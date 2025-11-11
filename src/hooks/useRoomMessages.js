import { useEffect, useState } from "react";
import Dexie from "dexie";
import { ccfoliaDB } from "../db/indexedDb";

const defaultFilters = {
  start: null,
  end: null,
  channels: [],
  roles: [],
  keywords: [],
  keywordMode: "plain",
  caseSensitive: false,
};

const buildKeywordMatchers = (filters) => {
  const { keywords, keywordMode, caseSensitive } = filters;
  if (!keywords?.length) return [];
  return keywords.map((raw) => {
    if (keywordMode === "regex") {
      try {
        return new RegExp(raw, caseSensitive ? "g" : "gi");
      } catch {
        return null;
      }
    }
    const text = caseSensitive ? raw : raw.toLowerCase();
    return text;
  }).filter(Boolean);
};

const matchText = (content, matchers, filters) => {
  if (!matchers.length) return true;
  if (!content) return false;
  const source = filters.caseSensitive ? content : content.toLowerCase();
  return matchers.every((matcher) => {
    if (matcher instanceof RegExp) {
      return matcher.test(content);
    }
    return source.includes(matcher);
  });
};

export const useRoomMessages = (roomId, filters = defaultFilters) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!roomId) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const fetch = async () => {
      const mergedFilters = { ...defaultFilters, ...filters };
      const { start, end, channels, roles } = mergedFilters;
      const matchers = buildKeywordMatchers(mergedFilters);

      let collection;
      if (start || end) {
        collection = ccfoliaDB.messages
          .where("[roomId+timestampMs]")
          .between(
            [roomId, start ?? Dexie.minKey],
            [roomId, end ?? Dexie.maxKey],
            true,
            true
          );
      } else {
        collection = ccfoliaDB.messages.where("roomId").equals(roomId);
      }

      if (channels?.length) {
        collection = collection.filter((msg) => channels.includes(msg.channelId));
      }

      if (roles?.length) {
        collection = collection.filter((msg) => roles.includes(msg.nickname));
      }

      const result = await collection.toArray();
      const filtered = result.filter((msg) => {
        const textContent = `${msg.text} ${msg.diceResult ?? ""}`;
        return matchText(textContent, matchers, mergedFilters);
      });

      if (isMounted) {
        setMessages(filtered.sort((a, b) => a.timestampMs - b.timestampMs));
        setLoading(false);
      }
    };

    fetch();

    return () => {
      isMounted = false;
    };
  }, [roomId, JSON.stringify(filters)]);

  return { messages, loading };
};

import { useState, useCallback } from "react";
import { ccfoliaDB, normalizeMessage } from "../db/indexedDb";

const API_BASE =
  "https://firestore.googleapis.com/v1/projects/ccfolia-160aa/databases/(default)/documents/rooms";

export const useRoomFetcher = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ total: 0, fetched: 0, message: "" });
  const [error, setError] = useState(null);

  const fetchRoom = useCallback(
    async (roomId, options = { forceRefresh: false }) => {
      if (!roomId) return;
      setIsLoading(true);
      setError(null);
      setProgress({ total: 0, fetched: 0, message: "开始拉取..." });

      if (options.forceRefresh) {
        await ccfoliaDB.messages.where("roomId").equals(roomId).delete();
      }

      let nextPageToken = "";
      let fetched = 0;
      let stopOnDuplicate = false;
      let latestTimestamp = 0;

      try {
        do {
          const url = new URL(`${API_BASE}/${roomId}/messages`);
          url.searchParams.set("pageSize", "300");
          if (nextPageToken) {
            url.searchParams.set("pageToken", nextPageToken);
          }

          const response = await fetch(url.toString());
          if (!response.ok) {
            throw new Error(`请求失败：${response.status}`);
          }
          const data = await response.json();
          const docs = data.documents || [];
          if (docs.length === 0) {
            break;
          }

          const docIds = docs.map((doc) => doc.name);
          const existingDocs = await ccfoliaDB.messages.bulkGet(docIds);
          const normalized = [];

          docs.forEach((doc, index) => {
            if (!existingDocs[index]) {
              const normalizedDoc = { ...normalizeMessage(doc), roomId };
              normalized.push(normalizedDoc);
              latestTimestamp = Math.max(latestTimestamp, normalizedDoc.timestampMs || 0);
            }
          });

          if (normalized.length) {
            await ccfoliaDB.messages.bulkPut(normalized);
            fetched += normalized.length;
            setProgress({
              total: fetched,
              fetched,
              message: `已获取 ${fetched} 条消息`,
            });
          }

          if (normalized.length < docs.length) {
            stopOnDuplicate = true;
          }

          nextPageToken = data.nextPageToken || "";
        } while (nextPageToken && !stopOnDuplicate);

        const totalMessages = await ccfoliaDB.messages.where("roomId").equals(roomId).count();
        const currentRoom = await ccfoliaDB.rooms.where("roomId").equals(roomId).first();

        await ccfoliaDB.rooms.put({
          roomId,
          title: roomId,
          lastSyncedAt: latestTimestamp || currentRoom?.lastSyncedAt || Date.now(),
          messageCount: totalMessages,
        });
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { fetchRoom, isLoading, progress, error };
};

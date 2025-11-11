import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import PreviewPanel from "./component/PreviewPanel.jsx";
import RoomManager from "./component/RoomManager.jsx";
import FilterPanel from "./component/FilterPanel.jsx";
import ExportWorkspace from "./component/ExportWorkspace.jsx";
import ContextPreview from "./component/ContextPreview.jsx";
import SearchResults from "./component/SearchResults.jsx";
import { handleDownload, main_style } from "./utils/FileDownload";
import { createImageSection, processMessageTag } from "./utils/utils";
import { useRoomMessages } from "./hooks/useRoomMessages";
import { ccfoliaDB } from "./db/indexedDb";
import { EXPORT_PAGE_SIZE } from "./constants/pagination";
import "./App.css";
import "./styles/base.css";

const defaultFilters = {
  start: null,
  end: null,
  channels: [],
  roles: [],
  keywords: [],
  keywordMode: "plain",
  caseSensitive: false,
};

const formatDate = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return ` - ${y}/${m}/${d}`;
};

function App() {
  const { t } = useTranslation();
  const [mode, setMode] = useState("search");
  const [fileContent, setFileContent] = useState("");
  const [fileName, setFileName] = useState("log.html");
  const [charColors, setCharColors] = useState({});
  const [charHeads, setCharHeads] = useState({});
  const [charAliases, setCharAliases] = useState({});
  const [imageCache, setImageCache] = useState({});
  const [titleImages, setTitleImages] = useState([]);
  const [endImages, setEndImages] = useState([]);
  const [inputTexts, setInputTexts] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState({
    main: true,
    info: false,
    other: false,
  });
  const [diceEnabled, setDiceEnabled] = useState(true);
  const [secretEnabled, setSecretEnabled] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState("");
  const [filters, setFilters] = useState(defaultFilters);
  const [rooms, setRooms] = useState([]);
  const [exportRoomId, setExportRoomId] = useState("");
  const [exportRange, setExportRange] = useState({ start: null, end: null });
  const [availableChannels, setAvailableChannels] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [searchPage, setSearchPage] = useState(1);
  const [selectedResultIndex, setSelectedResultIndex] = useState(null);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [contextWindow, setContextWindow] = useState({ start: 0, end: 12 });
  const [exportPage, setExportPage] = useState(1);
  const pageSize = 10;
  const exportPageSize = EXPORT_PAGE_SIZE;
  const imageCacheRef = useRef(imageCache);
  useEffect(() => {
    imageCacheRef.current = imageCache;
  }, [imageCache]);

  const resolveImageSrc = useCallback(
    (url) => {
      if (!url || typeof url !== "string") return "";
      if (url.startsWith("data:")) return url;
      if (Object.prototype.hasOwnProperty.call(imageCache, url)) {
        return imageCache[url];
      }
      return url;
    },
    [imageCache]
  );

  const { messages: apiMessages } = useRoomMessages(activeRoomId, filters);
  const contextFilters = useMemo(
    () => ({
      ...filters,
      keywords: [],
    }),
    [filters]
  );
  const { messages: contextMessages } = useRoomMessages(activeRoomId, contextFilters);
  const exportFilters = useMemo(
    () => ({ ...defaultFilters, start: exportRange.start, end: exportRange.end }),
    [exportRange]
  );
  const effectiveExportRoomId = exportRoomId || activeRoomId || rooms[0]?.roomId || "";
  const { messages: exportMessages } = useRoomMessages(effectiveExportRoomId, exportFilters);
  const exportTotalPages = useMemo(() => {
    const pages = Math.ceil((exportMessages.length || 0) / exportPageSize);
    return pages > 0 ? pages : 1;
  }, [exportMessages.length, exportPageSize]);
  useEffect(() => {
    if (exportPage > exportTotalPages) {
      setExportPage(exportTotalPages);
    }
  }, [exportPage, exportTotalPages]);
  useEffect(() => {
    setExportPage(1);
  }, [effectiveExportRoomId, exportRange.start, exportRange.end]);
  const exportPageMessages = useMemo(() => {
    if (!exportMessages.length) return [];
    const start = (exportPage - 1) * exportPageSize;
    return exportMessages.slice(start, start + exportPageSize);
  }, [exportMessages, exportPage, exportPageSize]);
  const totalPages = useMemo(() => Math.max(1, Math.ceil((apiMessages.length || 0) / pageSize)), [apiMessages.length]);
  const pagedMessages = useMemo(() => {
    const start = (searchPage - 1) * pageSize;
    return apiMessages.slice(start, start + pageSize);
  }, [apiMessages, searchPage]);
  const contextSelectedIndex = useMemo(() => {
    if (!selectedMessageId) return null;
    const idx = contextMessages.findIndex((msg) => msg.id === selectedMessageId);
    return idx === -1 ? null : idx;
  }, [contextMessages, selectedMessageId]);
  useEffect(() => {
    if (contextSelectedIndex === null) return;
    setContextWindow((prev) => {
      const inView = contextSelectedIndex >= prev.start && contextSelectedIndex < prev.end;
      if (inView) return prev;
      const start = Math.max(0, contextSelectedIndex - 5);
      return {
        start,
        end: Math.min(contextMessages.length, contextSelectedIndex + 6),
      };
    });
  }, [contextSelectedIndex, contextMessages.length]);
  useEffect(() => {
    if (selectedMessageId !== null) return;
    setContextWindow({
      start: 0,
      end: Math.min(contextMessages.length, 11),
    });
  }, [selectedMessageId, contextMessages.length]);
  useEffect(() => {
    setSelectedResultIndex(null);
    setSelectedMessageId(null);
  }, [apiMessages]);

  const refreshRooms = useCallback(async () => {
    const list = await ccfoliaDB.rooms.orderBy("lastSyncedAt").reverse().toArray();
    setRooms(list);
  }, []);

  useEffect(() => {
    refreshRooms();
  }, [refreshRooms]);

  useEffect(() => {
    if (!activeRoomId && rooms.length) {
      setActiveRoomId(rooms[0].roomId);
    }
  }, [rooms, activeRoomId]);
  useEffect(() => {
    if (activeRoomId && rooms.every((room) => room.roomId !== activeRoomId)) {
      setActiveRoomId(rooms[0]?.roomId || "");
    }
  }, [rooms, activeRoomId]);
  useEffect(() => {
    setSearchPage(1);
  }, [activeRoomId, filters]);
  useEffect(() => {
    if (searchPage > totalPages) {
      setSearchPage(totalPages);
    }
  }, [totalPages, searchPage]);

  useEffect(() => {
    if (!exportRoomId && rooms.length) {
      setExportRoomId(rooms[0].roomId);
    }
  }, [rooms, exportRoomId]);
  useEffect(() => {
    if (exportRoomId && rooms.every((room) => room.roomId !== exportRoomId)) {
      setExportRoomId(rooms[0]?.roomId || "");
    }
  }, [rooms, exportRoomId]);
  useEffect(() => {
    setExportRange({ start: null, end: null });
  }, [exportRoomId]);

  const resolvedTitleImages = useMemo(
    () => titleImages.map((url) => resolveImageSrc(url)),
    [titleImages, resolveImageSrc]
  );
  const resolvedEndImages = useMemo(
    () => endImages.map((url) => resolveImageSrc(url)),
    [endImages, resolveImageSrc]
  );
  const resolvedCharHeads = useMemo(() => {
    const next = {};
    Object.keys(charHeads).forEach((key) => {
      next[key] = resolveImageSrc(charHeads[key]);
    });
    return next;
  }, [charHeads, resolveImageSrc]);
  const titleImagesHtml = useMemo(() => createImageSection(resolvedTitleImages), [resolvedTitleImages]);
  const endImagesHtml = useMemo(() => createImageSection(resolvedEndImages), [resolvedEndImages]);

  const onUploadDownload = (type) => {
    handleDownload(() => parseContent(false), fileName, type);
  };

  const handleTitleImageChange = (event) => {
    const urls = event.target.value
      .split(",")
      .map((url) => url.trim())
      .filter(Boolean);
    setTitleImages(urls);
  };

  const handleEndImageChange = (event) => {
    const urls = event.target.value
      .split(",")
      .map((url) => url.trim())
      .filter(Boolean);
    setEndImages(urls);
  };

  const handleDescChange = (event) => {
    setInputTexts(event.target.value.split(",").map((text) => text));
  };

  const fetchImageAsDataUri = useCallback(async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
      const error = new Error(`请求图片失败：${response.status}`);
      error.status = response.status;
      throw error;
    }
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }, []);

  const ensureImagesCached = useCallback(
    async (urls = []) => {
      const unique = Array.from(
        new Set(urls.filter((url) => typeof url === "string" && url && !url.startsWith("data:")))
      );
      const missing = unique.filter((url) => !imageCacheRef.current[url]);
      if (!missing.length) return;
      const entries = await Promise.all(
        missing.map(async (url) => {
          try {
            const dataUri = await fetchImageAsDataUri(url);
            return [url, dataUri];
          } catch (error) {
            console.error("图片转码失败：", url, error);
            if (error?.status === 404) {
              return [url, ""];
            }
            return [url, url];
          }
        })
      );
      const updates = entries.reduce((acc, [url, dataUri]) => {
        acc[url] = dataUri && typeof dataUri === "string" && dataUri.startsWith("data:") ? dataUri : "";
        return acc;
      }, {});
      if (Object.keys(updates).length) {
        setImageCache((prev) => ({ ...prev, ...updates }));
      }
    },
    [fetchImageAsDataUri]
  );

  const collectImageUrls = useCallback(
    (messagesSource = [], options = {}) => {
      const { includeTitle = true, includeEnd = true } = options;
      const urls = new Set();
      const addUrl = (url) => {
        if (url && typeof url === "string" && !url.startsWith("data:")) {
          urls.add(url);
        }
      };
      if (includeTitle) {
        titleImages.forEach(addUrl);
      }
      if (includeEnd) {
        endImages.forEach(addUrl);
      }
      messagesSource.forEach((msg) => {
        addUrl(msg.iconUrl);
        const head = charHeads[msg.nickname];
        addUrl(head);
      });
      return Array.from(urls);
    },
    [titleImages, endImages, charHeads]
  );

  const ensureImagesForMessages = useCallback(
    async (messagesSource = [], options = {}) => {
      const urls = collectImageUrls(messagesSource, options);
      if (urls.length) {
        await ensureImagesCached(urls);
      }
    },
    [collectImageUrls, ensureImagesCached]
  );

  useEffect(() => {
    if (fileContent || !exportPageMessages.length) return;
    ensureImagesForMessages(exportPageMessages, {
      includeTitle: exportPage === 1,
      includeEnd: exportPage === exportTotalPages,
    });
  }, [fileContent, exportPageMessages, exportPage, exportTotalPages, ensureImagesForMessages]);

  const handleCacheExport = useCallback(
    async (roomId) => {
      const target = roomId || effectiveExportRoomId;
      if (!target) {
        alert("请先选择需要导出的房间。");
        return;
      }
      const room = await ccfoliaDB.rooms.where("roomId").equals(target).first();
      if (!room) {
        alert("未找到房间缓存。");
        return;
      }
      const messages = await ccfoliaDB.messages.where("roomId").equals(target).sortBy("timestampMs");
      const payload = {
        room,
        messages,
        exportedAt: Date.now(),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `cache_${target}.json`;
      link.click();
      URL.revokeObjectURL(link.href);
    },
    [effectiveExportRoomId]
  );

  const handleCacheImport = useCallback(
    async (file) => {
      if (!file) return;
      try {
        const content = await file.text();
        const data = JSON.parse(content);
        const roomData = data.room || data.roomInfo || null;
        const messagesData = data.messages || data.logs || [];
        const inferredRoomId =
          roomData?.roomId || data.roomId || messagesData[0]?.roomId || "";
        if (!inferredRoomId || !Array.isArray(messagesData)) {
          alert("导入失败：JSON 结构不合法。");
          return;
        }

        const normalizedRoom = {
          roomId: inferredRoomId,
          title: roomData?.title || inferredRoomId,
          lastSyncedAt: roomData?.lastSyncedAt || Date.now(),
          messageCount: messagesData.length,
          note: roomData?.note || "",
        };

        const normalizedMessages = messagesData.map((msg, index) => {
          const timestamp =
            typeof msg.timestampMs === "number"
              ? msg.timestampMs
              : Number.isNaN(Date.parse(msg.timestampMs))
              ? Date.now()
              : Date.parse(msg.timestampMs);
          const fallbackId =
            msg.id ||
            msg.name ||
            `${inferredRoomId}_${timestamp || Date.now()}_${index}`;
          return {
            ...msg,
            roomId: inferredRoomId,
            id: fallbackId,
            timestampMs: timestamp,
          };
        });

        await ccfoliaDB.transaction("rw", ccfoliaDB.rooms, ccfoliaDB.messages, async () => {
          await ccfoliaDB.messages.where("roomId").equals(inferredRoomId).delete();
          if (normalizedMessages.length) {
            await ccfoliaDB.messages.bulkPut(normalizedMessages);
          }
          await ccfoliaDB.rooms.put(normalizedRoom);
        });

        await refreshRooms();
        setActiveRoomId(inferredRoomId);
        setExportRoomId((prev) => prev || inferredRoomId);
        alert(`房间 ${inferredRoomId} 导入成功。`);
      } catch (error) {
        console.error("导入房间缓存失败：", error);
        alert("导入失败：请检查文件内容是否正确。");
      }
    },
    [refreshRooms]
  );

  const parseContent = useCallback(
    (limitLines = true) => {
      if (!fileContent) return t("preview.file_upload");
      return typeof fileContent === "string"
        ? parseHtml(limitLines)
        : parseJson(limitLines);
    },
    [fileContent, t]
  );

  const parseHtml = useCallback(
    (limitLines = true) => {
      if (!fileContent) return t("preview.file_upload");
      const parser = new DOMParser();
      const doc = parser.parseFromString(fileContent, "text/html");
      const parsedDivs = [];
      let count = { main: 0, info: 0, other: 0 };
      let lastCharName = null;
      let lastCategory = null;

      parsedDivs.push(titleImagesHtml);

      Array.from(doc.querySelectorAll("p")).forEach((p) => {
        processMessageTag(
          p,
          "html",
          t,
          charHeads,
          charColors,
          diceEnabled,
          setDiceEnabled,
          secretEnabled,
          setSecretEnabled,
          limitLines,
          count,
          parsedDivs,
          lastCharName,
          lastCategory,
          inputTexts,
          selectedCategories,
          setSelectedCategories
        );
      });

      Array.from(doc.querySelectorAll("#__tab__all div")).forEach((div) => {
        const p = document.createElement("p");
        p.innerHTML = div.innerHTML;
        div.parentNode.replaceChild(p, div);
        processMessageTag(
          p,
          "html",
          t,
          charHeads,
          charColors,
          diceEnabled,
          setDiceEnabled,
          secretEnabled,
          setSecretEnabled,
          limitLines,
          count,
          parsedDivs,
          lastCharName,
          lastCategory,
          inputTexts,
          selectedCategories,
          setSelectedCategories
        );
      });

      parsedDivs.push(endImagesHtml);
      return parsedDivs.length > 0 ? parsedDivs.join("") : "输出内容为空。";
    },
    [
      fileContent,
      titleImagesHtml,
      endImagesHtml,
      t,
      charHeads,
      charColors,
      diceEnabled,
      secretEnabled,
      inputTexts,
      selectedCategories,
    ]
  );
  const parseJson = useCallback(
    (limitLines = true) => {
      if (!fileContent) return t("preview.file_upload");
      if (!Array.isArray(fileContent)) return "JSON 格式不正确。";

      const parsedDivs = [];
      let count = { main: 0, info: 0, other: 0 };
      let lastCharName = null;
      let lastCategory = null;

      parsedDivs.push(titleImagesHtml);

      fileContent.forEach((log) => {
        const fields = log.fields;
        if (!fields) return;
        const category = fields.channelName?.stringValue || "other";
        const charName = fields.name?.stringValue || "NONAME";
        const color = fields.color?.stringValue || "#000000";
        const text = fields.text?.stringValue?.replace(/\n/g, "<br>") || "";
        const diceText =
          fields.extend?.mapValue?.fields?.roll?.mapValue?.fields?.result?.stringValue || "";
        const head = fields.iconUrl?.stringValue || "";
        const createdAt = fields.createdAt?.timestampValue || log.createTime || "";
        const p = document.createElement("p");
        p.innerHTML = `
          <span>[${category}]</span> <span>${charName}</span><b>${formatDate(
          Date.parse(createdAt)
        )}</b> : <span>${text + diceText}</span>
        `;

        processMessageTag(
          p,
          "json",
          t,
          { ...charHeads, [charName]: head },
          { ...charColors, [charName]: color },
          diceEnabled,
          setDiceEnabled,
          secretEnabled,
          setSecretEnabled,
          limitLines,
          count,
          parsedDivs,
          lastCharName,
          lastCategory,
          inputTexts,
          selectedCategories,
          setSelectedCategories
        );
      });

      parsedDivs.push(endImagesHtml);
      return parsedDivs.length > 0 ? parsedDivs.join("") : "输出内容为空。";
    },
    [
      fileContent,
      t,
      charHeads,
      charColors,
      diceEnabled,
      secretEnabled,
      inputTexts,
      selectedCategories,
      titleImagesHtml,
      endImagesHtml,
    ]
  );
  const renderNormalizedMessages = useCallback(
    (messages, limitLines = true, wrapImages = true) => {
      if (!messages || messages.length === 0) return "暂无聊天记录。";
      const parsedDivs = [];
      let count = {};
      let lastCharName = null;
      let lastCategory = null;
      const useAvatarCss = typeof wrapImages === "object" && wrapImages.avatarMode === "css";
      let avatarStyles = [];
      let avatarClassMap = null;
      let avatarBuilder = undefined;
      if (useAvatarCss) {
        avatarClassMap = new Map();
        const classPrefix = `avatar-${Date.now().toString(36)}-${Math.random()
          .toString(36)
          .slice(2, 6)}`;
        const escapeCss = (value) => value.replace(/(['\\])/g, "\\$1");
        const registerAvatar = (src) => {
          if (!src) return "";
          if (!avatarClassMap.has(src)) {
            const className = `${classPrefix}-${avatarClassMap.size + 1}`;
            avatarClassMap.set(src, className);
            avatarStyles.push(
              `.${className}{background-image:url('${escapeCss(src)}');background-size:cover;background-position:center;background-repeat:no-repeat;}`
            );
          }
          return avatarClassMap.get(src);
        };
        avatarBuilder = (src, charName) => {
          const className = registerAvatar(src);
          const baseStyle =
            "width: 40px; height: 40px; border-radius: 5px; background-color: rgba(255,255,255,0.05); display: inline-block;";
          const classes = ["avatar-img"];
          if (className) {
            classes.push(className);
          } else {
            classes.push("avatar-placeholder");
          }
          return `<div class="${classes.join(" ")}" aria-label="${charName}" style="${baseStyle}"></div>`;
        };
      }

      const mergedHeads = { ...resolvedCharHeads };
      messages.forEach((msg) => {
        const resolvedIcon = resolveImageSrc(msg.iconUrl);
        if (resolvedIcon && !mergedHeads[msg.nickname]) {
          mergedHeads[msg.nickname] = resolvedIcon;
        }
      });

      const wrapConfig =
        typeof wrapImages === "object"
          ? {
              start: wrapImages.start !== false,
              end: wrapImages.end !== false,
            }
          : {
              start: Boolean(wrapImages),
              end: Boolean(wrapImages),
            };

      if (wrapConfig.start && titleImagesHtml) {
        parsedDivs.push(titleImagesHtml);
      }

      messages.forEach((msg) => {
        const category = msg.channelName || msg.channelId || "other";
        const originalName = msg.nickname || "NONAME";
        const displayName = charAliases[originalName] || originalName;
        const text = (msg.text || "").replace(/\n/g, "<br>");
        const diceText = msg.diceResult || "";
        const p = document.createElement("p");
        p.innerHTML = `
          <span>[${category}]</span> <span>${displayName}</span><b>${formatDate(
          msg.timestampMs
        )}</b> : <span>${text + diceText}</span>
        `;
        const spans = p.getElementsByTagName("span");
        if (spans[1]) {
          spans[1].setAttribute("data-original-name", originalName);
        }

        processMessageTag(
          p,
          "json",
          t,
          mergedHeads,
          charColors,
          diceEnabled,
          setDiceEnabled,
          secretEnabled,
          setSecretEnabled,
          limitLines,
          count,
          parsedDivs,
          lastCharName,
          lastCategory,
          inputTexts,
          selectedCategories,
          setSelectedCategories,
          avatarBuilder
        );
      });

      if (wrapConfig.end && endImagesHtml) {
        parsedDivs.push(endImagesHtml);
      }
      if (useAvatarCss && avatarStyles.length) {
        avatarStyles.unshift(
          ".avatar-img{width:40px;height:40px;border-radius:5px;background-color:#2c2c2c;display:inline-block;}" +
            ".avatar-placeholder{background:#2c2c2c;}"
        );
        parsedDivs.unshift(`<style data-avatar-registry>${avatarStyles.join("\n")}</style>`);
      }
      return parsedDivs.length > 0 ? parsedDivs.join("") : "暂无聊天记录。";
    },
    [
      resolvedCharHeads,
      charColors,
      diceEnabled,
      secretEnabled,
      inputTexts,
      selectedCategories,
      titleImagesHtml,
      endImagesHtml,
      resolveImageSrc,
      charAliases,
      t,
    ]
  );
  const buildPaginatedHtml = useCallback(
    (messages) => {
      if (!messages || !messages.length) return "暂无聊天记录。";
      const totalPages = Math.ceil(messages.length / exportPageSize) || 1;
      const sections = [];
      for (let page = 0; page < totalPages; page += 1) {
        const start = page * exportPageSize;
        const chunk = messages.slice(start, start + exportPageSize);
        if (!chunk.length) continue;
        const wrapOptions = {
          start: page === 0,
          end: page === totalPages - 1,
          avatarMode: "css",
        };
        const chunkHtml = renderNormalizedMessages(chunk, false, wrapOptions);
        sections.push(`
          <section class="export-page" data-page="${page + 1}">
            <div class="page-meta">第 ${page + 1} / ${totalPages} 页（每页 ${exportPageSize} 条，共 ${messages.length} 条）</div>
            ${chunkHtml}
          </section>
        `);
      }
      return sections.length ? sections.join('<div class="page-break"></div>') : "暂无聊天记录。";
    },
    [renderNormalizedMessages, exportPageSize]
  );

  const exportPreviewHtml = useMemo(() => {
    if (fileContent) {
      return parseContent(false);
    }
    if (exportMessages.length) {
      const currentChunk = exportPageMessages;
      if (!currentChunk.length) return "暂无聊天记录。";
      const wrapOptions = {
        start: exportPage === 1,
        end: exportPage === exportTotalPages,
      };
      return renderNormalizedMessages(currentChunk, false, wrapOptions);
    }
    return t("preview.file_upload");
  }, [
    fileContent,
    exportMessages.length,
    exportPageMessages,
    exportPage,
    exportTotalPages,
    parseContent,
    renderNormalizedMessages,
    t,
  ]);
  const previewPagination = useMemo(() => {
    if (fileContent || !exportMessages.length) return null;
    return {
      page: exportPage,
      totalPages: exportTotalPages,
      pageSize: exportPageSize,
      totalItems: exportMessages.length,
      onPrev: () => setExportPage((prev) => Math.max(1, prev - 1)),
      onNext: () => setExportPage((prev) => Math.min(exportTotalPages, prev + 1)),
    };
  }, [fileContent, exportMessages.length, exportPage, exportTotalPages, exportPageSize]);

  const handleApiDownload = async (type) => {
    if (!apiMessages.length) return;
    const fileLabel = `log_${activeRoomId || "room"}.html`;
    await ensureImagesForMessages(apiMessages, { includeTitle: true, includeEnd: true });
    handleDownload(() => buildPaginatedHtml(apiMessages), fileLabel, type);
  };
  useEffect(() => {
    if (!document.getElementById("ccfolia-style")) {
      const styleTag = document.createElement("style");
      styleTag.id = "ccfolia-style";
      styleTag.innerHTML = main_style;
      document.head.appendChild(styleTag);
    }
    document.body.style.backgroundColor = "rgba(44, 44, 44, 0.87)";
  }, []);

  useEffect(() => {
    if (!fileContent || typeof fileContent !== "string") return;
    const parser = new DOMParser();
    const doc = parser.parseFromString(fileContent, "text/html");
    const newCharColors = {};

    doc.querySelectorAll("p, div").forEach((el) => {
      const spans = el.getElementsByTagName("span");
      if (spans.length >= 2) {
        const charName = spans[1].textContent.trim();
        const rawColor = el.style.color || window.getComputedStyle(el).color;
        const convertedColor = rgbToHex(rawColor);
        newCharColors[charName] = convertedColor;
      }
    });
    setCharColors((prev) => ({ ...newCharColors, ...prev }));
  }, [fileContent]);
  useEffect(() => {
    setCharAliases((prev) => {
      const validNames = new Set(Object.keys(charColors));
      const next = {};
      Object.keys(prev).forEach((name) => {
        if (validNames.has(name)) {
          next[name] = prev[name];
        }
      });
      const changed =
        Object.keys(next).length !== Object.keys(prev).length ||
        Object.keys(next).some((key) => next[key] !== prev[key]);
      return changed ? next : prev;
    });
  }, [charColors]);

  useEffect(() => {
    if (mode !== "search" || !apiMessages.length) return;
    setCharColors((prev) => {
      const next = { ...prev };
      apiMessages.forEach((msg) => {
        if (msg.color && !next[msg.nickname]) {
          next[msg.nickname] = msg.color;
        }
      });
      return next;
    });
    setCharHeads((prev) => {
      const next = { ...prev };
      apiMessages.forEach((msg) => {
        if (msg.iconUrl && !next[msg.nickname]) {
          next[msg.nickname] = msg.iconUrl;
        }
      });
      return next;
    });
  }, [mode, apiMessages]);

  useEffect(() => {
    if (!activeRoomId) return;
    const loadMeta = async () => {
      const all = await ccfoliaDB.messages.where("roomId").equals(activeRoomId).toArray();
      const channels = Array.from(
        new Set(all.map((msg) => msg.channelName || msg.channelId || "other"))
      );
      const roles = Array.from(new Set(all.map((msg) => msg.nickname || "NONAME")));
      setAvailableChannels(channels);
      setAvailableRoles(roles);
    };
    loadMeta();
    setSelectedResultIndex(null);
    setSelectedMessageId(null);
    setContextWindow({ start: 0, end: 10 });
  }, [activeRoomId]);
  const rgbToHex = (rgb) => {
    if (!rgb || !rgb.startsWith("rgb")) return rgb;
    const rgbValues = rgb.match(/\d+/g);
    if (!rgbValues || rgbValues.length < 3) return "#FFFFFF";
    return `#${rgbValues
      .slice(0, 3)
      .map((val) => parseInt(val).toString(16).padStart(2, "0"))
      .join("")}`;
  };

  const handleRoomSelect = (roomId) => {
    setActiveRoomId(roomId);
    setFilters({ ...defaultFilters });
    if (!exportRoomId) {
      setExportRoomId(roomId);
    }
  };
  const handleResultSelect = useCallback(
    (absoluteIndex) => {
      if (absoluteIndex == null) return;
      setSelectedResultIndex(absoluteIndex);
      const target = apiMessages[absoluteIndex];
      setSelectedMessageId(target?.id || null);
    },
    [apiMessages]
  );
  const handleContextSelect = useCallback(
    (absoluteIndex) => {
      const target = contextMessages[absoluteIndex];
      if (!target) return;
      setSelectedMessageId(target.id);
      const resultIndex = apiMessages.findIndex((msg) => msg.id === target.id);
      setSelectedResultIndex(resultIndex === -1 ? null : resultIndex);
    },
    [contextMessages, apiMessages]
  );
  const handleContextWindowRequest = useCallback(
    (dir) => {
      const batch = 5;
      setContextWindow((prev) => {
        if (dir === "up" && prev.start > 0) {
          const start = Math.max(0, prev.start - batch);
          return { start, end: prev.end };
        }
        if (dir === "down" && prev.end < contextMessages.length) {
          return {
            start: prev.start,
            end: Math.min(contextMessages.length, prev.end + batch),
          };
        }
        return prev;
      });
    },
    [contextMessages.length]
  );

  return (
    <div className="app-shell">
      <a
        href="https://github.com/kagangtuya-star/cclog_plus"
        className="github-badge"
        aria-label="View source on GitHub"
        target="_blank"
        rel="noreferrer"
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.01.08-2.1 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.09.16 1.9.08 2.1.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
          />
        </svg>
      </a>
      <main className="content">
        <div className="mode-switch">
          <button className={mode === "search" ? "active" : ""} onClick={() => setMode("search")}>
            搜索模式
          </button>
          <button className={mode === "export" ? "active" : ""} onClick={() => setMode("export")}>
            日志导出模式
          </button>
        </div>
        {mode === "search" ? (
          <>
            <div className="content-header">
              <span>搜索配置</span>
              <span>搜索结果</span>
            </div>
            <div className="search-layout">
              <div className="search-left">
                <RoomManager
                  rooms={rooms}
                  activeRoomId={activeRoomId}
                  onSelectRoom={handleRoomSelect}
                  onSyncFinished={(roomId) => handleRoomSelect(roomId)}
                  onRoomsChange={refreshRooms}
                  onExportCache={handleCacheExport}
                  onImportCache={handleCacheImport}
                />
                <FilterPanel
                  channels={availableChannels}
                  roles={availableRoles}
                  filters={filters}
                  onChange={setFilters}
                />
              </div>
              <div className="search-right">
                <SearchResults
                  messages={pagedMessages}
                  page={apiMessages.length === 0 ? 0 : searchPage}
                  totalPages={apiMessages.length === 0 ? 0 : totalPages}
                  onPrev={() => setSearchPage((prev) => Math.max(1, prev - 1))}
                  onNext={() => setSearchPage((prev) => Math.min(totalPages, prev + 1))}
                  renderHtml={(msgs) => renderNormalizedMessages(msgs, false, false)}
                  onSelect={handleResultSelect}
                  selectedIndex={selectedResultIndex}
                  pageStartIndex={(searchPage - 1) * pageSize}
                  totalCount={apiMessages.length}
                />
                {selectedMessageId !== null && (
                  <div className="context-preview">
                    <h4>上下文预览</h4>
                    <ContextPreview
                      messages={contextMessages}
                      selectedIndex={contextSelectedIndex}
                      visibleWindow={contextWindow}
                      onRequestWindow={handleContextWindowRequest}
                      onSelect={handleContextSelect}
                      renderHtml={(msgs) => renderNormalizedMessages(msgs, false, false)}
                    />
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="content-header">
              <span>导出配置</span>
              <span>导出预览</span>
            </div>
            <div className="export-layout">
              <div className="export-left">
                <ExportWorkspace
                  t={t}
                  rooms={rooms}
                  selectedRoomId={effectiveExportRoomId}
                  onSelectRoom={setExportRoomId}
                  exportRange={exportRange}
                  onRangeChange={setExportRange}
                  messages={exportMessages}
                  buildHtml={buildPaginatedHtml}
                  fileName={`log_${effectiveExportRoomId || "room"}.html`}
                  onExportCache={handleCacheExport}
                  prepareImages={ensureImagesForMessages}
                  uploadProps={{ t, setFileContent, setFileName }}
                  titleImages={titleImages}
                  endImages={endImages}
                  systemNames={inputTexts}
                  onTitleImageChange={handleTitleImageChange}
                  onEndImageChange={handleEndImageChange}
                  onDescChange={handleDescChange}
                  charColors={charColors}
                  setCharColors={setCharColors}
                  charHeads={charHeads}
                  setCharHeads={setCharHeads}
                  charAliases={charAliases}
                  setCharAliases={setCharAliases}
                  selectedCategories={selectedCategories}
                  setSelectedCategories={setSelectedCategories}
                  diceEnabled={diceEnabled}
                  setDiceEnabled={setDiceEnabled}
                  secretEnabled={secretEnabled}
                  setSecretEnabled={setSecretEnabled}
                />
              </div>
              <div className="export-right">
                <PreviewPanel
                  title={t("preview.preview")}
                  htmlContent={exportPreviewHtml}
                  enableDownload={Boolean(fileContent)}
                  onDownloadClick={onUploadDownload}
                  pagination={previewPagination}
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;

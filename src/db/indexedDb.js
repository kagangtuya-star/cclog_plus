import Dexie from "dexie";

/**
 * IndexedDB 实例，负责缓存房间与消息。
 */
export const ccfoliaDB = new Dexie("ccfolia-log-db");

ccfoliaDB.version(1).stores({
  rooms: "&roomId, title, lastSyncedAt, messageCount",
  messages:
    "&id, roomId, channelId, channelName, nickname, timestampMs, isDice, commandId, [roomId+timestampMs], [roomId+channelId], [roomId+nickname]",
});

const deepGet = (obj, path, fallback = "") =>
  path.reduce((acc, key) => (acc ? acc[key] : undefined), obj) ?? fallback;

export const normalizeMessage = (doc) => {
  const fields = doc.fields || {};
  const text = deepGet(fields, ["text", "stringValue"], "");
  const diceResult = deepGet(
    fields,
    ["extend", "mapValue", "fields", "roll", "mapValue", "fields", "result", "stringValue"],
    ""
  );
  const roomId = doc.name?.split("/")[6] || "";
  const createdAt = fields?.createdAt?.timestampValue || doc.createTime;
  const timestampMs = createdAt ? Date.parse(createdAt) : Date.parse(doc.createTime);

  return {
    id: doc.name,
    roomId,
    nickname: deepGet(fields, ["name", "stringValue"], "NONAME"),
    imUserId: deepGet(fields, ["from", "stringValue"], ""),
    uniformId: `Seal:${deepGet(fields, ["from", "stringValue"], "")}`,
    color: deepGet(fields, ["color", "stringValue"], "#ffffff"),
    channelId: deepGet(fields, ["channel", "stringValue"], "main"),
    channelName: deepGet(fields, ["channelName", "stringValue"], "主频道"),
    iconUrl: deepGet(fields, ["iconUrl", "stringValue"], ""),
    text,
    diceResult,
    isDice: Boolean(diceResult),
    commandId: deepGet(fields, ["commandId", "stringValue"], null),
    commandInfo:
      fields?.extend?.mapValue?.fields?.roll?.mapValue?.fields ?? null,
    rawMsgId: deepGet(fields, ["rawMsgId", "stringValue"], null),
    timestampMs: Number.isNaN(timestampMs) ? Date.now() : timestampMs,
    original: doc,
  };
};

export const toSealExport = (messages) => ({
  version: 105,
  items: messages.map((m) => ({
    nickname: m.nickname,
    imUserId: m.imUserId,
    uniformId: m.uniformId,
    time: Math.floor(m.timestampMs / 1000),
    message: m.text + (m.diceResult ? ` ${m.diceResult}` : ""),
    isDice: m.isDice,
    commandId: m.commandId,
    commandInfo: m.commandInfo ?? null,
    rawMsgId: m.rawMsgId ?? null,
  })),
});

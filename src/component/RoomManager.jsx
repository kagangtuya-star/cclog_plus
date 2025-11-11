import React, { useRef, useState } from "react";
import { ccfoliaDB } from "../db/indexedDb";
import { useRoomFetcher } from "../hooks/useRoomFetcher";

const formatTime = (timestamp) => {
  if (!timestamp) return "尚未同步";
  const date = new Date(timestamp);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
};

const RoomManager = ({
  rooms = [],
  activeRoomId,
  onSelectRoom,
  onSyncFinished,
  onRoomsChange,
  onExportCache,
  onImportCache,
}) => {
  const [roomId, setRoomId] = useState("");
  const [collapsed, setCollapsed] = useState(true);
  const { fetchRoom, isLoading, progress, error } = useRoomFetcher();
  const importInputRef = useRef(null);
  const [importing, setImporting] = useState(false);

  const handleFetch = async (targetRoomId, overrideForce) => {
    const id = targetRoomId || roomId;
    if (!id) return;
    await fetchRoom(id, { forceRefresh: Boolean(overrideForce) });
    if (!targetRoomId) {
      setRoomId("");
    }
    await onRoomsChange?.();
    onSyncFinished?.(id);
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !onImportCache) {
      event.target.value = "";
      return;
    }
    setImporting(true);
    try {
      await onImportCache(file);
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  const handleDelete = async (id) => {
    await ccfoliaDB.messages.where("roomId").equals(id).delete();
    await ccfoliaDB.rooms.where("roomId").equals(id).delete();
    if (activeRoomId === id) {
      onSelectRoom("");
    }
    await onRoomsChange?.();
  };

  return (
    <section className="room-panel">
      <div className="room-panel-header">
        <h3>房间管理</h3>
        <button className="collapse-btn" onClick={() => setCollapsed((prev) => !prev)}>
          {collapsed ? "展开" : "折叠"}
        </button>
      </div>
      <div className="room-input-row">
        <input
          type="text"
          placeholder="请输入房间 ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value.trim())}
        />
        <button disabled={isLoading || !roomId} onClick={() => handleFetch()}>
          {isLoading ? "同步中..." : "增量同步"}
        </button>
        <button
          disabled={isLoading || !roomId}
          onClick={() => handleFetch(null, true)}
          title="清空缓存后重新拉取"
        >
          强制刷新
        </button>
      </div>
      {isLoading && <p className="progress">{progress.message}</p>}
      {error && <p className="error">请求出错：{error}</p>}

      <div className="room-import-row">
        <input
          ref={importInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleImportChange}
        />
        <button onClick={handleImportClick} disabled={importing}>
          {importing ? "导入中..." : "导入缓存 JSON"}
        </button>
      </div>

      {!collapsed && (
        <div className="room-list">
          <h4>已缓存房间</h4>
          {rooms.length === 0 && <p>尚未缓存任何房间。</p>}
          {rooms.map((room) => (
            <div
              key={room.roomId}
              className={`room-item ${activeRoomId === room.roomId ? "active" : ""}`}
            >
              <div>
                <strong>{room.roomId}</strong>
                <p>最后同步：{formatTime(room.lastSyncedAt)}</p>
                <p>消息数：{room.messageCount || 0}</p>
                <textarea
                  className="room-note"
                  placeholder="备注..."
                  defaultValue={room.note || ""}
                  onBlur={async (e) => {
                    await ccfoliaDB.rooms.update(room.roomId, { note: e.target.value });
                    onRoomsChange?.();
                  }}
                />
              </div>
              <div className="room-actions">
                <button onClick={() => onSelectRoom(room.roomId)}>查看</button>
                <button onClick={() => handleFetch(room.roomId)}>增量</button>
                <button onClick={() => handleFetch(room.roomId, true)}>刷新</button>
                <button onClick={() => onExportCache?.(room.roomId)}>导出</button>
                <button onClick={() => handleDelete(room.roomId)}>删除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default RoomManager;

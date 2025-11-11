import React, { useEffect, useState } from "react";
import ExportPanel from "./ExportPanel.jsx";
import UploadSection from "./UploadSection.jsx";
import SettingsPanel from "./SettingsPanel.jsx";

const ExportWorkspace = ({
  t,
  rooms = [],
  selectedRoomId,
  onSelectRoom,
  exportRange,
  onRangeChange,
  messages,
  buildHtml,
  fileName,
  onExportCache,
  prepareImages,
  uploadProps = {},
  titleImages = [],
  endImages = [],
  onTitleImageChange,
  onEndImageChange,
  onDescChange,
  charColors,
  setCharColors,
  charHeads,
  setCharHeads,
  selectedCategories,
  setSelectedCategories,
  diceEnabled,
  setDiceEnabled,
  secretEnabled,
  setSecretEnabled,
  systemNames = [],
  charAliases = {},
  setCharAliases = () => {},
}) => {
  const currentRoom = rooms.find((room) => room.roomId === selectedRoomId);
  const roomOptions = rooms.length
    ? rooms
    : [{ roomId: "", title: "尚无缓存房间" }];
  const [titleInput, setTitleInput] = useState("");
  const [endInput, setEndInput] = useState("");
  const [systemInput, setSystemInput] = useState("");

  useEffect(() => {
    setTitleInput(titleImages.join(","));
  }, [titleImages]);

  useEffect(() => {
    setSystemInput(systemNames.join(","));
  }, [systemNames]);

  return (
    <div className="export-workspace">
      <section className="export-room-selector">
        <div className="selector-row">
          <label>选择缓存房间</label>
          <select
            value={selectedRoomId || ""}
            onChange={(e) => onSelectRoom(e.target.value)}
          >
            {roomOptions.map((room) => (
              <option key={room.roomId || "empty"} value={room.roomId}>
                {room.roomId || room.title}
              </option>
            ))}
          </select>
        </div>
        {currentRoom && (
          <div className="room-meta">
            <span>消息数：{currentRoom.messageCount || messages.length}</span>
            <span>
              最近同步：
              {currentRoom.lastSyncedAt
                ? new Date(currentRoom.lastSyncedAt).toLocaleString()
                : "未知"}
            </span>
          </div>
        )}
        <div className="selector-actions">
          <button onClick={() => onExportCache(selectedRoomId)}>
            导出缓存 JSON
          </button>
        </div>
      </section>

      <ExportPanel
        messages={messages}
        defaultRange={exportRange}
        buildHtml={buildHtml}
        fileName={fileName}
        onRangeChange={onRangeChange}
        prepareImages={prepareImages}
      />

      <section className="style-panel">
        <h4>
          01. {t("setting.title_img")} <b>(*{t("setting.warning_txt3")})</b>
        </h4>
        <input
          type="text"
          placeholder="封面图片 URL，多个用逗号分隔"
          className="title_input"
          value={titleInput}
          onChange={(e) => {
            setTitleInput(e.target.value);
            onTitleImageChange?.(e);
          }}
        />

        <h4>
          02. {t("setting.end_img")} <b>(*{t("setting.warning_txt3")})</b>
        </h4>
        <input
          type="text"
          placeholder="结尾图片 URL，多个用逗号分隔"
          className="end_input"
          value={endInput}
          onChange={(e) => {
            setEndInput(e.target.value);
            onEndImageChange?.(e);
          }}
        />

        <h4>
          03. {t("setting.system_cha")} <b>(*{t("setting.limit_txt")})</b>
        </h4>
        <input
          type="text"
          placeholder="系统角色名称（用逗号分隔）"
          className="system_input"
          value={systemInput}
          onChange={(e) => {
            setSystemInput(e.target.value);
            onDescChange?.(e);
          }}
        />

        <SettingsPanel
          t={t}
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
      </section>

      <section className="local-upload">
        <h4>本地日志文件转换</h4>
        <p>如需处理官方导出的 HTML/JSON，请直接上传文件。</p>
        <UploadSection
          t={uploadProps.t}
          setFileContent={uploadProps.setFileContent}
          setFileName={uploadProps.setFileName}
        />
      </section>
    </div>
  );
};

export default ExportWorkspace;

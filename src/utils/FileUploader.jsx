import React, { useState } from "react";
import { FIREBASE_BASE_URL, MESSAGES_QUERY } from "../config.js";

const normalizeRoomId = (input) => {
  if (!input) return "";
  return input
    .trim()
    .replace(/^https?:\/\/ccfolia\.com\/rooms\//i, "")
    .replace(/[?#].*$/, "");
};

const buildRoomRequestUrl = (roomId) => {
  const base = FIREBASE_BASE_URL.endsWith("/")
    ? FIREBASE_BASE_URL
    : `${FIREBASE_BASE_URL}/`;
  const queryPath = MESSAGES_QUERY.startsWith("/")
    ? MESSAGES_QUERY
    : `/${MESSAGES_QUERY}`;
  return `${base}${encodeURIComponent(roomId)}${queryPath}`;
};

function FileUploader({ t, setFileContent, setFileName }) {
  const [roomNumber, setRoomNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];

    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        try {
          setFileContent(content);
        } catch (error) {
          alert(t("setting.file_type"));
        }
      };
      reader.readAsText(file);
    }
  };

  const fetchLog = async () => {
    if (!roomNumber.trim()) {
      alert(t("setting.input_plz"));
      return;
    }

    const roomId = normalizeRoomId(roomNumber);
    if (!roomId) {
      alert("房间 ID 无效，请重新输入。");
      return;
    }

    const url = buildRoomRequestUrl(roomId);
  
    setLoading(true);
    let allMessages = [];
  
    const fetchMessages = async (url) => {
      setLoading(true);
    
      try {
        let collected = [];
        let nextPageToken = "";

        do {
          const response = await fetch(
            url + (nextPageToken ? `&pageToken=${nextPageToken}` : "")
          );
          const data = await response.json();

          if (data.documents) {
            collected = [...collected, ...data.documents];
            nextPageToken = data.nextPageToken || null;
          } else {
            alert(t("setting.none_log"));
            return;
          }
        } while (nextPageToken);

        const sortedMessages = collected.sort(
          (a, b) => new Date(a.createTime) - new Date(b.createTime)
        );

        setFileContent(sortedMessages);
        setFileName(`${roomId}.json`);
      } catch (error) {
        console.error(t("setting.err_txt"), error);
        alert(t("setting.console_errer"));
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages(url);
  };
  
  return (
    <div>
      <div className="file_upload" style={{ display: "grid" }}>
        
        <input type="file" accept=".html" onChange={handleFileUpload} />

        <label className="room_number">
          {t("setting.room_input")}
          <input
            type="text"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
          />
          <button onClick={fetchLog} disabled={loading}>
            {loading ? t("setting.loading") : t("setting.ok")}
          </button>
        </label>
      </div>
    </div>
  );
}

export default FileUploader;

import React, { useState, useEffect } from "react";
import { handleDownload } from "../utils/FileDownload";
import { toSealExport } from "../db/indexedDb";

const formatInputValue = (timestamp) =>
  timestamp ? new Date(timestamp).toISOString().slice(0, 16) : "";

const filterByRange = (messages, start, end) => {
  if (!start && !end) return messages;
  return messages.filter((msg) => {
    if (start && msg.timestampMs < start) return false;
    if (end && msg.timestampMs > end) return false;
    return true;
  });
};

const ExportPanel = ({
  messages = [],
  defaultRange = { start: null, end: null },
  buildHtml,
  fileName,
  onRangeChange = () => {},
  prepareImages = async () => {},
}) => {
  const [range, setRange] = useState(defaultRange);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setRange(defaultRange);
  }, [defaultRange.start, defaultRange.end]);

  const updateRange = (field, value) => {
    const timestamp = value ? new Date(value).getTime() : null;
    const updated = { ...range, [field]: timestamp };
    setRange(updated);
    onRangeChange(updated);
  };

  const handleExportHtml = async (type) => {
    const subset = filterByRange(messages, range.start, range.end);
    if (!subset.length) return alert("当前时间段没有可导出的消息。");
    try {
      setExporting(true);
      await prepareImages(subset, { includeTitle: true, includeEnd: true });
      handleDownload(() => buildHtml(subset), fileName, type);
    } finally {
      setExporting(false);
    }
  };

  const handleExportJson = () => {
    const subset = filterByRange(messages, range.start, range.end);
    if (!subset.length) return alert("当前时间段没有可导出的消息。");
    const json = JSON.stringify(toSealExport(subset), null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName.replace(/\.[^/.]+$/, "")}_seal.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <section className="export-panel">
      <h4>导出设置</h4>
      <div className="filter-row">
        <label>导出开始时间</label>
        <input
          type="datetime-local"
          value={formatInputValue(range.start)}
          onChange={(e) => updateRange("start", e.target.value)}
        />
        <label>导出结束时间</label>
        <input
          type="datetime-local"
          value={formatInputValue(range.end)}
          onChange={(e) => updateRange("end", e.target.value)}
        />
      </div>
      <div className="export-actions">
        <button onClick={() => handleExportHtml("html")} disabled={exporting}>
          {exporting ? "生成中..." : "导出 HTML"}
        </button>
        <button onClick={() => handleExportHtml("Tstory")} disabled={exporting}>
          {exporting ? "生成中..." : "导出博客 HTML"}
        </button>
        <button onClick={handleExportJson} disabled={exporting}>
          导出 JSON（海豹格式）
        </button>
      </div>
    </section>
  );
};

export default ExportPanel;

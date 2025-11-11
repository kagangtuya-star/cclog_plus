import React, { useMemo, useRef, useEffect } from "react";

const ContextPreview = ({
  messages = [],
  selectedIndex,
  visibleWindow,
  onRequestWindow,
  onSelect,
  renderHtml,
}) => {
  const containerRef = useRef(null);
  const windowMessages = useMemo(() => {
    return messages.slice(visibleWindow.start, visibleWindow.end);
  }, [messages, visibleWindow]);

  useEffect(() => {
    if (!containerRef.current) return;
    const selectedElement = containerRef.current.querySelector(".context-item.selected");
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: "center" });
    }
  }, [windowMessages, selectedIndex]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop === 0) {
      onRequestWindow?.("up");
    } else if (scrollTop + clientHeight >= scrollHeight - 10) {
      onRequestWindow?.("down");
    }
  };

  return (
    <div className="context-container" onScroll={handleScroll} ref={containerRef}>
      {windowMessages.map((msg, idx) => {
        const absoluteIndex = visibleWindow.start + idx;
          const html = renderHtml ? renderHtml([msg]) : "";
        return (
          <div
            key={msg.id || absoluteIndex}
            className={`context-item ${absoluteIndex === selectedIndex ? "selected" : ""}`}
            onClick={() => onSelect?.(absoluteIndex)}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
      {windowMessages.length === 0 && <p>暂无上下文。</p>}
    </div>
  );
};

export default ContextPreview;

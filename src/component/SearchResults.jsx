import React from "react";

const SearchResults = ({
  messages = [],
  page = 1,
  totalPages = 1,
  onPrev,
  onNext,
  renderHtml,
  onSelect,
  selectedIndex,
  pageStartIndex = 0,
  totalCount = 0,
}) => {
  const handleSelect = (absoluteIndex) => {
    onSelect?.(absoluteIndex);
  };

  return (
    <div className="search-results">
      {messages.length === 0 ? (
        <p className="empty-text">没有匹配结果。</p>
      ) : (
        messages.map((msg, idx) => {
          const absoluteIndex = pageStartIndex + idx;
          const html = renderHtml([msg]);
          return (
            <div
              key={msg.id || absoluteIndex}
              className={`result-item ${selectedIndex === absoluteIndex ? "selected" : ""}`}
              onClick={() => handleSelect(absoluteIndex)}
            >
              <div dangerouslySetInnerHTML={{ __html: html }} />
            </div>
          );
        })
      )}
      <div className="pagination-controls">
        <button onClick={onPrev} disabled={page <= 1 || totalCount === 0}>
          上一页
        </button>
        <span>
          第 {totalCount === 0 ? 0 : page} / {totalCount === 0 ? 0 : totalPages} 页（共 {totalCount} 条）
        </span>
        <button onClick={onNext} disabled={page >= totalPages || totalCount === 0}>
          下一页
        </button>
      </div>
    </div>
  );
};

export default SearchResults;

import React from "react";

const PreviewPanel = ({
  title,
  htmlContent,
  enableDownload,
  onDownloadClick,
  pagination,
}) => {
  const hasPagination = Boolean(pagination);
  const disabledPrev = hasPagination && pagination.page <= 1;
  const disabledNext = hasPagination && pagination.page >= pagination.totalPages;

  return (
    <div className="preview_panel">
      <h3>{title}</h3>
      {hasPagination && (
        <div className="preview-pagination">
          <button onClick={pagination.onPrev} disabled={disabledPrev}>
            上一页
          </button>
          <span>
            第 {pagination.page} / {pagination.totalPages} 页（每页 {pagination.pageSize} 条，共 {pagination.totalItems} 条）
          </span>
          <button onClick={pagination.onNext} disabled={disabledNext}>
            下一页
          </button>
        </div>
      )}
      <div
        className="preview-board"
        dangerouslySetInnerHTML={{ __html: htmlContent || "<p>暂无预览数据</p>" }}
      />
      <div className="download_pannel">
        {enableDownload && (
          <>
            <button onClick={() => onDownloadClick("html")} className="down_btn">
              下载 HTML
            </button>
            <button onClick={() => onDownloadClick("Tstory")} className="down_btn">
              博客 HTML
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PreviewPanel;

import React, { useState } from "react";

const MultiSelect = ({ options = [], selected = [], onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const effectiveSelected = selected ?? [];
  const toggleOption = (item) => {
    if (effectiveSelected.includes(item)) {
      onChange(effectiveSelected.filter((value) => value !== item));
    } else {
      onChange([...effectiveSelected, item]);
    }
  };

  const displayText =
    effectiveSelected.length > 0 ? effectiveSelected.join(", ") : placeholder || "全部";
  const filteredOptions = keyword
    ? options.filter((item) => item.toLowerCase().includes(keyword.toLowerCase()))
    : options;

  return (
    <div className={`multi-select-wrapper ${open ? "open" : ""}`}>
      <div className="multi-select-display" onClick={() => setOpen((prev) => !prev)}>
        <span>{displayText}</span>
        <span className="arrow">{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div className="multi-select-dropdown">
          <button className="clear-btn" onClick={() => onChange([])}>
            清空
          </button>
          <input
            type="text"
            className="multi-search"
            placeholder="输入关键词"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <div className="options">
            {filteredOptions.map((item) => (
              <label key={item} className="option-item">
                <input
                  type="checkbox"
                  checked={effectiveSelected.includes(item)}
                  onChange={() => toggleOption(item)}
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const FilterPanel = ({
  channels = [],
  roles = [],
  filters,
  onChange,
}) => {
  const handleDateChange = (field, value) => {
    const timestamp = value ? new Date(value).getTime() : null;
    onChange({ ...filters, [field]: timestamp });
  };

  const handleMultiSelect = (field, value) => {
    const list = filters[field] || [];
    const exists = list.includes(value);
    const updated = exists ? list.filter((item) => item !== value) : [...list, value];
    onChange({ ...filters, [field]: updated });
  };

  const handleKeywordChange = (value) => {
    const keywords = value
      .split(/[\n;；]/)
      .map((kw) => kw.trim())
      .filter(Boolean);
    onChange({ ...filters, keywords });
  };

  const clearFilters = () => {
    onChange({
      start: null,
      end: null,
      channels: [],
      roles: [],
      keywords: [],
      keywordMode: "plain",
      caseSensitive: false,
    });
  };

  return (
    <section className="filter-panel">
      <div className="filter-row">
        <div className="filter-block full">
          <p>文本搜索（分号或换行分隔，支持正则）</p>
          <textarea
            rows={3}
            placeholder="示例：骰子成功;KP"
            value={filters.keywords?.join("\n") || ""}
            onChange={(e) => handleKeywordChange(e.target.value)}
          />
          <div className="inline-options">
            <label>
              <input
                type="radio"
                name="keyword-mode"
                value="plain"
                checked={filters.keywordMode === "plain"}
                onChange={() => onChange({ ...filters, keywordMode: "plain" })}
              />
              模糊匹配
            </label>
            <label>
              <input
                type="radio"
                name="keyword-mode"
                value="regex"
                checked={filters.keywordMode === "regex"}
                onChange={() => onChange({ ...filters, keywordMode: "regex" })}
              />
              正则匹配
            </label>
            <label>
              <input
                type="checkbox"
                checked={filters.caseSensitive}
                onChange={() =>
                  onChange({ ...filters, caseSensitive: !filters.caseSensitive })
                }
              />
              区分大小写
            </label>
          </div>
        </div>
      </div>
      <div className="filter-row">
        <div className="filter-block full">
          <p>时间范围</p>
          <div className="range-picker">
            <div className="range-field">
              <label htmlFor="range-start">开始时间</label>
              <input
                id="range-start"
                type="datetime-local"
                value={filters.start ? new Date(filters.start).toISOString().slice(0, 16) : ""}
                onChange={(e) => handleDateChange("start", e.target.value)}
              />
            </div>
            <div className="range-field">
              <label htmlFor="range-end">截止时间</label>
              <input
                id="range-end"
                type="datetime-local"
                value={filters.end ? new Date(filters.end).toISOString().slice(0, 16) : ""}
                onChange={(e) => handleDateChange("end", e.target.value)}
              />
            </div>
            <div className="range-actions">
              <button className="clear-btn" onClick={() => onChange({ ...filters, start: null, end: null })}>
                清空
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="filter-row">
        <div className="filter-block">
          <p>频道筛选</p>
          <MultiSelect
            options={channels}
            selected={filters.channels}
            placeholder="默认全部频道"
            onChange={(selected) => onChange({ ...filters, channels: selected })}
          />
        </div>

        <div className="filter-block">
          <p>角色筛选</p>
          <MultiSelect
            options={roles}
            selected={filters.roles}
            placeholder="默认全部角色"
            onChange={(selected) => onChange({ ...filters, roles: selected })}
          />
        </div>
      </div>

      <div className="filter-row actions">
        <button onClick={clearFilters}>清空筛选</button>
      </div>
    </section>
  );
};

export default FilterPanel;

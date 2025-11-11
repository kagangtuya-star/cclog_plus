import React, { useEffect, useMemo, useState } from "react";
import "../App.css";
import "../styles/base.css";

const SettingsPanel = ({
  t,
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
}) => {
  const categoryLabels = useMemo(
    () => ({
      main: t("setting.main"),
      info: t("setting.info"),
      other: t("setting.other"),
    }),
    [t]
  );

  const [nameDrafts, setNameDrafts] = useState({});

  useEffect(() => {
    setNameDrafts((prev) => {
      const next = { ...prev };
      Object.keys(charColors).forEach((name) => {
        if (!(name in next)) {
          next[name] = name;
        }
      });
      Object.keys(next).forEach((key) => {
        if (!charColors[key]) {
          delete next[key];
        }
      });
      return next;
    });
  }, [charColors]);

  const handleCategoryChange = (category) => {
    setSelectedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleNameDraftChange = (originalName, value) => {
    setNameDrafts((prev) => ({ ...prev, [originalName]: value }));
  };

  const renameCharacter = (oldName) => {
    const draft = nameDrafts[oldName];
    const newName = draft?.trim();
    if (!newName || newName === oldName) {
      setNameDrafts((prev) => {
        const next = { ...prev };
        delete next[oldName];
        return next;
      });
      return;
    }
    if (charColors[newName]) {
      alert(`角色名称 "${newName}" 已存在，请使用其他名称。`);
      return;
    }
    setCharColors((prev) => {
      const { [oldName]: color, ...rest } = prev;
      return { ...rest, [newName]: color };
    });
    setCharHeads((prev) => {
      const { [oldName]: head, ...rest } = prev;
      return head ? { ...rest, [newName]: head } : rest;
    });
    setNameDrafts((prev) => {
      const next = { ...prev };
      delete next[oldName];
      next[newName] = newName;
      return next;
    });
  };

  const handleAvatarUpload = (charName, file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("请上传图片文件。");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl === "string") {
        setCharHeads((prev) => ({ ...prev, [charName]: dataUrl }));
      }
    };
    reader.readAsDataURL(file);
  };

  const toggles = [
    { id: "diceToggle", state: diceEnabled, setState: setDiceEnabled, label: "启用 Dice 样式" },
    { id: "secretToggle", state: secretEnabled, setState: setSecretEnabled, label: "启用其他标签立绘" },
  ];

  return (
    <div>
      <div className="skinTypeCheck">
        <h4>
          02. {t("setting.tab_select")}
          <b>(*{t("setting.multiple")})</b>
        </h4>
        <ul>
          {Object.keys(selectedCategories).map((category) => (
            <li key={category}>
              <input
                type="checkbox"
                id={category}
                value={category}
                checked={selectedCategories[category]}
                onChange={() => handleCategoryChange(category)}
              />
              <label htmlFor={category}>{categoryLabels[category] || category}</label>
            </li>
          ))}
        </ul>
      </div>

      <div className="skinTypeCheck">
        <h4>03. 其他样式开关</h4>
        <ul>
          {toggles.map(({ id, state, setState, label }) => (
            <li key={id}>
              <input
                type="checkbox"
                id={id}
                className="hidden"
                checked={state}
                onChange={() => setState((prev) => !prev)}
              />
              <label
                htmlFor={id}
                className={`relative toggle-switch ${state ? "active" : ""}`}
                style={{ cursor: "pointer" }}
              >
                <span className="mr-2">{label}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <h4>
        04. {t("setting.cha_color")}
        <b>(*{t("setting.warning_txt2")})</b>
      </h4>
      <div className="character-grid">
        {Object.keys(charColors).map((charName) => {
          const draftValue = nameDrafts[charName] ?? charName;
          const avatarSrc = charHeads[charName] || "";
          const inputId = `avatar-${charName}`;
          return (
            <div key={charName} className="character-row">
              <div className="character-cell">
                <label>角色姓名</label>
                <input
                  type="text"
                  value={draftValue}
                  onChange={(e) => handleNameDraftChange(charName, e.target.value)}
                  onBlur={() => renameCharacter(charName)}
                />
              </div>
              <div className="character-cell avatar-cell">
                <label>头像预览</label>
                <label className="avatar-upload" htmlFor={inputId} title="点击上传本地头像">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt={charName} className="avatar-preview" />
                  ) : (
                    <span className="avatar-placeholder">点击上传</span>
                  )}
                </label>
                <input
                  id={inputId}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleAvatarUpload(charName, e.target.files?.[0])}
                />
              </div>
              <div className="character-cell">
                <label>姓名颜色</label>
                <input
                  type="color"
                  value={charColors[charName] || "#000000"}
                  onChange={(e) => setCharColors((prev) => ({ ...prev, [charName]: e.target.value }))}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="avatar-hint">提示：点击头像区域即可上传本地图片并立即预览，导出时会自动嵌入。</p>
    </div>
  );
};

export default SettingsPanel;

import styled from "styled-components";
import { useFsStore } from "@entities/fs-tree";
import { buildZip, loadZip, updateText } from "@shared/api/zip";
import { useRef } from "react";

export default function HeaderBar() {
  const tree = useFsStore((s) => s.tree);
  const setTree = useFsStore((s) => s.setTree);

  const inputRef = useRef<HTMLInputElement>(null);

  const onUploadClick = () => {
    inputRef.current?.click();
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const t = await loadZip(f);
    setTree(t);
  };

  const flushAllOpenTextTabs = async () => {
    const { tabs } = useFsStore.getState();
    const tasks = tabs
      .filter((t) => t.kind === "text")
      .map((t) => updateText(t.path, t.content ?? ""));
    await Promise.allSettled(tasks);
  };

  const onDownload = async () => {
    if (!tree) {
      alert("파일이 업로드 되지 않았습니다.");
      return;
    }

    await flushAllOpenTextTabs();

    const blob = await buildZip();

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "edited.zip";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 0);
  };

  return (
    <Bar>
      <strong>Monaco ZIP Editor</strong>
      <button
        data-testid="upload-btn"
        type="button"
        id="uploadBtn"
        className="icon-btn"
        onClick={onUploadClick}
      >
        <i className="codicon codicon-cloud-upload" /> 파일 선택
      </button>

      <input
        ref={inputRef}
        id="zipInput"
        type="file"
        accept=".zip"
        onChange={onUpload}
        style={{ display: "none" }}
        aria-labelledby="uploadBtn"
      />
      <button
        data-testid="download-btn"
        className="icon-btn primary"
        onClick={onDownload}
      >
        <i className="codicon codicon-cloud-download" /> Download ZIP
      </button>
    </Bar>
  );
}

const Bar = styled.header`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  height: 56px;
  background: ${({ theme }) => theme.bg2};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  input[type="file"] {
    color: ${({ theme }) => theme.textMute};
  }
  .icon-btn {
    cursor: pointer;
    display: inline-flex;
    gap: 6px;
    align-items: center;
    padding: 6px 10px;
    border-radius: 4px;
    border: 1px solid ${({ theme }) => theme.border};
    background: ${({ theme }) => theme.bg3};
    color: ${({ theme }) => theme.text};
  }
  .icon-btn.primary {
    background: ${({ theme }) => theme.accent};
    border-color: ${({ theme }) => theme.accent};
    color: #fff;
  }
`;

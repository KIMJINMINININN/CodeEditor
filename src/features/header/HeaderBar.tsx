// src/features/header/HeaderBar.tsx
import styled from "styled-components";
import { useFsStore } from "../../store/useFsStore";
import { buildZip, loadZip } from "../../lib/zipClient";

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

export function HeaderBar() {
  const tree = useFsStore((s) => s.tree);
  const setTree = useFsStore((s) => s.setTree);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const t = await loadZip(f);
    setTree(t);
  };

  const onDownload = async () => {
    if (!tree) {
      alert("파일이 업로드 되지 않았습니다.");
      return;
    }
    const blob = await buildZip();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "edited.zip";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <Bar>
      <strong>Monaco ZIP Editor</strong>
      <label className="icon-btn">
        <i className="codicon codicon-cloud-upload" /> 파일 선택
        <input type="file" accept=".zip" onChange={onUpload} hidden />
      </label>
      <button className="icon-btn primary" onClick={onDownload}>
        <i className="codicon codicon-cloud-download" /> Download ZIP
      </button>
    </Bar>
  );
}

// src/features/header/HeaderBar.tsx
import styled from "styled-components";
import { useFsStore } from "../../store/useFsStore";
import { buildZip, loadZip, updateText } from "../../lib/zipClient";

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
  const get = useFsStore; // getState 사용을 위해 바인딩만

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const t = await loadZip(f);
    setTree(t);
  };

  const flushAllOpenTextTabs = async () => {
    const { tabs } = get.getState(); // ✅ 현재 스토어 스냅샷
    const tasks = tabs
      .filter((t) => t.kind === "text")
      .map((t) => updateText(t.path, t.content ?? ""));
    // 실패해도 계속 진행 (로그만 찍기)
    await Promise.allSettled(tasks);
  };

  const onDownload = async () => {
    if (!tree) {
      alert("파일이 업로드 되지 않았습니다.");
      return;
    }

    // ✅ 1) 마지막 편집 내용까지 워커에 반영
    await flushAllOpenTextTabs();

    // ✅ 2) 그 다음 ZIP 생성
    const blob = await buildZip();

    // ✅ 3) 다운로드 (일부 브라우저는 revoke를 다음 틱에)
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "edited.zip";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 0);
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

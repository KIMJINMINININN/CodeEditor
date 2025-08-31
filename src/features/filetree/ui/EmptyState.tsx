import { useRef } from "react";
import { useFsStore } from "@entities/fs-tree";
import { loadZip } from "@shared/api/zip";
import styled from "styled-components";

const EmptyState = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragActive = useFsStore((s) => s.dragActive);
  const setTree = useFsStore((s) => s.setTree);

  const onClick = () => fileInputRef.current?.click();
  const onChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".zip")) {
      alert("ZIP 파일만 업로드 가능합니다.");
      return;
    }
    const t = await loadZip(f);
    setTree(t);
  };

  // 키보드 접근성
  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <EmptyWrap>
      <DropHint
        role="button"
        tabIndex={0}
        $active={dragActive}
        onClick={onClick}
        onKeyDown={onKeyDown}
        aria-label="ZIP 업로드"
      >
        <i className="codicon codicon-cloud-upload" style={{ fontSize: 28 }} />
        <div className="title">
          {dragActive ? "여기에 드롭하여 업로드" : "ZIP을 업로드하세요"}
        </div>
        <div className="sub">드래그&드롭 또는 클릭하여 파일 선택</div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip"
          hidden
          onChange={onChange}
        />
      </DropHint>
    </EmptyWrap>
  );
};

const EmptyWrap = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: ${({ theme }) => theme.bg2};
`;

const DropHint = styled.div<{ $active: boolean }>`
  width: calc(100% - 24px);
  height: 160px;
  border: 2px dashed
    ${({ theme, $active }) => ($active ? theme.accent : theme.border)};
  border-radius: 12px;
  background: ${({ theme, $active }) => ($active ? theme.bg3 : "transparent")};
  color: ${({ theme }) => theme.text};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
  cursor: pointer;
  user-select: none;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease,
    transform 0.05s ease;
  &:hover {
    border-color: ${({ theme }) => theme.accent};
  }
  &:active {
    transform: scale(0.995);
  }
  .title {
    font-weight: 600;
  }
  .sub {
    color: ${({ theme }) => theme.textMute};
    font-size: 12px;
  }
`;

export default EmptyState;

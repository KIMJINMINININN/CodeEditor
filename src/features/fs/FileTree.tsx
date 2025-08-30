import styled from "styled-components";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";
import { useMemo, useCallback, useEffect, useRef, useState } from "react";
import { useFsStore } from "../../store/useFsStore";
import { fetchFileTab, loadZip } from "../../lib/zipClient";
import { flattenVisible, type FlatNode } from "../../lib/flattenTree";

const ICON = 16;

function parentPathOf(path: string) {
  const i = path.lastIndexOf("/");
  return i <= 0 ? "/" : path.slice(0, i);
}

const EmptyWrap = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: ${({ theme }) => theme.bg2};
`;

const DropHint = styled.div<{ active: boolean }>`
  width: calc(100% - 24px);
  height: 160px;
  border: 2px dashed
    ${({ theme, active }) => (active ? theme.accent : theme.border)};
  border-radius: 12px;
  background: ${({ theme, active }) => (active ? theme.bg3 : "transparent")};
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

function EmptyState() {
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
        active={dragActive}
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
}

export function FileTree() {
  const tree = useFsStore((s) => s.tree);
  const expanded = useFsStore((s) => s.expanded);
  const toggleExpanded = useFsStore((s) => s.toggleExpanded);
  const openTab = useFsStore((s) => s.openTab);
  const activePath = useFsStore((s) => s.activePath);
  const setActive = useFsStore((s) => s.setActive);

  const data = useMemo<FlatNode[]>(
    () => (tree ? flattenVisible(tree, expanded) : []),
    [tree, expanded],
  );

  const listRef = useRef<VirtuosoHandle>(null);
  const [focusIdx, setFocusIdx] = useState(0);
  useEffect(() => {
    // 데이터 길이 변하면 포커스 인덱스 안전 범위로 클램프
    if (focusIdx >= data.length) setFocusIdx(Math.max(0, data.length - 1));
  }, [data.length]);

  const focusRow = (idx: number) => {
    const clamped = Math.max(0, Math.min(idx, data.length - 1));
    setFocusIdx(clamped);
    listRef.current?.scrollToIndex({ index: clamped, align: "center" });
    // 다음 틱에 실제 포커스
    setTimeout(() => {
      const el = document.getElementById(`tree-row-${clamped}`);
      (el as HTMLElement | null)?.focus();
    }, 0);
  };

  const onRowClick = useCallback(
    async (n: FlatNode, idx: number) => {
      focusRow(idx);
      if (n.type === "folder") {
        toggleExpanded(n.path);
      } else {
        setActive(n.path);
        const tab = await fetchFileTab(n.path);
        openTab(tab);
      }
    },
    [toggleExpanded, setActive, openTab, data.length],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!data.length) return;
    const n = data[focusIdx];
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        focusRow(focusIdx + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        focusRow(focusIdx - 1);
        break;
      case "ArrowRight":
        e.preventDefault();
        if (n.type === "folder") {
          if (!expanded[n.path]) toggleExpanded(n.path);
          else focusRow(focusIdx + 1); // 이미 열려있다면 다음(보통 첫 자식)
        } else {
          // 파일은 Enter와 동일: 열기
          onRowClick(n, focusIdx);
        }
        break;
      case "ArrowLeft":
        e.preventDefault();
        if (n.type === "folder" && expanded[n.path]) {
          toggleExpanded(n.path);
        } else {
          const parent = parentPathOf(n.path);
          const idx = data.findIndex((x) => x.path === parent);
          if (idx >= 0) focusRow(idx);
        }
        break;
      case "Enter":
        e.preventDefault();
        onRowClick(n, focusIdx);
        break;
      default:
        break;
    }
  };

  if (!tree) return <EmptyState />;

  return (
    <Wrap tabIndex={0} onKeyDown={onKeyDown}>
      <Virtuoso
        ref={listRef}
        data={data}
        itemContent={(index, n) => {
          const isOpen = !!expanded[n.path];
          const twisty =
            n.type === "folder" ? (
              <i
                className={`codicon ${isOpen ? "codicon-chevron-down" : "codicon-chevron-right"} twisty`}
              />
            ) : (
              <span className="twisty" />
            );
          const kind = (
            <i
              className={`codicon ${
                n.type === "folder"
                  ? isOpen
                    ? "codicon-folder-opened"
                    : "codicon-folder"
                  : "codicon-file"
              } kind`}
            />
          );
          const active = n.path === activePath;
          const focused = index === focusIdx;
          return (
            <Row
              id={`tree-row-${index}`}
              depth={n.depth}
              active={active}
              focused={focused}
              tabIndex={focused ? 0 : -1}
              onClick={() => onRowClick(n, index)}
            >
              {twisty}
              {kind}
              <span className="label">{n.name}</span>
            </Row>
          );
        }}
        increaseViewportBy={600}
        overscan={200}
        style={{ height: "100%" }}
      />
    </Wrap>
  );
}

const Wrap = styled.div`
  height: 100%;
  overflow: hidden;
  font-size: 13px;
  color: ${({ theme }) => theme.text};
  background: ${({ theme }) => theme.bg2};
  outline: none;
`;

const Row = styled.div<{ active?: boolean; depth: number; focused: boolean }>`
  display: flex;
  align-items: center;
  padding: 3px 8px 3px calc(8px + ${(p) => p.depth * 14}px);
  height: 24px;
  background: ${({ active, theme }) => (active ? theme.bg3 : "transparent")};
  cursor: pointer;
  user-select: none;
  &:hover {
    background: ${({ theme }) => theme.bg3};
  }
  .twisty,
  .kind {
    width: ${ICON}px;
    height: ${ICON}px;
    flex: 0 0 ${ICON}px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.textMute};
  }
  .label {
    margin-left: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  &:focus {
    outline: 1px solid ${({ theme }) => theme.accent};
  }
`;

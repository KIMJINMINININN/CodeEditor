import styled from "styled-components";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";
import { useMemo, useCallback, useEffect, useRef, useState, memo } from "react";
import { useFsStore } from "@entities/fs-tree";
import { fetchFileTab, loadZip } from "@shared/api/zip";
import { flattenVisible, type FlatNode } from "@entities/fs-tree/lib/flatten";
import { BAR_H } from "@shared/styles/layout";
import EmptyState from "@features/filetree/ui/EmptyState";

const ICON = 16;

function parentPathOf(path: string) {
  const i = path.lastIndexOf("/");
  return i <= 0 ? "/" : path.slice(0, i);
}

const FileTree = memo(() => {
  const tree = useFsStore((s) => s.tree);
  const expanded = useFsStore((s) => s.expanded);
  const toggleExpanded = useFsStore((s) => s.toggleExpanded);
  const openTab = useFsStore((s) => s.openTab);
  const activePath = useFsStore((s) => s.activePath);
  const newFile = useFsStore((s) => s.newFile);
  const newFolder = useFsStore((s) => s.newFolder);
  const deleteEntry = useFsStore((s) => s.deleteEntry);

  const setActive = useFsStore((s) => s.setActive);

  const data = useMemo<FlatNode[]>(
    () => (tree ? flattenVisible(tree, expanded) : []),
    [tree, expanded],
  );

  const listRef = useRef<any>(null);
  const [focusIdx, setFocusIdx] = useState(0);
  useEffect(() => {
    // 데이터 길이 변하면 포커스 인덱스 안전 범위로 클램프
    if (focusIdx >= data.length) setFocusIdx(Math.max(0, data.length - 1));
  }, [data.length]);

  const focusRow = (idx: number) => {
    setFocusIdx(idx);

    const api = listRef.current as any;
    if (api?.scrollToIndex && typeof api.scrollToIndex === "function") {
      try {
        api.scrollToIndex({ index: idx, align: "center", behavior: "auto" });
      } catch {
        // noop: 테스트 목 등에서 옵션 객체 모양이 달라도 실패하지 않게
      }
      return;
    }
    if (api?.scrollTo && typeof api.scrollTo === "function") {
      api.scrollTo({ top: idx * 24 }); // 행 높이 대략값
    }
    // 아무 API도 없으면 그냥 포커스만 바꾸고 종료
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
          else focusRow(focusIdx + 1);
        } else {
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

  const itemContent = (index: any, n: any) => {
    const isOpen = expanded[n.path];
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
        $depth={n.depth}
        $active={active}
        $focused={focused}
        tabIndex={focused ? 0 : -1}
        onClick={() => onRowClick(n, index)}
        role="treeitem"
        data-testid="tree-row"
      >
        {twisty}
        {kind}
        <span className="label">{n.name}</span>
      </Row>
    );
  };

  const focusedPath = data[focusIdx]?.path;

  if (!tree) return <EmptyState />;

  return (
    <Wrap
      tabIndex={0}
      onKeyDown={onKeyDown}
      role="tree"
      data-testid="file-tree"
    >
      <Toolbar>
        <button onClick={() => newFile(focusedPath)} title="새 파일">
          <i className="codicon codicon-new-file" /> 새 파일
        </button>
        <button onClick={() => newFolder(focusedPath)} title="새 폴더">
          <i className="codicon codicon-new-folder" /> 새 폴더
        </button>
        <button
          onClick={() => focusedPath && deleteEntry(focusedPath)}
          disabled={!focusedPath}
          title="삭제"
        >
          <i className="codicon codicon-trash" /> 삭제
        </button>
      </Toolbar>
      <TreeBody>
        <Virtuoso
          ref={listRef}
          data={data}
          style={{ height: "100%" }}
          itemContent={(index, n) => itemContent(index, n)}
          increaseViewportBy={600}
          overscan={200}
        />
      </TreeBody>
    </Wrap>
  );
});

const Row = styled.div<{
  $active?: boolean;
  $depth: number;
  $focused: boolean;
}>`
  display: flex;
  align-items: center;
  padding: 3px 8px 3px calc(8px + ${(p) => p.$depth * 14}px);
  height: 24px;
  background: ${({ $active, theme }) => ($active ? theme.bg3 : "transparent")};
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

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  font-size: 13px;
  color: ${({ theme }) => theme.text};
  background: ${({ theme }) => theme.bg2};
  outline: none;
`;

const Toolbar = styled.div`
  height: ${BAR_H}px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 8px; /* 수직 패딩 0 → 라인 정렬 */
  border-bottom: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.bg2};

  button {
    height: 24px; /* 바 안에서 균형 잡힌 버튼 높이 */
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0 8px;
    border-radius: 6px;
    border: 1px solid ${({ theme }) => theme.border};
    background: ${({ theme }) => theme.bg3};
    color: ${({ theme }) => theme.text};
    &:hover {
      filter: brightness(1.1);
    }
  }
`;

const TreeBody = styled.div`
  flex: 1;
  min-height: 0;
`;

export default FileTree;

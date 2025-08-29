// src/features/fs/FileTree.tsx
import styled from "styled-components";
import { useFsStore, TreeNode } from "../../store/useFsStore";
import { fetchFileTab } from "../../lib/zipClient";
import { useState } from "react";

const ICON = 16;

const Wrap = styled.div`
  height: 100%;
  overflow: auto;
  font-size: 13px;
  color: ${({ theme }) => theme.text};
`;

const Row = styled.div<{ active?: boolean; depth: number }>`
  display: flex;
  align-items: center;
  padding: 3px 8px 3px calc(8px + ${(p) => p.depth * 14}px);
  background: ${({ active, theme }) => (active ? theme.bg3 : "transparent")};
  cursor: pointer;
  user-select: none;

  &:hover {
    background: ${({ theme }) => theme.bg3};
  }

  /* 고정 폭 셀: twisty(토글), kind(폴더/파일) */
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
`;

function NodeView({ node, depth }: { node: TreeNode; depth: number }) {
  const openTab = useFsStore((s) => s.openTab);
  const [open, setOpen] = useState(true);

  const onOpen = async () => {
    if (node.type === "file") {
      const tab = await fetchFileTab(node.path);
      openTab(tab);
    } else {
      setOpen((o) => !o);
    }
  };

  const twisty =
    node.type === "folder" ? (
      <i
        className={`codicon ${open ? "codicon-chevron-down" : "codicon-chevron-right"} twisty`}
      />
    ) : (
      <span className="twisty" />
    ); // ✅ 파일에도 placeholder

  const kind = (
    <i
      className={`codicon ${
        node.type === "folder"
          ? open
            ? "codicon-folder-opened"
            : "codicon-folder"
          : "codicon-file"
      } kind`}
    />
  );

  return (
    <>
      <Row depth={depth} onClick={onOpen}>
        {twisty}
        {kind}
        <span className="label">{node.name}</span>
      </Row>

      {open &&
        node.children?.map((ch) => (
          <NodeView key={ch.path} node={ch} depth={depth + 1} />
        ))}
    </>
  );
}

export function FileTree() {
  const tree = useFsStore((s) => s.tree);
  if (!tree)
    return (
      <Wrap style={{ padding: 12, color: "#a0a0a0" }}>ZIP을 업로드하세요</Wrap>
    );
  return (
    <Wrap>
      {tree.children?.map((n) => (
        <NodeView key={n.path} node={n} depth={0} />
      ))}
    </Wrap>
  );
}

// src/lib/expand.ts
import type { TreeNode } from "@entities/fs-tree";

/**
 * 폴더 노드를 maxDepth까지 펼친 상태로 반환합니다.
 * depth: 루트('/')가 0, 그 자식 폴더들이 1
 */
export function expandedToDepth(
  root: TreeNode,
  maxDepth: number,
): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  const walk = (node: TreeNode, depth: number) => {
    if (node.type === "folder" && depth <= maxDepth) {
      out[node.path] = true; // 이 폴더는 펼침
      if (node.children && depth < maxDepth) {
        node.children.forEach((ch) => walk(ch, depth + 1));
      }
    }
  };
  walk(root, 0);
  return out;
}

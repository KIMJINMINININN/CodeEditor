// src/lib/flattenTree.ts
import type { TreeNode } from "@entities/fs-tree";

export type FlatNode = {
  path: string;
  name: string;
  type: "file" | "folder";
  depth: number;
  size?: number;
  childrenCount?: number;
};

export function flattenVisible(
  root: TreeNode,
  expanded: Record<string, boolean>,
): FlatNode[] {
  const out: FlatNode[] = [];
  const walk = (node: TreeNode, depth: number) => {
    if (node.path !== "/") {
      out.push({
        path: node.path,
        name: node.name,
        type: node.type,
        depth,
        size: node.size,
        childrenCount: node.children?.length,
      });
    }
    if (node.type === "folder" && expanded[node.path ?? "/"]) {
      node.children?.forEach((ch) => walk(ch, depth + 1));
    }
  };
  walk(root, 0);
  return out;
}

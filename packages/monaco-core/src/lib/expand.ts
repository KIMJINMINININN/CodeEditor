// src/lib/expand.ts
import type { TreeNode } from "@entities/fs-tree";

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

import type { TreeNode } from "@entities/fs-tree";

export function buildTree(paths: { path: string; size?: number }[]): TreeNode {
  const root: TreeNode = { name: "/", path: "/", type: "folder", children: [] };
  const byPath = new Map<string, TreeNode>([["/", root]]);

  for (const { path, size } of paths) {
    const parts = path.split("/").filter(Boolean);
    let cur = root;
    let acc = "";
    for (let i = 0; i < parts.length; i++) {
      acc += "/" + parts[i];
      const isFile = i === parts.length - 1 && !path.endsWith("/");
      let child = byPath.get(acc);
      if (!child) {
        child = {
          name: parts[i],
          path: acc,
          type: isFile ? "file" : "folder",
          size: isFile ? size : undefined,
          children: isFile ? undefined : [],
        };
        cur.children!.push(child);
        byPath.set(acc, child);
      }
      cur = child;
    }
  }
  // 폴더 내 정렬: 폴더 우선, 이름순
  const sort = (n: TreeNode) => {
    if (!n.children) return;
    n.children.sort((a, b) =>
      a.type === b.type
        ? a.name.localeCompare(b.name)
        : a.type === "folder"
          ? -1
          : 1,
    );
    n.children.forEach(sort);
  };
  sort(root);
  return root;
}

export function ensureFolder(root: TreeNode, folderPath: string) {
  const parts = folderPath.split("/").filter(Boolean);
  let cur = root;
  for (let i = 0; i < parts.length; i++) {
    const seg = parts[i];
    const p = "/" + parts.slice(0, i + 1).join("/");
    let child = cur.children?.find((c) => c.path === p);
    if (!child) {
      child = { name: seg, path: p, type: "folder", children: [] };
      (cur.children ??= []).push(child);
    }
    cur = child;
  }
  return cur;
}

export function insertFile(root: TreeNode, filePath: string) {
  const idx = filePath.lastIndexOf("/");
  const folder = ensureFolder(root, filePath.slice(0, idx));
  const name = filePath.slice(idx + 1);
  const exists = folder.children?.some((c) => c.path === filePath);
  if (!exists)
    (folder.children ??= []).push({ name, path: filePath, type: "file" });
}

export function insertFolder(root: TreeNode, folderPath: string) {
  ensureFolder(root, folderPath);
}

export function removePath(root: TreeNode, target: string) {
  const walk = (node: TreeNode) => {
    if (!node.children) return;
    node.children = node.children.filter((c) => {
      if (c.path === target) return false;
      if (
        target.endsWith("/")
          ? c.path.startsWith(target)
          : c.path.startsWith(target + "/")
      )
        return false;
      return true;
    });
    node.children.forEach(walk);
  };
  walk(root);
}

export function uniqueName(
  root: TreeNode,
  folderPath: string,
  base: string,
  ext = "",
) {
  const folder = ensureFolder(root, folderPath);
  const set = new Set((folder.children ?? []).map((c) => c.name));
  if (!set.has(base + ext)) return base + ext;
  let i = 1;
  while (set.has(`${base} ${i}${ext}`)) i++;
  return `${base} ${i}${ext}`;
}

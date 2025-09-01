import { create } from "zustand";
import { revokeIfBlobUrl } from "@shared/api/zip";
import { expandedToDepth } from "@entities/fs-tree/lib/expand";
import {
  insertFile,
  insertFolder,
  removePath,
  uniqueName,
} from "@shared/lib/tree";
import {
  createFile as apiCreateFile,
  deletePath as apiDeletePath,
} from "@shared/api/zip";

export type NodeType = "file" | "folder";
export type TreeNode = {
  name: string;
  path: string;
  type: NodeType;
  size?: number;
  children?: TreeNode[];
};

export type Tab =
  | { path: string; kind: "text"; language?: string; content?: string }
  | { path: string; kind: "image"; dataUrl: string }
  | { path: string; kind: "binary" };

type State = {
  tree: TreeNode | null;
  tabs: Tab[];
  activePath?: string;
  expanded: Record<string, boolean>;
  dragActive: boolean;

  toggleExpanded: (path: string) => void;
  setExpanded: (path: string, v: boolean) => void;

  setTree: (t: TreeNode | null) => void;
  openTab: (t: Tab) => void;
  closeTab: (path: string) => void;
  updateText: (path: string, content: string) => void;
  setActive: (path?: string) => void;
  setDragActive: (v: boolean) => void;

  newFile: (baseOnPath?: string) => Promise<void>;
  newFolder: (baseOnPath?: string) => Promise<void>;
  deleteEntry: (targetPath: string) => Promise<void>;
};

export const useFsStore = create<State>((set, get) => ({
  tree: null,
  tabs: [],
  activePath: undefined,
  expanded: {},
  dragActive: false,

  toggleExpanded: (path) =>
    set((s) => ({
      expanded: { ...s.expanded, [path]: !s.expanded[path] },
    })),
  setExpanded: (path, v) =>
    set((s) => ({
      expanded: { ...s.expanded, [path]: v },
    })),

  setTree: (t) =>
    set(() => ({ tree: t, expanded: t ? expandedToDepth(t, 1) : {} })),

  openTab: (t) =>
    set((s) => ({
      tabs: [...s.tabs.filter((x) => x.path !== t.path), t],
      activePath: t.path,
    })),
  closeTab: (path) =>
    set((s) => {
      // 🔻 메모리 누수 방지: 이미지 blob URL 해제
      const target = s.tabs.find((x) => x.path === path);
      if (target && target.kind === "image") revokeIfBlobUrl(target.dataUrl);

      const tabs = s.tabs.filter((t) => t.path !== path);
      const activePath =
        s.activePath === path ? tabs.at(-1)?.path : s.activePath;
      return { tabs, activePath };
    }),
  updateText: (path, content) =>
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.path === path && t.kind === "text" ? { ...t, content } : t,
      ),
    })),
  setActive: (p) => set({ activePath: p }),
  setDragActive: (v) => set({ dragActive: v }),

  newFile: async (baseOnPath) => {
    const s = get();
    if (!s.tree) return;
    // 선택이 파일이면 그 부모, 폴더면 그 폴더, 없으면 루트
    const base = baseOnPath || s.activePath || "/";
    const parent = base.endsWith("/") ? base.slice(0, -1) : base;
    const folder =
      s.tree &&
      baseOnPath &&
      baseOnPath !== "/" &&
      baseOnPath.split("/").pop()!.includes(".")
        ? parent.substring(0, parent.lastIndexOf("/")) || "/"
        : base === "/"
          ? "/"
          : parent;

    const name = window.prompt("새 파일 이름", "untitled.txt");
    if (!name) return;
    const full = (folder === "/" ? "" : folder) + "/" + name;

    await apiCreateFile(full, "");
    set(({ tree, expanded }) => {
      if (!tree) return {};
      insertFile(tree, full);
      return {
        tree: { ...tree },
        expanded: { ...expanded, [folder || "/"]: true },
        activePath: full,
      };
    });
  },
  newFolder: async (baseOnPath) => {
    const s = get();
    if (!s.tree) return;
    const base = baseOnPath || s.activePath || "/";
    const isFile = base !== "/" && base.split("/").pop()!.includes(".");
    const folderBase = isFile ? base.slice(0, base.lastIndexOf("/")) : base;
    const name = window.prompt("새 폴더 이름", "new-folder");
    if (!name) return;
    const full = (folderBase === "/" ? "" : folderBase) + "/" + name;

    set(({ tree, expanded }) => {
      if (!tree) return {};
      insertFolder(tree, full);
      return {
        tree: { ...tree },
        expanded: { ...expanded, [folderBase || "/"]: true },
      };
    });
  },

  deleteEntry: async (targetPath) => {
    const s = get();
    if (!s.tree) return;
    if (!window.confirm(`${targetPath} 을(를) 삭제할까요?`)) return;

    await apiDeletePath(targetPath);
    set(({ tree, tabs, activePath }) => {
      if (!tree) return {};
      removePath(tree, targetPath);
      // 열린 탭도 정리
      const tabKept = tabs.filter(
        (t) => !(t.path === targetPath || t.path.startsWith(targetPath + "/")),
      );
      const newActive = tabKept.find((t) => t.path === activePath)
        ? activePath
        : tabKept.at(-1)?.path;
      return { tree: { ...tree }, tabs: tabKept, activePath: newActive };
    });
  },
}));

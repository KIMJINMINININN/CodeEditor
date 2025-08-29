// src/store/useFsStore.ts
import { create } from 'zustand';
import { revokeIfBlobUrl } from '../lib/zipClient';

export type NodeType = 'file'|'folder';
export type TreeNode = { name: string; path: string; type: NodeType; size?: number; children?: TreeNode[] };

export type Tab =
    | { path: string; kind: 'text';   language?: string; content?: string }
    | { path: string; kind: 'image';  dataUrl: string }
    | { path: string; kind: 'binary' };

type State = {
    tree: TreeNode | null;
    tabs: Tab[];
    activePath?: string;
    setTree: (t: TreeNode | null) => void;
    openTab: (t: Tab) => void;
    closeTab: (path: string) => void;
    updateText: (path: string, content: string) => void;
    setActive: (path?: string) => void;
};

export const useFsStore = create<State>((set, get) => ({
    tree: null,
    tabs: [],
    setTree: (t) => set({ tree: t }),
    openTab: (t) => set((s) => ({
        tabs: [...s.tabs.filter(x => x.path !== t.path), t],
        activePath: t.path
    })),
    closeTab: (path) => set((s) => {
        // 🔻 메모리 누수 방지: 이미지 blob URL 해제
        const target = s.tabs.find(x => x.path === path);
        if (target && target.kind === 'image') revokeIfBlobUrl(target.dataUrl);

        const tabs = s.tabs.filter(t => t.path !== path);
        const activePath = s.activePath === path ? tabs.at(-1)?.path : s.activePath;
        return { tabs, activePath };
    }),
    updateText: (path, content) => set((s) => ({
        tabs: s.tabs.map(t => t.path === path && t.kind === 'text' ? { ...t, content } : t)
    })),
    setActive: (p) => set({ activePath: p })
}));

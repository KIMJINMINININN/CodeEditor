import { create } from 'zustand';

export type NodeType = 'file'|'folder';
export type TreeNode = { name: string; path: string; type: NodeType; size?: number; children?: TreeNode[] };

export type Tab = { path: string; kind: 'text'|'image'|'binary'; language?: string; content?: string; dataUrl?: string };

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

export const useFsStore = create<State>((set) => ({
    tree: null,
    tabs: [],
    setTree: (t) => set({ tree: t }),
    openTab: (t) => set((s) => ({
        tabs: [...s.tabs.filter(x => x.path !== t.path), t],
        activePath: t.path
    })),
    closeTab: (path) => set((s) => {
        const tabs = s.tabs.filter(t => t.path !== path);
        const activePath = s.activePath === path ? tabs.at(-1)?.path : s.activePath;
        return { tabs, activePath };
    }),
    updateText: (path, content) => set((s) => ({
        tabs: s.tabs.map(t => t.path === path ? { ...t, content } : t)
    })),
    setActive: (p) => set({ activePath: p })
}));

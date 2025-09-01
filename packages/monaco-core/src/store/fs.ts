import { create } from 'zustand';
import { FileTab, FsNode } from '../types';

type State = {
    tree?: FsNode;
    expanded: Record<string, boolean>;
    tabs: FileTab[];
    activePath?: string;
    dragActive: boolean;
};
type Actions = {
    setTree: (tree?: FsNode) => void;
    toggleExpanded: (path: string) => void;
    openTab: (tab: FileTab) => void;
    closeTab: (path: string) => void;
    setActive: (path?: string) => void;
    setDragActive: (v: boolean) => void;
};

export const useFsStore = create<State & Actions>((set, get) => ({
    tree: undefined,
    expanded: { '/': true },
    tabs: [],
    activePath: undefined,
    dragActive: false,
    setTree: (tree) => set({ tree, expanded: { '/': true } }),
    toggleExpanded: (path) => set(s => ({ expanded: { ...s.expanded, [path]: !s.expanded[path] } })),
    openTab: (tab) => set(s => {
        const exists = s.tabs.some(t => t.path === tab.path);
        const tabs = exists ? s.tabs : [...s.tabs, tab];
        return { tabs, activePath: tab.path };
    }),
    closeTab: (path) => set(s => {
        const tabs = s.tabs.filter(t => t.path !== path);
        const activePath =
            s.activePath === path ? s.tabs[s.tabs.length - 1]?.path : s.activePath;
        return { tabs, activePath };
    }),
    setActive: (path) => set({ activePath: path }),
    setDragActive: (v) => set({ dragActive: v })
}));

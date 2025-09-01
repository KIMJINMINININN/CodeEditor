let _p: Promise<typeof import('monaco-editor/esm/vs/editor/editor.api')> | null = null;

export function ensureMonaco() {
    if (typeof window === 'undefined') throw new Error('Monaco cannot load on SSR');
    if (!_p) _p = import('monaco-editor/esm/vs/editor/editor.api');
    return _p;
}

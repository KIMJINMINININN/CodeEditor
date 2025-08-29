const BINARY_EXT = new Set(['png','jpg','jpeg','gif','bmp','webp','ico','pdf']);
export function extOf(path: string) {
    const m = path.match(/\.([a-z0-9]+)$/i);
    return m ? m[1].toLowerCase() : '';
}
export function isProbablyBinary(buf: Uint8Array, path: string): boolean {
    const ext = extOf(path);
    if (BINARY_EXT.has(ext)) return true;
    const len = Math.min(buf.length, 1024);
    for (let i = 0; i < len; i++) {
        const b = buf[i];
        if (b === 0) return true;               // NUL
        if (b < 7 || (b > 13 && b < 32)) return true; // control chars except \t\n\r
    }
    return false;
}
export function guessLanguage(path: string): string | undefined {
    const ext = extOf(path);
    switch (ext) {
        case 'ts': return 'typescript';
        case 'tsx': return 'typescript';
        case 'js': return 'javascript';
        case 'jsx': return 'javascript';
        case 'json': return 'json';
        case 'md': return 'markdown';
        case 'css': return 'css';
        case 'html': return 'html';
        default: return undefined;
    }
}

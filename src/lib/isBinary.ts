// src/lib/isBinary.ts
export type FileKind = 'text' | 'image' | 'binary';

export type DecideOptions = {
    treatSvgAsText?: boolean;       // SVG를 텍스트 편집 대상으로 볼지 (기본 true)
    sampleBytes?: number;           // 휴리스틱 샘플 크기 (기본 2048)
    controlCharThreshold?: number;  // 제어문자 비율 임계치 (기본 0.3)
};

const IMG_EXT = new Set(['png','jpg','jpeg','gif','webp','bmp','ico']);
const TEXT_EXT = new Set([
    'txt','md','json','js','jsx','ts','tsx','css','scss','html','xml','yml','yaml','csv','svg'
]);

export function extOf(path: string) {
    const m = path.match(/\.([a-z0-9]+)$/i);
    return m ? m[1].toLowerCase() : '';
}

function hasUtf8Bom(u: Uint8Array) {
    return u.length >= 3 && u[0] === 0xef && u[1] === 0xbb && u[2] === 0xbf;
}
function hasUtf16Bom(u: Uint8Array) {
    return u.length >= 2 && (
        (u[0] === 0xff && u[1] === 0xfe) ||
        (u[0] === 0xfe && u[1] === 0xff)
    );
}
function hasUtf32Bom(u: Uint8Array) {
    return u.length >= 4 && (
        (u[0] === 0xff && u[1] === 0xfe && u[2] === 0x00 && u[3] === 0x00) ||
        (u[0] === 0x00 && u[1] === 0x00 && u[2] === 0xfe && u[3] === 0xff)
    );
}

function looksLikeText(u8: Uint8Array, opt: DecideOptions) {
    const n = Math.min(u8.length, opt.sampleBytes ?? 2048);
    if (n === 0) return true; // 빈 파일은 텍스트 취급

    if (hasUtf8Bom(u8) || hasUtf16Bom(u8) || hasUtf32Bom(u8)) return true;

    // 제어문자 비율 휴리스틱
    let control = 0;
    for (let i = 0; i < n; i++) {
        const b = u8[i];
        if (b === 0x00) {              // NUL
            control++;
            continue;
        }
        // 0x00~0x08, 0x0e~0x1f (탭/개행/복귀 제외)
        if (b < 0x09 || (b > 0x0d && b < 0x20)) control++;
    }
    const threshold = opt.controlCharThreshold ?? 0.3;
    return control / n < threshold;
}

export function guessLanguage(path: string): string | undefined {
    switch (extOf(path)) {
        case 'ts':
        case 'tsx': return 'typescript';
        case 'js':
        case 'jsx': return 'javascript';
        case 'json': return 'json';
        case 'md':   return 'markdown';
        case 'css':  return 'css';
        case 'html': return 'html';
        case 'xml':  return 'xml';
        case 'yml':
        case 'yaml': return 'yaml';
        default:     return undefined;
    }
}

export function guessMime(path: string) {
    const ext = extOf(path);
    if (ext === 'svg') return 'image/svg+xml';
    if (ext === 'ico') return 'image/x-icon';
    if (IMG_EXT.has(ext)) return `image/${ext === 'jpg' ? 'jpeg' : ext}`;
    return 'application/octet-stream';
}

/** 최종 판별기 */
export function decideFileKind(path: string, bytes: Uint8Array, opt: DecideOptions = {}):
    { kind: FileKind; language?: string; mime?: string } {

    const ext = extOf(path);
    const treatSvgAsText = opt.treatSvgAsText ?? true;

    // 1) 이미지 확장자
    if (IMG_EXT.has(ext)) return { kind: 'image', mime: guessMime(path) };

    // 2) SVG (옵션)
    if (ext === 'svg') {
        if (treatSvgAsText) return { kind: 'text', language: 'xml' };
        return { kind: 'image', mime: 'image/svg+xml' };
    }

    // 3) 텍스트 확장자 또는 휴리스틱
    if (TEXT_EXT.has(ext) || looksLikeText(bytes, opt)) {
        return { kind: 'text', language: guessLanguage(path) };
    }

    // 4) 그 외 바이너리
    return { kind: 'binary' };
}

/** 기존 코드 호환용: boolean만 필요할 때 */
export function isProbablyBinary(bytes: Uint8Array, path: string) {
    return decideFileKind(path, bytes).kind !== 'text';
}

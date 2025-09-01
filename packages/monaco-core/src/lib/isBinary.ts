export type BinaryOptions = { treatSvgAsText?: boolean };

export function decideFileKind(path: string, bytes: Uint8Array, opts?: {treatSvgAsText?: boolean}) {
    // ...간단 구현(스텁)
    return isProbablyBinary(bytes, path, opts) ? "binary" : "text";
}


export function isProbablyBinary(bytes: Uint8Array, path: string, opt: BinaryOptions = { treatSvgAsText: true }) {
    const lower = path.toLowerCase();
    if (/\.(png|jpg|jpeg|gif|webp|ico|bmp)$/i.test(lower)) return true;
    if (opt.treatSvgAsText && lower.endsWith('.svg')) return false;
    // 헤더에 NUL(0x00) 비율이 높으면 바이너리
    const SAMPLE = bytes.slice(0, Math.min(bytes.length, 64));
    let nul = 0; for (const b of SAMPLE) if (b === 0) nul++;
    return nul > 0;
}

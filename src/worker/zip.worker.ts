/// <reference lib="webworker" />
import { unzipSync, zipSync, strFromU8, strToU8 } from 'fflate';
import { isProbablyBinary } from '../lib/isBinary';

// 워커 전역 상태: 파일 저장
type FileEntry = { path: string; bytes: Uint8Array; isBinary: boolean };
const files = new Map<string, FileEntry>();

type LoadZipMsg = { type: 'loadZip'; buffer: ArrayBuffer };
type GetFileMsg = { type: 'getFile'; path: string };
type UpdateFileMsg = { type: 'updateFile'; path: string; text: string };
type BuildZipMsg = { type: 'buildZip' };
type InMsg = LoadZipMsg | GetFileMsg | UpdateFileMsg | BuildZipMsg;

type Out =
    | { type: 'loaded'; tree: { path: string; size?: number }[] }
    | { type: 'file'; path: string; isBinary: boolean; text?: string; base64?: string }
    | { type: 'updated'; path: string }
    | { type: 'bundled'; buffer: ArrayBuffer };

self.onmessage = (e: MessageEvent<InMsg>) => {
    const msg = e.data;
    try {
        if (msg.type === 'loadZip') {
            files.clear();
            const u = unzipSync(new Uint8Array(msg.buffer)); // { filename: Uint8Array }
            const tree: { path: string; size?: number }[] = [];
            for (const [path, bytes] of Object.entries(u)) {
                const isBin = isProbablyBinary(bytes, path);
                files.set(path, { path, bytes, isBinary: isBin });
                tree.push({ path, size: bytes.byteLength });
            }
            postMessage(<Out>{ type: 'loaded', tree }, undefined);
        }

        if (msg.type === 'getFile') {
            const fe = files.get(msg.path);
            if (!fe) throw new Error('not found');
            if (fe.isBinary) {
                // base64 인코딩 (이미지 등 프리뷰용)
                const b64 = btoa(String.fromCharCode(...fe.bytes));
                postMessage(<Out>{ type: 'file', path: fe.path, isBinary: true, base64: b64 }, undefined);
            } else {
                const text = strFromU8(fe.bytes);
                postMessage(<Out>{ type: 'file', path: fe.path, isBinary: false, text }, undefined);
            }
        }

        if (msg.type === 'updateFile') {
            const fe = files.get(msg.path);
            if (!fe) throw new Error('not found');
            fe.bytes = strToU8(msg.text);
            fe.isBinary = false;
            postMessage(<Out>{ type: 'updated', path: fe.path }, undefined);
        }

        if (msg.type === 'buildZip') {
            const o: Record<string, Uint8Array> = {};
            for (const [p, fe] of files) o[p] = fe.bytes;
            const zipped = zipSync(o);
            postMessage(<Out>{ type: 'bundled', buffer: zipped.buffer }, [zipped.buffer]); // transfer
        }
    } catch (err) {
        // 에러 처리는 필요 시 확장
        console.error(err);
    }
};
export {};

import type { TreeNode, Tab } from '../store/useFsStore';
import { buildTree } from './tree';
import { guessLanguage, extOf } from './isBinary';

const worker = new Worker(new URL('../worker/zip.worker.ts', import.meta.url), { type: 'module' });
const normalize = (p: string) => p.replace(/^\/+/, '').replace(/\\/g, '/');

type Waiter = (e: MessageEvent<any>) => void;

// 보조: 확장자→MIME 추정
function guessMime(path: string) {
    const ext = path.split('.').pop()?.toLowerCase();
    if (!ext) return 'application/octet-stream';
    if (ext === 'svg') return 'image/svg+xml';
    if (ext === 'ico') return 'image/x-icon';
    if (['png','jpg','jpeg','gif','webp','bmp'].includes(ext)) {
        return `image/${ext === 'jpg' ? 'jpeg' : ext}`;
    }
    return 'application/octet-stream';
}

function once<T = any>(type: string): Promise<T> {
    return new Promise((resolve) => {
        const handler: Waiter = (e) => {
            if (e.data?.type === type) {
                worker.removeEventListener('message', handler as any);
                resolve(e.data as T);
            }
        };
        worker.addEventListener('message', handler as any);
    });
}

export async function loadZip(file: File): Promise<TreeNode> {
    const buf = await file.arrayBuffer();
    worker.postMessage({ type: 'loadZip', buffer: buf }, [buf]);
    const { tree } = await once<{ type: 'loaded'; tree: { path: string; size?: number }[] }>('loaded');
    return buildTree(tree);
}

export async function fetchFileTab(path: string): Promise<Tab> {
    worker.postMessage({ type: 'getFile', path });
    const res = await once<{ type:'file'; path:string; isBinary:true; buffer:ArrayBuffer }|{ type:'file'; path:string; isBinary:false; text:string }>('file');

    if ('buffer' in res) {
        // ✅ 이미지면 Blob URL로 프리뷰
        const mime = guessMime(res.path);
        const blob = new Blob([res.buffer], { type: mime });
        const url = URL.createObjectURL(blob);
        const isImage = mime.startsWith('image/');
        return isImage
            ? { path: res.path, kind: 'image', dataUrl: url }
            : { path: res.path, kind: 'binary' };
    } else {
        return { path: res.path, kind: 'text', content: res.text, language: guessLanguage(res.path) };
    }
}

export async function updateText(path: string, content: string) {
    worker.postMessage({ type: 'updateFile', path: normalize(path), text: content });
    await once('updated');
}

export async function buildZip(): Promise<Blob> {
    worker.postMessage({ type: 'buildZip' });
    const { buffer } = await once<{ type: 'bundled'; buffer: ArrayBuffer }>('bundled');
    return new Blob([buffer], { type: 'application/zip' });
}

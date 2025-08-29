import type { TreeNode, Tab } from '../store/useFsStore';
import { buildTree } from './tree';
import { guessLanguage, extOf } from './isBinary';

const worker = new Worker(new URL('../worker/zip.worker.ts', import.meta.url), { type: 'module' });
const normalize = (p: string) => p.replace(/^\/+/, '').replace(/\\/g, '/');

type Waiter = (e: MessageEvent<any>) => void;
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
    worker.postMessage({ type: 'getFile', path: normalize(path) });
    const res = await once<{ type: 'file'; path: string; isBinary: boolean; text?: string; base64?: string }>('file');
    if (res.isBinary) {
        const ext = extOf(path);
        const isImage = ['png','jpg','jpeg','gif','webp','bmp','svg','ico'].includes(ext);
        const mime = ext === 'svg' ? 'image/svg+xml' : (ext === 'ico' ? 'image/x-icon' : `image/${ext==='jpg'?'jpeg':ext}`);
        return isImage
            ? { path, kind: 'image', dataUrl: `data:${mime};base64,${res.base64}` }
            : { path, kind: 'binary' };
    } else {
        return { path, kind: 'text', content: res.text!, language: guessLanguage(path) };
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

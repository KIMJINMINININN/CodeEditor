import type { FsNode, FileTab } from '../types';
export interface ZipAdapter {
    loadZip(buffer: ArrayBuffer): Promise<FsNode>;
    getFile(path: string): Promise<FileTab>;
    updateFile(path: string, text: string): Promise<void>;
    buildZip(): Promise<Blob>;
}

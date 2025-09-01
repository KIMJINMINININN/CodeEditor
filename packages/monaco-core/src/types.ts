export type FsKind = 'dir' | 'file';
export type FsNode = { path: string; kind: FsKind; children?: FsNode[] };

export type TabKind = 'text' | 'binary' | 'image';
export type FileTab = {
    path: string;
    kind: TabKind;
    language?: string;
    content?: string; // text
    base64?: string;  // image/binary preview
};

export interface ZipAdapter {
    loadZip(buffer: ArrayBuffer): Promise<FsNode>;
    getFile(path: string): Promise<FileTab>;
    updateFile(path: string, text: string): Promise<void>;
    buildZip(): Promise<Blob>;
}

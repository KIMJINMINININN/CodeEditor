// src/lib/zipClient.ts
import type { TreeNode, Tab } from "../store/useFsStore";
import { buildTree } from "./tree";
import { guessLanguage, guessMime } from "./isBinary";

const normalize = (p: string) => p.replace(/^\/+/, "").replace(/\\/g, "/");

// ✅ HMR에서도 워커 1개만 유지
const WKEY = "__zipWorker__" as const;
const w = (globalThis as any)[WKEY] as Worker | undefined;
const worker: Worker =
  w ??
  ((globalThis as any)[WKEY] = new Worker(
    new URL("../worker/zip.worker.ts", import.meta.url),
    { type: "module" },
  ));

type FileEventText = {
  type: "file";
  path: string;
  isBinary: false;
  text: string;
};
type FileEventBin = {
  type: "file";
  path: string;
  isBinary: true;
  buffer: ArrayBuffer;
};
type FileEvent = FileEventText | FileEventBin;

function once<T = any>(type: string): Promise<T> {
  return new Promise((resolve) => {
    const handler = (e: MessageEvent) => {
      if ((e.data as any)?.type === type) {
        worker.removeEventListener("message", handler);
        resolve(e.data as T);
      }
    };
    worker.addEventListener("message", handler);
  });
}

export async function loadZip(file: File): Promise<TreeNode> {
  const buf = await file.arrayBuffer();
  worker.postMessage({ type: "loadZip", buffer: buf }, [buf]);
  const { tree } = await once<{
    type: "loaded";
    tree: { path: string; size?: number }[];
  }>("loaded");
  return buildTree(tree);
}

export async function fetchFileTab(path: string): Promise<Tab> {
  worker.postMessage({ type: "getFile", path: normalize(path) }); // ✅ normalize
  const res = await once<FileEvent>("file");

  if (res.isBinary) {
    const mime = guessMime(res.path);
    const blob = new Blob([res.buffer], { type: mime });
    const url = URL.createObjectURL(blob);
    const isImage = mime.startsWith("image/");
    return isImage
      ? { path: res.path, kind: "image", dataUrl: url }
      : { path: res.path, kind: "binary" };
  } else {
    return {
      path: res.path,
      kind: "text",
      content: res.text,
      language: guessLanguage(res.path),
    };
  }
}

export async function updateText(path: string, content: string) {
  worker.postMessage({
    type: "updateFile",
    path: normalize(path),
    text: content,
  }); // ✅ normalize
  await once("updated");
}

export async function buildZip(): Promise<Blob> {
  worker.postMessage({ type: "buildZip" });
  const { buffer } = await once<{ type: "bundled"; buffer: ArrayBuffer }>(
    "bundled",
  );
  return new Blob([buffer], { type: "application/zip" });
}

/** blob: URL 해제 유틸 (메모리 누수 방지) */
export function revokeIfBlobUrl(url?: string) {
  if (url && url.startsWith("blob:")) URL.revokeObjectURL(url);
}

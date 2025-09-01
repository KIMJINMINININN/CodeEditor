/// <reference lib="webworker" />
import { unzipSync, zipSync, strFromU8, strToU8 } from "fflate";
import { decideFileKind } from "@org/monaco-core/lib/isBinary";

// ==============================
// Types
// ==============================
type Entry = {
    path: string;
    bytes: Uint8Array;
    kind: "text" | "image" | "binary";
};

type LoadZipMsg = { type: "loadZip"; buffer: ArrayBuffer };
type GetFileMsg = { type: "getFile"; path: string };
type UpdateFileMsg = { type: "updateFile"; path: string; text: string };
type BuildZipMsg = { type: "buildZip" };

type OutLoaded = { type: "loaded"; tree: { path: string; size?: number }[] };

type OutFileText = {
    type: "file";
    path: string;
    isBinary: false;
    text: string;
};

type OutFileBinary = {
    type: "file";
    path: string;
    isBinary: true;
    buffer: ArrayBuffer; // ✅ Transferable
};

type OutUpdated = { type: "updated"; path: string };
type OutBundled = { type: "bundled"; buffer: ArrayBuffer };

// 추가 타입
type CreateFileMsg = { type: "createFile"; path: string; text?: string };
type DeletePathMsg = { type: "deletePath"; path: string };
type InMsg =
    | LoadZipMsg
    | GetFileMsg
    | UpdateFileMsg
    | BuildZipMsg
    | CreateFileMsg
    | DeletePathMsg;

type Out =
    | { type: "loaded"; tree: { path: string; size?: number }[] }
    | {
    type: "file";
    path: string;
    isBinary: boolean;
    text?: string;
    buffer?: ArrayBuffer;
}
    | { type: "updated"; path: string }
    | { type: "created"; path: string; size: number }
    | { type: "deleted"; path: string }
    | { type: "bundled"; buffer: ArrayBuffer };

// ==============================
// State
// ==============================
const files = new Map<string, Entry>();

const normalize = (p: string) => p.replace(/^\/+/, "").replace(/\\/g, "/");

// ==============================
// Worker
// ==============================
self.onmessage = (e: MessageEvent<InMsg>) => {
    const msg = e.data;
    try {
        // 1) ZIP 로드
        if (msg.type === "loadZip") {
            files.clear();
            const unzipped = unzipSync(new Uint8Array(msg.buffer));
            const tree: { path: string; size?: number }[] = [];

            for (const [rawPath, bytes] of Object.entries(unzipped)) {
                const path = normalize(rawPath);
                const { kind } = decideFileKind(path, bytes, { treatSvgAsText: true });
                files.set(path, { path, bytes, kind });
                tree.push({ path, size: bytes.byteLength });
            }

            postMessage(<Out>{ type: "loaded", tree }, undefined);
        }

        // 2) 파일 조회
        if (msg.type === "getFile") {
            const key = normalize(msg.path);
            const fe = files.get(key);
            if (!fe) throw new Error("not found");

            if (fe.kind === "text") {
                const text = strFromU8(fe.bytes);
                postMessage(
                    <OutFileText>{ type: "file", path: fe.path, isBinary: false, text },
                    undefined,
                );
            } else {
                const copy = fe.bytes.slice(); // 원본 보존
                postMessage(
                    <OutFileBinary>{
                        type: "file",
                        path: fe.path,
                        isBinary: true,
                        buffer: copy.buffer,
                    },
                    [copy.buffer],
                );
            }
        }

        // 3) 텍스트 업데이트
        if (msg.type === "updateFile") {
            const key = normalize(msg.path);
            const fe = files.get(key);
            if (!fe) throw new Error("not found");

            fe.bytes = strToU8(msg.text);
            fe.kind = "text";
            postMessage(<OutUpdated>{ type: "updated", path: fe.path }, undefined);
        }

        // 4) ZIP 번들
        if (msg.type === "buildZip") {
            const o: Record<string, Uint8Array> = {};
            for (const [p, fe] of files) o[p] = fe.bytes;

            const zipped = zipSync(o);
            postMessage(<OutBundled>{ type: "bundled", buffer: zipped.buffer }, [
                zipped.buffer,
            ]);
        }

        // ✅ 새 파일 생성
        if (msg.type === "createFile") {
            const key = normalize(msg.path);
            if (files.has(key)) throw new Error("already exists");
            const bytes = strToU8(msg.text ?? "");
            files.set(key, { path: key, bytes, kind: "text" }); // decideFileKind 쓰는 버전이면 kind:'text'
            postMessage({
                type: "created",
                path: key,
                size: bytes.byteLength,
            } as Out);
        }

        // ✅ 경로 삭제(파일 1개 또는 폴더 경로 트리 전체)
        if (msg.type === "deletePath") {
            const key = normalize(msg.path);
            // 파일 1개 삭제
            if (files.has(key)) {
                files.delete(key);
            } else {
                // 폴더라면 하위 모든 파일 삭제
                const prefix = key.endsWith("/") ? key : key + "/";
                for (const p of Array.from(files.keys())) {
                    if (p.startsWith(prefix)) files.delete(p);
                }
            }
            postMessage({ type: "deleted", path: key } as Out);
        }
    } catch (err) {
        console.error(err);
    }
};

export {};

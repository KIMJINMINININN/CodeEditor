/**
 * zip.worker.test.ts
 * - Jest + ts-jest 가정
 * - fflate / isProbablyBinary 모킹
 * - Worker 전역(self.postMessage) 스파이
 * - jest.isolateModules 로 테스트 간 상태(Map) 격리
 */

import { TextDecoder, TextEncoder } from "util";

// ──────────────────────────────────────────────
// 1) 모킹: fflate
//    (워커가 import한 모듈 이름과 동일해야 함)
// ──────────────────────────────────────────────
const unzipSync = jest.fn();
const zipSync = jest.fn();
const strFromU8 = jest.fn((u8: Uint8Array) => new TextDecoder().decode(u8));
const strToU8 = jest.fn((s: string) => new TextEncoder().encode(s));

jest.mock("fflate", () => ({
  unzipSync,
  zipSync,
  strFromU8,
  strToU8,
}));

const decideFileKind = jest.fn(
  (path: string, bytes: Uint8Array, options?: { treatSvgAsText?: boolean }) =>
    /\.(png|jpe?g|gif|webp|ico|bmp|zip)$/i.test(path) ? "binary" : "text",
);

const isProbablyBinary = jest.fn((_bytes: Uint8Array, path?: string) => {
  // boolean 판정이 필요할 경우를 위해서도 유지
  return !!path && /\.(png|jpe?g|gif|webp|ico|bmp|zip)$/i.test(path);
});

jest.mock("@shared/lib/isBinary", () => ({
  __esModule: true,
  decideFileKind,
  // 필요시 같이 export
  isProbablyBinary: jest.fn(),
  default: { decideFileKind },
}));

// ──────────────────────────────────────────────
// 3) 헬퍼: 워커 로드 & 메시지 전송
// ──────────────────────────────────────────────
function loadWorker() {
  jest.isolateModules(() => {
    // self 전역을 워커 스코프처럼 구성
    (globalThis as any).self = Object.assign((globalThis as any).self ?? {}, {
      postMessage: jest.fn(),
    });
    // 워커 모듈 로드 (⚠️ 실제 경로 맞추기)
    require("../zip.worker.ts");
  });
}

function send(msg: any) {
  const handler = (globalThis as any).self.onmessage;
  if (!handler) throw new Error("worker onmessage not set");
  handler({ data: msg });
}

const getPosts = () =>
  ((globalThis as any).self.postMessage as jest.Mock).mock.calls;

// ──────────────────────────────────────────────
// 4) 공통 샘플 데이터
// ──────────────────────────────────────────────
const U8 = (arr: number[]) => new Uint8Array(arr);
const SAMPLE_MAP = {
  "a.txt": U8([97]), // 'a'
  "img/p.png": U8([1, 2]), // binary
};

describe("zip.worker (unit)", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    // 기본 unzipSync 동작: 어떤 입력이 와도 SAMPLE_MAP 반환
    unzipSync.mockImplementation(() => ({ ...SAMPLE_MAP }));
    // 기본 zipSync 동작: 임의 바이트 반환
    zipSync.mockImplementation(() => U8([9, 9, 9]));
    // isProbablyBinary: *.png 은 true, 그 외 false (기본)
    (isProbablyBinary as jest.Mock).mockImplementation(
      (_bytes: Uint8Array, path?: string) => (path ?? "").endsWith(".png"),
    );

    loadWorker();
  });

  it("1) loadZip → Map 구성 & loaded(tree) 전송", () => {
    const buf = U8([0]).buffer;
    send({ type: "loadZip", buffer: buf });

    const calls = getPosts();
    // 마지막 메시지 = loaded
    const loaded = calls.find((c) => c[0]?.type === "loaded")?.[0];
    expect(loaded).toBeDefined();
    expect(loaded.tree).toEqual(
      expect.arrayContaining([
        { path: "a.txt", size: 1 },
        { path: "img/p.png", size: 2 },
      ]),
    );

    // assertion (순서/옵션 반영)
    expect(decideFileKind).toHaveBeenCalledWith(
      "a.txt",
      expect.any(Uint8Array),
      expect.objectContaining({ treatSvgAsText: true }),
    );
    expect(decideFileKind).toHaveBeenCalledWith(
      "img/p.png",
      expect.any(Uint8Array),
      expect.objectContaining({ treatSvgAsText: true }),
    );

    // 더 엄밀히 가면 호출 순서까지
    expect(decideFileKind).toHaveBeenNthCalledWith(
      1,
      "a.txt",
      expect.any(Uint8Array),
      expect.objectContaining({ treatSvgAsText: true }),
    );
    expect(decideFileKind).toHaveBeenNthCalledWith(
      2,
      "img/p.png",
      expect.any(Uint8Array),
      expect.objectContaining({ treatSvgAsText: true }),
    );
  });

  it("2) getFile(바이너리) → {isBinary:true, buffer} + transfer", () => {
    send({ type: "loadZip", buffer: U8([0]).buffer });
    (globalThis as any).self.postMessage.mockClear();

    send({ type: "getFile", path: "img/p.png" });

    const call = getPosts().find((c) => c[0]?.type === "file");
    expect(call).toBeDefined();

    const [msg, transfer] = call!;
    expect(msg.isBinary).toBe(true);
    expect(msg.path).toBe("img/p.png");
    expect(msg.buffer).toBeInstanceOf(ArrayBuffer);

    // 두 번째 인자(transfer list)에 buffer 포함
    expect(Array.isArray(transfer)).toBe(true);
    expect(transfer[0]).toBe(msg.buffer);
  });

  it("3) updateFile → updated 이후 getFile 텍스트 갱신 확인", () => {
    send({ type: "loadZip", buffer: U8([0]).buffer });
    (globalThis as any).self.postMessage.mockClear();

    send({ type: "updateFile", path: "a.txt", text: "hello" });

    const updated = getPosts().find((c) => c[0]?.type === "updated")?.[0];
    expect(updated).toBeDefined();
    expect(updated.path).toBe("a.txt");
    expect(strToU8).toHaveBeenCalledWith("hello");

    (globalThis as any).self.postMessage.mockClear();
    send({ type: "getFile", path: "a.txt" });
    const fileMsg = getPosts().find((c) => c[0]?.type === "file")?.[0];
    expect(fileMsg.isBinary).toBe(false);
    expect(fileMsg.text).toBe("hello");
  });

  it("4) buildZip → bundled + transfer", () => {
    send({ type: "loadZip", buffer: U8([0]).buffer });
    (globalThis as any).self.postMessage.mockClear();

    const zipped = U8([3, 4, 5]);
    zipSync.mockReturnValueOnce(zipped);

    send({ type: "buildZip" });

    const call = getPosts().find((c) => c[0]?.type === "bundled");
    expect(call).toBeDefined();

    const [msg, transfer] = call!;
    expect(msg.buffer).toBe(zipped.buffer);
    expect(transfer[0]).toBe(zipped.buffer);
    expect(zipSync).toHaveBeenCalled();
  });

  it('5) not found: getFile("missing") → console.error 호출', () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    send({ type: "loadZip", buffer: U8([0]).buffer });

    send({ type: "getFile", path: "missing" });
    expect(errSpy).toHaveBeenCalled();

    errSpy.mockRestore();
  });

  it("6) 시퀀스: loadZip → updateFile → getFile → buildZip", () => {
    send({ type: "loadZip", buffer: U8([0]).buffer });

    send({ type: "updateFile", path: "a.txt", text: "Z" });
    send({ type: "getFile", path: "a.txt" });

    let fileMsg = getPosts().find((c) => c[0]?.type === "file")?.[0];
    expect(fileMsg.text).toBe("Z");

    (globalThis as any).self.postMessage.mockClear();
    const zipped = U8([7, 7, 7]);
    zipSync.mockReturnValueOnce(zipped);

    send({ type: "buildZip" });
    const [msg, transfer] = getPosts().find((c) => c[0]?.type === "bundled")!;
    expect(msg.buffer).toBe(zipped.buffer);
    expect(transfer[0]).toBe(zipped.buffer);
  });
});

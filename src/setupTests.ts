import "@testing-library/jest-dom";

// Web Worker 목킹 (zipClient 등)
class MockWorker {
  onmessage: ((e: any) => void) | null = null;
  addEventListener() {}
  removeEventListener() {}
  postMessage() {}
  terminate() {}
}
(globalThis as any).Worker = MockWorker as any;

// blob URL / alert 등 환경 목킹
if (!URL.createObjectURL) {
  (URL as any).createObjectURL = () => "blob://test";
  (URL as any).revokeObjectURL = () => {};
}
jest.spyOn(window, "alert").mockImplementation(() => {});

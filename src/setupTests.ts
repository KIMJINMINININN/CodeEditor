import "@testing-library/jest-dom";

class MockWorker {
  onmessage: ((e: any) => void) | null = null;
  addEventListener() {}
  removeEventListener() {}
  postMessage() {}
  terminate() {}
}
(globalThis as any).Worker = MockWorker as any;

if (!URL.createObjectURL) {
  (URL as any).createObjectURL = () => "blob://test";
  (URL as any).revokeObjectURL = () => {};
}
jest.spyOn(window, "alert").mockImplementation(() => {});

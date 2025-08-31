import "@testing-library/jest-dom";
import React from "react";
import { renderWithProviders } from "@shared/test/render";
import { act, waitFor, screen } from "@testing-library/react";

import DropZone from "../DropZone";

/* ──────────────────────────────────────────────────────────────
   1) Zustand store 모킹 (0/1/2 인자 호환)
   - SUT가 import하는 경로로 맞추세요.
   - 예: '@entities/fs-tree' 또는 '@entities/fs-tree/model'
────────────────────────────────────────────────────────────── */
const storeSnapshot: any = {
  dragActive: false,
  setDragActive: jest.fn((v: boolean) => {
    storeSnapshot.dragActive = v;
  }),
  setTree: jest.fn(),
};
jest.mock("@entities/fs-tree", () => {
  const listeners = new Set<(s: any) => void>();

  const useFsStore = (selector?: any, _eq?: any) => {
    if (typeof selector === "function") return selector(storeSnapshot);
    return storeSnapshot;
  };
  (useFsStore as any).getState = () => storeSnapshot;
  (useFsStore as any).setState = (patch: any) => {
    const next = typeof patch === "function" ? patch(storeSnapshot) : patch;
    Object.assign(storeSnapshot, next);
    listeners.forEach((l) => l(storeSnapshot));
  };
  (useFsStore as any).subscribe = (fn: any) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  };
  return { __esModule: true, useFsStore };
});

/* ──────────────────────────────────────────────────────────────
   2) loadZip 모킹 (성공/실패 케이스 주입)
────────────────────────────────────────────────────────────── */
const loadZipMock = jest.fn();
jest.mock("@shared/api/zip", () => ({
  __esModule: true,
  loadZip: (...args: any[]) => loadZipMock(...args),
}));

/* ──────────────────────────────────────────────────────────────
   3) 전역 alert 및 add/removeEventListener 스파이
────────────────────────────────────────────────────────────── */
jest.spyOn(window, "alert").mockImplementation(() => {});
const addSpy = jest.spyOn(window, "addEventListener");
const removeSpy = jest.spyOn(window, "removeEventListener");

/* ──────────────────────────────────────────────────────────────
   4) 유틸: 특정 타입의 등록된 핸들러 찾기
────────────────────────────────────────────────────────────── */
function getHandler(type: string) {
  const call = addSpy.mock.calls.find((c) => c[0] === type);
  return call?.[1] as ((e: any) => void) | undefined;
}

describe("DropZone (unit)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storeSnapshot.dragActive = false;
  });

  it("1) dragenter → 오버레이 표시, setDragActive(true)", async () => {
    const { unmount } = renderWithProviders(<DropZone />);

    const handler = getHandler("dragenter");
    expect(handler).toBeDefined();

    await act(async () => {
      handler!({ preventDefault: jest.fn(), stopPropagation: jest.fn() });
    });

    expect(storeSnapshot.setDragActive).toHaveBeenCalledWith(true);

    await waitFor(() =>
      expect(screen.getByTestId("drop-overlay")).toHaveAttribute(
        "aria-hidden",
        "false",
      ),
    );

    unmount();
  });

  it("2) dragleave(카운터 0) → 오버레이 숨김, setDragActive(false)", () => {
    renderWithProviders(<DropZone />);

    const enter = getHandler("dragenter")!;
    const leave = getHandler("dragleave")!;
    // 내부 카운터 고려: enter 1번 후 leave 1번 → 0이 되도록
    enter({ preventDefault: jest.fn(), stopPropagation: jest.fn() });
    leave({ preventDefault: jest.fn(), stopPropagation: jest.fn() });

    expect(storeSnapshot.setDragActive).toHaveBeenLastCalledWith(false);

    const overlay = screen.getByTestId("drop-overlay");
    expect(overlay).toHaveAttribute("aria-hidden", "true");
  });

  it("3) drop(파일 없음) → 숨김 + setDragActive(false), loadZip 미호출", async () => {
    renderWithProviders(<DropZone />);

    const drop = getHandler("drop")!;
    drop({
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      dataTransfer: { files: [] },
    });

    expect(storeSnapshot.setDragActive).toHaveBeenLastCalledWith(false);
    expect(loadZipMock).not.toHaveBeenCalled();
  });

  it("4) drop(.txt) → alert, loadZip 미호출", () => {
    renderWithProviders(<DropZone />);

    const file = new File(["x"], "note.txt", { type: "text/plain" });
    const drop = getHandler("drop")!;
    drop({
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      dataTransfer: { files: [file] },
    });

    expect(window.alert).toHaveBeenCalled();
    expect(loadZipMock).not.toHaveBeenCalled();
    expect(storeSnapshot.setDragActive).toHaveBeenLastCalledWith(false);
  });

  it("5) drop(.zip) → loadZip 호출, setTree 호출됨", async () => {
    renderWithProviders(<DropZone />);

    const tree = { name: "/", path: "/", type: "folder", children: [] };
    loadZipMock.mockResolvedValueOnce(tree);

    const file = new File([new Uint8Array([1, 2, 3])], "archive.zip", {
      type: "application/zip",
    });

    const drop = getHandler("drop")!;
    await drop({
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      dataTransfer: { files: [file] },
    });

    // loadZip 호출 및 결과 반영
    expect(loadZipMock).toHaveBeenCalledWith(file);
    // setTree는 loadZip resolve 이후 호출된다고 가정
    expect(storeSnapshot.setTree).toHaveBeenCalledWith(tree);
    expect(storeSnapshot.setDragActive).toHaveBeenLastCalledWith(false);
  });

  it("6) dragover에서 e.preventDefault() 호출", () => {
    renderWithProviders(<DropZone />);

    const over = getHandler("dragover")!;
    const prevent = jest.fn();
    over({ preventDefault: prevent, stopPropagation: jest.fn() });

    expect(prevent).toHaveBeenCalled();
  });

  it("7) 마운트/언마운트 시 전역 리스너 등록/해제", () => {
    const { unmount } = renderWithProviders(<DropZone />);

    // 등록 확인: dragover/dragenter/dragleave/drop 각각 1회 이상
    const types = addSpy.mock.calls.map((c) => c[0]);
    expect(types).toEqual(
      expect.arrayContaining(["dragover", "dragenter", "dragleave", "drop"]),
    );

    unmount();

    const removedTypes = removeSpy.mock.calls.map((c) => c[0]);
    expect(removedTypes).toEqual(
      expect.arrayContaining(["dragover", "dragenter", "dragleave", "drop"]),
    );
  });
});

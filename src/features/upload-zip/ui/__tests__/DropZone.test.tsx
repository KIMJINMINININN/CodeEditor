import "@testing-library/jest-dom";
import React from "react";
import { renderWithProviders } from "@shared/test/render";
import { fireEvent, screen, waitFor, act } from "@testing-library/react";
import DropZone from "../DropZone";

const storeSnapshot: any = {
  dragActive: false,
  setDragActive: jest.fn((v: boolean) => {
    storeSnapshot.dragActive = v;
  }),
  setTree: jest.fn(),
};
jest.mock("@entities/fs-tree", () => {
  const listeners = new Set<(s: any) => void>();
  const useFsStore = (selector?: any) => {
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

const loadZipMock = jest.fn();
jest.mock("@shared/api/zip", () => ({
  __esModule: true,
  loadZip: (...args: any[]) => loadZipMock(...args),
}));

jest.spyOn(window, "alert").mockImplementation(() => {});
const addSpy = jest.spyOn(window, "addEventListener");
const removeSpy = jest.spyOn(window, "removeEventListener");

const dispatchCancelable = (type: string) => {
  const evt = new Event(type, { bubbles: true, cancelable: true });
  act(() => {
    // jsdom에서도 window로 발행 가능
    window.dispatchEvent(evt);
  });
  return evt;
};

describe("DropZone (unit)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storeSnapshot.dragActive = false;
  });

  it("1) dragenter → 오버레이 표시, setDragActive(true)", async () => {
    const { unmount } = renderWithProviders(<DropZone />);

    // fireEvent가 내부적으로 act를 wrapping
    fireEvent.dragEnter(window as any);

    expect(storeSnapshot.setDragActive).toHaveBeenCalledWith(true);
    await waitFor(() =>
      expect(screen.getByTestId("drop-overlay")).toHaveAttribute(
        "aria-hidden",
        "false",
      ),
    );

    unmount();
  });

  it("2) dragleave(카운터 0) → 오버레이 숨김, setDragActive(false)", async () => {
    renderWithProviders(<DropZone />);

    fireEvent.dragEnter(window as any);
    fireEvent.dragLeave(window as any);

    expect(storeSnapshot.setDragActive).toHaveBeenLastCalledWith(false);
    await waitFor(() =>
      expect(screen.getByTestId("drop-overlay")).toHaveAttribute(
        "aria-hidden",
        "true",
      ),
    );
  });

  it("3) drop(파일 없음) → 숨김 + setDragActive(false), loadZip 미호출", () => {
    renderWithProviders(<DropZone />);

    fireEvent.dragEnter(window as any);
    fireEvent.drop(
      window as any,
      {
        dataTransfer: { files: [] },
      } as any,
    );

    expect(storeSnapshot.setDragActive).toHaveBeenLastCalledWith(false);
    expect(loadZipMock).not.toHaveBeenCalled();
  });

  it("4) drop(.txt) → alert, loadZip 미호출", () => {
    renderWithProviders(<DropZone />);

    const file = new File(["x"], "note.txt", { type: "text/plain" });

    fireEvent.dragEnter(window as any);
    fireEvent.drop(
      window as any,
      {
        dataTransfer: { files: [file] },
      } as any,
    );

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

    fireEvent.dragEnter(window as any);
    fireEvent.drop(
      window as any,
      {
        dataTransfer: { files: [file] },
      } as any,
    );

    await waitFor(() => expect(loadZipMock).toHaveBeenCalledWith(file));
    expect(storeSnapshot.setTree).toHaveBeenCalledWith(tree);
    expect(storeSnapshot.setDragActive).toHaveBeenLastCalledWith(false);
  });

  it("6) dragover에서 preventDefault 호출 여부", () => {
    renderWithProviders(<DropZone />);

    const evt = dispatchCancelable("dragover");
    expect(evt.defaultPrevented).toBe(true); // onDragOver에서 preventDefault 처리 기대
  });

  it("7) 마운트/언마운트 시 전역 리스너 등록/해제", () => {
    const { unmount } = renderWithProviders(<DropZone />);

    // 등록 확인
    const types = addSpy.mock.calls.map((c) => c[0]);
    expect(types).toEqual(
      expect.arrayContaining(["dragover", "dragenter", "dragleave", "drop"]),
    );

    // 해제 확인
    unmount();
    const removed = removeSpy.mock.calls.map((c) => c[0]);
    expect(removed).toEqual(
      expect.arrayContaining(["dragover", "dragenter", "dragleave", "drop"]),
    );
  });
});

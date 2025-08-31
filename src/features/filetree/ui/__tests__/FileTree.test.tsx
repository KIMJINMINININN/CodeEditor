import { renderWithProviders } from "@shared/test/render";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import FileTree from "../FileTree";

/* ── 모듈 목킹 ───────────────────────────────────────────────── */

// tests 상단의 mock 교체 (features/filetree/ui/__tests__/FileTree.test.tsx)
jest.mock("react-virtuoso", () => {
  const React = require("react");
  const Virtuoso = React.forwardRef(function VirtuosoMock(
    { data = [], itemContent, style }: any,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    return (
      <div data-testid="Virtuoso" ref={ref} style={style}>
        {data.map((item: any, i: number) => (
          <div key={item?.path ?? i} data-testid={`row-${i}`}>
            {itemContent(i, item)}
          </div>
        ))}
      </div>
    );
  });
  return { __esModule: true, Virtuoso };
});

// 2) Zustand store 훅 (SUT가 import하는 경로 그대로!)
const storeState: any = {
  tree: null,
  expanded: {},
  activePath: undefined,
  dragActive: false,
  tabs: [],
  toggleExpanded: jest.fn(),
  openTab: jest.fn(),
  setActive: jest.fn(),
};

jest.mock("@entities/fs-tree/model/store", () => ({
  __esModule: true,
  useFsStore: (selector: any) => selector(storeState),
}));

// 3) fetchFileTab (SUT의 실제 import 경로에 맞추기!)
const fetchFileTabMock = jest.fn();
jest.mock("@shared/api/zip", () => ({
  __esModule: true,
  fetchFileTab: (...args: any[]) => fetchFileTabMock(...args),
}));

/* ── 샘플 트리 ──────────────────────────────────────────────── */
const sampleTree = {
  name: "/",
  path: "/",
  type: "folder",
  children: [
    {
      name: "src",
      path: "/src",
      type: "folder",
      children: [{ name: "a.ts", path: "/src/a.ts", type: "file" }],
    },
    { name: "README.md", path: "/README.md", type: "file" },
  ],
};

/* ── 테스트 ─────────────────────────────────────────────────── */
describe("FileTree (unit)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storeState.tree = null;
    storeState.expanded = {};
    storeState.activePath = undefined;
    storeState.dragActive = false;
  });

  it("빈 상태: 드래그&드롭 힌트 표기", () => {
    storeState.tree = null;

    renderWithProviders(<FileTree />);
    expect(screen.getByText(/ZIP을 업로드하세요/i)).toBeInTheDocument();
    expect(
      screen.getByText(/드래그&드롭 또는 클릭하여 파일 선택/i),
    ).toBeInTheDocument();
  });

  it('빈 상태 + dragActive=true: 문구가 "여기에 드롭하여 업로드"로 변경', () => {
    storeState.tree = null;
    storeState.dragActive = true;

    renderWithProviders(<FileTree />);
    expect(screen.getByText(/여기에 드롭하여 업로드/i)).toBeInTheDocument();
  });

  it("기본 렌더: 폴더(src)와 파일(README.md) 표시, 닫힌 폴더 내부(a.ts)는 숨김", () => {
    storeState.tree = sampleTree;
    storeState.expanded = { "/": true, "/src": false };

    renderWithProviders(<FileTree />);
    expect(screen.getByText("src")).toBeInTheDocument();
    expect(screen.getByText("README.md")).toBeInTheDocument();
    expect(screen.queryByText("a.ts")).not.toBeInTheDocument();
  });

  it('폴더 라인 클릭 → toggleExpanded("/src") 호출', () => {
    storeState.tree = sampleTree;
    storeState.expanded = { "/": true, "/src": false };

    renderWithProviders(<FileTree />);
    fireEvent.click(screen.getByText("src"));
    expect(storeState.toggleExpanded).toHaveBeenCalledWith("/src");
  });

  it("파일 라인 클릭 → fetchFileTab 호출 후 openTab 호출", async () => {
    storeState.tree = sampleTree;
    storeState.expanded = { "/": true, "/src": false };

    fetchFileTabMock.mockResolvedValue({
      path: "/README.md",
      kind: "text",
      content: "hello",
      language: "markdown",
    });

    renderWithProviders(<FileTree />);
    fireEvent.click(screen.getByText("README.md"));

    await waitFor(() =>
      expect(fetchFileTabMock).toHaveBeenCalledWith("/README.md"),
    );
    expect(storeState.openTab).toHaveBeenCalled();
  });

  it("키보드 네비: ArrowRight (폴더) → toggleExpanded 호출", () => {
    storeState.tree = sampleTree;
    storeState.expanded = { "/": true, "/src": false };

    const { container } = renderWithProviders(<FileTree />);
    const wrap = container.querySelector('[tabindex="0"]') as HTMLElement;
    expect(wrap).toBeInTheDocument();

    fireEvent.keyDown(wrap, { key: "ArrowRight" });
    expect(storeState.toggleExpanded).toHaveBeenCalledWith("/src");
  });
});

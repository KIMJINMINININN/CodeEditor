import "@testing-library/jest-dom";
import React from "react";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@shared/test/render";

// SUT (경로 확인)
import Tabs from "../Tabs";

// src/features/tabs/ui/__tests__/Tabs.test.tsx (또는 공통 mock 유틸)
const storeSnapshot: any = {
  tabs: [],
  activePath: undefined,
};

jest.mock("@entities/fs-tree/model/store", () => {
  const listeners = new Set<(s: any) => void>();

  // zustand useStore 모양 흉내: 0/1/2-arg 지원
  const useFsStore = (selector?: any, _equalityFn?: any) => {
    const state = storeSnapshot;
    if (typeof selector === "function") return selector(state);
    // selector 없으면 전체 상태 반환 (실제 zustand도 가능)
    return state;
  };

  // getState/setState/subscribe까지 얕게 구현해 두면 유용
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
  (useFsStore as any).destroy = () => {
    listeners.clear();
  };

  return { __esModule: true, useFsStore };
});

// ── 자식 컴포넌트 모킹: props를 모듈 스코프 변수에 캡처 ──
let lastTabBarProps: any | undefined;
let lastEditorProps: any | undefined;

jest.mock("@features/tabs/ui/TabBar", () => ({
  __esModule: true,
  default: (props: any) => {
    lastTabBarProps = props;
    return <div data-testid="TabBar" />;
  },
}));

jest.mock("@features/tabs/ui/EditorPane", () => ({
  __esModule: true,
  default: (props: any) => {
    lastEditorProps = props;
    return <div data-testid="EditorPane" />;
  },
}));

describe("Tabs (unit)", () => {
  beforeEach(() => {
    // 스냅샷/캡처 리셋
    storeSnapshot.tabs = [];
    storeSnapshot.activePath = undefined;
    lastTabBarProps = undefined;
    lastEditorProps = undefined;
  });

  it("매칭: activePath가 일치하면 해당 탭이 active, activeIndex도 일치", () => {
    storeSnapshot.tabs = [
      { path: "/a.ts", kind: "text" },
      { path: "/b.ts", kind: "text" },
    ];
    storeSnapshot.activePath = "/b.ts";

    renderWithProviders(<Tabs />);

    // 자식 렌더 확인
    expect(screen.getByTestId("TabBar")).toBeInTheDocument();
    expect(screen.getByTestId("EditorPane")).toBeInTheDocument();

    // 전달된 props 검증
    expect(lastTabBarProps).toBeDefined();
    expect(lastTabBarProps.activeIndex).toBe(1);
    expect(lastTabBarProps.active).toEqual({ path: "/b.ts", kind: "text" });

    expect(lastEditorProps).toBeDefined();
    expect(lastEditorProps.active).toEqual({ path: "/b.ts", kind: "text" });
  });

  it("불일치/없음: activePath가 없거나 매칭되지 않으면 첫 탭이 active", () => {
    storeSnapshot.tabs = [
      { path: "/a.ts", kind: "text" },
      { path: "/b.ts", kind: "text" },
    ];
    storeSnapshot.activePath = undefined; // 혹은 '/x.ts'

    renderWithProviders(<Tabs />);

    expect(screen.getByTestId("TabBar")).toBeInTheDocument();
    expect(lastTabBarProps.activeIndex).toBe(0); // Math.max(0, -1) → 0
    expect(lastTabBarProps.active).toEqual({ path: "/a.ts", kind: "text" });

    expect(lastEditorProps.active).toEqual({ path: "/a.ts", kind: "text" });
  });

  it("빈 배열: 탭이 없으면 active는 undefined, activeIndex는 0", () => {
    storeSnapshot.tabs = [];
    storeSnapshot.activePath = undefined;

    renderWithProviders(<Tabs />);

    expect(screen.getByTestId("TabBar")).toBeInTheDocument();
    expect(lastTabBarProps.activeIndex).toBe(0);
    expect(lastTabBarProps.active).toBeUndefined();

    expect(lastEditorProps.active).toBeUndefined();
  });
});

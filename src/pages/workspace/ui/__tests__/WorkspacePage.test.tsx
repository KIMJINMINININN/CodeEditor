// src/pages/workspace/ui/__tests__/WorkspacePage.test.tsx
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@shared/test/render";
import WorkspacePage from "../WorkspacePage";

jest.mock("@widgets/header-bar", () => ({
  __esModule: true,
  default: () => <div data-testid="HeaderBar" />,
}));
jest.mock("@widgets/file-panel", () => ({
  __esModule: true,
  default: () => <div data-testid="FilePanel" />,
}));
jest.mock("@widgets/editor-panel", () => ({
  __esModule: true,
  default: () => <div data-testid="EditorPanel" />,
}));
jest.mock("@features/upload-zip", () => ({
  __esModule: true,
  default: () => <div data-testid="DropZone" />,
}));

describe("WorkspacePage (unit)", () => {
  it("renders 4 core regions in order", () => {
    renderWithProviders(<WorkspacePage />);

    const header = screen.getByTestId("HeaderBar");
    const file = screen.getByTestId("FilePanel");
    const editor = screen.getByTestId("EditorPanel");
    const drop = screen.getByTestId("DropZone");

    expect(header).toBeInTheDocument();
    expect(file).toBeInTheDocument();
    expect(editor).toBeInTheDocument();
    expect(drop).toBeInTheDocument();

    // 간단한 순서/레이아웃 검증 (DOM 순서)
    const layout = header.parentElement; // Layout(grid rows)
    expect(layout?.children[0]).toBe(header);
    expect(layout?.children[1].contains(file)).toBe(true); // Body grid-left
    expect(layout?.children[1].contains(editor)).toBe(true); // Body grid-right
    expect(layout?.children[2]).toBe(drop); // overlay at end
  });
});

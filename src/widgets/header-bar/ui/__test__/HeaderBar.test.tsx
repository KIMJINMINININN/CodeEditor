import { screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { renderWithProviders } from "@shared/test/render";
import HeaderBar from "../HeaderBar";

const loadZipMock = jest.fn();
const buildZipMock = jest.fn();

jest.mock("@shared/api/zip", () => ({
  __esModule: true,
  loadZip: (...args: any[]) => loadZipMock(...args),
  buildZip: (...args: any[]) => buildZipMock(...args),
}));

jest.spyOn(URL, "createObjectURL").mockImplementation(() => "blob://test");
jest.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
jest.spyOn(window, "alert").mockImplementation(() => {});
jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {}); // ✅ 핵심

describe("HeaderBar (unit)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("업로드 없음: Download 클릭 시 alert 가드", async () => {
    renderWithProviders(<HeaderBar />);
    await userEvent.click(
      screen.getByRole("button", { name: /download zip/i }),
    );
    expect(window.alert).toHaveBeenCalled();
    expect(buildZipMock).not.toHaveBeenCalled();
  });

  it("업로드 후: Download 클릭 시 buildZip 호출", async () => {
    renderWithProviders(<HeaderBar />);
    loadZipMock.mockResolvedValue({
      name: "/",
      path: "/",
      type: "folder",
      children: [],
    });

    const fileInput = screen.getByLabelText("파일 선택", {
      selector: 'input[type="file"]',
    });
    const file = new File([new Uint8Array([1, 2, 3])], "sample.zip", {
      type: "application/zip",
    });
    fireEvent.change(fileInput, { target: { files: [file] } });
    await waitFor(() => expect(loadZipMock).toHaveBeenCalled());

    buildZipMock.mockResolvedValue(
      new Blob([new Uint8Array([9])], { type: "application/zip" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: /download zip/i }),
    );

    await waitFor(() => expect(buildZipMock).toHaveBeenCalled());
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });
});

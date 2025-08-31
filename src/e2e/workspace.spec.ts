import { test, expect } from "@playwright/test";
import path from "path";

test.describe("WorkspacePage E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/"); // baseURL 기준
  });

  test("업로드 → 트리 확인 → 에디터 포커스 → 다운로드", async ({ page }) => {
    // 1) 업로드: 버튼 흐름(파일선택 UI 트리거) 대신 안정적으로 input에 파일 주입
    const zipPath = path.resolve(__dirname, "fixtures/sample.zip");
    await page.setInputFiles("#zipInput", zipPath);

    // 2) 트리 렌더 확인
    await expect(page.getByText("src")).toBeVisible();
    await expect(page.getByText("README.md")).toBeVisible();

    // 3) 파일 클릭 → 에디터 포커스 후 타이핑(에러없이 입력 가능 여부)
    await page.getByText("README.md").click();
    // Monaco는 숨은 textarea/role=code를 사용: 컨테이너 클릭 후 키입력
    await page.locator(".monaco-editor").click();
    await page.keyboard.type(" E2E!");

    // 4) 다운로드 버튼 클릭 → 파일명 확인
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByTestId("download-btn").click(),
    ]);

    // 1) 가장 간단한 형태
    expect(download.suggestedFilename()).toBe("edited.zip");

    // 2) soft로도 가능 (resolves 제거!)
    expect.soft(download.suggestedFilename()).toBe("edited.zip");

    // 3) 추가 검증(옵션): 실제 파일 경로 확보 여부
    const filePath = await download.path();
    expect(filePath).toBeTruthy();
  });

  test("드래그&드롭: dragenter → 오버레이 표시 / drop → 숨김", async ({
    page,
  }) => {
    // dragenter (전역 핸들러: window에 이벤트 디스패치)
    await page.evaluate(() => {
      const e = new DragEvent("dragenter", { bubbles: true, cancelable: true });
      window.dispatchEvent(e);
    });
    await expect(page.getByTestId("drop-overlay")).toHaveAttribute(
      "aria-hidden",
      "false",
    );

    // drop (파일 없이) → 숨김
    await page.evaluate(() => {
      const e = new DragEvent("drop", { bubbles: true, cancelable: true });
      window.dispatchEvent(e);
    });
    await expect(page.getByTestId("drop-overlay")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  // e2e/workspace.spec.ts (수정)
  test("키보드 네비: ↑/↓/←/→/Enter", async ({ page }) => {
    const zipPath = path.resolve(__dirname, "fixtures/sample.zip");
    await page.setInputFiles("#zipInput", zipPath);

    // 1) 트리 루트를 포커스
    const tree = page.getByTestId("file-tree");
    await tree.click(); // 포커스 부여 (또는 await tree.focus())
    // 2) 트리 'src' 항목으로 이동(텍스트 클릭으로 초기 위치 명확화)
    await page.getByText("src", { exact: true }).click();
    // 3) 트리 요소에 직접 키 입력
    await tree.press("ArrowRight"); // 펼치기
    await tree.press("ArrowDown"); // 다음 항목(파일일 가능성 높음)
    await tree.press("Enter"); // 파일 열기

    // 4) 에디터 패널
    await expect(page.getByTestId("editor-panel")).toBeVisible();
  });

  test("접근성: 주요 컨트롤 a11y 속성 노출", async ({ page }) => {
    // role/name은 프로젝트에서 설정한 값 기준으로 검증
    await expect(page.getByTestId("upload-btn")).toBeVisible();
    await expect(page.getByTestId("download-btn")).toBeVisible();
    // 오버레이는 aria-hidden으로 상태 전달
    await expect(page.getByTestId("drop-overlay")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
});

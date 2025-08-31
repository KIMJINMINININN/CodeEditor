import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs/promises";
import { unzipSync } from "fflate";

// --- helper: Monaco 안정 포커스 (그대로 재사용) ---
async function focusMonacoEditor(page: import("@playwright/test").Page) {
  const editor = page.locator(".monaco-editor").first();
  await expect(editor).toBeVisible({ timeout: 15000 });
  await editor.locator(".view-lines").first().click({ force: true });
  const inputArea = editor.locator("textarea.inputarea").first();
  await inputArea.evaluate((el) => el.focus());
}

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

  test("Zip 파일 업로드, 수정 후 다운로드 (E2E)", async ({ page }) => {
    // 1) 업로드
    const zipPath = path.resolve(__dirname, "fixtures/sample.zip");
    await page.goto("/");
    await page.setInputFiles("#zipInput", zipPath);

    // 2) 트리 가시성 대기 및 'src' 폴더 펼치기
    const tree = page.getByTestId("file-tree");
    await expect(tree).toBeVisible({ timeout: 15000 });

    // src 폴더가 접혀 있다면 펼치기 (WAI-ARIA Right x2)
    const srcRow = tree.getByText(/^src$/, { exact: true });
    if (await srcRow.count()) {
      await srcRow.first().click();
      await srcRow.first().press("ArrowRight"); // expand
      await srcRow.first().press("ArrowRight"); // focus first child
    }

    // 3) 항상 App.tsx를 연다 (픽스처 기준으로 존재가 보장됨)
    const appTsx = tree.getByText(/^App\.tsx$/, { exact: true }).first();
    await appTsx.scrollIntoViewIfNeeded();
    await appTsx.click();

    // 4) Monaco에 안전 포커스 후 편집
    await focusMonacoEditor(page);
    await page.keyboard.insertText(" E2E!"); // insertText가 타이핑보다 안정적
    await page.waitForTimeout(250); // 워커 반영 여유

    // 5) 다운로드
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByTestId("download-btn").click(),
    ]);
    expect(download.suggestedFilename()).toBe("edited.zip");

    // 6) zip에서 'src/App.tsx'를 직접 읽어 검증
    const outDir = path.resolve(__dirname, "artifacts");
    await fs.mkdir(outDir, { recursive: true });
    const outZip = path.join(outDir, `edited-${Date.now()}.zip`);
    await download.saveAs(outZip);

    const buf = await fs.readFile(outZip);
    const u = unzipSync(new Uint8Array(buf));
    const key = Object.keys(u).find((k) =>
      k.replace(/\\/g, "/").endsWith("src/App.tsx"),
    );
    if (!key) throw new Error("zip 내에 src/App.tsx 엔트리를 찾지 못했습니다.");

    const text = new TextDecoder("utf-8").decode(u[key]);
    expect(text).toContain("E2E!");
  });
});

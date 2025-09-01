### option 추가
1. zip 파일 업로드시에, root 리렉토리 바로 아래에 있는 1depth에 있는 폴더들은 다볼수있게끔 추가
2. 디자인 제공해준 이미지와 비슷하게 수정 및 아이콘 수정
3. 새파일, 새폴더, 삭제 기능 추가

### 해보고싶은것
1. 파일 드래그 앤 드롭으로 폴더간에 이동시키기.
2. 


## Test
```
📌 2) FSD에서 테스트 파일 배치 규칙(추천)
페이지(Unit): src/pages/workspace/ui/__tests__/WorkspacePage.test.tsx
위젯(Unit): src/widgets/<widget>/ui/__tests__/*.test.tsx
피처(Unit): src/features/<feature>/ui/__tests__/*.test.tsx
엔티티(Unit): src/entities/<entity>/model/__tests__/*.test.ts (store/selector 로직)
공용 테스트 유틸: src/shared/test/render.tsx, src/setupTests.ts
```


-----

# Monaco ZIP Editor

ZIP을 업로드/열람/편집/재압축하여 다운로드할 수 있는 **React 18 기반** 미니 IDE.

파일 트리·탭 영역 가상화, 워커 기반 ZIP 처리, Monaco 에디터, Jest/Playwright 테스트를 포함합니다.

---

## 목차 (ToC)

- [프로젝트 메타](https://www.notion.so/README-md-2602accd3334806391b8e9b296ce4647?pvs=21)
- [주요 기능](https://www.notion.so/README-md-2602accd3334806391b8e9b296ce4647?pvs=21)
- [폴더 아키텍처 (FSD)](https://www.notion.so/README-md-2602accd3334806391b8e9b296ce4647?pvs=21)
- [기술 설계 요약](https://www.notion.so/README-md-2602accd3334806391b8e9b296ce4647?pvs=21)
- [실행/빌드/스크립트](https://www.notion.so/README-md-2602accd3334806391b8e9b296ce4647?pvs=21)
- [테스트 전략 (Unit/E2E)](https://www.notion.so/README-md-2602accd3334806391b8e9b296ce4647?pvs=21)
- [접근성/보안/성능 목표](https://www.notion.so/README-md-2602accd3334806391b8e9b296ce4647?pvs=21)
- [결정/트레이드오프](https://www.notion.so/README-md-2602accd3334806391b8e9b296ce4647?pvs=21)
- [커밋/PR/릴리스](https://www.notion.so/README-md-2602accd3334806391b8e9b296ce4647?pvs=21)
- [향후 개선 로드맵](https://www.notion.so/README-md-2602accd3334806391b8e9b296ce4647?pvs=21)
- [근거 & 참고 자료](https://www.notion.so/README-md-2602accd3334806391b8e9b296ce4647?pvs=21)

---

## 1) 프로젝트 메타

- 프로젝트명: **Monaco ZIP Editor**
- 레포 URL: *(예시)* `https://github.com/your-org/monaco-zip-editor`
- 런타임/도구: **Node LTS**, **npm**, **webpack**
- 프레임워크: **React 18**
- 상태관리: **Zustand** (선택자 최적화 + `shallow`)
- 서버 상태: **TanStack Query v5**
- 스타일: **styled-components v6**
- 테스트: **Jest + React Testing Library**, **Playwright (E2E)**

---

## 2) 주요 기능

- ✅ **ZIP 업로드** (버튼/드래그&드롭), **파일 트리 가상화**, **탭 가상화**
- ✅ **Monaco 에디터**로 텍스트 파일 편집 (PNG 등 바이너리는 프리뷰/비편집)
- ✅ **ZIP 재빌드 다운로드** (웹 워커 + Transferable)
- ✅ **키보드 내비게이션**: ← → ↑ ↓ / Enter
- ✅ **바이너리/텍스트 판별**: `isProbablyBinary(bytes, path)`

---

## 3) 폴더 아키텍처 (FSD)

> FSD(Feature-Sliced Design)를 따르는 entities / features / widgets / pages / shared 구성
>

```
src/
├─ app/
│  ├─ index.tsx
│  └─ App.tsx
├─ pages/
│  └─ workspace/
│     └─ ui/
│        └─ WorkspacePage.tsx
├─ widgets/
│  ├─ header-bar/
│  │  └─ ui/HeaderBar.tsx
│  ├─ file-panel/
│  │  └─ ui/FilePanel.tsx
│  └─ editor-panel/
│     └─ ui/EditorPanel.tsx
├─ features/
│  ├─ filetree/
│  │  └─ ui/FileTree.tsx
│  ├─ tabs/
│  │  └─ ui/Tabs.tsx
│  └─ upload-zip/
│     └─ ui/DropZone.tsx
├─ entities/
│  └─ fs-tree/
│     ├─ lib/
│     │  ├─ expand.ts
│     │  └─ flatten.ts
│     └─ model/
│        ├─ state.store.ts
│        ├─ handler.store.ts
│        └─ index.ts
├─ shared/
│  ├─ api/
│  │  └─ zip/index.ts           # loadZip / buildZip 등
│  ├─ workers/
│  │  └─ zip/zip.worker.ts
│  ├─ lib/
│  │  ├─ isBinary.ts
│  │  └─ paths.ts
│  └─ test/
│     └─ render.tsx             # renderWithProviders
└─ styles/
   └─ theme.ts                  # styled-components theme (v6)

```

> 테스트 파일은 각 모듈 하위 __tests__ 폴더에 위치.
>
>
> E2E: `e2e/workspace.spec.ts` (루트 `playwright.config.*`)
>

---

## 4) 기술 설계 요약

### ✅ 서버/클라이언트 상태 경계 (TanStack Query v5 / Zustand)

- **서버 상태**(원격 패칭/캐시/동기화)는 **TanStack Query v5**로 관리.
- **클라이언트 상태**(UI 상태, 트리 확장/선택, 드래그 활성, 탭 리스트/활성 경로)는 **Zustand** 사용.
- **리렌더 최소화**: `useFsStore(selector, shallow)` 및 **action 분리**로 구독 범위 축소.

### ✅ 워커 흐름 (`shared/workers/zip/zip.worker.ts`)

1. `loadZip(buffer)` → `unzipSync(Uint8Array)` → `Map<string, {bytes,isBinary}>` 저장 → `{type:'loaded', tree}` postMessage
2. `getFile(path)` → **normalize**(선행 `/` 제거, `\`→`/`) →
    - **바이너리**: `{isBinary:true, buffer}` + **Transferable**
    - **텍스트**: `{isBinary:false, text: strFromU8(bytes)}`
3. `updateFile(path, text)` → `bytes=strToU8(text)` 저장 → `{type:'updated'}`
4. `buildZip()` → `zipSync(object)` → `{type:'bundled', buffer}` + **Transferable**
5. 오류는 `console.error` 로깅

### ✅ 바이너리 판별

- `isProbablyBinary(bytes, path)` 를 이용해 **미디어/패키지**와 **텍스트**를 구분.
- 텍스트는 `strFromU8`으로 디코딩, 바이너리는 프리뷰/다운로드 대상.

### ✅ 가상화 (FileTree / TabBar)

- **트리/탭 항목 수 증가** 대비 가상 스크롤 적용.
- 가상화 시 **고정 data-속성**(`data-kind="file|dir"`, `data-path`) 부여로 테스트/셀렉터 안정화.
- 스크롤 동기화: 활성 탭/행 이동 시 `scrollIntoViewIfNeeded()` 호출.

### ✅ Monaco 포커스 안정화

- **이유**: `textarea.inputarea`는 실제 입력 타깃이지만 포인터 이벤트는 `.view-lines`가 가로챔.
- **패턴**: `.view-lines` 클릭 → `textarea.inputarea.focus()` → `keyboard.insertText()`
- E2E에서 이 패턴으로 **포커스 타임아웃**/클릭 인터셉트 문제를 해결.

---

## 5) 실행/빌드/스크립트

### 설치

```bash
npm ci

```

### 개발 서버

```bash
# webpack-dev-server 예시 (port는 프로젝트 설정에 맞게 수정)
npm run dev
# package.json 예)
# "dev": "webpack serve --mode development --port 5173 --open"

```

### 빌드

```bash
npm run build
# "build": "webpack --mode production"

```

### 테스트

```bash
# Unit
npm run test
# Watch
npm run test:watch
# E2E (Playwright)
npm run test:e2e

```

### 예시 npm scripts 표

| Script | 설명 |
| --- | --- |
| `dev` | 개발 서버 기동 (webpack-dev-server) |
| `build` | 프로덕션 번들 빌드 |
| `test` | Jest 단위테스트 |
| `test:watch` | Jest 워치 |
| `test:e2e` | Playwright E2E |
| `lint` | (선택) ESLint |
| `format` | (선택) Prettier |

### .env (예시)

```
# 필요 시 작성
# VITE_* 또는 WEBPACK_* 계열 변수는 빌드 도구 설정에 맞춰 사용

```

---

## 6) 테스트 전략 (Unit/E2E)

### Unit (Jest + RTL)

- **HeaderBar**: 업로드 없을 때 다운로드 가드(alert), 파일 input 트리거, 다운로드 링크 생성 로직
- **FileTree**: 폴더 토글/파일 클릭/키보드 내비(← → ↑ ↓ / Enter), 가상화 렌더
- **DropZone**: 전역 dragenter/leave/over/drop, zip 확장자 검사, `setDragActive` 토글
- **Tabs**: `tabs/activePath`로 activeIndex/active 계산 전달
- **zip.worker**: `loadZip/getFile/updateFile/buildZip/normalize` + **Transferable** 검증
- **fs-tree 유틸**: `expand.ts`, `flatten.ts` (depth/정렬/에러 내성)

**주의/패턴**

- jsdom 한계: `window.location.assign` 등은 mock 필요
- styled-components v6: DOM 경고 방지 위해 `$show`/`$active` 등 **dollar-prop** 사용
- react-virtuoso 등 가상화 라이브러리는 **간단 mock**으로 대체
- Web Worker 테스트는 `globalThis.self.postMessage = jest.fn()` + `isolateModules`

### E2E (Playwright)

- 시나리오: **Zip 업로드 → 트리 노출 → 파일 열기 → Monaco 편집 → ZIP 다운로드**
- Monaco 포커스: `.view-lines` 클릭 → `textarea.inputarea.focus()` → `keyboard.insertText()`
- 다운로드 아티팩트 검사: unzip → 대상 엔트리(`src/App.tsx` 등) 텍스트 포함 여부 확인

---

## 7) 접근성/보안/성능 목표

- **WCAG 2.2**
    - 키보드 조작 가능(트리/탭 네비), 포커스 링 가시성
    - 드래그&드롭 오버레이: `aria-hidden`, `role` 및 친절한 안내 텍스트
- **OWASP (간단 준수)**
    - 업로드 파일 **확장자/MIME 제한** (`.zip`), 과도한 파일 크기 방지 가이드
    - 사용자 입력(파일명/경로) **normalize** (`\`→`/`, 선행 `/` 제거)
- **Core Web Vitals**
    - 초기 렌더 TTI 개선: 가상화로 리스트 비용 절감
    - 불필요 리렌더 감소: Zustand 선택자 + `shallow` 조합

---

## 8) 결정/트레이드오프

- **webpack**: 요구사항에 따라 채택. 설정 자유도가 높고, 워커/에셋 처리 플러그인 선택지가 넓음.
- **React 18**: Concurrent 특성과 생태계 호환성, 최신 API(StrictMode 환경 포함) 반영.
- **TanStack Query v5**: 서버 상태와 클라 상태의 **명확한 경계** 확립, 캐시/동기화 내장.
- **Zustand + shallow**: 전역 UI 상태를 **얕은 비교**로 구독 범위 최소화 → 리렌더 감소.
- **가상화/Monaco/워커**: 퍼포먼스/UX 향상 vs 복잡도 증가. 테스트에서 mock/헬퍼 필요.

---

## 9) 커밋/PR/릴리스

- **Conventional Commits** 사용 (`feat:`, `fix:`, `refactor:`, `test:` …)
- PR 본문 하이라이트 예시
    - 리렌더 최소화(선택자/액션 분리)
    - Unit: HeaderBar/FileTree/DropZone/Tabs/zip.worker
    - E2E: 업로드→편집→다운로드 플로우
    - 버튼 UX·CSS 개선, 헤더 라인 연결
- 릴리스 태깅(예시)
    - `v0.1.0`: 최초 공개(기능 + 테스트 포함)
    - 릴리스 노트에 **주요 변경점/마이그레이션/테스트 지침** 명시

---

## 10) 향후 개선 로드맵

- 1️⃣ 대용량 ZIP 스트리밍(Streaming unzip/zip)
- 2️⃣ 에디터 다크/라이트 테마 토글, 단축키 사용자 정의
- 3️⃣ i18n (한/영 토글) + 접근성 점검 자동화
- 4️⃣ 휴지통/히스토리(파일 복원), Diff 뷰
- 5️⃣ 파일 검색/바꾸기, 다중 커서, 포맷터 연동

---

## 근거 & 참고 자료

- React 18 공식 문서: 최신 동시성 모델과 StrictMode 권장 패턴을 준수하여 마운트/언마운트 동작에 안전하게 대응했습니다.
- Zustand 문서: **selector + shallow** 조합으로 리렌더 최적화를 권장하며, action 분리로 구독 축소가 효과적입니다.
- TanStack Query v5 문서: 서버 상태/캐시/무효화 규칙을 통해 네트워크 종속 로직을 UI 상태와 분리할 것을 권장합니다.
- styled-components v6 마이그레이션 가이드: DOM에 불필요한 props를 내리지 않도록 `$prop` 네이밍을 권장합니다.
- Playwright 문서/가이드: 텍스트 엔진 셀렉터, 다운로드 아티팩트 확인, 비동기 렌더 대기 패턴 적용.
- JSDOM 한계: 네비게이션/레이아웃 일부 미구현 → mock 및 경고 억제를 통해 테스트 안정화.
- Monaco Editor 권장 패턴: 렌더 레이어와 입력 타깃 분리 구조를 고려해 **`.view-lines` 클릭 → `inputarea.focus()`** 후 입력하는 접근 방식이 안정적입니다.

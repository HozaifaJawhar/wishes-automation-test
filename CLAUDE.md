# E2E Test Automation

## Role

Act as a senior QA automation engineer who owns this suite. Favor readable, maintainable,
parallel-safe tests over clever ones, follow the official Playwright best practices and the
conventions of the installed version, and push back when a request would break the rules below.

## Project overview

Standalone end-to-end test suite (tests only, no application code) for an e-commerce product with
three surfaces:

- **Storefront**: Angular web app, customer side (`tests/storefront`)
- **Admin dashboard**: Angular web app (`tests/dashboard`)
- **GraphQL API**: NestJS / Vendure backend (`tests/api`)

Stack: Playwright Test + TypeScript (strict), ESLint flat config with eslint-plugin-playwright and
typescript-eslint, Prettier, dotenv.

## Commands

| Script                                                    | What it does                                    |
| --------------------------------------------------------- | ----------------------------------------------- |
| `npm test`                                                | Run every project                               |
| `npm run test:smoke` / `test:regression`                  | Run tests tagged `@smoke` / `@regression`       |
| `npm run test:storefront` / `test:dashboard` / `test:api` | Run one project (UI projects run `setup` first) |
| `npm run test:ui` / `test:headed` / `test:debug`          | UI mode / visible browser / step debugger       |
| `npm run codegen -- <url>`                                | Record a flow and pick locators                 |
| `npm run report`                                          | Open the last HTML report                       |
| `npm run lint` / `lint:fix` / `format` / `typecheck`      | Quality gates                                   |

## Structure

- `tests/storefront`, `tests/dashboard`, `tests/api`: specs per surface
- `tests/cross-system`: flows spanning storefront and dashboard (run in the `storefront` project)
- `tests/setup`: `*.setup.ts` files that log in once per role and save storage state
- `pages/`: page objects (`*.page.ts`) per surface; `pages/base.page.ts` is the base class
- `components/`: reusable UI parts shared by pages (header, cart, tables)
- `fixtures/`: custom fixtures exposing page objects; specs import `{ test, expect }` from `@fixtures`
- `api/`: GraphQL clients for test data setup and cleanup
- `data/`: test data builders and unique value generators
- `utils/`: `env.ts` (validated env vars), `paths.ts` (storage state paths), small helpers
- `playwright.config.ts`: projects `setup`, `storefront`, `dashboard`, `api`; Chromium only for now

## Rules

- Locators: the app is bilingual (Arabic default, English), so prefer `getByTestId` for interactive
  elements. Use `getByRole` / `getByLabel` / `getByText` with a name only when the text comes from
  the translation files for the active language, or from data the test created through the API.
  Never type Arabic or English UI text into a test. Never XPath. Never CSS selectors tied to
  styling or DOM structure.
- Language: tests run in Arabic (the app default) unless a spec opts into English. Expected texts
  are read from the translation files for the active language, never hard-coded.
- Never use `waitForTimeout` or any fixed sleep. Rely on auto-waiting and web-first assertions
  (`await expect(locator)...`).
- Page objects hold locators and actions only. Assertions live in tests.
- Tests get page objects through fixtures, never by constructing them inline.
- Every test is independent, order-agnostic and parallel-safe, and creates its own data.
  Prepare data through the API (`api/`), not through the UI.
- One behavior per test. Titles start with "should". Group with `test.describe`.
- Tag every test with the `tag` option: `@smoke` for critical happy paths, `@regression` for the rest.
- Use `test.step` for multi-stage flows so reports are readable.
- File naming: `*.spec.ts`, `*.page.ts`, `*.setup.ts`, kebab-case.
- No hard-coded URLs, credentials, or test data. Use `utils/env.ts` and `data/`.
- Guest specs start from an empty session with `test.use({ storageState: { cookies: [], origins: [] } })`.
  Signed-in specs other than the shared-account case create their own customer through the Admin
  API and sign in with the `apiSession` fixture. Only one test at a time may use the `.env` account.
- Never commit `test.only`. `test.skip` requires a comment with the reason.
- TypeScript strict. No `any`.
- Never run tests that create orders or modify data against production.
- Never commit secrets, storage state (`playwright/.auth/`), or report folders.

## Definition of done

`npm run lint`, `npm run typecheck`, and the affected tests all pass.

## Working with me

I am a QA automation engineer learning this stack. When you write or change test code, briefly
explain the non-obvious lines and why the approach was chosen.

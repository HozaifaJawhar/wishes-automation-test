# E2E Test Automation

End-to-end tests for the storefront (Angular), the admin dashboard (Angular) and the GraphQL API
(NestJS / Vendure), built with [Playwright Test](https://playwright.dev) and TypeScript.

## Prerequisites

- Node.js 22 or newer (current LTS) and npm
- A non-production environment of the three surfaces, plus one customer and one admin test account

## Setup

```bash
npm ci
npx playwright install chromium   # add --with-deps on Linux
cp .env.example .env              # then fill in the URLs and credentials
```

`.env` is git-ignored. In CI the same variables come from GitHub repository secrets.

The specs rely on `data-testid` attributes that only exist in the storefront source, so run the
storefront locally (`npm start` in the storefront repo, which serves `http://localhost:4200` against
the hosted dev backend) and point `STOREFRONT_URL` at it.

## Running tests

| Command                                                   | Runs                                 |
| --------------------------------------------------------- | ------------------------------------ |
| `npm test`                                                | Everything                           |
| `npm run test:smoke`                                      | Tests tagged `@smoke` (what CI runs) |
| `npm run test:regression`                                 | Tests tagged `@regression`           |
| `npm run test:storefront` / `test:dashboard` / `test:api` | One project                          |
| `npm run test:ui` / `test:headed` / `test:debug`          | UI mode / visible browser / debugger |
| `npm run codegen -- <url>`                                | Record a flow and pick locators      |
| `npm run report`                                          | Open the last HTML report            |
| `npm run lint` / `npm run typecheck` / `npm run format`   | Quality gates                        |

The UI projects depend on the `setup` project, which signs in once per role and saves the session
to `playwright/.auth/` (git-ignored). The login steps in `tests/setup/*.setup.ts` are still TODO.

## Folder structure

```
tests/
  storefront/     customer-side specs
  dashboard/      admin-side specs
  cross-system/   flows spanning storefront and dashboard
  api/            GraphQL API specs
  setup/          auth setup files (*.setup.ts)
pages/            page objects (*.page.ts) per surface
components/       reusable UI parts shared by pages
fixtures/         custom fixtures that expose page objects
api/              API clients for test data setup and cleanup
data/             test data builders and unique value generators
utils/            env loader and small helpers
```

Conventions and rules live in [CLAUDE.md](CLAUDE.md).

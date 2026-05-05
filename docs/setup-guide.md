# Setup Guide — Blocked Work

End-to-end setup: Rally API key, auth configuration, dev harness, and deployment.

## Prerequisites

- Node 18+ and npm
- A Rally workspace and project you can access
- A Rally API key (instructions below)

## 1. Generate a Rally API key

1. Sign in to Rally.
2. Open the API key page: **<https://rally1.rallydev.com/#/api_key>** (or click your avatar > API Keys).
3. Click **Create**, give it a name (e.g. `widget-dev`), select the workspaces it can access, and copy the key. It starts with `_` and is ~43 chars.
4. Treat it like a password — don't commit it.

## 2. Configure auth (pick one)

The Vite dev server proxies `/slm/*` to Rally. It needs a server URL and API key.

### Option A — `auth.json` (per-widget, gitignored)

Create `auth.json` in the `blocked-work/` folder:

```json
{
  "server": "https://rally1.rallydev.com",
  "apiKey": "_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

`auth.json` is gitignored. The `widget-ai deploy` CLI also reads it.

### Option B — environment variables / `.env.local`

```dotenv
RALLY_SERVER=https://rally1.rallydev.com
RALLY_API_KEY=_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Drop a `.env.local` file in the widget folder (gitignored via `*.local`), or set the vars in your shell.

> Restart `npm run dev` after changing credentials — Vite reads them at startup.

## 3. Run the dev server

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173` by default. The widget runs in mock mode (8 sample blocked items). To use live Rally data, add `?live=true` to the URL — the dev server proxies `/slm/*` to Rally via the credentials above.

### Mock mode scenarios

The mock data includes:

- Items with and without blocked reasons
- Items in different iterations and releases (for testing view filter)
- 2 items with disabled users (items 4 and 7) — shown in italics with `[disabled]` indicator
- Items spread across multiple projects (Platform Team, Reporting Squad, Integrations Team, UX & Accessibility)

The mock `ViewFilter` is set to Iteration "Sprint 24.3" by default — with the **Ignore View Filter** setting unchecked, only items in that iteration appear.

To see all items: either toggle **Ignore View Filter** in Edit Mode, or switch the mock context to `ViewFilter: { filters: [] }` in `src/mock-data.ts`.

### DevHarness toolbar

When running from `localhost`, the SDK wraps the widget in `<DevHarness>` — a thin toolbar across the top:

- **Gear** — toggles Edit Mode to preview the settings panel
- **Project picker** — switches the project scope for live-data testing

The harness is invisible in production builds and Rally.

## 4. Configure the "Ignore View Filter" setting

In the dev server, click the **gear icon** to open Edit Mode. You'll see the **Ignore View Filter** checkbox. This setting controls whether the widget respects the active Iteration, Release, or Milestone view filter on the Custom View page.

- **Unchecked (default):** Shows only blocked items whose WorkProduct is in the active timebox. Filtering is client-side (the blocker API doesn't accept timebox query params).
- **Checked:** Shows all blocked items in the project scope, ignoring any view filter.

## 5. Deploy to Rally

```bash
npx widget-ai deploy
```

This builds `dist/app.js` and pushes it to Rally as a Custom HTML Widget. The widget name comes from `rally.config.json`. The deployed view ID is written back to `rally.config.json` so subsequent deploys update the same widget.

Requires `auth.json` (the deploy CLI does not read env vars).

### Common deploy issues

- **`No auth.json found`** — create one before running `deploy`.
- **`401 Unauthorized`** — API key is revoked or doesn't have access to this workspace.
- **`dist/app.js not found`** — build failed; run `npm run build` and check output.

## 6. Using the widget in Rally

After deploying, add the Custom View to a Rally page. To see the view filter in action:

1. Add the widget to a page that has an Iteration or Release view filter set.
2. The widget will automatically filter blocked items to match the active timebox.
3. To ignore the filter, go to Edit Mode on the page and uncheck **Ignore View Filter**.

## Quick reference

| Task | Command |
|------|---------|
| Dev server (mock data) | `npm run dev` |
| Dev server (live data) | `npm run dev` then visit `?live=true` |
| Production build | `npm run build` |
| Mock build | `npm run build:mock` |
| TypeScript check | `npm run typecheck` |
| Deploy to Rally | `npx widget-ai deploy` |

---

## Reference

- Broadcom spec: [endorsed-widgets/blocked-work](https://github.com/Broadcom/rally-widgets/tree/main/endorsed-widgets/blocked-work)
- [API Reference](./api-reference.md) — widget-ai components and hooks
- [Cookbook](./cookbook.md) — common patterns

# Dashbuild

Modular GitHub Actions for generating static reporting sites. Compose steps in your CI workflow to produce a beautiful, interactive dashboard powered by [Observable Framework](https://observablehq.com/framework/).

## Repository Structure

```
dashbuild/
├── modules/                 ← GitHub Actions (one per module)
│   ├── _template/           ← Scaffold for new modules
│   ├── sonarqube/           ← SonarQube metrics module
│   ├── code-tasks/          ← Code task comment scanner module
│   └── javascript/
│       └── unit-tests/      ← Coverage & test statistics module
├── framework/               ← Observable Framework skeleton & shared components
├── setup/                   ← Setup composite action
├── compile/                 ← Build & deploy composite action
├── scripts/                 ← Dev tooling (dev.js)
├── justfile                 ← Development commands
└── test-local.sh            ← Full pipeline integration test
```

## Development

Requires [just](https://github.com/casey/just) and Node.js 20+.

```bash
# List all commands
just

# Create a new module from the template
just create-module my-report

# Preview a single module with hot reload
just dev sonarqube
just dev javascript/code-statistics

# Preview all modules together
just dev all

# Run the full build pipeline locally
just build-test

# Clean dev artifacts
just clean
```

### Module Structure

Each module in `modules/` contains:

| File         | Purpose                                                                       |
| ------------ | ----------------------------------------------------------------------------- |
| `page.md`    | Observable Framework page (Markdown + reactive JS)                            |
| `theme.css`  | Module-specific CSS custom properties and styles                              |
| `fixtures/`  | Sample JSON data for local dev preview                                        |
| `action.yml` | GitHub Actions composite action definition                                    |
| `scripts/`   | CI scripts (generate-page.js, generate-overview.js, register-module.js, etc.) |

Edit `page.md` and `theme.css` directly — they're used in both dev preview and CI.

## Quick Start (CI)

```yaml
name: Dashbuild Report
on: [push]

permissions:
  pages: write
  id-token: write

jobs:
  report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: dashbuild/setup@v1
        with:
          title: "My Project Report"

      - uses: dashbuild/sonarqube@v1
        with:
          token: ${{ secrets.SONAR_TOKEN }}
          project-key: my-org_my-project

      - uses: dashbuild/javascript/code-statistics@v1
        with:
          test-runner: vitest

      - uses: dashbuild/code-tasks@v1

      - uses: dashbuild/compile@v1
        with:
          deploy: true
```

## Actions

### `dashbuild/setup`

Bootstraps the Observable Framework project and installs dependencies. **Must be the first Dashbuild step.**

| Input          | Required | Default              | Description                                          |
| -------------- | -------- | -------------------- | ---------------------------------------------------- |
| `node-version` | No       | `20`                 | Node.js version                                      |
| `title`        | No       | `Dashbuild Report`   | Site title                                           |
| `subtitle`     | No       | `Development Report` | Subtitle displayed next to DASHBUILD on the overview |
| `theme`        | No       | `dashboard`          | Observable Framework theme                           |

### `dashbuild/sonarqube`

Fetches code quality metrics from SonarQube or SonarCloud and generates an interactive report page.

| Input         | Required | Default                    | Description                    |
| ------------- | -------- | -------------------------- | ------------------------------ |
| `token`       | **Yes**  | —                          | SonarQube/SonarCloud API token |
| `project-key` | **Yes**  | —                          | SonarQube project key          |
| `host-url`    | No       | `https://sonarcloud.io`    | SonarQube server URL           |
| `metrics`     | No       | `bugs,vulnerabilities,...` | Comma-separated metric keys    |

### `dashbuild/javascript/code-statistics`

Parses LCOV coverage files and test runner output (Vitest, Jest, Cypress) with monorepo support.

| Input               | Required | Default         | Description                                 |
| ------------------- | -------- | --------------- | ------------------------------------------- |
| `coverage-path`     | No       | `.`             | Directory to search for coverage files      |
| `pattern`           | No       | `**/lcov.info`  | Glob pattern for LCOV files                 |
| `test-runner`       | No       | `vitest`        | Test runner: `vitest`, `jest`, or `cypress` |
| `test-results-path` | No       | _(auto-detect)_ | Path to test runner JSON output             |

### `dashbuild/code-tasks`

Scans source code for task comments (TODO, FIXME, HACK, etc.) across all languages and generates a report with code context.

| Input           | Required | Default                          | Description                               |
| --------------- | -------- | -------------------------------- | ----------------------------------------- |
| `source-path`   | No       | `.`                              | Directory to scan                         |
| `patterns`      | No       | _(broad multi-language default)_ | Comma-separated glob patterns             |
| `tags`          | No       | `TODO,FIXME,HACK,...`            | Comma-separated task tags to search for   |
| `context-lines` | No       | `5`                              | Lines of context around each task comment |
| `task-regex`    | No       | _(auto)_                         | Custom regex for matching task comments   |

### `dashbuild/compile`

Assembles all registered modules, builds the static site, and optionally deploys to GitHub Pages.

| Input           | Required | Default            | Description                                             |
| --------------- | -------- | ------------------ | ------------------------------------------------------- |
| `deploy`        | No       | `false`            | Deploy to GitHub Pages                                  |
| `artifact-name` | No       | `dashbuild-report` | Name for the uploaded artifact                          |
| `show-overview` | No       | `true`             | Show the module overview section on the dashboard index |

## Architecture

```
Workflow:  setup → [modules...] → compile
                      │
                      ├── sonarqube                    → page.md + theme.css + data/sonarqube.json
                      ├── javascript/code-statistics   → page.md + theme.css + data/js-code-stats.json
                      ├── code-tasks                   → page.md + theme.css + data/code-tasks.json
                      └── (your module)                → page.md + theme.css + data/<slug>.json
                                                         + module-api/<slug>/overview.json (optional)
```

Each module writes:

1. A **Markdown page** (`src/<module>.md`) with Observable Framework visualizations
2. A **theme CSS file** (`src/<module>-theme.css`) with scoped custom properties
3. A **JSON data file** (`src/data/<module>.json`) consumed by the page
4. A **registry entry** in `modules.json` so `compile` knows what to include
5. _(Optional)_ **Module API files** in `module-api/<slug>/` for inter-module communication (see below)

The `compile` action discovers all module themes, generates a combined stylesheet, builds the Observable Framework config, and produces the static site.

## Theming

Each module defines its own CSS custom properties in `theme.css`. Styles are scoped using `[data-path="/<module-name>"]` selectors so modules don't conflict. Example:

```css
:root {
  --my-module-primary: #6366f1;
}

[data-path="/my-module"] {
  --theme-foreground-focus: var(--my-module-primary);
}

[data-path="/my-module"] .card {
  border-top: 3px solid var(--my-module-primary);
}
```

Shared components are available in `framework/src/components/`:

- **`metricCard.js`** — `metricCard()`, `statusBadge()`, `percentBar()`
- **`dataTable.js`** — `dataTable()` for sortable, paginated tables

## Module Communication API

Modules can expose structured data to the dashboard and to other modules via the **module API** — a set of well-known JSON files written to `$DASHBUILD_DIR/module-api/<slug>/`. The `compile` action discovers these files at assembly time and uses them to enrich the generated site.

This is an extensible system: each communication type is a separate JSON file at a known path. Modules opt in by generating the relevant file.

### `overview.json`

The **overview** API lets a module surface key metrics on the dashboard index page. Each module that generates an `overview.json` gets a styled summary box on the main page, using the module's own color scheme.

**Path:** `$DASHBUILD_DIR/module-api/<slug>/overview.json`

**Schema:**

```json
{
  "moduleName": "My Module",
  "modulePath": "/my-module",
  "backgroundColor": "#0d1117",
  "boxColor": "#161b22",
  "borderColor": "#30363d",
  "textColor": "#e6edf3",
  "titleColor": "#58a6ff",
  "summaries": [
    { "label": "Metric Name", "value": "42" },
    { "label": "Another Metric", "value": "98%" }
  ]
}
```

| Field             | Type   | Description                                     |
| ----------------- | ------ | ----------------------------------------------- |
| `moduleName`      | string | Display name shown above the summary grid       |
| `modulePath`      | string | Link target (e.g. `/<slug>`)                    |
| `backgroundColor` | string | CSS color for the overview container background |
| `boxColor`        | string | CSS color for each summary item background      |
| `borderColor`     | string | CSS color for container and item borders        |
| `textColor`       | string | CSS color for labels and values                 |
| `titleColor`      | string | CSS color for the module name heading           |
| `summaries`       | array  | List of `{ label, value }` pairs to display     |

The overview section is displayed on the index page by default. Disable it with `show-overview: false` on the `compile` action. Modules still generate their `overview.json` regardless of the toggle — only the rendering is affected.

**To add overview support to a new module**, create `scripts/generate-overview.js` (see `modules/_template/scripts/generate-overview.js` for a starting point) and add a "Generate overview" step to your `action.yml`:

```yaml
- name: Generate overview
  shell: bash
  run: |
    node "${{ github.action_path }}/scripts/generate-overview.js"
```

### Future communication types

Additional API types will follow the same pattern: a JSON file at `module-api/<slug>/<type>.json`, discovered by `compile` at assembly time. Planned types may include alerts, badges, and cross-module data sharing.

## License

MIT

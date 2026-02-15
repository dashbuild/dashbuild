# JavaScript Test Project

A TypeScript monorepo used to generate real test data for Dashbuild modules. Unlike a mock/fake project, this uses **Vitest** with real test files to produce actual coverage and test result reports.

## Structure

```
tests/javascript/
├── packages/
│   ├── core/       # Shared utilities, config, events, logger
│   ├── api/        # Server, routes, middleware
│   └── ui/         # Components, hooks
├── vitest.config.ts
├── tsconfig.json
└── package.json
```

Each package contains:
- `src/` — Source files with intentional task comments (TODO, FIXME, HACK, etc.)
- `__tests__/` — Real Vitest test files

## Setup

```bash
cd tests/javascript
npm install
```

## Running Tests

```bash
# Run all tests
npx vitest run

# Run with coverage (lcov + text)
npx vitest run --coverage

# Run with JSON reporter output
npx vitest run --reporter=json --outputFile=test-results.json
```

## Generating Dashbuild Fixtures

From the project root:

```bash
# Generate code-tasks fixture (scans for TODO/FIXME/etc. comments)
just test-js-tasks

# Run tests + generate code-statistics fixture (real coverage + test results)
just test-js-stats

# Both at once
just test-js
```

## Output

- `coverage/lcov.info` — Real V8 coverage in LCOV format
- `test-results.json` — Real Vitest JSON reporter output
- Both are consumed by `generate-fixture.js` scripts in the respective modules

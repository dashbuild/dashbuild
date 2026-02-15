#!/usr/bin/env node

/**
 * Dev script for previewing individual Dashbuild modules.
 *
 * Usage:
 *   node scripts/dev.js sonarqube
 *   node scripts/dev.js javascript/code-statistics
 *   node scripts/dev.js all
 *
 * This assembles a temporary Observable Framework project from:
 *   - framework/                  → base skeleton (package.json, shared components)
 *   - modules/<module>/page.md    → the module's page template
 *   - modules/<module>/theme.css  → the module's custom theme
 *   - modules/<module>/fixtures/  → sample data for development
 *
 * Then runs `npx observable preview` with hot reload.
 */

import {
  cpSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  readdirSync,
  symlinkSync,
  rmSync,
} from "node:fs";
import { join, resolve, dirname } from "node:path";
import { execSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  buildOverviewSection,
  buildIndexPage,
  buildPagesList,
} from "./lib/index-builder.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const MODULES_DIR = join(ROOT, "modules");
const DEV_DIR = join(ROOT, ".dev");

// ─── Dev config ──────────────────────────────────────────────────────

/**
 * Parse .dev-config.yml if present.
 * Supports a simple subset of YAML: top-level module keys, nested
 * scalar values, and list items (prefixed with "- ").
 */
function loadDevConfig() {
  const configPath = join(ROOT, ".dev-config.yml");

  if (!existsSync(configPath)) {
    return {};
  }

  const rawText = readFileSync(configPath, "utf-8");
  const config = {};
  let currentModuleName = null;
  let currentListKey = null;

  for (const line of rawText.split("\n")) {
    if (line.startsWith("#") || line.trim() === "") {
      continue;
    }

    // Top-level module key (e.g. "sonarqube:")
    const moduleMatch = line.match(/^(\w[\w-]*):\s*$/);
    if (moduleMatch) {
      currentModuleName = moduleMatch[1];
      config[currentModuleName] = {};
      currentListKey = null;
      continue;
    }

    if (!currentModuleName) {
      continue;
    }

    // Nested key that starts a list (e.g. "  areas:")
    const listKeyMatch = line.match(/^\s+(\w[\w-]*):\s*$/);
    if (listKeyMatch) {
      currentListKey = listKeyMatch[1];
      config[currentModuleName][currentListKey] = [];
      continue;
    }

    // List item (e.g. "    - coverage")
    const listItemMatch = line.match(/^\s+-\s+(.+)$/);
    if (listItemMatch && currentListKey) {
      config[currentModuleName][currentListKey].push(listItemMatch[1].trim());
      continue;
    }

    // Scalar key-value (e.g. "  retention: 90")
    const scalarMatch = line.match(/^\s+(\w[\w-]*):\s+(.+)$/);
    if (scalarMatch) {
      config[currentModuleName][scalarMatch[1]] = scalarMatch[2].trim();
      currentListKey = null;
    }
  }

  return config;
}

const devConfig = loadDevConfig();

if (Object.keys(devConfig).length > 0) {
  console.log("📋 Loaded .dev-config.yml");
}

// ─── Module discovery ────────────────────────────────────────────────

function loadModuleConfig(moduleDirectory) {
  const configPath = join(moduleDirectory, "module.json");
  return JSON.parse(readFileSync(configPath, "utf-8"));
}

function discoverModules(dir = MODULES_DIR, prefix = "") {
  if (!existsSync(dir)) {
    return [];
  }

  const results = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith("_")) {
      continue;
    }

    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    const fullPath = join(dir, entry.name);

    if (existsSync(join(fullPath, "module.json"))) {
      results.push(relativePath);
    } else {
      results.push(...discoverModules(fullPath, relativePath));
    }
  }

  return results;
}

const availableModules = discoverModules();

// ─── Argument parsing ────────────────────────────────────────────────

const requestedModule = process.argv[2];

if (!requestedModule) {
  console.error("Usage: node scripts/dev.js <module-name|all>");
  console.error("Available modules:");
  availableModules.forEach((name) => console.error(`  - ${name}`));
  process.exit(1);
}

const selectedModules =
  requestedModule === "all" ? availableModules : [requestedModule];

for (const moduleName of selectedModules) {
  if (!existsSync(join(MODULES_DIR, moduleName, "module.json"))) {
    console.error(
      `Module "${moduleName}" not found (no module.json at ${join(MODULES_DIR, moduleName)})`,
    );
    console.error("Available modules:");
    availableModules.forEach((name) => console.error(`  - ${name}`));
    process.exit(1);
  }
}

// ─── Assemble dev project ────────────────────────────────────────────

console.log(
  `\n🔧 Assembling dev environment for: ${selectedModules.join(", ")}\n`,
);

// Preserve node_modules across rebuilds to avoid reinstalling
const nodeModulesCache = join(ROOT, ".dev-node_modules");
const devNodeModules = join(DEV_DIR, "node_modules");

if (existsSync(devNodeModules)) {
  execSync(`mv "${devNodeModules}" "${nodeModulesCache}"`);
}

rmSync(DEV_DIR, { recursive: true, force: true });
cpSync(join(ROOT, "framework"), DEV_DIR, { recursive: true });

if (existsSync(nodeModulesCache)) {
  execSync(`mv "${nodeModulesCache}" "${devNodeModules}"`);
}

// Install dependencies if needed
if (!existsSync(devNodeModules)) {
  console.log("📦 Installing dependencies...");
  execSync("npm install", { cwd: DEV_DIR, stdio: "inherit" });
}

// Create required directories
mkdirSync(join(DEV_DIR, "src", "data"), { recursive: true });
mkdirSync(join(DEV_DIR, "src", "components"), { recursive: true });
mkdirSync(join(DEV_DIR, "module-api"), { recursive: true });

// Clear Observable cache to prevent stale page references
rmSync(join(DEV_DIR, "src", ".observablehq", "cache"), {
  recursive: true,
  force: true,
});

// Symlink shared components back to source for live editing
const componentsDir = join(DEV_DIR, "src", "components");
execSync(`rm -rf "${componentsDir}"`);
symlinkSync(join(ROOT, "framework", "src", "components"), componentsDir);

// ─── Link module files ───────────────────────────────────────────────

const registeredPages = [];

for (const moduleName of selectedModules) {
  const moduleDirectory = join(MODULES_DIR, moduleName);
  const moduleConfig = loadModuleConfig(moduleDirectory);
  const slug = moduleConfig.slug;

  // Read fixture data for this module
  const fixturesDirectory = join(moduleDirectory, "fixtures");
  const moduleDevConfig = devConfig[slug] || devConfig[moduleName] || null;
  let fixtureJson = null;

  if (existsSync(fixturesDirectory)) {
    for (const fixtureFile of readdirSync(fixturesDirectory)) {
      if (fixtureFile.startsWith(".")) continue;

      const sourcePath = join(fixturesDirectory, fixtureFile);

      if (fixtureFile === `${slug}.json`) {
        // This is the module's primary data file — read it for inlining
        try {
          let fixtureData = JSON.parse(readFileSync(sourcePath, "utf-8"));

          // Patch with dev config overrides when available
          if (moduleDevConfig && fixtureData.config && moduleDevConfig.areas) {
            fixtureData.config.areas = moduleDevConfig.areas;
            console.log(
              `   Patched ${fixtureFile} with dev config areas: ${moduleDevConfig.areas.join(", ")}`,
            );
          }

          fixtureJson = JSON.stringify(fixtureData);
        } catch {
          // Fall through — fixtureJson stays null
        }
      }

      // Still copy all fixtures to src/data/ (other scripts may need them)
      const targetPath = join(DEV_DIR, "src", "data", fixtureFile);
      if (!existsSync(targetPath)) {
        symlinkSync(sourcePath, targetPath);
      }
    }
  }

  // Copy page.md and inline fixture data (replacing /*INLINE_DATA*/ placeholder)
  const pageSource = join(moduleDirectory, "page.md");
  if (existsSync(pageSource)) {
    let pageContent = readFileSync(pageSource, "utf-8");

    if (fixtureJson) {
      pageContent = pageContent.replace("/*INLINE_DATA*/ {}", fixtureJson);
      console.log(`   Inlined fixture data into ${slug}.md`);
    }

    writeFileSync(join(DEV_DIR, "src", `${slug}.md`), pageContent, "utf-8");
    registeredPages.push({
      name: moduleConfig.name,
      path: `/${slug}`,
      section: moduleConfig.section || null,
    });
  }

  // Symlink theme CSS (referenced by per-page style front matter)
  const themeSource = join(moduleDirectory, "theme.css");
  if (existsSync(themeSource)) {
    symlinkSync(themeSource, join(DEV_DIR, "src", `${slug}-theme.css`));
  }
}

// ─── Generate module overviews ──────────────────────────────────────

for (const moduleName of selectedModules) {
  const moduleDirectory = join(MODULES_DIR, moduleName);
  const overviewScript = join(
    moduleDirectory,
    "scripts",
    "generate-overview.js",
  );
  if (existsSync(overviewScript)) {
    try {
      execSync(`node ${JSON.stringify(overviewScript)}`, {
        env: { ...process.env, DASHBUILD_DIR: DEV_DIR },
        stdio: "pipe",
      });
    } catch {
      // Overview generation is optional — skip silently in dev
    }
  }
}

// Collect overview data
const moduleApiDir = join(DEV_DIR, "module-api");
const overviews = [];

if (existsSync(moduleApiDir)) {
  for (const entry of readdirSync(moduleApiDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const overviewPath = join(moduleApiDir, entry.name, "overview.json");
    if (existsSync(overviewPath)) {
      try {
        overviews.push(JSON.parse(readFileSync(overviewPath, "utf-8")));
      } catch {
        // skip malformed overview files
      }
    }
  }
}

// ─── Generate index page ─────────────────────────────────────────────

const devSubtitle = devConfig["dashbuild"]?.subtitle || "Development Report";

const indexContent = buildIndexPage({
  title: "Dev Preview",
  subtitle: devSubtitle,
  overviewSection: buildOverviewSection(overviews),
});

writeFileSync(join(DEV_DIR, "src", "index.md"), indexContent, "utf-8");

// ─── Generate Observable config ──────────────────────────────────────

const observableConfig = {
  title: "Dashbuild Dev",
  root: "src",
  theme: "dashboard",
  pager: false,
  head: `<link rel="stylesheet" href="./components/dashbuild-base.css"><style>observablehq-loading{display:none!important}.observablehq--block:empty{display:none!important}#observablehq-footer{opacity:0;animation:dashFadeIn 150ms ease-out forwards;animation-delay:calc(6 * 30ms)}</style>`,
  pages: buildPagesList(registeredPages),
};

writeFileSync(
  join(DEV_DIR, "observablehq.config.js"),
  `export default ${JSON.stringify(observableConfig, null, 2)};\n`,
  "utf-8",
);

console.log("✅ Dev project assembled at .dev/");
console.log(`   Pages: ${registeredPages.map((page) => page.name).join(", ")}`);
console.log("");

// ─── Launch preview ──────────────────────────────────────────────────

console.log("🚀 Starting Observable Framework preview...\n");

const previewProcess = spawn(
  "npx",
  ["observable", "preview", "--port", "4321"],
  {
    cwd: DEV_DIR,
    stdio: "inherit",
    env: { ...process.env },
  },
);

previewProcess.on("exit", (code) => process.exit(code));

process.on("SIGINT", () => {
  previewProcess.kill("SIGINT");
});

process.on("SIGTERM", () => {
  previewProcess.kill("SIGTERM");
});

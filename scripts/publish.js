#!/usr/bin/env node

/**
 * Publish Dashbuild actions to GitHub repositories.
 *
 * Publishes three target repos:
 *   dashbuild/setup       ← setup/
 *   dashbuild/compile     ← compile/
 *   dashbuild/modules     ← modules/ (all modules as sub-actions + _shared/lib)
 *
 * Consumers use:
 *   uses: dashbuild/setup@v1
 *   uses: dashbuild/compile@v1
 *   uses: dashbuild/modules/code-tasks@v1
 *   uses: dashbuild/modules/javascript/code-statistics@v1
 *
 * Usage:
 *   node scripts/publish.js [--dry-run] [--repo <name>] [--tag <tag>]
 *
 * Options:
 *   --dry-run   Stage files but do not push to remote repos
 *   --repo      Publish only a specific repo ("setup", "compile", or "modules")
 *   --tag       Git tag to create on the target repos (e.g. "v1", "v1.2.0")
 *
 * Environment:
 *   GITHUB_TOKEN  Required (unless --dry-run). Used to push to target repos.
 *   GITHUB_ORG    Optional. Defaults to "dashbuild".
 */

import {
  cpSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { join, resolve, dirname, relative } from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const STAGE_DIR = join(ROOT, ".publish-staging");

// ─── CLI arguments ──────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const repoFilter = args.includes("--repo")
  ? args[args.indexOf("--repo") + 1]
  : null;
const tag = args.includes("--tag") ? args[args.indexOf("--tag") + 1] : null;
const org = process.env.GITHUB_ORG || "dashbuild";

if (!dryRun && !process.env.GITHUB_TOKEN) {
  console.error("GITHUB_TOKEN is required unless --dry-run is set");
  process.exit(1);
}

// ─── Target repos ───────────────────────────────────────────────────

const TARGET_REPOS = ["setup", "compile", "modules"];

// ─── Path rewriting ─────────────────────────────────────────────────

/**
 * Rewrite an action.yml for standalone repos (setup, compile).
 * Bundles shared code at _shared/lib/ within the action directory.
 */
function rewriteStandaloneActionYml(actionYmlPath, repoName) {
  let content = readFileSync(actionYmlPath, "utf-8");

  // Replace references to ${DASHBUILD_ROOT}/scripts/lib/ with local _shared/lib/
  content = content.replace(
    /\$\{DASHBUILD_ROOT\}\/scripts\/lib\//g,
    "${{ github.action_path }}/_shared/lib/",
  );

  // For the setup action, rewrite the framework copy path
  if (repoName === "setup") {
    content = content.replace(
      /\$\{\{ github\.action_path \}\}\/\.\.\/framework/g,
      "${{ github.action_path }}/_framework",
    );
  }

  writeFileSync(actionYmlPath, content, "utf-8");
}

/**
 * Rewrite a module action.yml for the modules repo.
 * - Rewrites `uses: ./actions/resolve-dashbuild-root` to the path where the
 *   shared action is bundled in the published repo (_shared/actions/resolve-dashbuild-root).
 * - Updates ${DASHBUILD_ROOT}/scripts/lib/ references to _shared/lib/.
 */
function rewriteModuleActionYml(actionYmlPath) {
  let content = readFileSync(actionYmlPath, "utf-8");

  // Rewrite the local action path to where it is bundled in the published repo
  content = content.replace(
    /uses: \.\/actions\/resolve-dashbuild-root/g,
    "uses: ./_shared/actions/resolve-dashbuild-root",
  );

  // Update references to use _shared/lib instead of scripts/lib
  content = content.replace(
    /\$\{DASHBUILD_ROOT\}\/scripts\/lib\//g,
    "${DASHBUILD_ROOT}/_shared/lib/",
  );

  writeFileSync(actionYmlPath, content, "utf-8");
}

/**
 * Rewrite JS imports in compile/scripts/assemble-site.js that reference
 * ../../scripts/lib/ to use ../_shared/lib/ instead.
 */
function rewriteCompileImports(stageDir) {
  const assembleScript = join(stageDir, "scripts", "assemble-site.js");
  if (!existsSync(assembleScript)) return;

  let content = readFileSync(assembleScript, "utf-8");
  content = content.replace(
    /from\s+["']\.\.\/\.\.\/scripts\/lib\//g,
    'from "../_shared/lib/',
  );
  writeFileSync(assembleScript, content, "utf-8");
}

// ─── Staging ────────────────────────────────────────────────────────

function addAutoPublishNotice(readmePath) {
  const existingReadme = existsSync(readmePath)
    ? readFileSync(readmePath, "utf-8")
    : "";

  const notice = `<!-- AUTO-PUBLISHED from https://github.com/${org}/dashbuild -->
> **Note**: This repository is automatically published from the [dashbuild monorepo](https://github.com/${org}/dashbuild).
> Do not edit this repository directly — changes will be overwritten.

`;

  if (!existingReadme.includes("AUTO-PUBLISHED")) {
    writeFileSync(readmePath, notice + existingReadme, "utf-8");
  }
}

/**
 * Stage the setup repo: setup/ + _framework/
 */
function stageSetup() {
  const stageDir = join(STAGE_DIR, "setup");
  rmSync(stageDir, { recursive: true, force: true });
  mkdirSync(stageDir, { recursive: true });

  cpSync(join(ROOT, "setup"), stageDir, { recursive: true });
  cpSync(join(ROOT, "framework"), join(stageDir, "_framework"), {
    recursive: true,
  });

  rewriteStandaloneActionYml(join(stageDir, "action.yml"), "setup");
  addAutoPublishNotice(join(stageDir, "README.md"));

  return stageDir;
}

/**
 * Stage the compile repo: compile/ + _shared/lib/
 */
function stageCompile() {
  const stageDir = join(STAGE_DIR, "compile");
  rmSync(stageDir, { recursive: true, force: true });
  mkdirSync(stageDir, { recursive: true });

  cpSync(join(ROOT, "compile"), stageDir, { recursive: true });
  cpSync(join(ROOT, "scripts/lib"), join(stageDir, "_shared/lib"), {
    recursive: true,
  });

  rewriteStandaloneActionYml(join(stageDir, "action.yml"), "compile");
  rewriteCompileImports(stageDir);
  addAutoPublishNotice(join(stageDir, "README.md"));

  return stageDir;
}

/**
 * Stage the modules repo: all modules + _shared/ at root.
 *
 * Published structure:
 *   _shared/lib/                              ← scripts/lib (shared code)
 *   _shared/actions/resolve-dashbuild-root/   ← actions/resolve-dashbuild-root
 *   code-tasks/                               ← modules/code-tasks
 *   sonarqube/                                ← modules/sonarqube
 *   javascript/
 *     code-statistics/                        ← modules/javascript/code-statistics
 *   ...
 */
function stageModules() {
  const stageDir = join(STAGE_DIR, "modules");
  rmSync(stageDir, { recursive: true, force: true });
  mkdirSync(stageDir, { recursive: true });

  // Copy _shared/lib at the repo root
  cpSync(join(ROOT, "scripts/lib"), join(stageDir, "_shared/lib"), {
    recursive: true,
  });

  // Bundle shared actions so module action.ymls can reference them with a local path
  cpSync(
    join(ROOT, "actions/resolve-dashbuild-root"),
    join(stageDir, "_shared/actions/resolve-dashbuild-root"),
    { recursive: true },
  );

  // Copy each module (excluding _template)
  const modulesSource = join(ROOT, "modules");
  function copyModules(dir, targetDir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith("_")) continue;
      const fullPath = join(dir, entry.name);
      const targetPath = join(targetDir, entry.name);

      if (existsSync(join(fullPath, "module.json"))) {
        // This is a module — copy it and rewrite its action.yml
        cpSync(fullPath, targetPath, { recursive: true });
        rewriteModuleActionYml(join(targetPath, "action.yml"));
      } else {
        // This is a grouping directory (e.g. javascript/) — recurse
        mkdirSync(targetPath, { recursive: true });
        copyModules(fullPath, targetPath);
      }
    }
  }

  copyModules(modulesSource, stageDir);
  addAutoPublishNotice(join(stageDir, "README.md"));

  return stageDir;
}

// ─── Git push ───────────────────────────────────────────────────────

function pushToRepo(stageDir, targetRepo) {
  const repoUrl = `https://x-access-token:${process.env.GITHUB_TOKEN}@github.com/${org}/${targetRepo}.git`;

  const git = (cmd) =>
    execSync(`git ${cmd}`, { cwd: stageDir, stdio: "pipe" }).toString().trim();

  git("init");
  git('config user.name "dashbuild-publish"');
  git('config user.email "dashbuild-publish@users.noreply.github.com"');
  git("add -A");

  try {
    git('commit -m "publish: update from monorepo"');
  } catch {
    console.log(`  No changes to publish for ${targetRepo}`);
    return;
  }

  git("branch -M main");
  git(`remote add origin ${repoUrl}`);
  git("push -f origin main");

  if (tag) {
    git(`tag -f ${tag}`);
    git(`push -f origin ${tag}`);

    // Also update the major version tag (e.g. v1 from v1.2.0)
    const majorMatch = tag.match(/^(v\d+)/);
    if (majorMatch && majorMatch[1] !== tag) {
      const majorTag = majorMatch[1];
      git(`tag -f ${majorTag}`);
      git(`push -f origin ${majorTag}`);
      console.log(`  Tagged ${targetRepo} with ${tag} and ${majorTag}`);
    } else {
      console.log(`  Tagged ${targetRepo} with ${tag}`);
    }
  }

  console.log(`  Pushed ${targetRepo}`);
}

// ─── Main ───────────────────────────────────────────────────────────

const stagers = {
  setup: stageSetup,
  compile: stageCompile,
  modules: stageModules,
};

console.log(`\nDashbuild publish${dryRun ? " (dry run)" : ""}\n`);

rmSync(STAGE_DIR, { recursive: true, force: true });

const toPublish = repoFilter
  ? TARGET_REPOS.filter((r) => r === repoFilter)
  : TARGET_REPOS;

if (toPublish.length === 0) {
  console.error(`No repo matching "${repoFilter}"`);
  console.error(`Available repos: ${TARGET_REPOS.join(", ")}`);
  process.exit(1);
}

console.log("Repos to publish:");
for (const repo of toPublish) {
  console.log(`  ${org}/${repo}`);
}
console.log("");

for (const repo of toPublish) {
  console.log(`Publishing ${org}/${repo}...`);
  const stageDir = stagers[repo]();

  if (dryRun) {
    console.log(`  Staged at ${relative(ROOT, stageDir)}`);
  } else {
    pushToRepo(stageDir, repo);
  }
}

if (dryRun) {
  console.log(
    `\nDry run complete. Staged files at ${relative(ROOT, STAGE_DIR)}/`,
  );
  console.log("Inspect the staged directories to verify the output.");
} else {
  rmSync(STAGE_DIR, { recursive: true, force: true });
  console.log("\nPublish complete.");
}

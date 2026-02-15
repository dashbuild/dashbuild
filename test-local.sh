#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export DASHBUILD_DIR="/tmp/dashbuild-test"
MODULES_DIR="${SCRIPT_DIR}/modules"

echo "=== Dashbuild Local Test ==="
echo "Project root: ${SCRIPT_DIR}"
echo "Workspace:    ${DASHBUILD_DIR}"
echo ""

# ─── Step 1: Simulate setup action ───────────────────────────────────
echo "▶ Step 1: Setup"
rm -rf "${DASHBUILD_DIR}"
cp -r "${SCRIPT_DIR}/framework" "${DASHBUILD_DIR}"

cat > "${DASHBUILD_DIR}/dashbuild-config.json" <<'EOF'
{
  "title": "Test Project Report",
  "subtitle": "Development Report",
  "theme": "dashboard"
}
EOF

echo "[]" > "${DASHBUILD_DIR}/modules.json"
mkdir -p "${DASHBUILD_DIR}/src/data"
mkdir -p "${DASHBUILD_DIR}/src/components"
mkdir -p "${DASHBUILD_DIR}/module-api"

cd "${DASHBUILD_DIR}"
npm install
cd "${SCRIPT_DIR}"
echo "✓ Setup complete"
echo ""

# ─── Step 2: Run each module ─────────────────────────────────────────
STEP=2
while IFS= read -r MODULE_JSON; do
  MODULE_DIR="$(dirname "${MODULE_JSON}")"

  # Skip template
  [[ "${MODULE_DIR}" == */_template ]] && continue

  MODULE_NAME="$(node -e "console.log(JSON.parse(require('fs').readFileSync('${MODULE_JSON}','utf-8')).name)")"

  echo "▶ Step ${STEP}: ${MODULE_NAME}"

  # Copy fixture data into the workspace
  SLUG="$(node -e "console.log(JSON.parse(require('fs').readFileSync('${MODULE_DIR}/module.json','utf-8')).slug)")"
  if [ -f "${MODULE_DIR}/fixtures/${SLUG}.json" ]; then
    cp "${MODULE_DIR}/fixtures/${SLUG}.json" "${DASHBUILD_DIR}/src/data/${SLUG}.json"
  fi

  # Generate page, overview, and register module using shared scripts
  node "${SCRIPT_DIR}/scripts/lib/generate-page.js" "${MODULE_DIR}"
  if [ -f "${MODULE_DIR}/scripts/generate-overview.js" ]; then
    node "${MODULE_DIR}/scripts/generate-overview.js"
  fi
  node "${SCRIPT_DIR}/scripts/lib/register-module.js" "${MODULE_DIR}"

  echo "✓ ${MODULE_NAME} module complete"
  echo ""
  STEP=$((STEP + 1))
done < <(find "${MODULES_DIR}" -name "module.json" -not -path "*/_template/*" | sort)

# ─── Final step: Simulate compile action ─────────────────────────────
echo "▶ Step ${STEP}: Build Site"
node "${SCRIPT_DIR}/compile/scripts/assemble-site.js"

echo ""
echo "--- Generated modules.json ---"
cat "${DASHBUILD_DIR}/modules.json"
echo ""
echo ""
echo "--- Generated observablehq.config.js ---"
cat "${DASHBUILD_DIR}/observablehq.config.js"
echo ""

cd "${DASHBUILD_DIR}"
npx observable build
echo "✓ Site built successfully"
echo ""

echo "=== Build complete ==="
echo "Static site output: ${DASHBUILD_DIR}/dist/"
echo ""
echo "To preview, run:"
echo "  cd ${DASHBUILD_DIR} && npx observable preview"

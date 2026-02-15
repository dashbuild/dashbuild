# Dashbuild development commands

modules_dir := "modules"
template_dir := modules_dir / "_template"

# List available commands
default:
    @just --list

# ─── Development ──────────────────────────────────────────────────────

# Start dev preview for a module (or 'all'). Use fetch=true to fetch data first.
[group('development')]
dev module="all" fetch="false":
    #!/usr/bin/env bash
    set -euo pipefail
    if [ "{{fetch}}" = "true" ]; then
        if [ "{{module}}" = "all" ]; then
            just fetch-all
        else
            just fetch "{{module}}"
        fi
    fi
    node scripts/dev.js {{module}}

# List available modules
[group('development')]
list:
    @echo "Available modules:"
    @find {{modules_dir}} -name "module.json" -not -path "*/_template/*" | sed 's|{{modules_dir}}/||;s|/module.json||' | sort | sed 's/^/  - /'

# Build the full site with all modules (using test fixtures)
[group('development')]
build-test:
    bash test-local.sh

# Serve the built site from the tmp directory
[group('development')]
serve-test:
    npx http-server /tmp/dashbuild-test/dist/ -p 8080

# Clean dev artifacts
[group('development')]
clean:
    rm -rf .dev .dev-node_modules
    echo "✓ Cleaned dev artifacts"

# ─── Data ─────────────────────────────────────────────────────────────

# Fetch or generate fixture data for a module
[group('data')]
fetch module:
    #!/usr/bin/env bash
    set -euo pipefail
    MODULE_DIR="{{modules_dir}}/{{module}}"
    FETCH_SCRIPT="${MODULE_DIR}/scripts/fetch.sh"
    if [ ! -f "${FETCH_SCRIPT}" ]; then
        echo "Error: No fetch script found for '{{module}}'"
        echo "  Expected: ${FETCH_SCRIPT}"
        echo ""
        echo "Available modules with fetch scripts:"
        find {{modules_dir}} -path "*/scripts/fetch.sh" -not -path "*/_template/*" \
            | sed 's|{{modules_dir}}/||;s|/scripts/fetch.sh||' | sort | sed 's/^/  - /'
        exit 1
    fi
    echo "── Fetching data for {{module}} ──"
    bash "${FETCH_SCRIPT}"

# Fetch data for all modules that have a fetch script
[group('data')]
fetch-all:
    #!/usr/bin/env bash
    set -euo pipefail
    SCRIPTS=$(find {{modules_dir}} -path "*/scripts/fetch.sh" -not -path "*/_template/*" | sort)
    if [ -z "${SCRIPTS}" ]; then
        echo "No modules have fetch scripts."
        exit 0
    fi
    for SCRIPT in ${SCRIPTS}; do
        MODULE=$(echo "${SCRIPT}" | sed 's|{{modules_dir}}/||;s|/scripts/fetch.sh||')
        echo ""
        echo "── Fetching data for ${MODULE} ──"
        bash "${SCRIPT}"
    done
    echo ""
    echo "All modules fetched."

# ─── Modules ──────────────────────────────────────────────────────────

# Create a new module from the template
[group('modules')]
create-module name:
    #!/usr/bin/env bash
    set -euo pipefail
    MODULE_NAME="{{name}}"
    # Derive title from the last path segment (e.g. javascript/code-statistics → Code Statistics)
    BASENAME="$(basename '{{name}}')"
    MODULE_TITLE="$(echo "${BASENAME}" | sed 's/-/ /g' | sed 's/\b\(.\)/\u\1/g')"
    DEST="{{modules_dir}}/${MODULE_NAME}"

    if [ -d "${DEST}" ]; then
        echo "Error: Module '${MODULE_NAME}' already exists at ${DEST}"
        exit 1
    fi

    echo "Creating module '${MODULE_NAME}' (${MODULE_TITLE})..."
    mkdir -p "$(dirname "${DEST}")"
    cp -r "{{template_dir}}" "${DEST}"

    # Rename fixture file (use basename to handle nested module names like javascript/foo)
    SLUG="$(echo "${BASENAME}" | tr '[:upper:]' '[:lower:]')"
    if [ -f "${DEST}/fixtures/__MODULE_NAME__.json" ]; then
        mv "${DEST}/fixtures/__MODULE_NAME__.json" "${DEST}/fixtures/${SLUG}.json"
    fi
    rm -f "${DEST}/fixtures/.gitkeep"

    # Replace placeholders in all files
    find "${DEST}" -type f | while read -r file; do
        sed -i "s/__MODULE_NAME__/${MODULE_NAME}/g" "$file"
        sed -i "s/__MODULE_TITLE__/${MODULE_TITLE}/g" "$file"
    done

    echo "✓ Module created at ${DEST}/"
    echo ""
    echo "Files:"
    find "${DEST}" -type f | sort | sed 's/^/  /'
    echo ""
    echo "Next steps:"
    echo "  1. Edit ${DEST}/page.md          — your report page"
    echo "  2. Edit ${DEST}/theme.css        — module colors"
    echo "  3. Edit ${DEST}/scripts/fetch.sh — data fetching logic"
    echo "  4. Run: just dev ${MODULE_NAME}"

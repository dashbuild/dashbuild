#!/usr/bin/env bash
# Fetch or generate fixture data for this module.
# Called by: just fetch __MODULE_NAME__
#
# Customize this script to fetch data from an API, run tests,
# scan source files, or however this module collects its data.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODULE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "TODO: Implement data fetching for __MODULE_TITLE__"
echo "Edit ${SCRIPT_DIR}/fetch.sh to add your fetch logic."
exit 1

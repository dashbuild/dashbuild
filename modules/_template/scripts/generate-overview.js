import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadModuleContext,
  readModuleData,
  writeOverview,
} from "../../../scripts/lib/module-helpers.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const moduleDir = join(__dirname, "..");
const { config, slug, dashbuildDir } = loadModuleContext(moduleDir);

const data = readModuleData(dashbuildDir, slug);
if (!data) process.exit(0);

// ─── Build overview ─────────────────────────────────────────────────
// Replace with your module's key metrics.

const summaries = [
  { label: "Example Metric", value: String(data.example ?? "—") },
];

writeOverview(dashbuildDir, slug, {
  moduleName: config.name,
  modulePath: `/${slug}`,
  backgroundColor: "#0d1117",
  boxColor: "#161b22",
  borderColor: "#30363d",
  textColor: "#e6edf3",
  titleColor: "#58a6ff",
  summaries,
});

/**
 * Dashbuild shared component builders
 *
 * Reusable DOM-building functions for common dashboard patterns.
 * Modules import what they need; unused exports are tree-shaken.
 *
 * @version 1
 */

import { html } from "npm:htl";
import { formatMetric, calculateTrend, makeArrowNode } from "./trendChart.js";

// ─── Summary Card ──────────────────────────────────────────────────────
//
// A centered stat card with title, big value, optional trend, and
// optional child content (e.g. a badge or subtitle).
//
// Options:
//   label        — card heading text
//   value        — the metric value (number or string)
//   suffix       — appended to formatted value (e.g. "%")
//   colorClass   — CSS class on the .big element ("accent-primary", "red", etc.)
//   highlight    — if truthy, wrap in a gradient border card (string: "primary"|"secondary")
//   trend        — a trend object from calculateTrend()
//   child        — additional HTML node rendered below the value
//   badge        — if provided, renders a rating badge instead of .big value
//                  { text, background } — text inside badge, background color
//   centered     — if true, center-align the card content (default: false)

export function summaryCard({
  label,
  value,
  suffix = "",
  colorClass = "",
  highlight = false,
  trend = null,
  child = null,
  badge = null,
  centered = false,
} = {}) {
  let trendHtml = "";
  if (trend && trend.text) {
    trendHtml = html`<span
      class="muted trend-container"
      style="font-size: 0.75rem;"
    >
      ${makeArrowNode(trend)}${trend.text}${suffix ? suffix : ""} from previous
    </span>`;
  }

  let valueDisplay;
  if (badge) {
    valueDisplay = html`<span
      class="dash-rating-badge"
      style="background: ${badge.background}"
      >${badge.text}</span
    >`;
  } else {
    valueDisplay = html`<span class="big ${colorClass}"
      >${formatMetric(value, suffix)}</span
    >`;
  }

  const cardClass = centered
    ? "card summary-card centered"
    : "card summary-card";

  const inner = html`<div class="${cardClass}">
    <h2>${label}</h2>
    ${valueDisplay} ${trendHtml} ${child || ""}
  </div>`;

  if (!highlight) return inner;

  const gradientClass =
    highlight === "secondary"
      ? "dash-gradient-card-secondary"
      : "dash-gradient-card-primary";

  return html`<div class="${gradientClass}">${inner}</div>`;
}

// ─── Section Header ────────────────────────────────────────────────────
//
// Renders a heading (h2 or h3) inside a dash-section with stagger index.

export function sectionHeader(text, { level = 2, sectionIndex = 0 } = {}) {
  const tag = level === 3 ? "h3" : "h2";
  return html`<div class="dash-section" style="--si:${sectionIndex}">
    <${tag}>${text}</${tag}>
  </div>`;
}

// ─── Filter Toggle Button ──────────────────────────────────────────────
//
// Creates a colored filter toggle button with a count badge.
//
// Options:
//   label     — button text
//   count     — number shown in the count badge
//   color     — accent color (hex or CSS var)
//   bgAlpha   — background color when active (rgba string)
//   active    — initial active state
//   onToggle  — callback(isActive) when clicked

export function filterToggle({
  label,
  count,
  color,
  bgAlpha,
  active = true,
  onToggle,
} = {}) {
  const btn = document.createElement("button");
  btn.className = `dash-filter-toggle${active ? " active" : ""}`;
  btn.innerHTML = `${label} <span class="dash-filter-count">${count}</span>`;

  function applyActive(el) {
    el.style.borderColor = color;
    el.style.background = bgAlpha;
    el.style.color = color;
  }
  function applyInactive(el) {
    el.style.borderColor = "";
    el.style.background = "";
    el.style.color = "";
  }

  if (active) applyActive(btn);

  btn.addEventListener("click", () => {
    const isActive = btn.classList.toggle("active");
    if (isActive) applyActive(btn);
    else applyInactive(btn);
    if (onToggle) onToggle(isActive);
  });

  return btn;
}

// ─── Filter Row ────────────────────────────────────────────────────────
//
// Creates a row of filter toggle buttons from an array of tag configs.
//
// tagConfigs: [{ label, count, color, bgAlpha }]
// Returns: { row: HTMLElement, buttons: HTMLElement[], setAll(active) }

export function filterRow(tagConfigs, { onToggle, sectionIndex = 0 } = {}) {
  const row = document.createElement("div");
  row.className = "dash-filter-row dash-section";
  row.style.setProperty("--si", String(sectionIndex));

  const buttons = [];

  for (const cfg of tagConfigs) {
    const btn = filterToggle({
      ...cfg,
      active: cfg.active !== false,
      onToggle: (isActive) => {
        if (onToggle) onToggle(cfg.label, isActive);
      },
    });
    buttons.push(btn);
    row.appendChild(btn);
  }

  function setAll(active) {
    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i];
      const cfg = tagConfigs[i];
      if (active) {
        btn.classList.add("active");
        btn.style.borderColor = cfg.color;
        btn.style.background = cfg.bgAlpha;
        btn.style.color = cfg.color;
      } else {
        btn.classList.remove("active");
        btn.style.borderColor = "";
        btn.style.background = "";
        btn.style.color = "";
      }
    }
  }

  return { row, buttons, setAll };
}

// ─── Action Buttons Row ────────────────────────────────────────────────
//
// Creates a row with utility buttons (e.g. "Select all", "Clear all").
//
// actions: [{ label, onClick }]

export function actionRow(actions, { sectionIndex = 0 } = {}) {
  const row = document.createElement("div");
  row.className = "dash-action-row dash-section";
  row.style.setProperty("--si", String(sectionIndex));

  for (const action of actions) {
    const btn = document.createElement("button");
    btn.className = "dash-action-btn";
    btn.textContent = action.label;
    btn.addEventListener("click", action.onClick);
    row.appendChild(btn);
  }

  return row;
}

// ─── Segment Bar ──────────────────────────────────────────────────────
//
// Builds a horizontal stacked bar from an array of segment configs.
//
// segments: [{ value, color, className, label }]
//   value     — numeric value (used for width proportion)
//   color     — CSS color for the segment background
//   className — optional extra class on the segment div
//   label     — optional text inside the segment (omitted for thin bars)
//
// options:
//   thin      — if true, renders a thinner bar without labels (e.g. language bars)
//   emptyText — fallback text when all values are 0

export function segmentBar(segments, { thin = false, emptyText = "" } = {}) {
  const total = segments.reduce((s, seg) => s + (seg.value || 0), 0);
  if (total === 0 && emptyText) {
    return html`<div class="muted" style="font-size:0.85rem">
      ${emptyText}
    </div>`;
  }
  if (total === 0) return "";

  const barClass = thin ? "dash-segment-bar thin" : "dash-segment-bar";
  const children = segments
    .filter((seg) => seg.value > 0)
    .map((seg) => {
      const pct = (seg.value / total) * 100;
      const cls = seg.className ? `segment ${seg.className}` : "segment";
      return html`<div
        class="${cls}"
        style="width:${pct}%;background:${seg.color}"
      >
        ${thin ? "" : (seg.label ?? seg.value)}
      </div>`;
    });

  return html`<div class="${barClass}">${children}</div>`;
}

// ─── Bar Legend ───────────────────────────────────────────────────────
//
// Builds a legend row with colored dots and labels.
//
// items: [{ color, label }]

export function barLegend(items) {
  if (!items || items.length === 0) return "";
  const spans = items.map(
    (item) =>
      html`<span
        ><span class="dot" style="background:${item.color}"></span
        >${item.label}</span
      >`,
  );
  return html`<div class="dash-bar-legend">${spans}</div>`;
}

// ─── Badge ───────────────────────────────────────────────────────────
//
// Builds a small colored pill badge.
//
// text    — display text
// options:
//   color    — text color (CSS)
//   bg       — background color (CSS)
//   border   — border color (CSS), adds a border if provided
//   mono     — if true, uses monospace font (e.g. for CVSS scores)

export function dashBadge(text, { color, bg, border, mono = false } = {}) {
  const style = [
    color ? `--badge-color:${color}` : "",
    bg ? `--badge-bg:${bg}` : "",
    border ? `--badge-border:${border}` : "",
    mono
      ? 'font-family:"SFMono-Regular",Consolas,"Liberation Mono",Menlo,monospace'
      : "",
  ]
    .filter(Boolean)
    .join(";");

  return html`<span class="dash-badge" style="${style}">${text}</span>`;
}

// ─── Pill List ───────────────────────────────────────────────────────
//
// Builds a flex-wrapped row of badge pills.
//
// items: [{ label, count, color, bg, border, mono }]
//   If count is provided, it's shown with .dash-pill-count styling.

export function pillList(items) {
  if (!items || items.length === 0) return "";
  const pills = items.map((item) => {
    const style = [
      item.color ? `--badge-color:${item.color}` : "",
      item.bg ? `--badge-bg:${item.bg}` : "",
      item.border ? `--badge-border:${item.border}` : "",
      item.mono
        ? 'font-family:"SFMono-Regular",Consolas,"Liberation Mono",Menlo,monospace'
        : "",
    ]
      .filter(Boolean)
      .join(";");

    return html`<span class="dash-badge" style="${style}"
      >${item.label}${item.count != null
        ? html` <span class="dash-pill-count">${item.count}</span>`
        : ""}</span
    >`;
  });
  return html`<div class="dash-pill-list">${pills}</div>`;
}

// ─── Metric Grid ───────────────────────────────────────────────────────
//
// Builds a grid of summary cards from a metric config array.
//
// metrics:       [{ key, label, suffix, highlight, colorClass, inverse, neutral, color, child, badge }]
// latestMetrics: { [key]: value }
// metricHistory: [{ date, metrics }]
// options:
//   cols          — grid column count (3 or 4)
//   sectionIndex  — stagger index
//   sectionTitle  — optional heading text
//   centered      — if true, center-align all cards (default: false)

export function metricGrid(
  metrics,
  latestMetrics,
  metricHistory,
  { cols = 3, sectionIndex = 0, sectionTitle = "", centered = false } = {},
) {
  const cards = [];

  for (const metric of metrics) {
    const value = latestMetrics[metric.key];
    if (value == null) continue;

    const trend = metricHistory
      ? calculateTrend(metricHistory, latestMetrics, metric.key, {
          inverse: metric.inverse || false,
          neutral: metric.neutral || false,
        })
      : null;

    cards.push(
      summaryCard({
        label: metric.label,
        value,
        suffix: metric.suffix || "",
        colorClass: metric.colorClass || "",
        highlight: metric.highlight || false,
        trend,
        child: metric.child || null,
        badge: metric.badge || null,
        centered,
      }),
    );
  }

  if (cards.length === 0) return "";

  return html`<div class="dash-section" style="--si:${sectionIndex}">
    ${sectionTitle ? html`<h3>${sectionTitle}</h3>` : ""}
    <div class="grid grid-cols-${cols} skel-cards-${cols}">${cards}</div>
  </div>`;
}

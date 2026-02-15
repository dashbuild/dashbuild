/**
 * Shared trend chart and metric display components for Dashbuild modules.
 *
 * Provides formatMetric, calculateTrend, and buildTrendChart functions
 * used by modules that display time-series data (sonarqube, js-code-stats, etc.).
 *
 * CSS variable contract — each module's theme.css must define:
 *   --dash-trend-up    (color for positive trends)
 *   --dash-trend-down  (color for negative trends)
 *   --dash-trend-flat  (color for zero/neutral trends)
 *
 * @version 2
 */

import * as Plot from "npm:@observablehq/plot";
import { html } from "npm:htl";

// ─── Format a metric value for display ───────────────────────────────

export function formatMetric(value, suffix = "") {
  if (value == null) return "—";
  if (typeof value === "number") return value.toLocaleString() + suffix;
  return value;
}

// ─── SVG arrow icons ─────────────────────────────────────────────────

const svgUpRight = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 10 L10 2"/><path d="M5 2 L10 2 L10 7"/></svg>`;
const svgDownRight = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 2 L10 10"/><path d="M5 10 L10 10 L10 5"/></svg>`;
const svgFlat = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6 L10 6"/><path d="M7 3 L10 6 L7 9"/></svg>`;

// ─── Calculate trend between two most recent data points ─────────────

/**
 * @param {Array} metricHistory  — Array of { date, metrics } entries
 * @param {object} latestMetrics — The most recent metrics object
 * @param {string} metricKey     — Which metric to compute the trend for
 * @param {object} [options]
 * @param {boolean} [options.inverse]  — If true, a decrease is positive (e.g. fewer bugs)
 * @param {boolean} [options.neutral]  — If true, delta is always shown as neutral color
 */
export function calculateTrend(
  metricHistory,
  latestMetrics,
  metricKey,
  { inverse = false, neutral = false } = {},
) {
  const noTrend = { text: "", arrow: "", color: "var(--dash-trend-flat)" };

  if (metricHistory.length < 2) return noTrend;

  const previousValue =
    metricHistory[metricHistory.length - 2]?.metrics?.[metricKey];
  const currentValue = latestMetrics[metricKey];

  if (previousValue == null || currentValue == null) return noTrend;

  const delta = currentValue - previousValue;
  const sign = delta > 0 ? "+" : "";
  const deltaText = sign + (Number.isInteger(delta) ? delta : delta.toFixed(1));

  if (delta === 0) {
    return {
      text: deltaText,
      arrow: svgFlat,
      color: "var(--dash-trend-flat)",
    };
  }

  const isPositiveTrend = inverse ? delta < 0 : delta > 0;
  const arrow = delta > 0 ? svgUpRight : svgDownRight;

  if (neutral) {
    return { arrow, text: deltaText, color: "var(--dash-trend-flat)" };
  }

  return {
    arrow,
    text: deltaText,
    color: isPositiveTrend ? "var(--dash-trend-up)" : "var(--dash-trend-down)",
  };
}

// ─── Build a trend arrow DOM node ────────────────────────────────────

export function makeArrowNode(trend) {
  if (!trend.arrow) return "";
  const span = document.createElement("span");
  span.className = "trend-arrow";
  span.style.color = trend.color;
  span.style.display = "inline-flex";
  span.innerHTML = trend.arrow;
  return span;
}

// ─── Build a trend chart card ────────────────────────────────────────

/**
 * @param {Array} metricHistory  — Array of { date, metrics } entries (dates as Date objects)
 * @param {object} latestMetrics — The most recent metrics object
 * @param {string} metricKey     — Which metric to chart
 * @param {object} [options]
 * @param {string} options.title
 * @param {string} [options.color]    — CSS color for the chart line/area
 * @param {string} [options.suffix]   — e.g. "%"
 * @param {number[]} [options.yDomain] — e.g. [0, 100]
 * @param {boolean} [options.inverse]
 * @param {boolean} [options.neutral]
 *
 * Requires Observable's Plot and html to be in scope (global in Observable Framework).
 */
export function buildTrendChart(
  metricHistory,
  latestMetrics,
  metricKey,
  options = {},
) {
  const {
    title,
    color = "var(--dash-trend-flat)",
    suffix = "",
    yDomain,
    inverse = false,
    neutral = false,
    tickFormat,
    valueFormat,
    reverse = false,
  } = options;

  const chartData = metricHistory
    .filter((entry) => entry.metrics[metricKey] != null)
    .map((entry) => ({ date: entry.date, value: entry.metrics[metricKey] }));

  if (chartData.length === 0) {
    return html`<div class="card">
      <h2>${title}</h2>
      <span class="muted">No data</span>
    </div>`;
  }

  const allIntegers = chartData.every((d) => Number.isInteger(d.value));
  const isSinglePoint = chartData.length === 1;

  // When reverse is true, invert the data so that lower raw values appear at the top.
  // E.g. for ratings 1-5: raw 1 (best) maps to 5 (top of chart), raw 5 (worst) maps to 1 (bottom).
  if (reverse && yDomain) {
    const [lo, hi] = yDomain;
    for (const d of chartData) {
      d.value = hi + lo - d.value;
    }
  }

  const yAxisOptions = { label: null, grid: true };
  if (yDomain) yAxisOptions.domain = yDomain;
  if (tickFormat) {
    yAxisOptions.tickFormat = tickFormat;
  } else if (suffix) {
    yAxisOptions.tickFormat = (d) =>
      (Number.isInteger(d) ? d : d.toFixed(2).replace(/\.?0+$/, "")) + suffix;
  } else if (allIntegers) {
    yAxisOptions.tickFormat = "d";
  } else {
    yAxisOptions.tickFormat = (d) =>
      Number.isInteger(d) ? String(d) : d.toFixed(2).replace(/\.?0+$/, "");
  }

  // For a single data point, pad the x-axis ±3 days so it renders cleanly
  const xAxisOptions = { type: "time", label: null };
  if (isSinglePoint) {
    const pointDate = chartData[0].date;
    const firstDay = new Date(pointDate);
    const lastDay = new Date(pointDate);
    firstDay.setDate(firstDay.getDate() - 6);
    xAxisOptions.domain = [firstDay, lastDay];
  }

  const metricTrend = calculateTrend(metricHistory, latestMetrics, metricKey, {
    inverse,
    neutral,
  });
  const areaBaseline = yDomain ? yDomain[0] : 0;

  // Build a display function for tooltip values
  const displayValue =
    reverse && yDomain && valueFormat
      ? (v) => valueFormat(yDomain[1] + yDomain[0] - v)
      : (v) => formatMetric(v, suffix);

  // For reversed charts, the tick labels need to map inverted values back to original labels
  if (reverse && yDomain && tickFormat) {
    const [lo, hi] = yDomain;
    const origTickFormat = tickFormat;
    yAxisOptions.tickFormat = (d) => origTickFormat(hi + lo - d);
  }

  let trendArrowHtml = "";
  if (metricTrend.arrow) {
    trendArrowHtml = makeArrowNode(metricTrend);
  }

  const deltaText = metricTrend.text
    ? metricTrend.text + suffix + " from previous"
    : metricHistory.length === 1
      ? "No trend"
      : "";

  let deltaNode = "";
  if (deltaText) {
    const textSpan = document.createElement("span");
    textSpan.style.marginLeft = "0.25rem";
    textSpan.textContent = deltaText;
    deltaNode = textSpan;
  }

  // Build chart marks — use a horizontal rule for single points, area+line for multiple
  const marks = isSinglePoint
    ? [
        Plot.ruleY([chartData[0].value], {
          stroke: color,
          strokeWidth: 1.5,
          strokeOpacity: 0.7,
        }),
        Plot.dot(chartData, {
          x: "date",
          y: "value",
          fill: color,
          fillOpacity: 0.6,
          r: 3,
        }),
      ]
    : [
        Plot.areaY(chartData, {
          x: "date",
          y2: "value",
          y1: areaBaseline,
          fill: color,
          fillOpacity: 0.1,
          curve: "monotone-x",
        }),
        Plot.lineY(chartData, {
          x: "date",
          y: "value",
          stroke: color,
          strokeWidth: 1.5,
          strokeOpacity: 0.7,
          curve: "monotone-x",
        }),
        Plot.dot(chartData, {
          x: "date",
          y: "value",
          fill: color,
          fillOpacity: 0.6,
          r: 2.5,
        }),
        Plot.tip(
          chartData,
          Plot.pointerX({
            x: "date",
            y: "value",
            title: (point) =>
              `${point.date.toLocaleDateString()}: ${displayValue(point.value)}`,
          }),
        ),
      ];

  const chart = Plot.plot({
    height: 180,
    marginTop: 8,
    marginBottom: 24,
    marginLeft: 40,
    marginRight: 12,
    x: xAxisOptions,
    y: yAxisOptions,
    marks,
  });

  return html`<div class="card">
    <h2>${title}</h2>
    <span class="big"
      >${valueFormat
        ? valueFormat(latestMetrics[metricKey])
        : formatMetric(latestMetrics[metricKey], suffix)}</span
    >
    <span class="muted trend-container">${trendArrowHtml}${deltaNode}</span>
    ${chart}
  </div>`;
}

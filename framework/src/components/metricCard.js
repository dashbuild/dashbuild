import {html} from "npm:htl";

export function metricCard(title, value, {subtitle, color, icon} = {}) {
  return html`<div class="card">
    <h2>${icon ? html`<span style="margin-right: 0.4em;">${icon}</span>` : ""}${title}</h2>
    <span class="big" ${color ? `style="color: ${color}"` : ""}>${value}</span>
    ${subtitle ? html`<span class="muted">${subtitle}</span>` : ""}
  </div>`;
}

export function statusBadge(label, status) {
  const colors = {
    pass: "var(--theme-green, #22c55e)",
    warn: "var(--theme-yellow, #eab308)",
    fail: "var(--theme-red, #ef4444)",
    info: "var(--theme-foreground-focus)"
  };
  const bg = colors[status] || colors.info;
  return html`<span style="
    display: inline-block;
    padding: 0.15em 0.6em;
    border-radius: 999px;
    font-size: 0.85em;
    font-weight: 600;
    color: white;
    background: ${bg};
  ">${label}</span>`;
}

export function percentBar(value, {max = 100, height = 8, color} = {}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const barColor = color || (pct >= 80 ? "#22c55e" : pct >= 50 ? "#eab308" : "#ef4444");
  return html`<div style="
    width: 100%;
    height: ${height}px;
    background: var(--theme-foreground-faintest);
    border-radius: ${height / 2}px;
    overflow: hidden;
  "><div style="
    width: ${pct}%;
    height: 100%;
    background: ${barColor};
    border-radius: ${height / 2}px;
    transition: width 0.3s ease;
  "></div></div>`;
}

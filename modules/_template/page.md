---
title: __MODULE_TITLE__
style: __MODULE_NAME__-theme.css
toc: false
---

# **MODULE_TITLE**

```js
const data = /*INLINE_DATA*/ {};
```

```js
import { metricCard, percentBar } from "./components/metricCard.js";
import {
  summaryCard,
  metricGrid,
  filterRow,
  actionRow,
} from "./components/dashbuild-components.js";
```

<div class="dash-section" style="--si:0">
<div class="grid grid-cols-3 skel-cards-3">
  <div class="card">
    <h2>Example Metric</h2>
    <span class="big">${data.example ?? "—"}</span>
    <span class="muted">Replace with your data</span>
  </div>
</div>
</div>

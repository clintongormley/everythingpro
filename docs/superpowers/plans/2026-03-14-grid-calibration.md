# Grid Calibration Mode Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Grid calibration" tab to `tools/sensor-diagnostic.html` that lets users measure sensor accuracy at known grid positions across the FOV, fit angle/range correction curves, and apply corrections to the Explore view.

**Architecture:** Single-file HTML modification. New tab follows existing patterns (arc calibration tab). Grid state in module-level variables. Canvas drawing reuses `drawFovAndRings()`. Analysis reuses `linearFit()` (currently scoped inside `showMarkResults` — must be extracted to module scope first).

**Tech Stack:** Vanilla JS, HTML5 Canvas, WebSocket (existing connection)

**Spec:** `docs/superpowers/specs/2026-03-14-grid-calibration-design.md`

---

## Chunk 1: Foundation

### Task 1: Extract `linearFit()` to module scope

The `linearFit()` function is currently defined inside `showMarkResults()` (line ~1085). Grid calibration needs it too. Move it to module scope so both features can use it.

**Files:**
- Modify: `tools/sensor-diagnostic.html:1085-1099` (move function out of `showMarkResults`)

- [ ] **Step 1: Move `linearFit` out of `showMarkResults`**

Cut the `linearFit` function from inside `showMarkResults()` and place it at module scope, just before the `// Mark corners logic` section comment (around line 922). The function is self-contained with no closure dependencies:

```javascript
// ============================================================
// Shared utilities
// ============================================================
function linearFit(points, getX, getY) {
  const n = points.length;
  if (n === 0) return { c0: 1.0, c1: 0.0 };
  if (n === 1) return { c0: getY(points[0]), c1: 0.0 };
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (const p of points) {
    const x = getX(p), y = getY(p);
    sx += x; sy += y; sxx += x * x; sxy += x * y;
  }
  const det = n * sxx - sx * sx;
  if (Math.abs(det) < 1e-10) return { c0: sy / n, c1: 0.0 };
  const c0 = (sxx * sy - sx * sxy) / det;
  const c1 = (n * sxy - sx * sy) / det;
  return { c0, c1 };
}
```

Remove the original from inside `showMarkResults()`. The two call sites (`angleFit` and `rangeFit` around lines 1101-1102) remain unchanged — they just call the now-module-scoped function.

- [ ] **Step 2: Verify the page still works**

Refresh the diagnostic tool in the browser. Connect to HA. Switch to Mark corners tab. Verify no JS errors in console. If you have previously recorded corner data, verify the fit still computes correctly.

- [ ] **Step 3: Commit**

```bash
git add tools/sensor-diagnostic.html
git commit -m "refactor: extract linearFit to module scope for reuse"
```

### Task 2: Add grid tab HTML and CSS

Add the HTML structure and CSS for the new Grid calibration tab. No JS logic yet — just the skeleton.

**Files:**
- Modify: `tools/sensor-diagnostic.html`
  - CSS section (~line 93, after arc calibration styles)
  - Toolbar (~line 156, add tab button)
  - Main UI (~line 241, after arc-ui div, add grid-ui div)

- [ ] **Step 1: Add the tab button**

In the `#mode-tabs` div (line ~156), after the Arc calibration button, add:

```html
<button class="tab" data-mode="grid">Grid calibration</button>
```

- [ ] **Step 2: Add CSS for grid UI**

After the arc calibration CSS block (before `</style>`, around line 128), add:

```css
/* Grid calibration */
#grid-ui { display: none; }
#grid-panels { display: flex; gap: 16px; padding: 16px; justify-content: center; align-items: flex-start; }
#grid-controls { width: 360px; }
#grid-setup { margin-bottom: 12px; }
#grid-setup label { display: block; margin-bottom: 6px; font-size: 12px; color: #aaa; }
#grid-setup input[type="number"] {
  background: #0f3460; border: 1px solid #333; border-radius: 3px; color: #eee; padding: 3px 6px; width: 60px;
}
#btn-grid-generate {
  padding: 6px 14px; background: #4caf50; border: none; border-radius: 4px;
  color: #fff; font-size: 13px; cursor: pointer; margin-top: 4px;
}
#btn-grid-generate:hover { background: #43a047; }
#grid-status { font-size: 13px; margin: 8px 0; min-height: 20px; }
#btn-grid-record {
  padding: 8px 24px; border: none; border-radius: 4px;
  color: #fff; font-size: 14px; cursor: pointer;
}
#btn-grid-record.ready { background: #4caf50; }
#btn-grid-record.recording { background: #e94560; }
#btn-grid-record:hover { opacity: 0.9; }
#btn-grid-skip {
  padding: 8px 16px; background: #0f3460; border: 1px solid #333; border-radius: 4px;
  color: #eee; font-size: 13px; cursor: pointer; margin-left: 8px;
}
#grid-progress { margin-top: 8px; }
#grid-progress-bar {
  width: 100%; height: 6px; background: #0f3460; border-radius: 3px; overflow: hidden;
}
#grid-progress-fill {
  height: 100%; width: 0%; background: #4caf50; transition: width 0.1s;
}
#grid-progress-text { font-size: 11px; color: #aaa; margin-top: 2px; }
#grid-point-info { font-size: 13px; color: #4fc3f7; margin: 8px 0; font-family: monospace; min-height: 20px; }
#btn-grid-compute {
  margin-top: 12px; padding: 8px 18px; background: #4caf50; border: none; border-radius: 4px;
  color: #fff; font-size: 13px; cursor: pointer; display: none;
}
#btn-grid-compute:hover { background: #43a047; }
#grid-results { margin-top: 16px; display: none; }
#grid-results h3 { font-size: 14px; margin-bottom: 8px; }
#grid-error-table, #grid-corrected-table {
  width: 100%; font-size: 11px; border-collapse: collapse; font-family: monospace; margin-bottom: 12px;
}
#grid-error-table th, #grid-error-table td,
#grid-corrected-table th, #grid-corrected-table td {
  padding: 3px 5px; border: 1px solid #333; text-align: right;
}
#grid-error-table th, #grid-corrected-table th { background: #16213e; color: #aaa; }
#grid-fit-params { font-family: monospace; font-size: 12px; color: #4fc3f7; margin: 8px 0; }
```

- [ ] **Step 3: Add HTML structure**

After the `#arc-ui` closing div (around line 290), add the grid UI:

```html
<div id="grid-ui" style="display:none">
  <div id="grid-panels">
    <div style="display:flex;flex-direction:column;align-items:center">
      <div class="panel">
        <h2>Grid view (raw sensor)</h2>
        <canvas id="grid-canvas" width="500" height="500"></canvas>
      </div>
    </div>
    <div id="grid-controls">
      <div id="grid-setup">
        <label>X range (m)
          <input type="number" id="grid-x-min" value="-3" step="1" /> to
          <input type="number" id="grid-x-max" value="3" step="1" />
        </label>
        <label>Y range (m)
          <input type="number" id="grid-y-min" value="1" step="1" /> to
          <input type="number" id="grid-y-max" value="5" step="1" />
        </label>
        <label>Spacing (m)
          <input type="number" id="grid-spacing" value="1" step="0.5" min="0.5" />
        </label>
        <div style="margin-top:4px;margin-bottom:8px">
          <span style="font-size:12px;color:#aaa">Track target:</span>
          <select id="grid-target" style="background:#0f3460;border:1px solid #333;border-radius:3px;color:#eee;padding:3px 6px;font-size:12px">
            <option value="0">T1</option>
            <option value="1">T2</option>
            <option value="2">T3</option>
          </select>
        </div>
        <button id="btn-grid-generate">Generate grid</button>
      </div>
      <div id="grid-point-info"></div>
      <div id="grid-status">Configure grid and click Generate.</div>
      <div>
        <button id="btn-grid-record" class="ready" style="display:none">Record (5s)</button>
        <button id="btn-grid-skip" style="display:none">Skip</button>
      </div>
      <div id="grid-progress" style="display:none">
        <div id="grid-progress-bar"><div id="grid-progress-fill"></div></div>
        <div id="grid-progress-text"></div>
      </div>
      <button id="btn-grid-compute">Compute corrections</button>
      <div id="grid-results">
        <h3>Error table (raw)</h3>
        <table id="grid-error-table">
          <thead><tr><th>Known X</th><th>Known Y</th><th>Meas X</th><th>Meas Y</th><th>Range err</th><th>Angle err</th></tr></thead>
          <tbody></tbody>
        </table>
        <h3>Fitted correction</h3>
        <div id="grid-fit-params"></div>
        <h3>Corrected error</h3>
        <table id="grid-corrected-table">
          <thead><tr><th>Known X</th><th>Known Y</th><th>Corr X</th><th>Corr Y</th><th>Range err</th><th>Angle err</th></tr></thead>
          <tbody></tbody>
        </table>
        <button id="btn-grid-apply" style="margin-top:8px;padding:6px 14px;background:#4caf50;border:none;border-radius:4px;color:#fff;cursor:pointer;font-size:12px">Apply fitted correction to Explore</button>
        <button id="btn-grid-export" style="margin-left:8px;padding:6px 14px;background:#0f3460;border:1px solid #333;border-radius:4px;color:#eee;cursor:pointer;font-size:12px">Copy JSON to clipboard</button>
      </div>
    </div>
  </div>
</div>
```

- [ ] **Step 4: Update mode tab switching**

In the tab click handler (lines 910-920), add grid-ui visibility. Insert the new line after the `arc-ui` line (line 917), so the block becomes:

```javascript
    document.getElementById('panels').style.display = currentMode === 'explore' ? 'flex' : 'none';
    document.getElementById('mark-ui').style.display = currentMode === 'mark' ? 'block' : 'none';
    document.getElementById('arc-ui').style.display = currentMode === 'arc' ? 'block' : 'none';
    document.getElementById('grid-ui').style.display = currentMode === 'grid' ? 'block' : 'none';
```

- [ ] **Step 5: Verify**

Refresh the page. Verify the "Grid calibration" tab appears in the toolbar. Click it — should show the empty grid UI with controls. No JS errors. Other tabs still work.

- [ ] **Step 6: Commit**

```bash
git add tools/sensor-diagnostic.html
git commit -m "feat: add grid calibration tab HTML and CSS skeleton"
```

### Task 3: Grid generation and state

Add the grid point generation logic, serpentine ordering, and canvas drawing of the grid.

**Files:**
- Modify: `tools/sensor-diagnostic.html` (JS section, after arc calibration code at ~line 1612)

- [ ] **Step 1: Add grid state variables and generation function**

Before the closing `</script>` tag, add:

```javascript
// ============================================================
// Grid calibration
// ============================================================
let gridPoints = []; // {x, y, measured: null|{x,y}, status: 'pending'|'recording'|'recorded'}
let gridCurrentIndex = -1;
let gridSamples = [];
let gridRecordingStart = 0;
let gridRecordingTimer = null;
let gridConfig = null; // {xMin, xMax, yMin, yMax, spacing} in mm

const FOV_HALF_RAD = FOV_RAD / 2; // 60° in radians

function generateGrid() {
  // Cancel any active recording
  if (gridRecordingTimer) {
    clearTimeout(gridRecordingTimer);
    gridRecordingTimer = null;
  }
  gridSamples = [];

  const xMin = parseFloat(document.getElementById('grid-x-min').value) * 1000;
  const xMax = parseFloat(document.getElementById('grid-x-max').value) * 1000;
  const yMin = parseFloat(document.getElementById('grid-y-min').value) * 1000;
  const yMax = parseFloat(document.getElementById('grid-y-max').value) * 1000;
  const spacing = parseFloat(document.getElementById('grid-spacing').value) * 1000;

  gridConfig = { xMin, xMax, yMin, yMax, spacing };

  // Generate points, filtering by FOV
  const rawPoints = [];
  // Use spacing * 0.01 as epsilon to handle floating-point boundary issues
  for (let y = yMin; y <= yMax + spacing * 0.01; y += spacing) {
    for (let x = xMin; x <= xMax + spacing * 0.01; x += spacing) {
      const angle = Math.abs(Math.atan2(x, y));
      if (angle <= FOV_HALF_RAD) {
        rawPoints.push({ x, y });
      }
    }
  }

  // Sort into serpentine order
  // Group by y, then alternate x direction per row
  const rows = new Map();
  for (const p of rawPoints) {
    const key = p.y;
    if (!rows.has(key)) rows.set(key, []);
    rows.get(key).push(p);
  }
  const sortedYs = [...rows.keys()].sort((a, b) => a - b);

  gridPoints = [];
  sortedYs.forEach((y, rowIdx) => {
    const row = rows.get(y);
    row.sort((a, b) => a.x - b.x);
    if (rowIdx % 2 === 1) row.reverse();
    for (const p of row) {
      gridPoints.push({ x: p.x, y: p.y, measured: null, status: 'pending' });
    }
  });

  gridCurrentIndex = gridPoints.length > 0 ? 0 : -1;
  updateGridUI();
}

function updateGridUI() {
  const recordBtn = document.getElementById('btn-grid-record');
  const skipBtn = document.getElementById('btn-grid-skip');
  const computeBtn = document.getElementById('btn-grid-compute');
  const statusEl = document.getElementById('grid-status');
  const infoEl = document.getElementById('grid-point-info');

  if (gridPoints.length === 0) {
    statusEl.textContent = 'Configure grid and click Generate.';
    recordBtn.style.display = 'none';
    skipBtn.style.display = 'none';
    computeBtn.style.display = 'none';
    infoEl.textContent = '';
    return;
  }

  const recorded = gridPoints.filter(p => p.status === 'recorded').length;
  const total = gridPoints.length;
  statusEl.textContent = `${recorded}/${total} points recorded.`;

  recordBtn.style.display = '';
  skipBtn.style.display = '';

  // Show compute button if >= 3 recorded
  computeBtn.style.display = recorded >= 3 ? '' : 'none';

  // Show current point info
  if (gridCurrentIndex >= 0 && gridCurrentIndex < gridPoints.length) {
    const p = gridPoints[gridCurrentIndex];
    infoEl.textContent = `Point ${gridCurrentIndex + 1}/${total}: stand at (${(p.x / 1000).toFixed(1)}m, ${(p.y / 1000).toFixed(1)}m)`;
  } else {
    infoEl.textContent = 'All points visited.';
  }
}

document.getElementById('btn-grid-generate').addEventListener('click', generateGrid);
```

- [ ] **Step 2: Add canvas drawing**

Add the `drawGridCanvas` function:

```javascript
function drawGridCanvas() {
  const canvas = document.getElementById('grid-canvas');
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const { scale, ox, oy, toCanvas } = drawFovAndRings(ctx, w, h);

  // Draw grid points
  for (let i = 0; i < gridPoints.length; i++) {
    const p = gridPoints[i];
    const cp = toCanvas(p.x, p.y);

    if (p.status === 'recorded' && p.measured) {
      // Error vector: red line from measured to known
      const mp = toCanvas(p.measured.x, p.measured.y);
      ctx.beginPath();
      ctx.moveTo(mp.cx, mp.cy);
      ctx.lineTo(cp.cx, cp.cy);
      ctx.strokeStyle = '#e94560';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Measured position (small red dot)
      ctx.beginPath();
      ctx.arc(mp.cx, mp.cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#e94560';
      ctx.fill();
    }

    // Known position circle
    ctx.beginPath();
    ctx.arc(cp.cx, cp.cy, 6, 0, Math.PI * 2);
    if (i === gridCurrentIndex) {
      // Pulsing blue for current target
      const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 200);
      ctx.fillStyle = `rgba(79,195,247,${0.3 + 0.4 * pulse})`;
      ctx.strokeStyle = '#4fc3f7';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
      // Label
      ctx.fillStyle = '#4fc3f7';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`(${(p.x / 1000).toFixed(1)}, ${(p.y / 1000).toFixed(1)})`, cp.cx + 10, cp.cy + 4);
    } else if (p.status === 'recorded') {
      ctx.fillStyle = 'rgba(76,175,80,0.6)';
      ctx.fill();
      ctx.strokeStyle = '#4caf50';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(150,150,150,0.3)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(150,150,150,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Label pending points with coordinates
      ctx.fillStyle = 'rgba(150,150,150,0.6)';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${(p.x / 1000).toFixed(0)},${(p.y / 1000).toFixed(0)}`, cp.cx, cp.cy - 10);
    }
  }

  // Draw live target
  const tIdx = parseInt(document.getElementById('grid-target').value);
  const t = targets[tIdx];
  if (t.active) {
    const p = toCanvas(t.raw_x, t.raw_y);
    ctx.beginPath();
    ctx.arc(p.cx, p.cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = TARGET_COLORS[tIdx];
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    const dist = Math.sqrt(t.raw_x * t.raw_x + t.raw_y * t.raw_y);
    const angle = Math.atan2(t.raw_x, t.raw_y) * 180 / Math.PI;
    ctx.fillStyle = '#fff';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${(dist / 1000).toFixed(2)}m  ${angle.toFixed(1)}°`, p.cx + 10, p.cy + 4);
  }
}
```

- [ ] **Step 3: Add render loop branch**

In `renderLoop()` (around line 856), add the grid branch:

```javascript
} else if (currentMode === 'grid') {
  gridRecordFrame();
  drawGridCanvas();
}
```

Also add a stub `gridRecordFrame`:

```javascript
function gridRecordFrame() {
  // Will be implemented in Task 4
}
```

- [ ] **Step 4: Add canvas click handler for point selection**

```javascript
document.getElementById('grid-canvas').addEventListener('click', (e) => {
  if (gridPoints.length === 0) return;
  const canvas = e.target;
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  const xRange = MAX_RANGE * 2;
  const scale = Math.min(canvas.width / xRange, canvas.height / MAX_RANGE);
  const ox = canvas.width / 2;
  const oy = 10;

  for (let i = 0; i < gridPoints.length; i++) {
    const p = gridPoints[i];
    const cx = ox + p.x * scale;
    const cy = oy + p.y * scale;
    const dx = clickX - cx;
    const dy = clickY - cy;
    if (dx * dx + dy * dy <= 15 * 15) {
      gridCurrentIndex = i;
      updateGridUI();
      return;
    }
  }
});
```

- [ ] **Step 5: Verify**

Refresh the page. Go to Grid calibration tab. Set X range -2 to 2, Y range 1 to 4, spacing 1. Click Generate. Verify:
- Grid points appear as grey circles on the canvas within the FOV
- First point pulses blue
- Point count is shown in status
- Clicking on grid points on the canvas changes the current selection
- Points outside 60° are excluded

- [ ] **Step 6: Commit**

```bash
git add tools/sensor-diagnostic.html
git commit -m "feat: add grid generation, canvas drawing, and point selection"
```

### Task 4: Recording workflow

Implement the 5-second recording, progress bar, skip, and auto-advance.

**Files:**
- Modify: `tools/sensor-diagnostic.html` (replace `gridRecordFrame` stub, add recording handlers)

- [ ] **Step 1: Implement `gridRecordFrame`**

Replace the stub:

```javascript
function gridRecordFrame() {
  if (!gridRecordingTimer) return; // not recording
  const idx = gridCurrentIndex;
  if (idx < 0 || idx >= gridPoints.length) return;

  const tIdx = parseInt(document.getElementById('grid-target').value);
  const t = targets[tIdx];
  if (!t.active) return;

  // Skip consecutive duplicates
  const last = gridSamples[gridSamples.length - 1];
  if (last && last.x === t.raw_x && last.y === t.raw_y) return;

  gridSamples.push({ x: t.raw_x, y: t.raw_y });

  // Update progress bar
  const elapsed = Date.now() - gridRecordingStart;
  const pct = Math.min(100, (elapsed / 5000) * 100);
  document.getElementById('grid-progress-fill').style.width = `${pct}%`;
  document.getElementById('grid-progress-text').textContent =
    `${(elapsed / 1000).toFixed(1)}s — ${gridSamples.length} samples`;
}
```

- [ ] **Step 2: Add record and skip button handlers**

```javascript
document.getElementById('btn-grid-record').addEventListener('click', () => {
  if (gridRecordingTimer) return; // already recording
  if (gridCurrentIndex < 0 || gridCurrentIndex >= gridPoints.length) return;

  gridSamples = [];
  gridRecordingStart = Date.now();
  gridPoints[gridCurrentIndex].status = 'recording';

  document.getElementById('btn-grid-record').className = 'recording';
  document.getElementById('btn-grid-record').textContent = 'Recording...';
  document.getElementById('grid-progress').style.display = '';
  document.getElementById('grid-progress-fill').style.width = '0%';

  gridRecordingTimer = setTimeout(() => {
    gridRecordingTimer = null;

    document.getElementById('btn-grid-record').className = 'ready';
    document.getElementById('btn-grid-record').textContent = 'Record (5s)';
    document.getElementById('grid-progress').style.display = 'none';

    if (gridSamples.length < 5) {
      gridPoints[gridCurrentIndex].status = 'pending';
      document.getElementById('grid-status').textContent =
        'Not enough readings — ensure you are detected by the sensor.';
      return;
    }

    // Average
    let sumX = 0, sumY = 0;
    for (const s of gridSamples) { sumX += s.x; sumY += s.y; }
    gridPoints[gridCurrentIndex].measured = {
      x: Math.round(sumX / gridSamples.length),
      y: Math.round(sumY / gridSamples.length),
    };
    gridPoints[gridCurrentIndex].status = 'recorded';

    // Advance to next unrecorded
    advanceGridPoint();
    updateGridUI();
  }, 5000);
});

document.getElementById('btn-grid-skip').addEventListener('click', () => {
  if (gridRecordingTimer) return; // don't skip while recording
  advanceGridPoint();
  updateGridUI();
});

function advanceGridPoint() {
  // Find next unrecorded point after current index, wrapping
  const n = gridPoints.length;
  for (let offset = 1; offset <= n; offset++) {
    const idx = (gridCurrentIndex + offset) % n;
    if (gridPoints[idx].status === 'pending') {
      gridCurrentIndex = idx;
      return;
    }
  }
  // All recorded or no pending — stay at current
  gridCurrentIndex = -1;
}
```

- [ ] **Step 3: Verify**

Refresh the page. Generate a grid. Click Record — verify:
- Button changes to "Recording..."
- Progress bar fills over 5 seconds
- Sample count increases
- After 5 seconds, point turns green and advances to next
- Skip button advances without recording
- If you stand outside sensor range and record, you get the "Not enough readings" message

- [ ] **Step 4: Commit**

```bash
git add tools/sensor-diagnostic.html
git commit -m "feat: add grid recording workflow with 5s averaging"
```

### Task 5: Analysis — error table, fitting, corrected table

Implement the Compute button logic: error table, linear fit, corrected error table, Apply, and Export.

**Files:**
- Modify: `tools/sensor-diagnostic.html` (add compute handler after recording code)

- [ ] **Step 1: Add the compute function**

```javascript
document.getElementById('btn-grid-compute').addEventListener('click', computeGridCorrections);

function computeGridCorrections() {
  const recorded = gridPoints.filter(p => p.status === 'recorded');
  if (recorded.length < 3) return;

  // Build data for each recorded point
  const data = recorded.map(p => {
    const kAngle = Math.atan2(p.x, p.y);
    const kRange = Math.sqrt(p.x * p.x + p.y * p.y);
    const mAngle = Math.atan2(p.measured.x, p.measured.y);
    const mRange = Math.sqrt(p.measured.x * p.measured.x + p.measured.y * p.measured.y);
    return {
      kx: p.x, ky: p.y,
      mx: p.measured.x, my: p.measured.y,
      kAngle, kRange, mAngle, mRange,
      rangeErr: mRange - kRange,
      angleErr: (mAngle - kAngle) * 180 / Math.PI,
    };
  });

  // Error table
  const tbody = document.querySelector('#grid-error-table tbody');
  tbody.innerHTML = '';
  for (const d of data) {
    const row = document.createElement('tr');
    row.innerHTML =
      `<td>${d.kx}</td><td>${d.ky}</td>` +
      `<td>${d.mx}</td><td>${d.my}</td>` +
      `<td style="color:${Math.abs(d.rangeErr) > 200 ? '#ff9800' : '#4caf50'}">${d.rangeErr.toFixed(0)}</td>` +
      `<td style="color:${Math.abs(d.angleErr) > 3 ? '#ff9800' : '#4caf50'}">${d.angleErr.toFixed(1)}°</td>`;
    tbody.appendChild(row);
  }

  // Build fitting data
  const angleFitData = [];
  const rangeFitData = [];
  for (const d of data) {
    const absTheta = Math.abs(d.mAngle);
    const rangeRatio = d.kRange / d.mRange;
    rangeFitData.push({ absTheta, ratio: rangeRatio });

    if (absTheta > 0.01) {
      const angleRatio = d.kAngle / d.mAngle;
      angleFitData.push({ absTheta, ratio: angleRatio });
    }
  }

  const angleFit = linearFit(angleFitData, p => p.absTheta, p => p.ratio);
  const rangeFit = linearFit(rangeFitData, p => p.absTheta, p => p.ratio);

  // These are shared module-level globals (declared at line ~991), also used by Mark corners.
  // Grid calibration intentionally overwrites any previous Mark corners fit.
  fittedAngleCoeffs = { a0: angleFit.c0, a1: angleFit.c1 };
  fittedRangeCoeffs = { r0: rangeFit.c0, r1: rangeFit.c1 };

  // Show fit params
  document.getElementById('grid-fit-params').innerHTML =
    `angle_scale(|θ|) = ${angleFit.c0.toFixed(4)} + ${angleFit.c1.toFixed(4)} × |θ|<br>` +
    `range_scale(|θ|) = ${rangeFit.c0.toFixed(4)} + ${rangeFit.c1.toFixed(4)} × |θ|`;

  // Corrected error table
  const ctbody = document.querySelector('#grid-corrected-table tbody');
  ctbody.innerHTML = '';
  for (const d of data) {
    const absTheta = Math.abs(d.mAngle);
    const aScale = angleFit.c0 + angleFit.c1 * absTheta;
    const rScale = rangeFit.c0 + rangeFit.c1 * absTheta;
    const corrAngle = d.mAngle * aScale;
    const corrRange = d.mRange * rScale;
    const corrX = Math.round(corrRange * Math.sin(corrAngle));
    const corrY = Math.round(corrRange * Math.cos(corrAngle));
    const corrRangeErr = corrRange - d.kRange;
    const corrAngleErr = (corrAngle - d.kAngle) * 180 / Math.PI;
    const row = document.createElement('tr');
    row.innerHTML =
      `<td>${d.kx}</td><td>${d.ky}</td>` +
      `<td>${corrX}</td><td>${corrY}</td>` +
      `<td style="color:${Math.abs(corrRangeErr) > 200 ? '#ff9800' : '#4caf50'}">${corrRangeErr.toFixed(0)}</td>` +
      `<td style="color:${Math.abs(corrAngleErr) > 3 ? '#ff9800' : '#4caf50'}">${corrAngleErr.toFixed(1)}°</td>`;
    ctbody.appendChild(row);
  }

  document.getElementById('grid-results').style.display = '';
}
```

- [ ] **Step 2: Add Apply to Explore handler**

```javascript
document.getElementById('btn-grid-apply').addEventListener('click', () => {
  if (!fittedAngleCoeffs || !fittedRangeCoeffs) return;
  // Compute median |theta| from recorded points
  const thetas = gridPoints
    .filter(p => p.status === 'recorded')
    .map(p => Math.abs(Math.atan2(p.measured.x, p.measured.y)))
    .sort((a, b) => a - b);
  const medianTheta = thetas.length > 0
    ? thetas[Math.floor(thetas.length / 2)]
    : Math.PI / 6;
  const aScale = fittedAngleCoeffs.a0 + fittedAngleCoeffs.a1 * medianTheta;
  const rScale = fittedRangeCoeffs.r0 + fittedRangeCoeffs.r1 * medianTheta;
  document.getElementById('ctl-scale').value = aScale.toFixed(2);
  document.getElementById('ctl-scale-val').textContent = aScale.toFixed(2);
  document.getElementById('ctl-range').value = rScale.toFixed(2);
  document.getElementById('ctl-range-val').textContent = rScale.toFixed(2);
  clearAllTrails();
});
```

- [ ] **Step 3: Add Export JSON handler**

```javascript
document.getElementById('btn-grid-export').addEventListener('click', () => {
  if (!gridConfig) return;
  const recorded = gridPoints.filter(p => p.status === 'recorded');
  const result = {
    config: {
      xMin: gridConfig.xMin / 1000, xMax: gridConfig.xMax / 1000,
      yMin: gridConfig.yMin / 1000, yMax: gridConfig.yMax / 1000,
      spacing: gridConfig.spacing / 1000,
    },
    points: recorded.map(p => ({
      known: { x: p.x, y: p.y },
      measured: p.measured,
      rangeErr: Math.sqrt(p.measured.x ** 2 + p.measured.y ** 2) - Math.sqrt(p.x ** 2 + p.y ** 2),
      angleErr: (Math.atan2(p.measured.x, p.measured.y) - Math.atan2(p.x, p.y)) * 180 / Math.PI,
    })),
    fit: fittedAngleCoeffs && fittedRangeCoeffs ? {
      angle: { a0: fittedAngleCoeffs.a0, a1: fittedAngleCoeffs.a1 },
      range: { r0: fittedRangeCoeffs.r0, r1: fittedRangeCoeffs.r1 },
    } : null,
  };
  navigator.clipboard.writeText(JSON.stringify(result, null, 2)).then(() => {
    const btn = document.getElementById('btn-grid-export');
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = 'Copy JSON to clipboard'; }, 2000);
  });
});
```

- [ ] **Step 4: Verify**

Refresh and test the full workflow:
1. Generate grid
2. Record at least 3 points (stand in different spots)
3. Click Compute — verify error table shows known vs measured positions, fit params display, and corrected table shows reduced errors
4. Click Apply to Explore — verify slider values change on the Explore tab
5. Click Export — verify JSON is copied to clipboard with correct structure

- [ ] **Step 5: Commit**

```bash
git add tools/sensor-diagnostic.html
git commit -m "feat: add grid calibration analysis, fitting, and export"
```

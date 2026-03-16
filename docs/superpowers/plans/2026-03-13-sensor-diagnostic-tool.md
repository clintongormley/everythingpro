# Sensor diagnostic tool implementation plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone HTML diagnostic tool that visualizes raw LD2450 sensor coordinates alongside room-transformed coordinates, with a corner-marking mode to quantify distortion.

**Architecture:** Single HTML file with inline CSS/JS. Connects to HA's WebSocket API to subscribe to live target data. Two modes: explore (two-panel live view with trails) and mark corners (guided 4-point capture with distortion visualization). No dependencies, no build step.

**Tech Stack:** Vanilla HTML/CSS/JS, Canvas 2D API, HA WebSocket API

**Spec:** `docs/superpowers/specs/2026-03-13-sensor-diagnostic-tool-design.md`

---

## Chunk 1: Connection and explore mode

### Task 1: Create the HTML file with connection form

**Files:**
- Create: `tools/sensor-diagnostic.html`

- [ ] **Step 1: Create the `tools/` directory and HTML file skeleton**

Create `tools/sensor-diagnostic.html` with:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EP Pro sensor diagnostic</title>
  <style>
    /* All CSS goes here — see step 3 */
  </style>
</head>
<body>
  <!-- Connection form — see step 2 -->
  <!-- Main UI — see task 2+ -->
  <script>
    // All JS goes here — see step 4+
  </script>
</body>
</html>
```

- [ ] **Step 2: Add the connection form HTML**

Inside `<body>`, before `<script>`:

```html
<div id="connect-form">
  <h1>EP Pro sensor diagnostic</h1>
  <label>HA URL
    <input id="ha-url" type="text" value="http://homeassistant.local:8123" />
  </label>
  <label>Access token
    <input id="ha-token" type="password" placeholder="Long-lived access token" />
  </label>
  <label>Config entry ID
    <input id="entry-id" type="text" placeholder="Paste from HA integration URL" />
  </label>
  <button id="connect-btn">Connect</button>
  <div id="connect-status"></div>
</div>

<div id="main-ui" style="display:none">
  <!-- Filled in by later tasks -->
</div>
```

- [ ] **Step 3: Add base CSS**

Inside `<style>`:

```css
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #1a1a2e; color: #eee; }

#connect-form {
  max-width: 400px; margin: 80px auto; padding: 24px;
  background: #16213e; border-radius: 8px;
}
#connect-form h1 { font-size: 18px; margin-bottom: 16px; }
#connect-form label { display: block; margin-bottom: 12px; font-size: 13px; color: #aaa; }
#connect-form input {
  display: block; width: 100%; margin-top: 4px; padding: 8px;
  background: #0f3460; border: 1px solid #333; border-radius: 4px; color: #eee; font-size: 14px;
}
#connect-form button {
  width: 100%; padding: 10px; margin-top: 8px;
  background: #e94560; border: none; border-radius: 4px; color: #fff;
  font-size: 14px; cursor: pointer;
}
#connect-form button:hover { background: #c73e54; }
#connect-status { margin-top: 8px; font-size: 12px; color: #aaa; }
.status-ok { color: #4caf50 !important; }
.status-err { color: #e94560 !important; }
```

- [ ] **Step 4: Add WebSocket connection logic**

Inside `<script>`:

```javascript
// -- State --
let ws = null;
let msgId = 0;
let targets = [
  { x: 0, y: 0, active: false },
  { x: 0, y: 0, active: false },
  { x: 0, y: 0, active: false },
];
let config = { placement: '', mirrored: false, room_bounds: {}, room_name: '' };

// -- Forward declarations (defined in Task 3, called here on config load) --
function applyConfigToUI() {} // stub — replaced in Task 3
function startRenderLoop() {} // stub — replaced in Task 3

// -- Connection --
function nextId() { return ++msgId; }

function setStatus(msg, ok) {
  const el = document.getElementById('connect-status');
  el.textContent = msg;
  el.className = ok ? 'status-ok' : (ok === false ? 'status-err' : '');
}

function connect() {
  const haUrl = document.getElementById('ha-url').value.trim();
  const token = document.getElementById('ha-token').value.trim();
  const entryId = document.getElementById('entry-id').value.trim();

  if (!haUrl || !token || !entryId) {
    setStatus('All fields required', false);
    return;
  }

  const wsUrl = haUrl.replace(/^http/, 'ws') + '/api/websocket';
  setStatus('Connecting...');

  ws = new WebSocket(wsUrl);

  ws.onopen = () => setStatus('Connected, authenticating...');

  ws.onmessage = (evt) => {
    const msg = JSON.parse(evt.data);

    if (msg.type === 'auth_required') {
      ws.send(JSON.stringify({ type: 'auth', access_token: token }));
    } else if (msg.type === 'auth_ok') {
      setStatus('Authenticated, subscribing...', true);
      // Show main UI only after successful auth
      document.getElementById('connect-form').style.display = 'none';
      document.getElementById('main-ui').style.display = '';
      startRenderLoop();
      // Get config
      const cfgId = nextId();
      ws.send(JSON.stringify({
        id: cfgId, type: 'everything_presence_pro/get_config', entry_id: entryId
      }));
      // Subscribe to targets
      const subId = nextId();
      ws.send(JSON.stringify({
        id: subId, type: 'everything_presence_pro/subscribe_targets', entry_id: entryId
      }));
    } else if (msg.type === 'auth_invalid') {
      setStatus('Auth failed: ' + (msg.message || 'invalid token'), false);
    } else if (msg.type === 'result' && msg.success && msg.result) {
      // Config response — has placement, room_bounds, etc.
      if (msg.result.placement !== undefined) {
        config = {
          placement: msg.result.placement || '',
          mirrored: msg.result.mirrored || false,
          room_bounds: msg.result.room_bounds || {},
          room_name: msg.result.room_name || '',
        };
        applyConfigToUI();
      }
    } else if (msg.type === 'event' && msg.event && msg.event.targets) {
      // Target update
      msg.event.targets.forEach((t, i) => {
        if (i < 3) {
          targets[i] = { x: t.x, y: t.y, active: !!t.active };
        }
      });
    }
  };

  ws.onerror = () => setStatus('WebSocket error', false);
  ws.onclose = () => setStatus('Disconnected', false);
}

document.getElementById('connect-btn').addEventListener('click', connect);
```

- [ ] **Step 5: Open in browser and verify connection form renders**

Open `tools/sensor-diagnostic.html` directly in a browser. Verify:
- Dark themed form appears with 3 inputs and a Connect button
- No console errors

- [ ] **Step 6: Commit**

```bash
git add tools/sensor-diagnostic.html
git commit -m "feat: sensor diagnostic tool — connection form and WebSocket logic"
```

### Task 2: Explore mode — raw sensor panel (left)

**Files:**
- Modify: `tools/sensor-diagnostic.html`

- [ ] **Step 1: Add the main UI HTML structure**

Replace the `<!-- Filled in by later tasks -->` comment inside `#main-ui`:

```html
<div id="toolbar">
  <div id="mode-tabs">
    <button class="tab active" data-mode="explore">Explore</button>
    <button class="tab" data-mode="mark">Mark corners</button>
  </div>
  <div id="controls">
    <label>Placement
      <select id="ctl-placement">
        <option value="left_corner">Left corner</option>
        <option value="wall">Wall (center)</option>
        <option value="right_corner">Right corner</option>
      </select>
    </label>
    <label><input type="checkbox" id="ctl-mirror" /> Mirrored</label>
    <label>Width (m) <input type="number" id="ctl-width" step="0.1" value="6" style="width:60px" /></label>
    <label>Depth (m) <input type="number" id="ctl-depth" step="0.1" value="6" style="width:60px" /></label>
    <button id="btn-use-saved">Use saved</button>
    <button id="btn-clear-trails">Clear trails</button>
  </div>
</div>

<div id="panels">
  <div class="panel">
    <h2>Raw sensor view</h2>
    <canvas id="raw-canvas" width="500" height="500"></canvas>
    <div id="raw-readout" class="readout"></div>
  </div>
  <div class="panel">
    <h2>Room view</h2>
    <canvas id="room-canvas" width="500" height="500"></canvas>
    <div id="room-readout" class="readout"></div>
  </div>
</div>

<div id="mark-ui" style="display:none">
  <!-- Filled in by task 4 -->
</div>
```

- [ ] **Step 2: Add layout CSS**

Append to `<style>`:

```css
#toolbar {
  display: flex; align-items: center; gap: 16px; padding: 8px 16px;
  background: #16213e; border-bottom: 1px solid #333;
}
.tab {
  padding: 6px 14px; background: none; border: 1px solid #444; border-radius: 4px;
  color: #aaa; cursor: pointer; font-size: 13px;
}
.tab.active { background: #e94560; color: #fff; border-color: #e94560; }
#controls { display: flex; align-items: center; gap: 12px; font-size: 12px; color: #aaa; }
#controls label { display: flex; align-items: center; gap: 4px; }
#controls select, #controls input[type="number"] {
  background: #0f3460; border: 1px solid #333; border-radius: 3px; color: #eee; padding: 3px 6px;
}
#controls button {
  padding: 4px 10px; background: #0f3460; border: 1px solid #333; border-radius: 3px;
  color: #eee; cursor: pointer; font-size: 12px;
}

#panels { display: flex; gap: 16px; padding: 16px; justify-content: center; }
.panel { text-align: center; }
.panel h2 { font-size: 14px; margin-bottom: 8px; color: #aaa; }
.panel canvas { background: #0a0a1a; border: 1px solid #333; border-radius: 4px; }
.readout { font-size: 12px; color: #888; margin-top: 6px; font-family: monospace; min-height: 48px; }
```

- [ ] **Step 3: Add trail state and raw canvas rendering**

Append to `<script>`:

```javascript
// -- Trails --
const TRAIL_LEN = 100;
let trails = [[], [], []]; // one array per target

function pushTrail(idx, x, y) {
  trails[idx].push({ x, y });
  if (trails[idx].length > TRAIL_LEN) trails[idx].shift();
}

function clearTrails() { trails = [[], [], []]; }

// -- Constants --
const SIN45 = Math.sin(Math.PI / 4); // 0.7071
const MAX_RANGE = 6000; // mm
const FOV_DEG = 120;
const FOV_RAD = FOV_DEG * Math.PI / 180;
const TARGET_COLORS = ['rgba(79,195,247,1)', 'rgba(129,199,132,1)', 'rgba(255,183,77,1)'];

// -- Raw canvas rendering --
function drawRawCanvas() {
  const canvas = document.getElementById('raw-canvas');
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Coordinate mapping: sensor origin at top-center
  // X: left(-6000) to right(+6000) mapped to 0..w
  // Y: 0(sensor) to 6000(far) mapped to 0..h
  const xRange = MAX_RANGE * 2; // -6000 to +6000
  const scale = Math.min(w / xRange, h / MAX_RANGE);
  const ox = w / 2; // origin x (center)
  const oy = 10;    // origin y (top, small margin)

  function toCanvas(sx, sy) {
    return { cx: ox + sx * scale, cy: oy + sy * scale };
  }

  // Draw FOV wedge (triangle: origin → far-left → far-right)
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  const halfFov = FOV_RAD / 2;
  const farLeft = toCanvas(-MAX_RANGE * Math.sin(halfFov), MAX_RANGE * Math.cos(halfFov));
  const farRight = toCanvas(MAX_RANGE * Math.sin(halfFov), MAX_RANGE * Math.cos(halfFov));
  ctx.lineTo(farLeft.cx, farLeft.cy);
  ctx.lineTo(farRight.cx, farRight.cy);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.stroke();

  // Draw range rings at 1m intervals
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  for (let r = 1000; r <= MAX_RANGE; r += 1000) {
    ctx.beginPath();
    ctx.arc(ox, oy, r * scale, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Draw trails
  for (let i = 0; i < 3; i++) {
    const trail = trails[i];
    for (let j = 0; j < trail.length; j++) {
      const age = 1 - j / trail.length; // 0 = oldest, 1 = newest
      const p = toCanvas(trail[j].x, trail[j].y);
      ctx.beginPath();
      ctx.arc(p.cx, p.cy, 2 + age * 2, 0, Math.PI * 2);
      const parts = TARGET_COLORS[i].match(/[\d.]+/g);
      ctx.fillStyle = `rgba(${parts[0]},${parts[1]},${parts[2]},${age * 0.5})`;
      ctx.fill();
    }
  }

  // Draw active targets
  let readout = '';
  for (let i = 0; i < 3; i++) {
    const t = targets[i];
    if (!t.active) continue;
    pushTrail(i, t.x, t.y);
    const p = toCanvas(t.x, t.y);
    ctx.beginPath();
    ctx.arc(p.cx, p.cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = TARGET_COLORS[i];
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Label
    ctx.fillStyle = '#fff';
    ctx.font = '11px sans-serif';
    ctx.fillText(`T${i + 1}`, p.cx + 9, p.cy + 4);
    readout += `T${i + 1}: x=${t.x.toFixed(0)}mm  y=${t.y.toFixed(0)}mm    `;
  }
  document.getElementById('raw-readout').textContent = readout || 'No active targets';
}
```

- [ ] **Step 4: Verify raw canvas renders the FOV wedge**

Open in browser, connect to HA. Verify:
- FOV wedge appears on left canvas
- Range rings visible
- If a person is in the room, a colored dot appears and leaves a trail

- [ ] **Step 5: Commit**

```bash
git add tools/sensor-diagnostic.html
git commit -m "feat: diagnostic tool — explore mode raw sensor panel with trails"
```

### Task 3: Explore mode — room view panel (right) and controls

**Files:**
- Modify: `tools/sensor-diagnostic.html`

- [ ] **Step 1: Add the sensorToRoom transform function**

Append to `<script>`:

```javascript
// -- Sensor-to-room transform --
function sensorToRoom(tx, ty, placement, bounds) {
  const leftX = bounds.left_x || 0;
  const rightX = bounds.right_x || 6000;
  const wallWidth = rightX - leftX;

  if (placement === 'wall') {
    const sensorX = (leftX + rightX) / 2;
    return { rx: sensorX + tx, ry: ty };
  } else if (placement === 'left_corner') {
    return {
      rx: ty * SIN45 + tx * SIN45,
      ry: ty * SIN45 - tx * SIN45,
    };
  } else if (placement === 'right_corner') {
    return {
      rx: wallWidth - ty * SIN45 + tx * SIN45,
      ry: ty * SIN45 + tx * SIN45,
    };
  }
  // Fallback: no transform
  return { rx: tx, ry: ty };
}

function getUIPlacement() {
  return document.getElementById('ctl-placement').value;
}
function getUIMirrored() {
  return document.getElementById('ctl-mirror').checked;
}
function getUIBounds() {
  const w = parseFloat(document.getElementById('ctl-width').value) * 1000; // m to mm
  const d = parseFloat(document.getElementById('ctl-depth').value) * 1000;
  return { left_x: 0, right_x: w, far_y: d };
}
```

- [ ] **Step 2: Add room canvas rendering**

Append to `<script>`:

```javascript
// -- Room trails (separate from raw trails) --
let roomTrails = [[], [], []];

function pushRoomTrail(idx, rx, ry) {
  roomTrails[idx].push({ x: rx, y: ry });
  if (roomTrails[idx].length > TRAIL_LEN) roomTrails[idx].shift();
}

function drawRoomCanvas() {
  const canvas = document.getElementById('room-canvas');
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const placement = getUIPlacement();
  const mirrored = getUIMirrored();
  const bounds = getUIBounds();
  const roomW = bounds.right_x - bounds.left_x;
  const roomD = bounds.far_y || 6000;

  // Scale room to canvas with padding
  const pad = 30;
  const scaleX = (w - pad * 2) / roomW;
  const scaleY = (h - pad * 2) / roomD;
  const scale = Math.min(scaleX, scaleY);
  const offX = (w - roomW * scale) / 2;
  const offY = pad;

  function toCanvas(rx, ry) {
    return { cx: offX + rx * scale, cy: offY + ry * scale };
  }

  // Draw room rectangle
  const tl = toCanvas(0, 0);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 2;
  ctx.strokeRect(tl.cx, tl.cy, roomW * scale, roomD * scale);

  // Label walls
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${(roomW / 1000).toFixed(1)}m`, tl.cx + roomW * scale / 2, tl.cy - 6);
  ctx.save();
  ctx.translate(tl.cx - 10, tl.cy + roomD * scale / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(`${(roomD / 1000).toFixed(1)}m`, 0, 0);
  ctx.restore();
  ctx.textAlign = 'left';

  // Draw sensor position indicator
  let sensorPos;
  if (placement === 'left_corner') sensorPos = toCanvas(0, 0);
  else if (placement === 'right_corner') sensorPos = toCanvas(roomW, 0);
  else sensorPos = toCanvas(roomW / 2, 0);
  ctx.beginPath();
  ctx.arc(sensorPos.cx, sensorPos.cy, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#e94560';
  ctx.fill();

  // Draw trails
  for (let i = 0; i < 3; i++) {
    const trail = roomTrails[i];
    for (let j = 0; j < trail.length; j++) {
      const age = 1 - j / trail.length;
      const p = toCanvas(trail[j].x, trail[j].y);
      ctx.beginPath();
      ctx.arc(p.cx, p.cy, 2 + age * 2, 0, Math.PI * 2);
      const parts = TARGET_COLORS[i].match(/[\d.]+/g);
      ctx.fillStyle = `rgba(${parts[0]},${parts[1]},${parts[2]},${age * 0.5})`;
      ctx.fill();
    }
  }

  // Draw active targets
  let readout = '';
  for (let i = 0; i < 3; i++) {
    const t = targets[i];
    if (!t.active) continue;
    let tx = mirrored ? -t.x : t.x;
    let ty = t.y;
    const { rx, ry } = sensorToRoom(tx, ty, placement, bounds);
    pushRoomTrail(i, rx, ry);
    const p = toCanvas(rx, ry);
    ctx.beginPath();
    ctx.arc(p.cx, p.cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = TARGET_COLORS[i];
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = '11px sans-serif';
    ctx.fillText(`T${i + 1}`, p.cx + 9, p.cy + 4);
    readout += `T${i + 1}: rx=${rx.toFixed(0)}mm  ry=${ry.toFixed(0)}mm    `;
  }
  document.getElementById('room-readout').textContent = readout || 'No active targets';
}
```

- [ ] **Step 3: Add render loop and control wiring**

Append to `<script>`:

```javascript
// -- Render loop --
let animFrame = null;
function renderLoop() {
  drawRawCanvas();
  drawRoomCanvas();
  animFrame = requestAnimationFrame(renderLoop);
}
// Replace the stub from Task 1
startRenderLoop = function() {
  if (!animFrame) renderLoop();
};

// Replace the stub from Task 1
applyConfigToUI = function() {
  if (config.placement) document.getElementById('ctl-placement').value = config.placement;
  document.getElementById('ctl-mirror').checked = config.mirrored;
  if (config.room_bounds.right_x) {
    document.getElementById('ctl-width').value = ((config.room_bounds.right_x - (config.room_bounds.left_x || 0)) / 1000).toFixed(1);
  }
  if (config.room_bounds.far_y) {
    document.getElementById('ctl-depth').value = (config.room_bounds.far_y / 1000).toFixed(1);
  }
}

document.getElementById('btn-clear-trails').addEventListener('click', () => {
  clearTrails();
  roomTrails = [[], [], []];
});

document.getElementById('btn-use-saved').addEventListener('click', applyConfigToUI);

// Mode tabs
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const mode = tab.dataset.mode;
    document.getElementById('panels').style.display = mode === 'explore' ? 'flex' : 'none';
    document.getElementById('mark-ui').style.display = mode === 'mark' ? '' : 'none';
  });
});
```

- [ ] **Step 4: Test the explore mode end-to-end**

Open in browser, connect to HA with a valid token and entry ID. Verify:
- Both canvases render
- Raw panel shows FOV wedge + live dots
- Room panel shows room rectangle + transformed dots
- Changing placement dropdown changes right panel behavior
- Mirror toggle works
- Clear trails button works
- Trails accumulate as targets move

- [ ] **Step 5: Commit**

```bash
git add tools/sensor-diagnostic.html
git commit -m "feat: diagnostic tool — room view panel with transform and controls"
```

## Chunk 2: Mark corners mode

### Task 4: Mark corners UI and logic

**Files:**
- Modify: `tools/sensor-diagnostic.html`

- [ ] **Step 1: Add mark corners HTML**

Replace the `<!-- Filled in by task 4 -->` comment inside `#mark-ui`:

```html
<div id="mark-panels">
  <div class="panel">
    <h2>Raw sensor view</h2>
    <canvas id="mark-canvas" width="500" height="500"></canvas>
  </div>
  <div id="mark-controls">
    <div id="mark-target-selector">
      <span>I am target:</span>
      <button class="target-btn active" data-target="0">T1</button>
      <button class="target-btn" data-target="1">T2</button>
      <button class="target-btn" data-target="2">T3</button>
    </div>
    <div id="mark-steps">
      <div id="mark-instruction">Stand in corner 1 (near-left). Click Mark when steady.</div>
      <button id="btn-mark">Mark</button>
      <div id="mark-progress"></div>
    </div>
    <div id="mark-dimensions">
      <label>Room width (m) <input type="number" id="mark-width" step="0.1" value="4" style="width:60px" /></label>
      <label>Room depth (m) <input type="number" id="mark-depth" step="0.1" value="5" style="width:60px" /></label>
    </div>
    <div id="mark-redo" style="display:none">
      <span style="font-size:12px;color:#aaa">Redo:</span>
      <button class="redo-btn" data-corner="0">Near-left</button>
      <button class="redo-btn" data-corner="1">Near-right</button>
      <button class="redo-btn" data-corner="2">Far-right</button>
      <button class="redo-btn" data-corner="3">Far-left</button>
    </div>
    <div id="mark-results" style="display:none">
      <h3>Distortion summary</h3>
      <table id="mark-table">
        <thead><tr><th>Corner</th><th>Sensor X</th><th>Sensor Y</th><th>Ideal X</th><th>Ideal Y</th><th>Error</th></tr></thead>
        <tbody></tbody>
      </table>
      <button id="btn-mark-reset">Reset all</button>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Add mark corners CSS**

Append to `<style>`:

```css
#mark-panels { display: flex; gap: 16px; padding: 16px; justify-content: center; align-items: flex-start; }
#mark-controls { width: 320px; }
#mark-target-selector { margin-bottom: 12px; }
#mark-target-selector span { font-size: 13px; color: #aaa; margin-right: 8px; }
.target-btn {
  padding: 4px 12px; background: #0f3460; border: 1px solid #333; border-radius: 3px;
  color: #aaa; cursor: pointer; font-size: 13px;
}
.target-btn.active { background: #e94560; color: #fff; border-color: #e94560; }
#mark-instruction { font-size: 14px; margin-bottom: 8px; min-height: 40px; }
#btn-mark {
  padding: 8px 24px; background: #4caf50; border: none; border-radius: 4px;
  color: #fff; font-size: 14px; cursor: pointer;
}
#btn-mark:hover { background: #43a047; }
#mark-progress { margin-top: 8px; font-size: 12px; color: #aaa; }
#mark-dimensions { margin-top: 12px; font-size: 12px; color: #aaa; }
#mark-dimensions label { display: block; margin-bottom: 6px; }
#mark-dimensions input {
  background: #0f3460; border: 1px solid #333; border-radius: 3px; color: #eee; padding: 3px 6px;
}
#mark-results { margin-top: 16px; }
#mark-results h3 { font-size: 14px; margin-bottom: 8px; }
#mark-table { width: 100%; font-size: 12px; border-collapse: collapse; font-family: monospace; }
#mark-table th, #mark-table td { padding: 4px 6px; border: 1px solid #333; text-align: right; }
#mark-table th { background: #16213e; color: #aaa; }
#mark-redo { margin-top: 8px; }
.redo-btn {
  padding: 3px 8px; background: #0f3460; border: 1px solid #333; border-radius: 3px;
  color: #aaa; cursor: pointer; font-size: 11px; margin-right: 4px;
}
.redo-btn:hover { background: #1a4a80; }
#btn-mark-reset {
  margin-top: 8px; padding: 6px 14px; background: #0f3460; border: 1px solid #333;
  border-radius: 3px; color: #eee; cursor: pointer; font-size: 12px;
}
```

- [ ] **Step 3: Add mark corners state and logic**

Append to `<script>`:

```javascript
// -- Mark corners state --
const CORNER_LABELS = ['Near-left', 'Near-right', 'Far-right', 'Far-left'];
let selectedTarget = 0;
let markedCorners = [null, null, null, null]; // { x, y } or null
let currentCorner = 0;
let idealCorners = null; // computed after all 4 corners marked

function updateMarkInstruction() {
  const el = document.getElementById('mark-instruction');
  if (currentCorner >= 4) {
    el.textContent = 'All corners marked! See results below.';
    document.getElementById('btn-mark').style.display = 'none';
    showMarkResults();
  } else {
    el.textContent = `Stand in corner ${currentCorner + 1} (${CORNER_LABELS[currentCorner].toLowerCase()}). Click Mark when steady.`;
    document.getElementById('btn-mark').style.display = '';
  }
  // Update progress
  const prog = document.getElementById('mark-progress');
  prog.textContent = markedCorners.map((c, i) =>
    c ? `${CORNER_LABELS[i]}: (${c.x.toFixed(0)}, ${c.y.toFixed(0)})` : `${CORNER_LABELS[i]}: --`
  ).join('  |  ');
}

document.getElementById('btn-mark').addEventListener('click', () => {
  const t = targets[selectedTarget];
  if (!t.active) {
    document.getElementById('mark-instruction').textContent =
      `Target ${selectedTarget + 1} is not active! Make sure you're detected, then try again.`;
    return;
  }
  markedCorners[currentCorner] = { x: t.x, y: t.y };
  // Find next unmarked corner, or advance past 4 if all done
  let next = currentCorner + 1;
  while (next < 4 && markedCorners[next] !== null) next++;
  currentCorner = next;
  updateMarkInstruction();
});

// Target selector
document.querySelectorAll('.target-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.target-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedTarget = parseInt(btn.dataset.target);
  });
});

// Redo individual corner
document.querySelectorAll('.redo-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const idx = parseInt(btn.dataset.corner);
    // Jump back to re-mark this corner
    currentCorner = idx;
    idealCorners = null;
    document.getElementById('mark-results').style.display = 'none';
    document.getElementById('mark-redo').style.display = 'none';
    document.getElementById('btn-mark').style.display = '';
    updateMarkInstruction();
  });
});

// Reset all
document.getElementById('btn-mark-reset').addEventListener('click', () => {
  markedCorners = [null, null, null, null];
  currentCorner = 0;
  idealCorners = null;
  document.getElementById('mark-results').style.display = 'none';
  document.getElementById('mark-redo').style.display = 'none';
  updateMarkInstruction();
});
```

- [ ] **Step 4: Add mark results computation and display**

Append to `<script>`:

```javascript
function showMarkResults() {
  const widthMm = parseFloat(document.getElementById('mark-width').value) * 1000;
  const depthMm = parseFloat(document.getElementById('mark-depth').value) * 1000;

  // Anchor ideal rectangle to corner 1 (near-left) position.
  // This shows true positional distortion — where each corner SHOULD be
  // relative to corner 1, vs where the sensor actually placed it.
  const anchor = markedCorners[0];

  // Ideal corners: near-left, near-right, far-right, far-left
  // Near-left is anchored, others are offset by room dimensions
  const ideal = [
    { x: anchor.x,            y: anchor.y },              // near-left (anchor)
    { x: anchor.x + widthMm,  y: anchor.y },              // near-right
    { x: anchor.x + widthMm,  y: anchor.y + depthMm },    // far-right
    { x: anchor.x,            y: anchor.y + depthMm },     // far-left
  ];

  // Fill table
  const tbody = document.querySelector('#mark-table tbody');
  tbody.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const c = markedCorners[i];
    const id = ideal[i];
    const err = Math.sqrt((c.x - id.x) ** 2 + (c.y - id.y) ** 2);
    const row = document.createElement('tr');
    row.innerHTML = `<td style="text-align:left">${CORNER_LABELS[i]}</td>
      <td>${c.x.toFixed(0)}</td><td>${c.y.toFixed(0)}</td>
      <td>${id.x.toFixed(0)}</td><td>${id.y.toFixed(0)}</td>
      <td>${err.toFixed(0)}mm</td>`;
    tbody.appendChild(row);
  }

  document.getElementById('mark-results').style.display = '';
  document.getElementById('mark-redo').style.display = '';

  // Store for canvas rendering
  idealCorners = ideal;
}
```

- [ ] **Step 5: Add mark canvas rendering (raw view + overlays)**

Append to `<script>`:

```javascript
function drawMarkCanvas() {
  const canvas = document.getElementById('mark-canvas');
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const xRange = MAX_RANGE * 2;
  const scale = Math.min(w / xRange, h / MAX_RANGE);
  const ox = w / 2;
  const oy = 10;

  function toCanvas(sx, sy) {
    return { cx: ox + sx * scale, cy: oy + sy * scale };
  }

  // Draw FOV wedge (same as raw canvas)
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  const halfFov = FOV_RAD / 2;
  const farLeft = toCanvas(-MAX_RANGE * Math.sin(halfFov), MAX_RANGE * Math.cos(halfFov));
  const farRight = toCanvas(MAX_RANGE * Math.sin(halfFov), MAX_RANGE * Math.cos(halfFov));
  ctx.lineTo(farLeft.cx, farLeft.cy);
  ctx.lineTo(farRight.cx, farRight.cy);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.stroke();

  // Draw range rings
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  for (let r = 1000; r <= MAX_RANGE; r += 1000) {
    ctx.beginPath();
    ctx.arc(ox, oy, r * scale, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Draw marked corners as red polygon
  const marked = markedCorners.filter(c => c !== null);
  if (marked.length >= 2) {
    ctx.beginPath();
    marked.forEach((c, i) => {
      const p = toCanvas(c.x, c.y);
      if (i === 0) ctx.moveTo(p.cx, p.cy);
      else ctx.lineTo(p.cx, p.cy);
    });
    if (marked.length >= 3) ctx.closePath();
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Draw marked corner dots
  markedCorners.forEach((c, i) => {
    if (!c) return;
    const p = toCanvas(c.x, c.y);
    ctx.beginPath();
    ctx.arc(p.cx, p.cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#e94560';
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '10px sans-serif';
    ctx.fillText(CORNER_LABELS[i], p.cx + 9, p.cy + 4);
  });

  // Draw ideal rectangle (blue) if available
  if (idealCorners) {
    const ideal = idealCorners;
    ctx.beginPath();
    ideal.forEach((c, i) => {
      const p = toCanvas(c.x, c.y);
      if (i === 0) ctx.moveTo(p.cx, p.cy);
      else ctx.lineTo(p.cx, p.cy);
    });
    ctx.closePath();
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Distortion arrows
    for (let i = 0; i < 4; i++) {
      if (!markedCorners[i]) continue;
      const from = toCanvas(markedCorners[i].x, markedCorners[i].y);
      const to = toCanvas(ideal[i].x, ideal[i].y);
      ctx.beginPath();
      ctx.moveTo(from.cx, from.cy);
      ctx.lineTo(to.cx, to.cy);
      ctx.strokeStyle = 'rgba(255,255,0,0.6)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // Draw live targets (faded, for reference)
  for (let i = 0; i < 3; i++) {
    const t = targets[i];
    if (!t.active) continue;
    const p = toCanvas(t.x, t.y);
    ctx.beginPath();
    ctx.arc(p.cx, p.cy, 5, 0, Math.PI * 2);
    const parts = TARGET_COLORS[i].match(/[\d.]+/g);
    ctx.fillStyle = `rgba(${parts[0]},${parts[1]},${parts[2]},0.5)`;
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '10px sans-serif';
    ctx.fillText(`T${i + 1}`, p.cx + 7, p.cy + 3);
  }
}
```

- [ ] **Step 6: Update render loop to handle both modes**

Find and replace the existing `renderLoop` function:

```javascript
function renderLoop() {
  const activeTab = document.querySelector('.tab.active');
  const mode = activeTab ? activeTab.dataset.mode : 'explore';
  if (mode === 'explore') {
    drawRawCanvas();
    drawRoomCanvas();
  } else {
    drawMarkCanvas();
  }
  animFrame = requestAnimationFrame(renderLoop);
}
```

- [ ] **Step 7: Initialize mark mode on tab switch**

Add to the tab click handler (inside the existing `document.querySelectorAll('.tab').forEach(...)` block), after setting display:

```javascript
// Also inside the tab click handler, after setting display:
if (mode === 'mark') updateMarkInstruction();
```

- [ ] **Step 8: Test mark corners mode end-to-end**

Open in browser, connect. Switch to "Mark corners" tab. Verify:
- Raw sensor view with live targets visible
- Target selector (T1/T2/T3) works
- Mark button captures position and advances to next corner
- After 4 marks: red polygon, blue ideal rectangle, yellow distortion arrows appear
- Summary table shows coordinates and error
- Redo buttons appear — clicking one lets you re-mark that corner, then results update
- Reset button clears everything (polygon, ideal rectangle, arrows all gone)

- [ ] **Step 9: Commit**

```bash
git add tools/sensor-diagnostic.html
git commit -m "feat: diagnostic tool — mark corners mode with distortion visualization"
```


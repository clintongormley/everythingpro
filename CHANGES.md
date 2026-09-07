# Changelog

User-facing changes to Everything Presence Grid. For full release assets and
firmware downloads, see the
[GitHub releases page](https://github.com/clintongormley/everything-presence-pro-grid/releases).

## v1.9.0 — 2026-09-07

**Everything Presence Grid now runs on the Everything Presence Lite as well as
the Pro** — which is why it has changed name from Everything Presence Pro Grid
to simply Everything Presence Grid. If you already have it installed, nothing
changes: your devices, entities, and settings all carry over, and only the name
shown in Home Assistant and HACS is different.

### New features

- **Support for the Everything Presence Lite.** The Lite now gets the same
    zones, target tracking, grid, and room calibration as the Pro. Flashing over
    USB recognises which model you have plugged in and installs the right
    firmware for it, and the panel only shows the controls your device actually
    has. Huge thanks to @HaniKazmi, whose work made this possible (#416).
- **A new Tracking Sensor tells you when tracking has failed.** If the part of
    the sensor that tracks people stops working, a room can look empty when it
    isn't — targets vanish and presence reads clear, even though motion and
    occupancy keep working normally. The new Tracking Sensor reads Connected
    while tracking is working and Disconnected when it isn't, so a fault is easy
    to spot (#407).
- **Clear the heatmap straight from the panel.** A Clear button now sits next to
    the Heatmap toggle, so you can wipe a sensor's built-up heatmap without a
    dashboard card or a service call. It asks you to confirm first, and the
    heatmap stays cleared even after the device restarts (#411).

### Fixes

- **Keeps working on the latest Home Assistant.** Updated the integration for
    changes in recent Home Assistant releases that would otherwise have stopped
    it loading.
- **A more reliable panel.** The panel no longer gets cut off or scrolls oddly,
    and the detection log now shows on every editor tab (#412, #414).

### Contributors

Thanks to @HaniKazmi for contributing Everything Presence Lite support (#416).

## v1.8.0 — 2026-08-16

### New features

- **Czech translation.** The panel and dashboard card are now available in Czech
    (čeština), shown automatically when Home Assistant is set to Czech.
- **Firmware updates no longer need internet access.** Home Assistant now serves
    firmware to your devices over your local network, so a sensor with no
    internet access of its own can still update. Devices that do have internet
    fall back to downloading from GitHub.
- **The installed devices list shows each device's area.** The flasher's
    Installed Devices list now shows the Home Assistant area each device is in,
    making it easier to tell similar devices apart at a glance.

### Fixes

- **The panel opens reliably from the sidebar and updates itself after an
    upgrade.** Opening the panel could show a blank screen — unreachable in the
    mobile app, where there is no refresh — and a tab left open across a Home
    Assistant restart could keep showing the previous version. The panel now
    loads however you open it and reloads itself to the new version.
- **The heatmap no longer logs "unknown" warnings.** The `sensor.*_heatmap`
    entity was logging "state is longer than 255, falling back to unknown"
    (#365). The heatmap is now delivered directly to the panel and card and is
    no longer a Home Assistant sensor entity; the old entity is removed
    automatically after you update the firmware.

## v1.7.0 — 2026-08-07

### New features

- **Clear the heatmap on demand.** A new `eppgrid.clear_heatmap` action wipes
    the accumulated heatmap for one or more sensors — target a device, entity,
    area, or label, or leave the target empty to clear every Everything Presence
    Grid sensor at once. The card's heatmap setting gains a second toggle
    option, **Toggle and clear on card**, which adds a Clear button (with a
    confirmation dialog) next to the heatmap switch so any dashboard viewer can
    wipe it themselves. Clearing is permanent and survives a device reboot. See
    [Clearing the heatmap](https://clintongormley.github.io/everything-presence-pro-grid/user-guide/heatmap/#clearing-the-heatmap).

### Fixes

- **Devices are recognised again on Home Assistant 2026.8 and newer.** After
    updating Home Assistant to 2026.8, a device already running Everything
    Presence Grid firmware could be shown as still needing to be *flashed over
    USB*, and could drop out of the panel entirely — zones, settings, and device
    groups stopped working with it. Home Assistant 2026.8 changed the way it
    labels ESPHome entities behind the scenes; the integration now understands
    both the old and new form. If you are on Home Assistant 2026.8 or newer,
    update the integration to 1.7.0.

## v1.6.0 — 2026-07-20

### New features

- **Show or hide the heatmap from the dashboard card.** The card's heatmap
    setting now has a third option, **Toggle on card**, alongside off and on.
    Choose it and a small switch appears on the map, so you can show or hide the
    heatmap without editing the card — and each device remembers its own choice.
    Cards set to plain on or off are unchanged.
- **WiFi drop diagnostics.** If a device keeps going offline while never
    rebooting, the **WiFi Signal** reading alone often can't explain it — plenty
    of drops happen on a strong signal because the *router* ended the
    connection. WiFi builds now record what happened at each drop and report it
    once the device is back online: **WiFi Disconnects** (how many times it has
    lost WiFi since booting), **WiFi Disconnect Reason** (why, the last time),
    **WiFi Disconnect Signal** (the signal strength at that exact moment),
    **WiFi Downtime** (how long the outage lasted), and **WiFi BSSID** (which
    access point it is on — useful on a mesh, where the router may be moving the
    device between nodes). Nothing needs to be running or connected to catch a
    drop, and they only update when the connection actually changes. See
    [WiFi keeps dropping](https://clintongormley.github.io/everything-presence-pro-grid/user-guide/troubleshooting/#wifi-keeps-dropping).

### Fixes

- **The dashboard card recovers on its own after a connection drop.** If a
    device briefly lost its connection — during a Wi-Fi hiccup, a firmware
    update, or a restart — the live map and sensor values on a dashboard card
    used to freeze, with no sign anything was wrong, until you reloaded the
    dashboard. The card now shows that the device is offline and resumes by
    itself once it is back. The same applies after the integration itself is
    reloaded or updated.
- **The panel recovers on its own after a connection drop, too.** The live view,
    zone editor, heatmap, and room calibration previously froze until you
    switched device or reloaded the page if the sensor's connection dropped
    while Home Assistant still considered it online. The panel now recovers the
    same way the dashboard card does.
- **Room calibration tells you when the sensor goes offline** instead of
    silently failing to detect you, and keeps the corners you've already
    captured so you can pick up right where you left off once it reconnects.
- **Expanding Detection events no longer pushes it off the bottom of the
    screen.** The live map now sizes itself to the space actually available in
    the panel, so opening the log resizes the map instead of shoving the log
    below the visible area with no way to scroll down to it.
- **Detection events is now a fixed six lines tall** instead of growing taller
    with every new event.
- **The target menu now opens on the target you clicked** instead of sometimes
    appearing well away from it.
- **Firmware update error messages are no longer cut off.** When a device fails
    to update, opening the error indicator now brings the full explanation into
    view instead of clipping it against the bottom of a long device list.

## v1.5.1 — 2026-07-04

**Everything Presence Grid is now available directly in HACS.** The headline
features: a live **overview dashboard card** for your Home Assistant dashboards,
an on-device **activity heatmap**, and **text labels** for your room layout.

### New features

- **Overview dashboard card.** Add a live map and/or sensor panel for any
    Everything Presence Grid device directly to a Home Assistant dashboard.
    Configure it through the visual editor — pick the device, choose whether to
    show the map, the sensors, or both, and control which sensor groups and map
    layers appear. The card heading (Primary and Secondary text) supports Jinja
    templates, so it can show live values from any entity. Two display controls
    let you tune the map: **Show grid** turns off the gridlines, zone colours
    and occupancy glow for a clean, plain map that still shows live targets and
    furniture, and **Rest-of-room colour** sets the colour of the unpainted area
    of the room. The card fills the full width of its dashboard column and lays
    out correctly on narrow screens. Non-admin household users can view
    dashboards that include this card without needing admin access. Feature
    requested by @tuckerdude
    ([#295](https://github.com/clintongormley/everything-presence-pro-grid/issues/295)).
- **Activity heatmap and movement trails.** The live view and the overview card
    can now show an on-device activity heatmap — a rolling picture of where
    movement happens most in the room — plus live movement trails that fade in
    behind each target as it moves. Toggle the **Heatmap** layer on the live
    view or in the card editor. Requires updating the device firmware.
- **Text labels in the furniture layout.** Annotate the layout with
    free-floating text — room names, captions, notes. Labels scale with the room
    and support different fonts, real-world sizing, bold and italic, alignment,
    a text colour (with an auto-contrast option), and an optional background
    box.
- **Request a translation.** If Everything Presence Grid isn't translated into
    your Home Assistant language yet, the panel now shows a dismissible banner
    that opens a pre-filled translation request on GitHub — naming your language
    so you can ask for it, and offer to help review it
    ([#301](https://github.com/clintongormley/everything-presence-pro-grid/pull/301)).
- **WiFi Signal diagnostic.** WiFi builds now expose a **WiFi Signal** (RSSI)
    diagnostic entity, so you can read signal strength at the device's mounted
    location straight from Home Assistant — the quickest way to tell whether a
    device that keeps dropping off the network has a coverage problem. Requires
    updating the device firmware.

### Improvements

- **Furniture resizes proportionally by default.** Dragging a **corner** handle
    keeps a furniture item's proportions; the **edge** handles stretch a single
    dimension when you need to match a piece that isn't the preset's shape.
- **Furniture adapts to the room colour.** Furniture icons automatically pick a
    light or dark shade so they stay legible whatever rest-of-room colour you
    choose.
- **Overview card: cleaner out-of-coverage cells.** Cells outside the sensor's
    coverage fade out on the overview card instead of showing cross-hatching.

### Fixes

- **Dashboard cards refresh themselves after an update.** The overview card now
    reloads on its own once you update the integration, so it shows the new
    version instead of the old one until you manually refresh the browser — the
    settings panel already did this. It takes effect from the next update
    onward, so updating *to* this version may still need one hard refresh of the
    browser tab.
- **Overview card keeps its width** when you open its settings in the dashboard
    editor.

## v1.5.0 — 2026-07-02

**Everything Presence Grid is now available directly in HACS.** The headline
features: a live **overview dashboard card** for your Home Assistant dashboards,
an on-device **activity heatmap**, and **text labels** for your room layout.

### New features

- **Activity heatmap and movement trails.** The live view and the overview card
    can now show an on-device activity heatmap — a rolling picture of where
    movement happens most in the room — plus live movement trails that fade in
    behind each target as it moves. Toggle the **Heatmap** layer on the live
    view or in the card editor. Requires updating the device firmware.
- **Text labels in the furniture layout.** Annotate the layout with
    free-floating text — room names, captions, notes. Labels scale with the room
    and support different fonts, real-world sizing, bold and italic, alignment,
    a text colour (with an auto-contrast option), and an optional background
    box.
- **WiFi Signal diagnostic.** WiFi builds now expose a **WiFi Signal** (RSSI)
    diagnostic entity, so you can read signal strength at the device's mounted
    location straight from Home Assistant — the quickest way to tell whether a
    device that keeps dropping off the network has a coverage problem. Requires
    updating the device firmware.

### Improvements

- **Furniture resizes proportionally by default.** Dragging a **corner** handle
    keeps a furniture item's proportions; the **edge** handles stretch a single
    dimension when you need to match a piece that isn't the preset's shape.
- **Furniture adapts to the room colour.** Furniture icons automatically pick a
    light or dark shade so they stay legible whatever rest-of-room colour you
    choose.
- **Overview card: cleaner out-of-coverage cells.** Cells outside the sensor's
    coverage fade out on the overview card instead of showing cross-hatching.

### Fixes

- **Overview card keeps its width** when you open its settings in the dashboard
    editor.

## v1.4.0 — 2026-06-28

### Improvements

- **Overview card: a cleaner map and colour options (beta).** The dashboard
    overview card now has two new display controls in its visual editor:

    - **Show grid** — turn off the gridlines, zone colours and occupancy glow for
        a clean, plain map that still shows live targets and furniture.
    - **Rest-of-room colour** — set the colour of the unpainted area of the room.

    The card also fills the full width of its dashboard column and lays out
    correctly on narrow screens.

## v1.3.0 — 2026-06-28

### New features

- **Overview dashboard card (beta).** Add a live map and/or sensor panel for any
    Everything Presence Grid device directly to a Home Assistant dashboard. The
    card is configured through the visual editor — pick the device, choose
    whether to show the map, the sensors, or both, and control which sensor
    groups and map layers appear. The card heading (Primary and Secondary text)
    supports Jinja templates, so it can show live values from any entity.
    Non-admin household users can view dashboards that include this card without
    needing admin access. Feature requested by @tuckerdude
    ([#295](https://github.com/clintongormley/everything-presence-pro-grid/issues/295)).
- **Request a translation.** If Everything Presence Grid isn't translated into
    your Home Assistant language yet, the panel now shows a dismissible banner
    that opens a pre-filled translation request on GitHub — naming your language
    so you can ask for it, and offer to help review it
    ([#301](https://github.com/clintongormley/everything-presence-pro-grid/pull/301)).

## v1.2.3 — 2026-06-24

### Fixes

- **The panel reloads itself after an update.** After Everything Presence Grid
    updates to a new version, the panel now notices the new interface and
    reloads automatically, so you see the latest version instead of a stale,
    cached one. Previously you might have needed to refresh the page by hand
    after updating.

## v1.2.2 — 2026-06-22

### Fixes

- **The firmware flasher now lists devices in a predictable order.** Devices
    used to appear in whatever order they were discovered; they're now sorted
    alphabetically by name, so the same device is always in the same place.
- **Calibration controls stay inside their box on narrow layouts.** On narrow
    screens — and when the editor column tightens on desktop — the uncalibrated
    field-of-view diagram and the "Calibrate room size" button could spill
    outside their card. Both now scale and wrap to fit.

## v1.2.1 — 2026-06-21

### Fixes

- **Updating several devices at once is now reliable.** When you started
    firmware updates on multiple devices together, some could fail to start and
    stay on the old version. The panel now retries those automatically, and the
    firmware waits until the update is ready before starting, so batch updates
    complete. The automatic retry also helps devices still on older firmware;
    the firmware-side fix takes effect once they're on v1.2.1.

## v1.2.0 — 2026-06-21

### Interface

- **Redesigned, responsive interface.** The panel now works on phones and
    tablets — larger touch targets, a bottom-sheet zone editor on small screens,
    and a side-by-side editor with a full-width live grid on desktop.
- **Follows your Home Assistant theme.** Colours, surfaces, and dark mode are
    now driven by your active theme, so the panel matches the rest of Home
    Assistant instead of using fixed styling.

### New features

- **Device Groups editor redesigned.** Pick which devices to include and which
    sensors to import — toggle off any presence sensor or zone you don't need.
    Presence coverage and device availability are shown inline so you can see at
    a glance what each sensor contributes.

### Breaking changes

- **Device groups now expose a single combined Rest of room sensor** instead of
    one per source device. Automations that referenced a group's per-device
    Rest-of-room sensor should be repointed to the combined sensor, or to the
    physical device's own Rest-of-room entity.

### Improvements

- **Smoother device setup after flashing.** Once a newly flashed device is on
    your network, the panel adds it and opens a dialog to set its name and area
    straight away. The previous flow could silently skip naming when it couldn't
    match the new device, leaving the setup banner nagging.
- **Flash firmware from your browser over HTTPS.** When the in-panel USB flasher
    is unavailable — most often because you reach Home Assistant over plain
    HTTP, which browsers block from USB access — the panel now explains why and
    links to a new web flasher that runs over HTTPS and flashes either firmware
    variant directly, instead of showing a misleading "requires Chrome or Edge"
    message.
- **More reliable firmware updates.** Updates now succeed on devices that were
    low on memory and previously failed with a connection error — the device is
    restarted to free memory before the update runs. If an update still can't
    proceed for lack of memory, the panel now explains that clearly instead of
    showing a generic error.
- **Detection log now shows a readable event timeline** — zone and sensor
    transitions, room occupancy, sensor-assisted clears, stuck-target
    dismissals, and target movement — instead of a raw state dump. Requires
    firmware v1.2.0.

## v1.1.0 — 2026-06-14

### New features

- **Device Groups.** Combine several Everything Presence Grid devices into one
    logical presence sensor. A group exposes merged presence and per-zone
    sensors under a single Home Assistant device and turns on whenever any
    member device detects presence — so a room covered by several radars reports
    one occupancy entity. Set groups up on the new **Device Groups** page, with
    an optional "rest of room" zone, cross-device zone merging, and area
    assignment.
- **Configurable sensor-assisted clear.** You can now control how the zone
    engine clears pending zones when a room empties. A per-device toggle (on by
    default) and a grace delay (0–600 seconds; 0 clears immediately) replace the
    previous always-immediate behaviour. Turning the toggle off falls back to
    each zone's own clear timeout.
- **Zone colour presets.** Recolouring a zone opens a palette of preset
    swatches, with a marker showing colours already used by another zone. The
    system colour picker is still available as a custom-colour option.

### Improvements

- The Logging settings always show the **Bluetooth** and **CO₂** log-level rows
    instead of hiding them based on the build.

### Fixes

- Setting the firmware **System** log category to Debug no longer floods the log
    with messages from other categories.

### Documentation

- Added a Device Groups guide.
- Documented that the motion sensor's detection range cannot be tuned, with
    corner-mount placement advice for avoiding detections through open doorways.

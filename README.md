# Everything Presence Pro

[![Tests](https://github.com/clintongormley/everything-presence-pro-grid/actions/workflows/tests.yml/badge.svg)](https://github.com/clintongormley/everything-presence-pro-grid/actions/workflows/tests.yml)
[![HACS Validation](https://github.com/clintongormley/everything-presence-pro-grid/actions/workflows/hacs.yml/badge.svg)](https://github.com/clintongormley/everything-presence-pro-grid/actions/workflows/hacs.yml)
[![Hassfest](https://github.com/clintongormley/everything-presence-pro-grid/actions/workflows/hassfest.yml/badge.svg)](https://github.com/clintongormley/everything-presence-pro-grid/actions/workflows/hassfest.yml)

A Home Assistant custom integration for the Everything Presence Pro radar sensor, providing grid-based presence detection with zone management, calibration wizard, and floor plan editor.

## Installation

### HACS (Recommended)

1. Open HACS in Home Assistant
2. Add this repository as a custom repository
3. Search for "Everything Presence Pro" and install
4. Restart Home Assistant

### Manual

Copy the `custom_components/everything_presence_pro` directory to your Home Assistant `custom_components` folder.

## Features

- Grid-based presence detection using LD2450 radar
- Perspective calibration wizard for accurate room mapping
- Up to 7 named zones with configurable sensitivity
- Floor plan editor with furniture placement
- Per-zone occupancy, motion, and target tracking sensors
- Environmental sensors (illuminance, temperature, humidity, CO2)

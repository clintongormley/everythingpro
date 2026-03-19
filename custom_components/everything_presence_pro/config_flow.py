"""Config flow for Everything Presence Pro."""

from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol
from aioesphomeapi import (
    APIClient,
    APIConnectionError,
    InvalidAuthAPIError,
)

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult

from .const import DEFAULT_PORT, DOMAIN

_LOGGER = logging.getLogger(__name__)

HOST_SCHEMA = vol.Schema(
    {
        vol.Required("host"): str,
    }
)


class EverythingPresenceProConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Everything Presence Pro."""

    VERSION = 1

    def __init__(self) -> None:
        """Initialize the config flow."""
        self._host: str = ""
        self._mac: str = ""
        self._esphome_name: str = ""

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Step 1: Ask for the host IP address."""
        errors: dict[str, str] = {}

        if user_input is not None:
            self._host = user_input["host"]

            client = APIClient(
                self._host,
                DEFAULT_PORT,
                "",
            )

            try:
                await client.connect(login=True)
                device_info = await client.device_info()
            except InvalidAuthAPIError:
                errors["base"] = "invalid_auth"
            except APIConnectionError:
                errors["base"] = "cannot_connect"
            except Exception:
                _LOGGER.exception("Unexpected error connecting to device")
                errors["base"] = "cannot_connect"
            else:
                await self.async_set_unique_id(device_info.mac_address)
                self._abort_if_unique_id_configured()

                self._mac = device_info.mac_address
                self._esphome_name = (
                    device_info.friendly_name or device_info.name
                )
                return await self.async_step_name()
            finally:
                await client.disconnect()

        return self.async_show_form(
            step_id="user",
            data_schema=HOST_SCHEMA,
            errors=errors,
        )

    async def async_step_name(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Step 2: Ask for the sensor name."""
        if user_input is not None:
            name = user_input["name"].strip()
            if not name:
                name = self._esphome_name

            return self.async_create_entry(
                title=name,
                data={
                    "host": self._host,
                    "mac": self._mac,
                    "device_name": name,
                },
            )

        return self.async_show_form(
            step_id="name",
            data_schema=vol.Schema(
                {
                    vol.Required("name", default=self._esphome_name): str,
                }
            ),
        )

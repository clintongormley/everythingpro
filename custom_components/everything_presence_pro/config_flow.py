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

USER_SCHEMA = vol.Schema(
    {
        vol.Required("host"): str,
    }
)


class EverythingPresenceProConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Everything Presence Pro."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Handle the initial step."""
        errors: dict[str, str] = {}

        if user_input is not None:
            host = user_input["host"]

            client = APIClient(
                host,
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

                title = device_info.friendly_name or device_info.name

                return self.async_create_entry(
                    title=title,
                    data={
                        "host": host,
                        "mac": device_info.mac_address,
                        "device_name": title,
                    },
                )
            finally:
                await client.disconnect()

        return self.async_show_form(
            step_id="user",
            data_schema=USER_SCHEMA,
            errors=errors,
        )

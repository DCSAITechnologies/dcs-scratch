"""Shared environment reading for the examples. Credentials come ONLY from the environment."""
import os
import sys

from dcs_connector_os import Client


def require(name: str) -> str:
    v = os.environ.get(name)
    if not v:
        sys.exit(f"set {name} (see devex/examples/python/README section in devex/sdk-python/README.md)")
    return v


def developer() -> Client:
    return Client(require("DCS_API_KEY"), require("DCS_BASE_URL"))


def operator() -> Client:
    return Client(require("DCS_OPERATOR_SESSION"), require("DCS_BASE_URL"))


def attestation() -> str:
    return require("DCS_OPERATOR_ATTESTATION")

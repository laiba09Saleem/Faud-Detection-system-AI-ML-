from __future__ import annotations

from typing import Any

from flask import Request


def parse_request_json(request: Request) -> dict[str, Any]:
    payload = request.get_json(silent=True)
    return payload if isinstance(payload, dict) else {}


def validate_numeric_range(
    value: Any,
    min_value: float,
    max_value: float,
    field_name: str,
) -> tuple[bool, str]:
    try:
        numeric_value = float(value)
    except (TypeError, ValueError):
        return False, f"{field_name} must be a numeric value."

    if numeric_value < min_value or numeric_value > max_value:
        return False, f"{field_name} must be between {min_value} and {max_value}."

    return True, ""

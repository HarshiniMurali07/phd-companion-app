import os
import secrets

from fastapi import Header, HTTPException


def verify_api_key(x_api_key: str | None = Header(default=None)):
    expected = os.getenv("APP_API_KEY")

    if not expected:
        raise HTTPException(
            status_code=500,
            detail="Server API key is not configured.",
        )

    if not x_api_key or not secrets.compare_digest(
        x_api_key.encode(), expected.encode()
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid or missing API key.",
        )

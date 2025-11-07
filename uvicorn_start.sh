#!/usr/bin/env bash
export DATABASE_URL="${DATABASE_URL:-sqlite:///./data/dev.db}"
mkdir -p ./data
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

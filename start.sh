#!/bin/bash
export PYTHONPATH=/home/iven/igb-design-center
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

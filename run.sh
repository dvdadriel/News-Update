#!/bin/bash
# Wrapper untuk dijalankan via crontab.
# Cron jalan dengan env minimal — semua path harus absolut.

set -euo pipefail

cd "$(dirname "$0")"

mkdir -p logs
LOG="logs/run-$(date +%Y-%m).log"

{
  echo "===== $(date '+%Y-%m-%d %H:%M:%S %Z') ====="
  ./.venv/bin/python main.py
  echo
} >> "$LOG" 2>&1

#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

PYTHON=""
if command -v python3 >/dev/null 2>&1; then
  PYTHON="$(command -v python3)"
elif command -v python >/dev/null 2>&1; then
  PYTHON="$(command -v python)"
else
  echo "Python 3.10 or newer is required. Install it and run this script again."
  exit 1
fi

if ! "$PYTHON" -c 'import sys; raise SystemExit(sys.version_info < (3, 10))'; then
  echo "Python 3.10 or newer is required."
  exit 1
fi

if [[ ! -x .venv/bin/python ]]; then
  echo "Creating the MEDCOM environment..."
  "$PYTHON" -m venv .venv
fi
if ! .venv/bin/python -c 'import flask' >/dev/null 2>&1; then
  echo "Installing Flask. An internet connection is needed the first time."
  .venv/bin/python -m pip install --disable-pip-version-check -r requirements.txt
fi
export MEDCOM_OPEN_BROWSER=1
echo "MEDCOM AI is running at http://127.0.0.1:5000"
exec .venv/bin/python -m backend.app

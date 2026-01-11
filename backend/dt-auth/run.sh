#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Run ./setup.sh first."
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

# Run migrations
echo "Running migrations..."
python migrate.py

# Start the server
echo "Starting dt-auth server on http://localhost:12000"
echo "API docs available at http://localhost:12000/docs"
uvicorn src.app:app --reload --port 12000

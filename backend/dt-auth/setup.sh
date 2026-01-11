#!/bin/bash

set -e

echo "=========================================="
echo "DecodingTrust Agent Auth - Setup Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 1. Create virtual environment
echo -e "\n${YELLOW}[1/4] Creating virtual environment...${NC}"
if [ -d "venv" ]; then
    echo "Virtual environment already exists, skipping..."
else
    python3 -m venv venv
    echo -e "${GREEN}Virtual environment created!${NC}"
fi

# 2. Activate virtual environment and install dependencies
echo -e "\n${YELLOW}[2/4] Installing dependencies...${NC}"
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
echo -e "${GREEN}Dependencies installed!${NC}"

# 3. Create .env file if not exists
echo -e "\n${YELLOW}[3/4] Setting up environment...${NC}"
if [ -f ".env" ]; then
    echo ".env file already exists, skipping..."
else
    cp .env.example .env
    # Generate a random secret key
    SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/your-secret-key-change-in-production/$SECRET_KEY/" .env
    else
        sed -i "s/your-secret-key-change-in-production/$SECRET_KEY/" .env
    fi
    echo -e "${GREEN}.env file created with secure secret key!${NC}"
fi

# 4. Create database and run migrations
echo -e "\n${YELLOW}[4/4] Setting up database...${NC}"

# Check if PostgreSQL is available
if command -v psql &> /dev/null; then
    # Check if database exists
    if psql -U postgres -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw dt_auth; then
        echo "Database 'dt_auth' already exists, skipping creation..."
    else
        echo "Creating database 'dt_auth'..."
        createdb -U postgres dt_auth 2>/dev/null || {
            echo -e "${YELLOW}Could not create database automatically.${NC}"
            echo "Please create it manually: createdb -U postgres dt_auth"
        }
    fi
else
    echo -e "${YELLOW}PostgreSQL CLI not found. Please ensure PostgreSQL is running.${NC}"
    echo "You can use Docker: docker-compose up -d postgres"
fi

# Run migrations
echo "Running database migrations..."
python migrate.py

echo -e "\n${GREEN}=========================================="
echo "Setup complete!"
echo "==========================================${NC}"
echo ""
echo "To start the server:"
echo "  source venv/bin/activate"
echo "  uvicorn src.app:app --reload --port 8001"
echo ""
echo "Or use Docker:"
echo "  docker-compose up -d"
echo ""
echo "API will be available at: http://localhost:8001"
echo "API docs at: http://localhost:8001/docs"

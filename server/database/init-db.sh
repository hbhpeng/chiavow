#!/bin/bash

# Database initialization script for Chiavow
# This script will create the database and set up the schema

echo "==================================="
echo "Chiavow Database Initialization"
echo "==================================="
echo ""

# Check if MySQL is running
if ! command -v mysql &> /dev/null; then
    echo "Error: MySQL is not installed or not in PATH"
    echo "Please install MySQL first:"
    echo "  macOS: brew install mysql"
    echo "  Ubuntu: sudo apt install mysql-server"
    exit 1
fi

# Prompt for MySQL root password
echo "This script will create the 'chiavow' database and set up the schema."
echo ""
read -s -p "Enter MySQL root password: " MYSQL_ROOT_PASSWORD
echo ""

# Test MySQL connection
if ! mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "SELECT 1" &> /dev/null; then
    echo "Error: Failed to connect to MySQL. Please check your password."
    exit 1
fi

echo ""
echo "Connected to MySQL successfully!"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SCHEMA_FILE="$SCRIPT_DIR/schema.sql"

if [ ! -f "$SCHEMA_FILE" ]; then
    echo "Error: schema.sql not found at $SCHEMA_FILE"
    exit 1
fi

echo "Executing schema.sql..."
mysql -u root -p"$MYSQL_ROOT_PASSWORD" < "$SCHEMA_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "==================================="
    echo "Database initialized successfully!"
    echo "==================================="
    echo ""
    echo "Default admin account created:"
    echo "  Email: admin@chiavow.com"
    echo "  Password: admin123"
    echo ""
    echo "IMPORTANT: Please change the admin password after first login!"
    echo ""
    echo "Next steps:"
    echo "1. Copy server/.env.example to server/.env"
    echo "2. Update the database credentials in .env"
    echo "3. Start the server with: npm run dev"
else
    echo ""
    echo "Error: Failed to initialize database"
    exit 1
fi

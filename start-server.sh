#!/bin/bash

# ========================================
# PriceCompare-v2 Server Startup Script
# For macOS & Linux Users
# ========================================

echo ""
echo "==================================="
echo "  ShopIQ - Price Comparison Server"
echo "==================================="
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js from: https://nodejs.org/"
    echo ""
    exit 1
fi

# Check if npm packages are installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install dependencies"
        exit 1
    fi
fi

echo ""
echo "Starting server..."
echo ""
echo "========================================"
echo "Server will run on: http://localhost:3000"
echo "Search endpoint: http://localhost:3000/api/search?q=iPhone"
echo "========================================"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
npm start

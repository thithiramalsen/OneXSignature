#!/bin/bash

# OneX Signature - Quick Setup Verification Script

echo "========================================="
echo "OneX Signature - Setup Verification"
echo "========================================="
echo ""

# Check Docker
echo "Checking Docker..."
if command -v docker &> /dev/null; then
    echo "✓ Docker is installed: $(docker --version)"
else
    echo "✗ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check Docker Compose
echo "Checking Docker Compose..."
if command -v docker-compose &> /dev/null; then
    echo "✓ Docker Compose is installed: $(docker-compose --version)"
else
    echo "✗ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo ""
echo "========================================="
echo "All prerequisites are met!"
echo "========================================="
echo ""
echo "Quick Start Commands:"
echo "  1. Start the application: docker-compose up --build"
echo "  2. Access frontend: http://localhost:3000"
echo "  3. Access backend API: http://localhost:5000"
echo ""
echo "Default admin credentials:"
echo "  Email: admin@onexsignature.com"
echo "  Password: admin123"
echo ""
echo "========================================="

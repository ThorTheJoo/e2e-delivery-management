#!/bin/bash

echo "🚀 Installing E2E Delivery Management System..."
echo "================================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    echo "Please upgrade Node.js to version 18 or higher."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm version: $(npm -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
else
    echo "❌ Failed to install dependencies. Please check the error messages above."
    exit 1
fi

# Create .env.local file if it doesn't exist
if [ ! -f .env.local ]; then
    echo "🔧 Creating .env.local file..."
    cat > .env.local << EOF
NEXT_PUBLIC_APP_NAME="E2E Delivery Management"
NEXT_PUBLIC_VERSION="1.0.0"
EOF
    echo "✅ .env.local file created!"
fi

echo ""
echo "🎉 Installation completed successfully!"
echo ""
echo "To start the development server, run:"
echo "  npm run dev"
echo ""
echo "Then open your browser and navigate to:"
echo "  http://localhost:3000"
echo ""
echo "Happy coding! 🚀"

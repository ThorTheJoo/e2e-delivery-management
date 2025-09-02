# CET v22.0 Project Setup Guide

## Quick Start

### 1. Create New Project
```bash
npx create-next-app@latest cet-v22-domain-breakdown --typescript --tailwind --eslint --app
cd cet-v22-domain-breakdown
```

### 2. Install Dependencies
```bash
npm install xlsx
npm install @types/xlsx --save-dev
npm install lucide-react
npm install class-variance-authority clsx tailwind-merge
```

### 3. Setup Path Aliases
Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## File Structure Setup

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── progress.tsx
│   │   ├── button.tsx
│   │   ├── tabs.tsx
│   │   └── alert.tsx
│   └── cet-v22/
│       ├── CETv22ServiceDesign.tsx
│       ├── CETv22ResourceDashboard.tsx
│       ├── CETv22FileUpload.tsx
│       └── CETv22ProjectOverview.tsx
├── services/
│   ├── cet-v22-parser.ts
│   └── cet-v22-analyzer.ts
├── types/
│   └── index.ts
└── lib/
    └── utils.ts
```

## Configuration Files

### package.json
```json
{
  "name": "cet-v22-domain-breakdown",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.32",
    "react": "^18",
    "react-dom": "^18",
    "xlsx": "^0.18.5",
    "lucide-react": "^0.300.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@types/xlsx": "^0.0.36",
    "autoprefixer": "^10.0.1",
    "postcss": "^8",
    "tailwindcss": "^3.3.0",
    "eslint": "^8",
    "eslint-config-next": "14.2.32"
  }
}
```

### tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
    },
  },
  plugins: [],
}
```

### globals.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

## Implementation Steps

### Step 1: Create Type Definitions
Copy the type definitions from `CETv22-Domain-Breakdown-Implementation-Guide.md` to `src/types/index.ts`

### Step 2: Create Utility Functions
Create `src/lib/utils.ts`:
```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### Step 3: Create UI Components
Create base UI components in `src/components/ui/`:
- `card.tsx`
- `badge.tsx`
- `progress.tsx`
- `button.tsx`
- `tabs.tsx`
- `alert.tsx`

### Step 4: Implement Services
Create parser and analyzer services:
- `src/services/cet-v22-parser.ts`
- `src/services/cet-v22-analyzer.ts`

### Step 5: Create CET v22 Components
Create the main components:
- `src/components/cet-v22/CETv22ServiceDesign.tsx`
- `src/components/cet-v22/CETv22ResourceDashboard.tsx`
- `src/components/cet-v22/CETv22FileUpload.tsx`

### Step 6: Update Main Page
Update `src/app/page.tsx` to include the CET v22 component

## Development Commands

### Start Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm start
```

### Run Linting
```bash
npm run lint
```

## Testing Setup

### Install Testing Dependencies
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom
```

### Jest Configuration
Create `jest.config.js`:
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
}

module.exports = createJestConfig(customJestConfig)
```

### Test Scripts
Add to `package.json`:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

## Deployment

### Vercel Deployment
```bash
npm install -g vercel
vercel
```

### Docker Deployment
Create `Dockerfile`:
```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

## Environment Variables

### .env.local
```bash
# Optional: Add any environment-specific variables
NEXT_PUBLIC_APP_NAME="CET v22.0 Domain Breakdown"
```

## Troubleshooting

### Common Issues

#### 1. Module Resolution Errors
- Ensure path aliases are configured in `tsconfig.json`
- Check import paths use `@/` prefix

#### 2. Excel Parsing Issues
- Verify xlsx library is installed
- Check file format compatibility
- Ensure proper error handling

#### 3. Styling Issues
- Verify Tailwind CSS is properly configured
- Check CSS variable definitions
- Ensure proper class names

#### 4. TypeScript Errors
- Verify all type definitions are imported
- Check interface implementations
- Ensure proper type annotations

This setup guide provides everything needed to create a new project with the CET v22.0 domain breakdown functionality.

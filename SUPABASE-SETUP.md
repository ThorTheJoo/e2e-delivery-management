# Supabase Setup Guide

## Overview
This application uses Supabase to store TMF ODA reference data for domains and capabilities. The reference data provides a foundation for users to build their domain and capability management system.

## Setup Instructions

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project
4. Note your project URL and anon key

### 2. Environment Configuration
Create a `.env.local` file in the root directory with:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Database Schema
The application will automatically create the required tables when you first run it. The tables are:

#### tmf_reference_domains
- id (uuid, primary key)
- name (text)
- description (text)
- category (text)
- version (text)
- created_at (timestamp)

#### tmf_reference_capabilities
- id (uuid, primary key)
- name (text)
- description (text)
- domain_id (uuid, foreign key to tmf_reference_domains)
- category (text)
- level (text)
- version (text)
- created_at (timestamp)

### 4. Reference Data
The application includes comprehensive TMF ODA reference data:
- 6 core domains (Market & Sales, Product, Customer, Service, Resource, Partner)
- 18 capabilities (3 per domain)
- All data follows TMF ODA standards

### 5. Features
- **Reference Data Integration**: Users can select from predefined TMF ODA domains and capabilities
- **Custom Entries**: Users can also create custom domains and capabilities
- **Search and Filter**: Built-in search functionality for domains and capabilities
- **Expandable Views**: Click to expand domains and view their capabilities
- **Selection Management**: Checkbox selection for domains and capabilities

## Usage
1. Start the application
2. Navigate to the TMF section
3. Click "Add Domain" to create a new domain
4. Select from reference domains or create a custom one
5. Expand domains to add capabilities
6. Use the search functionality to find specific items

## Development
The reference data is automatically initialized when the application starts. You can modify the reference data in `src/lib/tmf-reference-service.ts`.

# TMF Reference Data Implementation

## Overview

This implementation replaces the mock TMF reference data with real data from the `TMF_Domains_Functions.csv` file, loaded into Supabase for efficient querying and management.

## What's Been Implemented

### 1. Database Schema (`supabase-tmf-reference-schema.sql`)
- **tmf_domains**: Stores TMF domain information
- **tmf_functions**: Stores TMF function details with domain relationships
- **specsync_tmf_mappings**: Tracks mappings between SpecSync items and TMF functions
- **Views**: Optimized views for common queries
- **Indexes**: Performance indexes for fast queries
- **RLS Policies**: Row-level security for data protection

### 2. Data Loading (`setup-tmf-reference-data.js`)
- Parses the CSV file with 1,291 TMF functions across 9 domains
- Loads data into Supabase tables
- Handles data validation and error checking
- Provides progress feedback during loading

### 3. New TMF Reference Service (`src/lib/tmf-reference-service-new.ts`)
- **TMFReferenceService**: Complete service for TMF data operations
- **getDomains()**: Retrieve all TMF domains with function counts
- **getFunctionsByDomain()**: Get functions for a specific domain
- **searchFunctions()**: Search functions with optional domain filtering
- **findBestMatch()**: Intelligent matching for SpecSync imports
- **createMapping()**: Create SpecSync to TMF function mappings

### 4. Enhanced SpecSync Integration (`src/lib/specsync-tmf-utils.ts`)
- **mapSpecSyncToTMFunctions()**: Maps SpecSync items to TMF functions
- **getMappedTMFunctions()**: Get functions mapped from SpecSync data
- **getUnmappedSpecSyncItems()**: Find unmapped SpecSync items
- **getAvailableTMFunctionsForCustomDomain()**: Get functions for custom domain addition

### 5. Updated Types (`src/types/index.ts`)
- **TMFDomain**: Domain interface with metadata
- **TMFFunction**: Function interface with domain relationships
- **TMFMapping**: Mapping interface for SpecSync integration

### 6. New TMF ODA Manager Component (`src/components/tmf-oda-manager-new.tsx`)
- Real-time display of TMF domains and functions
- SpecSync integration with automatic mapping
- Search and filter functionality
- Custom domain addition with reference data
- Visual indicators for mapped vs unmapped functions

## Key Features

### ✅ Real Reference Data
- 9 TMF domains (Customer, Resource, Enterprise, Shared, Product, Service, Market & Sales, Business Partner, Integration)
- 1,291 TMF functions with complete metadata
- Proper domain-function relationships

### ✅ Intelligent SpecSync Mapping
- Domain-aware matching for better accuracy
- Fuzzy matching with confidence scores
- Automatic mapping creation and tracking
- Support for unmapped items

### ✅ Enhanced Add Custom Domain
- Shows only unmapped functions
- Domain-based filtering
- Search functionality
- Prevents duplicate additions

### ✅ Performance Optimized
- Database indexes for fast queries
- Efficient views for common operations
- Batch processing for large datasets
- Caching support

## Setup Instructions

### 1. Configure Supabase
```bash
# Set environment variables
export NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### 2. Create Database Schema
```bash
# Run the schema creation script
node setup-tmf-reference-data.js
```

### 3. Test the Setup
```bash
# Verify the implementation
node test-tmf-reference-setup.js
```

### 4. Update Your Application
Replace the old TMF ODA Manager with the new implementation:
```tsx
import { TMFOdaManager } from '@/components/tmf-oda-manager-new';
```

## Data Structure

### TMF Domains (9 total)
1. **Customer Domain**: 245 functions (19.0%)
2. **Resource Domain**: 237 functions (18.4%)
3. **Enterprise Domain**: 210 functions (16.3%)
4. **Shared Domain**: 152 functions (11.8%)
5. **Product Domain**: 140 functions (10.8%)
6. **Service Domain**: 130 functions (10.1%)
7. **Market & Sales Domain**: 73 functions (5.7%)
8. **Business Partner Domain**: 70 functions (5.4%)
9. **Integration Domain**: 34 functions (2.6%)

### TMF Functions
Each function includes:
- **Function Name**: The rephrased function name from CSV
- **Domain**: Associated TMF domain
- **Vertical**: Business vertical classification
- **AF Level 1**: Architecture Framework Level 1
- **AF Level 2**: Architecture Framework Level 2
- **Function ID**: Unique identifier
- **UID**: Universal identifier

## Usage Examples

### Load TMF Reference Data
```typescript
import { TMFReferenceService } from '@/lib/tmf-reference-service-new';

// Get all domains
const domains = await TMFReferenceService.getDomains();

// Get functions for a domain
const functions = await TMFReferenceService.getFunctionsByDomain(domainId);

// Search functions
const results = await TMFReferenceService.searchFunctions('management');
```

### Map SpecSync Data
```typescript
import { mapSpecSyncToTMFunctions } from '@/lib/specsync-tmf-utils';

// Map SpecSync items to TMF functions
const mapping = await mapSpecSyncToTMFunctions(specSyncItems);
console.log(`Mapped ${mapping.assignments.length} items`);
console.log(`Unmapped: ${mapping.unmapped}`);
```

### Find Best Matches
```typescript
// Find best TMF function match for SpecSync item
const match = await TMFReferenceService.findBestMatch(
  'Customer Order Management',
  'Customer Domain'
);

if (match) {
  console.log(`Found: ${match.function.function_name} (confidence: ${match.confidence})`);
}
```

## Benefits

1. **Accurate Data**: Real TMF functions instead of mock data
2. **Efficient Querying**: Supabase provides fast, indexed queries
3. **Smart Mapping**: Domain-aware matching improves accuracy
4. **Intelligent Custom Addition**: Only shows relevant, unmapped options
5. **Scalable Architecture**: Easy to add new domains/functions
6. **Data Integrity**: Proper relationships and constraints
7. **Performance**: Caching and indexing for large datasets

## Migration Notes

- The old mock data is preserved in `src/lib/tmf-reference-service.ts`
- The new implementation is in `src/lib/tmf-reference-service-new.ts`
- Update imports to use the new service
- Test thoroughly before deploying to production

## Troubleshooting

### Common Issues

1. **"No data found"**: Run the setup script to load reference data
2. **"Supabase client not available"**: Check environment variables
3. **"Permission denied"**: Verify RLS policies and service role key
4. **"Slow queries"**: Ensure indexes are created properly

### Debug Commands

```bash
# Test database connection
node test-tmf-reference-setup.js

# Check data counts
node -e "
const { createClient } = require('@supabase/supabase-js');
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
client.from('tmf_domains').select('*', { count: 'exact' }).then(r => console.log('Domains:', r.count));
"
```

## Next Steps

1. **Test the Implementation**: Use the test script to verify everything works
2. **Update Components**: Replace old components with new implementations
3. **Test SpecSync Integration**: Import SpecSync data and verify mapping
4. **Test Custom Domain Addition**: Verify the enhanced functionality
5. **Performance Testing**: Ensure queries perform well with large datasets
6. **User Testing**: Get feedback on the new interface and functionality

## Files Created/Modified

### New Files
- `supabase-tmf-reference-schema.sql` - Database schema
- `setup-tmf-reference-data.js` - Data loading script
- `test-tmf-reference-setup.js` - Test script
- `src/lib/tmf-reference-service-new.ts` - New TMF service
- `src/lib/specsync-tmf-utils.ts` - SpecSync integration utilities
- `src/components/tmf-oda-manager-new.tsx` - New TMF ODA Manager

### Modified Files
- `src/types/index.ts` - Added new TMF types
- `package.json` - Added csv-parser dependency

### Documentation
- `TMF-REFERENCE-IMPLEMENTATION.md` - This implementation guide


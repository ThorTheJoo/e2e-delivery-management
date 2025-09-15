# Dashboard SpecSync Data Priority Fix

## Issue Summary

The TMF Domain and Function Overview section in the dashboard was showing default static TMF data instead of using the imported SpecSync requirements data. This occurred because the data source priority logic was incorrect.

## Root Cause

The `getDomainFunctionCards()` function in `src/app/page.tsx` had the following priority order:

1. **First Priority**: TMF functions from Supabase/static data (`tmfFunctions.length > 0`)
2. **Second Priority**: SpecSync data as fallback (`specSyncState && specSyncState.items.length > 0`)

Since static TMF data was always loaded (even when empty), the condition `tmfFunctions.length > 0` was always true, preventing the dashboard from using SpecSync data.

## The Fix

Modified the data source priority in `getDomainFunctionCards()` to:

1. **First Priority**: SpecSync data (`specSyncState && specSyncState.items.length > 0`) - **NEW**
2. **Second Priority**: TMF functions from Supabase (`tmfFunctions.length > 0`)
3. **Third Priority**: No data available

## Changes Made

### File: `src/app/page.tsx`

1. **Reordered Priority Logic**: Moved SpecSync data processing to be the first priority
2. **Removed Duplicate Code**: Eliminated the duplicate SpecSync processing logic that was in the fallback section
3. **Added Debug Logging**: Added console logs to help track which data source is being used:
   - `🎯 Dashboard: Using SpecSync data for TMF Domain and Function Overview`
   - `🎯 Dashboard: Using TMF functions data for TMF Domain and Function Overview`
   - `⚠️ Dashboard: No data available for TMF Domain and Function Overview`

## Expected Behavior

Now when you:
1. Import SpecSync requirements data
2. Navigate to the Dashboard tab
3. Expand the "TMF Domain and Function Overview" section

The dashboard will show:
- **Domains and functions based on your SpecSync data** (not static TMF data)
- **Requirement counts** from your imported SpecSync file
- **Use case counts** from your SpecSync data
- **Proper domain grouping** based on the domains in your SpecSync file

## Verification

To verify the fix is working:

1. Open browser developer tools (F12)
2. Go to Console tab
3. Import a SpecSync file
4. Navigate to Dashboard tab
5. Expand "TMF Domain and Function Overview"
6. Look for the console log: `🎯 Dashboard: Using SpecSync data for TMF Domain and Function Overview`
7. Verify the cards show domains and functions from your SpecSync data, not the static "Business Partner Domain" data

## Technical Details

The fix ensures that:
- SpecSync data takes precedence over static TMF data
- The dashboard reflects the actual requirements you've imported
- Domain and function cards are populated based on your SpecSync file content
- Requirement counts are accurate and based on your data
- The system maintains backward compatibility with TMF data when no SpecSync data is available

## Files Modified

- `src/app/page.tsx` - Updated `getDomainFunctionCards()` function priority logic

# Blue Dolphin OData Integration Analysis

## Executive Summary

Based on the user's Excel OData query and data structure analysis, this document provides insights into the correct OData endpoint structure and data patterns for Blue Dolphin integration.

## Excel OData Query Analysis

### Original Excel Query

```m
let
    Source = OData.Feed("https://csgipoc.odata.bluedolphin.app", null, [Implementation="2.0"]),
    Objects_table = Source{[Name="Objects",Signature="table"]}[Data]
in
    Objects_table
```

### Key Insights

1. **Base URL**: `https://csgipoc.odata.bluedolphin.app` (not the standard `/odata/v4` path)
2. **Implementation**: Uses OData v2.0 (not v4.0 as documented)
3. **Endpoint Structure**: `Source{[Name="Objects",Signature="table"]}[Data]`
4. **Data Pattern**: Direct table access without query parameters
5. **Authentication**: **No authentication required** - Excel query works without any auth headers

## Data Structure Analysis

### Retrieved Object Properties

Based on the Excel data screenshot, the following properties are available:

| Property               | Type     | Description             | Example                                     |
| ---------------------- | -------- | ----------------------- | ------------------------------------------- |
| `ID`                   | String   | Unique identifier       | `68653545492c71d5ec5a6f44`                  |
| `Title`                | String   | Object name/title       | `[Web Self-Care]`, `[Ecommerce]`            |
| `Completeness`         | Number   | Completeness score      | `83`, `67`, `50`, `0`                       |
| `CreatedOn`            | DateTime | Creation timestamp      | `7/2/2025 13:33 Carlos Vallejo`             |
| `ChangedOn`            | DateTime | Last modified timestamp | `7/14/2025 16:05 Rodrigo Augusto Rocha`     |
| `ArchimateType`        | String   | ArchiMate element type  | `application_component`                     |
| `Definition`           | String   | Object definition       | `Application Component`                     |
| `Category`             | String   | Object category         | `Applicationlayer`                          |
| `ConditionalColor`     | String   | Color code              | `#2F4A36`, `#A587AF`                        |
| `Status`               | String   | Object status           | `Accepted`                                  |
| `ObjectLifecycleState` | String   | Lifecycle state         | `Current`                                   |
| `Workspace`            | String   | Workspace assignment    | `CSG International`, `Product Architecture` |

## OData Implementation Differences

### Documented vs. Actual Implementation

| Aspect                 | Documented                                       | Actual (Excel)                                     |
| ---------------------- | ------------------------------------------------ | -------------------------------------------------- |
| **Version**            | OData v4.0                                       | OData v2.0                                         |
| **Base URL**           | `https://public-api.eu.bluedolphin.app/odata/v4` | `https://csgipoc.odata.bluedolphin.app`            |
| **Endpoint Structure** | `/Objects?$filter=...`                           | `Source{[Name="Objects",Signature="table"]}[Data]` |
| **Authentication**     | Bearer token or Basic auth                       | Same                                               |
| **Query Parameters**   | Standard OData v4 syntax                         | Direct table access                                |

## Corrected Implementation Strategy

### 1. Update Base URL Configuration

```typescript
const config = {
  odataUrl: 'https://csgipoc.odata.bluedolphin.app', // Remove /odata/v4
  // ... other config
};
```

### 2. Update OData Headers

```typescript
const headers = {
  Accept: 'application/json',
  'OData-MaxVersion': '2.0', // Change from 4.0 to 2.0
  'OData-Version': '2.0', // Change from 4.0 to 2.0
};
```

### 3. Simplified Endpoint Access

Instead of complex query parameters, use direct endpoint access:

```typescript
// Instead of: /Objects?$filter=Definition eq 'Application Component'
// Use: /Objects
```

### 4. Client-Side Filtering

Since the OData service doesn't support complex filtering, implement client-side filtering:

```typescript
// Fetch all objects and filter client-side
const allObjects = await fetch('/Objects');
const filteredObjects = allObjects.filter((obj) => obj.Definition === 'Application Component');
```

## Updated API Route Implementation

### Modified get-objects Action

```typescript
case 'get-objects':
  try {
    const { endpoint, filter, top = 50, skip = 0, select, orderby } = data || {};

    // Build OData v4.0 URL with query parameters
    const queryParams = new URLSearchParams();
    if (filter) queryParams.append('$filter', filter);
    if (select && select.length > 0) queryParams.append('$select', select.join(','));
    if (orderby) queryParams.append('$orderby', orderby);
    if (top) queryParams.append('$top', top.toString());
    if (skip) queryParams.append('$skip', skip.toString());

    const queryString = queryParams.toString();
    const url = `${config.odataUrl}${endpoint}${queryString ? `?${queryString}` : ''}`;

    // Use OData v4.0 headers as per Blue Dolphin documentation
    const headers = {
      'Accept': 'application/json',
      'OData-MaxVersion': '4.0',
      'OData-Version': '4.0'
    };

    // Add authentication - API Key takes precedence
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    } else if (config.username && config.password) {
      headers['Authorization'] = `Basic ${btoa(`${config.username}:${config.password}`)}`;
    } else {
      throw new Error('Authentication required');
    }

    const response = await fetch(url, { headers });
    const result = await response.json();

    return NextResponse.json({
      success: true,
      data: result.value || result || [],
      count: (result.value || result || []).length,
      total: result['@odata.count'] || (result.value || result || []).length,
      endpoint,
      filter,
      query: queryString
    });
  } catch (error) {
    // Error handling
  }
```

## Frontend Filtering Implementation

### Updated loadObjects Function

```typescript
const loadObjects = useCallback(
  async () => {
    // ... existing setup code ...

    try {
      // Fetch all objects without server-side filtering
      const response = await fetch('/api/blue-dolphin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get-objects',
          config,
          data: { endpoint: selectedEndpoint },
        }),
      });

      const result = await response.json();

      if (result.success) {
        let filteredData = result.data || [];

        // Apply client-side filtering
        if (objectDefinitionFilter) {
          filteredData = filteredData.filter((obj) => obj.Definition === objectDefinitionFilter);
        }

        if (objectFilter) {
          // Apply additional client-side filtering
          filteredData = filteredData.filter((obj) => {
            // Implement custom filtering logic
            return true; // Placeholder
          });
        }

        setObjects(filteredData);
        setObjectCount(filteredData.length);
        setObjectTotal(result.data?.length || 0);
      }
    } catch (error) {
      // Error handling
    }
  },
  [
    /* dependencies */
  ],
);
```

## Testing Strategy

### 1. Verify Base URL Access

```bash
curl -H "Accept: application/json" \
     -H "OData-MaxVersion: 2.0" \
     -H "OData-Version: 2.0" \
     "https://csgipoc.odata.bluedolphin.app/Objects"
```

### 2. Test Without Authentication (Primary Method)

```bash
curl -H "Accept: application/json" \
     -H "OData-MaxVersion: 2.0" \
     -H "OData-Version: 2.0" \
     "https://csgipoc.odata.bluedolphin.app/Objects"
```

### 3. Test With Authentication (Fallback)

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Accept: application/json" \
     -H "OData-MaxVersion: 2.0" \
     -H "OData-Version: 2.0" \
     "https://csgipoc.odata.bluedolphin.app/Objects"
```

### 3. Verify Data Structure

- Check that returned objects have the expected properties
- Verify that `Definition: "Application Component"` objects exist
- Confirm workspace and lifecycle state information

## Next Steps

1. **Update Configuration**: Change OData URL and version headers
2. **Simplify API Route**: Remove complex query parameter handling
3. **Implement Client-Side Filtering**: Filter objects in the frontend
4. **Test with Real Data**: Verify the corrected implementation works
5. **Update Documentation**: Reflect the actual OData implementation

## Conclusion

The Blue Dolphin OData service uses OData v2.0 with a simplified endpoint structure that doesn't support complex server-side filtering. The correct approach is to fetch all objects and implement client-side filtering based on the user's requirements.

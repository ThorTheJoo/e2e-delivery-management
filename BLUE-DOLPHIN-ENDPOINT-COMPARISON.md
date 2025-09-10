# Blue Dolphin Endpoint Comparison - EU vs US

## Test Results Summary

**Date**: September 9, 2025  
**API Key**: `ea09e6ac-1747-4c5a-955e-a4f699ba3678`  
**Tenant**: `csgipoc`

## Infrastructure Status

| Component | EU Endpoint | US Endpoint | Status |
|-----------|-------------|-------------|---------|
| **API Service** | ✅ Operational | ✅ Operational | Both working |
| **Liveness** | ✅ "Healthy" | ✅ "Healthy" | Both working |
| **Swagger Docs** | ✅ Accessible | ✅ Accessible | Both working |
| **OpenAPI Spec** | ✅ Available | ✅ Available | Both working |

## Authentication Results

### EU Endpoint (`https://public-api.eu.bluedolphin.app`)

**Error Pattern**: `"Invalid apikey"`
```json
{
  "type": "https://tools.ietf.org/html/rfc7235#section-3.1",
  "title": "One or more validation errors occurred",
  "status": 401,
  "errors": {
    "x-api-key": ["Invalid apikey"]
  }
}
```

**Analysis**: 
- API key is recognized but invalid
- Tenant name is accepted
- Key validation fails

### US Endpoint (`https://public-api.us.bluedolphin.app`)

**Error Pattern**: `"Unknown tenant specified"`
```json
{
  "type": "https://tools.ietf.org/html/rfc7235#section-3.1",
  "title": "One or more validation errors occurred",
  "status": 401,
  "errors": {
    "tenant": ["Unknown tenant specified"]
  }
}
```

**Analysis**:
- API key is not validated (different error)
- Tenant name `csgipoc` is not recognized in US region
- Suggests tenant is EU-specific

## Key Findings

### 1. Regional Tenant Separation
- **EU Tenant**: `csgipoc` is recognized in EU region
- **US Tenant**: `csgipoc` is not recognized in US region
- **Implication**: Tenants are region-specific

### 2. API Key Validation Differences
- **EU**: Key is validated but invalid
- **US**: Key validation doesn't occur due to unknown tenant
- **Implication**: Different validation flows per region

### 3. Infrastructure Consistency
- Both regions have identical API structure
- Same endpoints and OpenAPI specification
- Same authentication requirements
- Different tenant databases

## Available Endpoints (Both Regions)

From OpenAPI specification:
- `/v1/objects` - Object management
- `/v1/object-definitions` - Object type definitions
- `/v1/workspaces` - Workspace management
- `/v1/users` - User management
- `/v1/relations` - Relationship management
- `/v1/questionnaires` - Questionnaire management
- `/v1/user-api-keys` - API key management
- `/data-collector/v1/datasources` - Data source management

## Recommendations

### 1. Use EU Endpoint
Since your tenant `csgipoc` is recognized in the EU region:
- **Primary Endpoint**: `https://public-api.eu.bluedolphin.app`
- **Focus**: Resolve API key validation issue
- **Action**: Contact Blue Dolphin admin for valid API key

### 2. API Key Resolution
The EU endpoint shows the API key is being validated but is invalid:
- Key format appears correct
- Key is being processed by authentication system
- Issue is likely: expired, wrong permissions, or wrong key type

### 3. Tenant Verification
Confirm that:
- `csgipoc` is the correct tenant name
- Tenant is properly configured in EU region
- Tenant has PUBLIC_API add-on activated

## Next Steps

### Immediate Actions
1. **Contact Blue Dolphin Administrator**:
   - Verify tenant `csgipoc` is correctly configured
   - Generate valid API key for EU region
   - Confirm PUBLIC_API add-on is activated

2. **Verify API Key Requirements**:
   - Ensure key is "User API Key" type
   - Check key expiration date
   - Verify key has required scopes

3. **Test with Valid Credentials**:
   - Retest EU endpoint with valid API key
   - Verify all CRUD operations work
   - Test object creation capabilities

### Alternative Approach
Since OData integration is fully functional:
- **Use OData for data retrieval** (already working)
- **Implement REST API when valid key is available**
- **Build hybrid solution** with both data sources

## Conclusion

**EU Endpoint**: ✅ **Infrastructure Ready** - API key validation issue only  
**US Endpoint**: ❌ **Tenant Not Recognized** - Wrong region for tenant  

**Recommendation**: Focus on resolving API key issue with EU endpoint, as the tenant is properly recognized there.

**Current Status**:
- **OData Integration**: ✅ Fully functional
- **REST API (EU)**: ❌ Invalid API key
- **REST API (US)**: ❌ Unknown tenant
- **Infrastructure**: ✅ Both regions operational

The EU endpoint is the correct choice, and the issue is specifically with the API key validation.

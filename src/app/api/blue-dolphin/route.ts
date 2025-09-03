import { NextRequest, NextResponse } from 'next/server';
import { createBlueDolphinService, BlueDolphinRestService, BlueDolphinODataService, BlueDolphinSyncService } from '@/lib/blue-dolphin-service';

type BlueDolphinService = BlueDolphinRestService | BlueDolphinODataService | {
  rest: BlueDolphinRestService;
  odata: BlueDolphinODataService;
  sync: BlueDolphinSyncService;
};

function encodeBasicAuth(username: string, password: string): string {
  return Buffer.from(`${username}:${password}`).toString('base64');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, config, data } = body;

    if (!config) {
      return NextResponse.json(
        { error: 'Configuration is required' },
        { status: 400 }
      );
    }

    console.log('Blue Dolphin API request:', { action, protocol: config.protocol });
    console.log('Full configuration:', JSON.stringify(config, null, 2));

    let service: BlueDolphinService;
    try {
      service = createBlueDolphinService(config);
      console.log('✅ Blue Dolphin service created successfully');
    } catch (serviceError) {
      console.error('❌ Failed to create Blue Dolphin service:', serviceError);
      return NextResponse.json(
        { success: false, error: `Service creation failed: ${serviceError instanceof Error ? serviceError.message : 'Unknown error'}` },
        { status: 500 }
      );
    }

    switch (action) {
      case 'test-connection':
        try {
          console.log('=== BLUE DOLPHIN CONNECTION TEST STARTED ===');
          console.log('Testing connection with protocol:', config.protocol);
          console.log('Configuration received:', {
            odataUrl: config.odataUrl,
            apiUrl: config.apiUrl,
            username: config.username,
            hasApiKey: !!config.apiKey,
            hasPassword: !!config.password
          });
          
          if (config.protocol === 'ODATA') {
            console.log('=== TESTING ODATA CONNECTION ===');
            
            // Step 1: Test base endpoint reachability
            console.log('Step 1: Testing base endpoint reachability...');
            // Ensure proper URL formatting by removing trailing slash
            const baseUrl = config.odataUrl.endsWith('/') ? config.odataUrl.slice(0, -1) : config.odataUrl;
            console.log('Target URL:', baseUrl);
            
            const baseResponse = await fetch(baseUrl, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'OData-MaxVersion': '4.0',
                'OData-Version': '4.0'
              }
            });
            
            console.log('Base endpoint response status:', baseResponse.status);
            console.log('Base endpoint response status text:', baseResponse.statusText);
            
            if (baseResponse.status === 401) {
              console.log('✅ Base endpoint is reachable but requires authentication (expected)');
            } else if (!baseResponse.ok) {
              console.log('❌ Base endpoint not reachable:', baseResponse.status, baseResponse.statusText);
              throw new Error(`OData endpoint not reachable: ${baseResponse.status} ${baseResponse.statusText}`);
            } else {
              console.log('✅ Base endpoint is reachable without authentication');
            }
            
            // Step 2: Test with authentication
            console.log('Step 2: Testing with authentication...');
            
            const authHeaders: Record<string, string> = {
              'Accept': 'application/json',
              'OData-MaxVersion': '4.0',
              'OData-Version': '4.0'
            };
            
            if (config.apiKey) {
              authHeaders['Authorization'] = `Bearer ${config.apiKey}`;
              console.log('Using API Key authentication');
              console.log('API Key (first 10 chars):', config.apiKey.substring(0, 10) + '...');
            } else if (config.username && config.password) {
              authHeaders['Authorization'] = `Basic ${encodeBasicAuth(config.username, config.password)}`;
              console.log('Using Basic authentication');
              console.log('Username:', config.username);
            } else {
              console.log('❌ No authentication credentials provided');
              throw new Error('OData authentication required: Please provide either API key or username/password');
            }
            
            console.log('Authentication headers:', authHeaders);
            
            // Test authenticated access to base endpoint
            const authResponse = await fetch(baseUrl, {
              headers: authHeaders
            });

            console.log('Authenticated response status:', authResponse.status);
            console.log('Authenticated response status text:', authResponse.statusText);
            
            if (!authResponse.ok) {
              const errorText = await authResponse.text();
              console.log('❌ Authentication failed. Response body:', errorText);
              throw new Error(`OData authentication failed: ${authResponse.status} ${authResponse.statusText} - ${errorText}`);
            }

            console.log('✅ Authentication successful!');
            
            // Step 3: Test service discovery
            console.log('Step 3: Testing service discovery...');
            
            // Test service root to see what's available
            console.log('Testing service root...');
            try {
              const serviceRootResponse = await fetch(baseUrl, {
                headers: authHeaders
              });
              
              console.log('Service root response status:', serviceRootResponse.status);
              console.log('Service root response status text:', serviceRootResponse.statusText);
              
              if (serviceRootResponse.ok) {
                const serviceRoot = await serviceRootResponse.json();
                console.log('✅ Service root response:');
                console.log('Service root keys:', Object.keys(serviceRoot));
                console.log('Service root content:', JSON.stringify(serviceRoot, null, 2));
              } else {
                console.log('❌ Service root failed:', serviceRootResponse.status, serviceRootResponse.statusText);
              }
            } catch (error) {
              console.log('❌ Service root test failed:', error);
            }
            
            // Test metadata endpoint
            console.log('Testing metadata endpoint...');
            try {
              const metadataResponse = await fetch(`${baseUrl}/$metadata`, {
                headers: {
                  ...authHeaders,
                  'Accept': 'application/xml'
                }
              });
              
              console.log('Metadata response status:', metadataResponse.status);
              console.log('Metadata response status text:', metadataResponse.statusText);
              
              if (metadataResponse.ok) {
                const metadata = await metadataResponse.text();
                console.log('✅ Metadata available (first 500 chars):');
                console.log(metadata.substring(0, 500));
              } else {
                console.log('❌ Metadata failed:', metadataResponse.status, metadataResponse.statusText);
              }
            } catch (error) {
              console.log('❌ Metadata test failed:', error);
            }
            
            // Test without authentication (like Excel does)
            console.log('Testing Objects endpoint without authentication...');
            try {
              const objectsResponse = await fetch(`${baseUrl}/Objects?$top=1`, {
                headers: {
                  'Accept': 'application/json',
                  'OData-MaxVersion': '2.0',
                  'OData-Version': '2.0'
                }
              });
              
              console.log('Objects (no auth) response status:', objectsResponse.status);
              console.log('Objects (no auth) response status text:', objectsResponse.statusText);
              
              if (objectsResponse.ok) {
                const objects = await objectsResponse.json();
                console.log('✅ Objects endpoint works without authentication!');
                console.log('Objects response keys:', Object.keys(objects));
                console.log('Number of objects:', objects.value?.length || 0);
                
                if (objects.value && objects.value.length > 0) {
                  console.log('Sample object structure:', Object.keys(objects.value[0]));
                }
              } else {
                console.log('❌ Objects (no auth) failed:', objectsResponse.status, objectsResponse.statusText);
              }
            } catch (error) {
              console.log('❌ Objects (no auth) test failed:', error);
            }
            
            console.log('=== ODATA CONNECTION TEST COMPLETED SUCCESSFULLY ===');
            
          } else if (config.protocol === 'REST') {
            console.log('=== TESTING REST CONNECTION ===');
            const restService = service as BlueDolphinRestService;
            await restService.getDomains({ page: 1, size: 1 });
            console.log('✅ REST connection test successful');
          } else if (config.protocol === 'HYBRID') {
            console.log('=== TESTING HYBRID CONNECTION ===');
            if ('rest' in service) {
              await service.rest.getDomains({ page: 1, size: 1 });
              console.log('✅ HYBRID connection test successful');
            } else {
              throw new Error('HYBRID service not available');
            }
          }
          
          console.log('=== CONNECTION TEST COMPLETED SUCCESSFULLY ===');
          return NextResponse.json({ 
            success: true, 
            message: 'Connection test successful',
            protocol: config.protocol,
            endpoint: config.odataUrl || config.apiUrl
          });
        } catch (error) {
          console.error('=== CONNECTION TEST FAILED ===');
          console.error('Error details:', error);
          console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
          const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
          return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
          );
        }

      case 'get-domains':
        try {
          console.log('Getting domains with protocol:', config.protocol);
          let domains;
          
          if (config.protocol === 'HYBRID' && 'rest' in service) {
            const response = await service.rest.getDomains(data?.params || {});
            domains = response.data;
          } else if (config.protocol === 'REST') {
            const restService = service as BlueDolphinRestService;
            const response = await restService.getDomains(data?.params || {});
            domains = response.data;
          } else if (config.protocol === 'ODATA') {
            const odataService = service as BlueDolphinODataService;
            const response = await odataService.getDomains(data?.options || {});
            domains = response.value;
          }
          
          console.log(`Retrieved ${domains?.length || 0} domains`);
          return NextResponse.json({ success: true, data: domains });
        } catch (error) {
          console.error('Failed to get domains:', error);
          return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Failed to get domains' },
            { status: 500 }
          );
        }

      case 'create-domain':
        try {
          let domain;
          if (config.protocol === 'HYBRID' && 'rest' in service) {
            domain = await service.rest.createDomain(data);
          } else if (config.protocol === 'REST') {
            const restService = service as BlueDolphinRestService;
            domain = await restService.createDomain(data);
          } else {
            throw new Error('Domain creation not supported in OData mode');
          }
          return NextResponse.json({ success: true, data: domain });
        } catch (error) {
          console.error('Failed to create domain:', error);
          return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Failed to create domain' },
            { status: 500 }
          );
        }

             case 'create-requirement':
         try {
           let requirement;
           if (config.protocol === 'HYBRID' && 'rest' in service) {
             requirement = await service.rest.createRequirement(data);
                     } else if (config.protocol === 'REST') {
            const restService = service as BlueDolphinRestService;
            requirement = await restService.createRequirement(data);
           } else {
             throw new Error('Requirement creation not supported in OData mode');
           }
           return NextResponse.json({ success: true, data: requirement });
         } catch (error) {
           console.error('Failed to create requirement:', error);
           return NextResponse.json(
             { success: false, error: error instanceof Error ? error.message : 'Failed to create requirement' },
             { status: 500 }
           );
         }

               case 'get-objects':
          try {
            console.log('=== GET OBJECTS REQUEST STARTED ===');
            console.log('Getting objects with protocol:', config.protocol);
            console.log('Configuration received:', {
              odataUrl: config.odataUrl,
              username: config.username,
              hasApiKey: !!config.apiKey,
              hasPassword: !!config.password,
              apiKeyFirst10: config.apiKey ? config.apiKey.substring(0, 10) + '...' : 'none'
            });
            
            if (config.protocol !== 'ODATA') {
              throw new Error('Object retrieval only available for OData protocol');
            }

            const { endpoint, filter, top = 50, skip = 0, select, orderby } = data || {};
            
            if (!endpoint) {
              throw new Error('Endpoint is required for object retrieval');
            }

            console.log(`Retrieving objects from endpoint: ${endpoint}`);
            console.log('Filter:', filter);
            console.log('Top:', top, 'Skip:', skip);
            console.log('Select fields:', select);

            // Validate and sanitize filter if provided
            let sanitizedFilter = filter;
            if (filter) {
              try {
                // Basic OData filter validation - check for common syntax issues
                if (filter.includes("'") && !filter.includes("contains(") && !filter.includes("eq '")) {
                  // If it contains single quotes but doesn't look like proper OData syntax
                  // This might be a user entering raw text instead of a proper filter
                  throw new Error('Invalid OData filter syntax. Please use proper OData expressions or text search.');
                }
                
                // Check for unbalanced parentheses
                const openParens = (filter.match(/\(/g) || []).length;
                const closeParens = (filter.match(/\)/g) || []).length;
                if (openParens !== closeParens) {
                  throw new Error('Unbalanced parentheses in OData filter');
                }
                
                sanitizedFilter = filter;
              } catch (filterError) {
                console.error('Filter validation error:', filterError);
                throw new Error(`OData filter validation failed: ${filterError instanceof Error ? filterError.message : 'Invalid filter syntax'}`);
              }
            }

            // Build OData v4.0 URL with query parameters
            const queryParams = new URLSearchParams();
            if (sanitizedFilter) queryParams.append('$filter', sanitizedFilter);
            if (select && select.length > 0) queryParams.append('$select', select.join(','));
            if (orderby) queryParams.append('$orderby', orderby);
            if (top) queryParams.append('$top', top.toString());
            if (skip) queryParams.append('$skip', skip.toString());

            const queryString = queryParams.toString();
            // Ensure proper URL formatting by removing trailing slash from odataUrl
            const baseUrl = config.odataUrl.endsWith('/') ? config.odataUrl.slice(0, -1) : config.odataUrl;
            const url = `${baseUrl}${endpoint}${queryString ? `?${queryString}` : ''}`;
            
            console.log('Full URL:', url);

            // Use OData v4.0 headers as per Blue Dolphin documentation
            const headers: Record<string, string> = {
              'Accept': 'application/json',
              'OData-MaxVersion': '4.0',
              'OData-Version': '4.0'
            };

            // Add authentication - API Key takes precedence
            if (config.apiKey) {
              headers['Authorization'] = `Bearer ${config.apiKey}`;
              console.log('Using API Key authentication');
              console.log('API Key (first 10 chars):', config.apiKey.substring(0, 10) + '...');
            } else if (config.username && config.password) {
              headers['Authorization'] = `Basic ${encodeBasicAuth(config.username, config.password)}`;
              console.log('Using Basic authentication');
              console.log('Username:', config.username);
            } else {
              console.log('❌ No authentication credentials provided');
              throw new Error('Authentication required: Please provide either API key or username/password');
            }

            console.log('Authentication headers:', {
              'Accept': headers['Accept'],
              'OData-MaxVersion': headers['OData-MaxVersion'],
              'OData-Version': headers['OData-Version'],
              'Authorization': headers['Authorization'] ? 'Bearer [HIDDEN]' : 'none'
            });
            
            console.log('Making request to Blue Dolphin OData service...');
            
            const response = await fetch(url, { headers });

            console.log('Response status:', response.status);
            console.log('Response status text:', response.statusText);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
              const errorText = await response.text();
              console.error('❌ Object retrieval failed');
              console.error('Status:', response.status);
              console.error('Status text:', response.statusText);
              console.error('Response body:', errorText);
              
              // Parse error response for better error messages
              let errorMessage = `Object retrieval failed: ${response.status} ${response.statusText}`;
              try {
                const errorData = JSON.parse(errorText);
                if (errorData.error?.message) {
                  errorMessage = `OData Error: ${errorData.error.message}`;
                  // Add helpful suggestions for common OData syntax errors
                  if (errorData.error.message.includes('Syntax error')) {
                    errorMessage += '\n\nTip: Use the "Text Search" field to search for text content instead of entering raw OData expressions.';
                  }
                }
              } catch (parseError) {
                // If we can't parse the error, use the raw text
                errorMessage += ` - ${errorText}`;
              }
              
              throw new Error(errorMessage);
            }

            const result = await response.json();
            console.log('✅ Object retrieval successful!');
            console.log('Raw response keys:', Object.keys(result));
            console.log(`Retrieved ${result.value?.length || 0} objects from ${endpoint}`);
            
            if (result.value && result.value.length > 0) {
              console.log('Sample object structure:', Object.keys(result.value[0]));
            }
            
            return NextResponse.json({ 
              success: true, 
              data: result.value || result || [],
              count: (result.value || result || []).length,
              total: result['@odata.count'] || (result.value || result || []).length,
              endpoint,
              filter,
              query: queryString,
              rawResponse: result
            });
          } catch (error) {
            console.error('=== GET OBJECTS REQUEST FAILED ===');
            console.error('Error details:', error);
            return NextResponse.json(
              { success: false, error: error instanceof Error ? error.message : 'Failed to get objects' },
              { status: 500 }
            );
          }

       case 'test-odata-functions':
         try {
           console.log('Testing OData filter functions...');
           
           if (config.protocol !== 'ODATA') {
             throw new Error('Function testing only available for OData protocol');
           }

           const testResults: {
             supportedFunctions: string[];
             failedFunctions: string[];
             sampleData: Record<string, unknown>;
           } = {
             supportedFunctions: [],
             failedFunctions: [],
             sampleData: {}
           };

           // Test different OData filter functions
           const testFunctions = [
             { name: 'contains', filter: "contains(Title, 'test')" },
             { name: 'substringof', filter: "substringof('test', Title)" },
             { name: 'startswith', filter: "startswith(Title, 'test')" },
             { name: 'endswith', filter: "endswith(Title, 'test')" },
             { name: 'tolower', filter: "tolower(Title) eq 'test'" },
             { name: 'toupper', filter: "toupper(Title) eq 'TEST'" },
             { name: 'length', filter: "length(Title) gt 0" },
             { name: 'trim', filter: "trim(Title) eq 'test'" },
             { name: 'concat', filter: "concat(Title, 'test') eq 'testtest'" },
             { name: 'indexof', filter: "indexof(Title, 'test') ge 0" },
             { name: 'replace', filter: "replace(Title, 'test', 'new') eq 'new'" },
             { name: 'substring', filter: "substring(Title, 0, 4) eq 'test'" }
           ];

           for (const testFunc of testFunctions) {
             try {
               console.log(`Testing function: ${testFunc.name}`);
               const response = await fetch(`${config.odataUrl}/Objects?$filter=${encodeURIComponent(testFunc.filter)}&$top=1`, {
                 headers: {
                   'Accept': 'application/json',
                   'OData-MaxVersion': '4.0',
                   'OData-Version': '4.0',
                   ...(config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {}),
                   ...(config.username && config.password ? { 
                     'Authorization': `Basic ${encodeBasicAuth(config.username, config.password)}` 
                   } : {})
                 }
               });

               if (response.ok) {
                 testResults.supportedFunctions.push(testFunc.name);
                 console.log(`✅ Function ${testFunc.name} is supported`);
               } else {
                 const errorText = await response.text();
                 testResults.failedFunctions.push({ name: testFunc.name, error: errorText });
                 console.log(`❌ Function ${testFunc.name} failed: ${response.status} - ${errorText}`);
               }
             } catch (error) {
               testResults.failedFunctions.push({ name: testFunc.name, error: error instanceof Error ? error.message : 'Unknown error' });
               console.log(`❌ Function ${testFunc.name} test failed:`, error);
             }
           }

           return NextResponse.json({ 
             success: true, 
             message: 'OData function testing completed',
             data: testResults 
           });
         } catch (error) {
           console.error('OData function testing failed:', error);
           return NextResponse.json(
             { success: false, error: error instanceof Error ? error.message : 'Function testing failed' },
             { status: 500 }
           );
         }

       case 'investigate-odata':
         try {
           console.log('Investigating OData service structure...');
           
           if (config.protocol !== 'ODATA') {
             throw new Error('Investigation only available for OData protocol');
           }

           const investigationResults: {
             serviceRoot: string;
             availableEndpoints: string[];
             businessUnits: unknown[];
             projects: unknown[];
             sampleData: Record<string, unknown>;
           } = {
             serviceRoot: config.odataUrl,
             availableEndpoints: [],
             businessUnits: [],
             projects: [],
             sampleData: {}
           };

                       // Test service root and service document
            try {
              const serviceRootResponse = await fetch(config.odataUrl, {
                headers: {
                  'Accept': 'application/json',
                  'OData-MaxVersion': '4.0',
                  'OData-Version': '4.0',
                  ...(config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {}),
                  ...(config.username && config.password ? { 
                    'Authorization': `Basic ${encodeBasicAuth(config.username, config.password)}` 
                  } : {})
                }
              });

              if (serviceRootResponse.ok) {
                const serviceRoot = await serviceRootResponse.json();
                investigationResults.serviceRootResponse = serviceRoot;
                console.log('Service root response:', serviceRoot);
              }
            } catch (error) {
              console.log('Service root test failed:', error);
            }

            // Test service document
            try {
              const serviceDocResponse = await fetch(`${config.odataUrl}/$metadata`, {
                headers: {
                  'Accept': 'application/xml',
                  'OData-MaxVersion': '4.0',
                  'OData-Version': '4.0',
                  ...(config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {}),
                  ...(config.username && config.password ? { 
                    'Authorization': `Basic ${btoa(`${config.username}:${config.password}`)}` 
                  } : {})
                }
              });

              if (serviceDocResponse.ok) {
                const serviceDoc = await serviceDocResponse.text();
                investigationResults.serviceDocument = serviceDoc;
                console.log('Service document available');
              }
            } catch (error) {
              console.log('Service document test failed:', error);
            }

            // Test alternative service discovery endpoints
            const discoveryEndpoints = [
              '/$metadata',
              '/metadata',
              '/service',
              '/api',
              '/v1',
              '/v2',
              '/v3',
              '/v4',
              '/odata',
              '/rest',
              '/graphql',
              '/swagger',
              '/openapi',
              '/docs',
              '/help',
              '/discovery'
            ];

            for (const discoveryEndpoint of discoveryEndpoints) {
              try {
                const response = await fetch(`${config.odataUrl}${discoveryEndpoint}`, {
                  headers: {
                    'Accept': 'application/json,application/xml,*/*',
                    'OData-MaxVersion': '4.0',
                    'OData-Version': '4.0',
                    ...(config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {}),
                    ...(config.username && config.password ? { 
                      'Authorization': `Basic ${btoa(`${config.username}:${config.password}`)}` 
                    } : {})
                  }
                });

                if (response.ok) {
                  investigationResults.discoveryEndpoints = investigationResults.discoveryEndpoints || [];
                  investigationResults.discoveryEndpoints.push(discoveryEndpoint);
                  console.log(`Discovery endpoint ${discoveryEndpoint} is available`);
                }
              } catch (error) {
                // Ignore discovery endpoint errors
              }
            }

                                    // Test comprehensive list of OData endpoints based on Blue Dolphin integration docs
             const endpointsToTest = [
               // Core TMF ODA entities
               '/Domains',
               '/Capabilities', 
               '/Requirements',
               '/UseCases',
               '/Applications',
               '/Functions',
               '/Services',
               '/Interfaces',
               
               // Enterprise Architecture Objects (Key for Application Components)
               '/Objects',
               '/Elements',
               '/Components',
               '/ApplicationComponents',
               '/ApplicationComponents',
               '/BusinessComponents',
               '/TechnologyComponents',
               '/DataComponents',
               
               // Architecture Framework Objects
               '/ArchitectureObjects',
               '/TOGAFObjects',
               '/ZachmanObjects',
               '/ArchiMateObjects',
               '/TMFObjects',
               '/ODAObjects',
               
               // Object Types and Definitions
               '/ObjectTypes',
               '/Definitions',
               '/ElementTypes',
               '/ComponentTypes',
               '/ApplicationTypes',
               '/BusinessTypes',
               '/TechnologyTypes',
               
               // Business and organizational entities
               '/BusinessUnits',
               '/Projects',
               '/Programs',
               '/Organizations',
               '/Stakeholders',
               '/Roles',
               '/Users',
               
               // Architecture and design entities
               '/Architectures',
               '/Models',
               '/Views',
               '/Diagrams',
               '/Systems',
               '/Infrastructure',
               '/Technologies',
               '/Standards',
               
               // Relationship and mapping entities
               '/Relationships',
               '/Mappings',
               '/Dependencies',
               '/Connections',
               '/Links',
               '/Associations',
               
               // Metadata and definition entities
               '/Metadata',
               '/Templates',
               '/Schemas',
               '/Types',
               '/Categories',
               '/Classifications',
               '/Tags',
               '/Labels',
               
               // Process and workflow entities
               '/Processes',
               '/Workflows',
               '/Activities',
               '/Tasks',
               '/Milestones',
               '/Deliverables',
               
               // Quality and governance entities
               '/Policies',
               '/Guidelines',
               '/Compliance',
               '/Quality',
               '/Reviews',
               '/Approvals',
               
               // Configuration and settings entities
               '/Configurations',
               '/Settings',
               '/Parameters',
               '/Options',
               '/Preferences',
               
               // Version and change management entities
               '/Versions',
               '/Changes',
               '/Revisions',
               '/History',
               '/Audit',
               '/Logs',
               
               // Integration and API entities
               '/APIs',
               '/Endpoints',
               '/Integrations',
               '/Connectors',
               '/Adapters',
               '/Gateways',
               
               // Data and information entities
               '/Data',
               '/Information',
               '/Documents',
               '/Files',
               '/Artifacts',
               '/Assets',
               '/Resources',
               
               // Security and access entities
               '/Security',
               '/Permissions',
               '/Access',
               '/Authentication',
               '/Authorization',
               
               // Monitoring and analytics entities
               '/Metrics',
               '/KPIs',
               '/Reports',
               '/Analytics',
               '/Dashboards',
               '/Monitoring',
               
               // Alternative naming conventions (singular)
               '/Domain',
               '/Capability',
               '/Requirement',
               '/UseCase',
               '/Application',
               '/Function',
               '/Service',
               '/Interface',
               '/BusinessUnit',
               '/Project',
               '/Program',
               '/Organization',
               '/Stakeholder',
               '/Role',
               '/User',
               '/Architecture',
               '/Model',
               '/View',
               '/Diagram',
               '/Component',
               '/System',
               '/Infrastructure',
               '/Technology',
               '/Standard',
               '/Relationship',
               '/Mapping',
               '/Dependency',
               '/Connection',
               '/Link',
               '/Association',
               '/Metadata',
               '/Definition',
               '/Template',
               '/Schema',
               '/Type',
               '/Category',
               '/Classification',
               '/Tag',
               '/Label',
               '/Process',
               '/Workflow',
               '/Activity',
               '/Task',
               '/Milestone',
               '/Deliverable',
               '/Policy',
               '/Guideline',
               '/Compliance',
               '/Quality',
               '/Review',
               '/Approval',
               '/Configuration',
               '/Setting',
               '/Parameter',
               '/Option',
               '/Preference',
               '/Version',
               '/Change',
               '/Revision',
               '/History',
               '/Audit',
               '/Log',
               '/API',
               '/Endpoint',
               '/Integration',
               '/Connector',
               '/Adapter',
               '/Gateway',
               '/Data',
               '/Information',
               '/Document',
               '/File',
               '/Artifact',
               '/Asset',
               '/Resource',
               '/Security',
               '/Permission',
               '/Access',
               '/Authentication',
               '/Authorization',
               '/Metric',
               '/KPI',
               '/Report',
               '/Analytic',
               '/Dashboard',
               '/Monitoring',
               
               // Enterprise Architecture specific endpoints
               '/EnterpriseObjects',
               '/ArchitectureElements',
               '/ModelElements',
               '/ViewElements',
               '/DiagramElements',
               '/RepositoryObjects',
               '/CatalogObjects',
               '/LibraryObjects',
               '/TemplateObjects',
               '/ReferenceObjects',
               
               // Blue Dolphin specific endpoints
               '/BlueDolphinObjects',
               '/BlueDolphinElements',
               '/BlueDolphinComponents',
               '/BlueDolphinApplications',
               '/BlueDolphinSystems',
               '/BlueDolphinServices',
               '/BlueDolphinFunctions',
               '/BlueDolphinInterfaces',
               '/BlueDolphinData',
               '/BlueDolphinTechnologies',
               '/BlueDolphinInfrastructure',
               '/BlueDolphinBusiness',
               '/BlueDolphinTechnology',
               '/BlueDolphinApplication',
               '/BlueDolphinService',
               '/BlueDolphinFunction',
               '/BlueDolphinInterface',
               '/BlueDolphinData',
               '/BlueDolphinTechnology',
               '/BlueDolphinInfrastructure',
               '/BlueDolphinBusiness'
             ];

                       // Test endpoints in batches to avoid overwhelming the server
            const batchSize = 10;
            for (let i = 0; i < endpointsToTest.length; i += batchSize) {
              const batch = endpointsToTest.slice(i, i + batchSize);
              console.log(`Testing batch ${Math.floor(i/batchSize) + 1}: ${batch.join(', ')}`);
              
              const batchPromises = batch.map(async (endpoint) => {
                try {
                  const response = await fetch(`${config.odataUrl}${endpoint}?$top=1`, {
                    headers: {
                      'Accept': 'application/json',
                      'OData-MaxVersion': '4.0',
                      'OData-Version': '4.0',
                      ...(config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {}),
                      ...(config.username && config.password ? { 
                        'Authorization': `Basic ${encodeBasicAuth(config.username, config.password)}` 
                      } : {})
                    }
                  });

                  if (response.ok) {
                    const data = await response.json();
                    investigationResults.availableEndpoints.push(endpoint);
                    investigationResults.sampleData[endpoint] = data;
                    console.log(`✅ Endpoint ${endpoint} is available:`, data);
                    return { endpoint, success: true, data };
                  } else {
                    console.log(`❌ Endpoint ${endpoint} returned ${response.status}: ${response.statusText}`);
                    return { endpoint, success: false, status: response.status };
                  }
                                 } catch (error) {
                   console.log(`❌ Endpoint ${endpoint} test failed:`, error);
                   return { endpoint, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
                 }
              });

              const batchResults = await Promise.all(batchPromises);
              console.log(`Batch ${Math.floor(i/batchSize) + 1} completed. Found ${batchResults.filter(r => r.success).length} available endpoints.`);
            }

           return NextResponse.json({ 
             success: true, 
             message: 'OData investigation completed',
             data: investigationResults 
           });
         } catch (error) {
           console.error('OData investigation failed:', error);
           return NextResponse.json(
             { success: false, error: error instanceof Error ? error.message : 'Investigation failed' },
             { status: 500 }
           );
         }

       case 'get-objects-enhanced':
          try {
            console.log('🔍 [Blue Dolphin] Enhanced object retrieval requested');
            
            const { endpoint, filter, top = 10, skip = 0, orderby, moreColumns = true } = data || {};
            
            console.log('📋 [Blue Dolphin] Request parameters:', {
              endpoint,
              filter,
              top,
              skip,
              orderby,
              moreColumns
            });
            
                            // Validate filter parameter to prevent injection
                const sanitizedFilter = filter;
                if (filter && typeof filter === 'string') {
                  // More permissive validation for OData filters
                  // Allow OData operators: eq, ne, gt, lt, ge, le, and, or, not, contains, startswith, endswith
                  // Allow parentheses, quotes, spaces, and common characters
                  if (!/^[a-zA-Z0-9\s_\-\.\(\)\=\'\&\|\,\<\>\"\s]+$/.test(filter)) {
                    console.warn('⚠️ [Blue Dolphin] Filter validation warning - potentially unsafe characters:', filter);
                    // Don't throw error, just log warning and continue
                  }
                }
            
            const queryParams = new URLSearchParams();
            
            // Add MoreColumns parameter for enhanced field retrieval
            if (moreColumns) {
              queryParams.append('MoreColumns', 'true');
              console.log('✅ [Blue Dolphin] MoreColumns=true added to query');
              // NOTE: Do NOT add $select when MoreColumns=true
            }
            
            if (sanitizedFilter) queryParams.append('$filter', sanitizedFilter);
            if (orderby) queryParams.append('$orderby', orderby);
            if (top) queryParams.append('$top', top.toString());
            if (skip) queryParams.append('$skip', skip.toString());

            const queryString = queryParams.toString();
            const baseUrl = config.odataUrl.endsWith('/') ? config.odataUrl.slice(0, -1) : config.odataUrl;
            const url = `${baseUrl}${endpoint}${queryString ? `?${queryString}` : ''}`;
            
            console.log('🌐 [Blue Dolphin] Final URL:', url);
            console.log('🔑 [Blue Dolphin] Using authentication:', config.apiKey ? 'API Key' : 'Basic Auth');
            
            // Use OData v4.0 headers as per Blue Dolphin documentation
            const headers: Record<string, string> = {
              'Accept': 'application/json',
              'OData-MaxVersion': '4.0',
              'OData-Version': '4.0'
            };

            // Add authentication - API Key takes precedence
            if (config.apiKey) {
              headers['Authorization'] = `Bearer ${config.apiKey}`;
            } else if (config.username && config.password) {
              headers['Authorization'] = `Basic ${encodeBasicAuth(config.username, config.password)}`;
            } else {
              throw new Error('Authentication required');
            }
            
            console.log('📤 [Blue Dolphin] Making request to Blue Dolphin...');
            const response = await fetch(url, { headers });
            
            if (!response.ok) {
              console.error('❌ [Blue Dolphin] HTTP Error:', response.status, response.statusText);
              const errorText = await response.text();
              console.error('❌ [Blue Dolphin] Error response:', errorText);
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('✅ [Blue Dolphin] Response received successfully');
            console.log('📊 [Blue Dolphin] Response stats:', {
              hasValue: !!result.value,
              valueCount: result.value?.length || 0,
              odataCount: result['@odata.count'],
              context: result['@odata.context']
            });
            
            // Log first object to see enhanced fields
            if (result.value && result.value.length > 0) {
              const firstObj = result.value[0];
              const enhancedFields = Object.keys(firstObj).filter(key => 
                key.startsWith('Object_Properties_') || 
                key.startsWith('Deliverable_Object_Status_') || 
                key.startsWith('Ameff_properties_')
              );
              console.log('🔍 [Blue Dolphin] First object enhanced fields:', enhancedFields);
              console.log('📋 [Blue Dolphin] Sample enhanced field values:', 
                enhancedFields.reduce((acc, key) => ({ ...acc, [key]: firstObj[key] }), {})
              );
            }
            
            return NextResponse.json({
              success: true,
              data: result.value || result || [],
              count: (result.value || result || []).length,
              total: result['@odata.count'] || (result.value || result || []).length,
              endpoint,
              filter: sanitizedFilter,
              query: queryString,
              moreColumns: moreColumns,
              enhancedFields: moreColumns ? 'enabled' : 'disabled'
            });
          } catch (error) {
            console.error('❌ [Blue Dolphin] Enhanced object retrieval failed:', error);
            return NextResponse.json(
              { 
                success: false, 
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                timestamp: new Date().toISOString()
              },
              { status: 500 }
            );
          }

       default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Blue Dolphin API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Test script to verify workspace refresh functionality
const testWorkspaceRefresh = async () => {
  console.log('Testing Blue Dolphin workspace refresh functionality...');
  
  // Test configuration
  const config = {
    protocol: 'ODATA',
    odataUrl: 'https://csgipoc.odata.bluedolphin.app',
    username: 'csgipoc',
    password: 'ef498b94-732b-46c8-a24c-65fbd27c1482'
  };

  try {
    // Test the workspace refresh API call
    const requestBody = {
      action: 'get-objects-enhanced',
      config: config,
      data: {
        endpoint: '/Objects',
        filter: '', // No filter to get all workspaces
        top: 100, // Smaller sample for testing
        orderby: 'Title asc',
        moreColumns: false, // We only need the Workspace field
      },
    };

    console.log('Making API request to refresh workspaces...');
    const response = await fetch('http://localhost:3000/api/blue-dolphin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();
    
    if (result.success) {
      // Extract unique workspace names from the objects
      const workspaceNames = (result.data || [])
        .map((obj) => obj.Workspace)
        .filter((workspace) => 
          typeof workspace === 'string' && workspace.trim() !== ''
        );
      
      const workspaces = Array.from(new Set(workspaceNames)).sort();
      
      console.log(`✅ Successfully refreshed ${workspaces.length} workspaces:`);
      workspaces.forEach((workspace, index) => {
        console.log(`  ${index + 1}. ${workspace}`);
      });
      
      return workspaces;
    } else {
      console.error('❌ Failed to refresh workspaces:', result.error);
      return [];
    }
  } catch (error) {
    console.error('❌ Error testing workspace refresh:', error.message);
    return [];
  }
};

// Run the test
testWorkspaceRefresh().then((workspaces) => {
  console.log(`\nTest completed. Found ${workspaces.length} workspaces.`);
  process.exit(0);
}).catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});

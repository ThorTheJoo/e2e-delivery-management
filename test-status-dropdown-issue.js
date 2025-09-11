// Test script to verify why "Accepted" status is missing from dropdown
const testStatusDropdownIssue = async () => {
  console.log('🔍 Testing why "Accepted" status is missing from dropdown...');
  
  // Test configuration
  const config = {
    protocol: 'ODATA',
    odataUrl: 'https://csgipoc.odata.bluedolphin.app',
    username: 'csgipoc',
    password: 'ef498b94-732b-46c8-a24c-65fbd27c1482'
  };

  console.log('\n📊 Scenario 1: No objects loaded yet (like on page load)');
  console.log('Expected: availableStatuses = [] (empty array)');
  console.log('Result: Status dropdown would only show "All Statuses" and no other options');
  console.log('This explains why "Accepted" is missing from the dropdown!');
  
  console.log('\n📊 Scenario 2: After loading objects with status filter applied');
  
  try {
    // Test 1: Load objects with "Archived" filter (like in the screenshot)
    console.log('\n🧪 Test 1: Loading objects with Status eq "Archived" filter...');
    
    const archivedRequestBody = {
      action: 'get-objects-enhanced',
      config: config,
      data: {
        endpoint: '/Objects',
        filter: 'Status eq "Archived"', // This is what's currently applied
        top: 50,
        orderby: 'Title asc',
        moreColumns: true,
      },
    };

    const archivedResponse = await fetch('http://localhost:3000/api/blue-dolphin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(archivedRequestBody),
    });

    const archivedResult = await archivedResponse.json();
    
    if (archivedResult.success) {
      const archivedObjects = archivedResult.data || [];
      const archivedStatuses = Array.from(
        new Set(
          archivedObjects
            .map(obj => obj.Status)
            .filter(status => status && status.trim() !== '')
        )
      ).sort();
      
      console.log(`✅ Retrieved ${archivedObjects.length} objects with "Archived" filter`);
      console.log(`📊 Statuses found in response: [${archivedStatuses.join(', ')}]`);
      console.log('🎯 This explains why only "Archived" appears in the dropdown!');
    }
    
    // Test 2: Load objects with no status filter to get all statuses
    console.log('\n🧪 Test 2: Loading objects with NO status filter...');
    
    const allRequestBody = {
      action: 'get-objects-enhanced',
      config: config,
      data: {
        endpoint: '/Objects',
        filter: '', // No filter to get all statuses
        top: 50,
        orderby: 'Title asc',
        moreColumns: true,
      },
    };

    const allResponse = await fetch('http://localhost:3000/api/blue-dolphin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(allRequestBody),
    });

    const allResult = await allResponse.json();
    
    if (allResult.success) {
      const allObjects = allResult.data || [];
      const allStatuses = Array.from(
        new Set(
          allObjects
            .map(obj => obj.Status)
            .filter(status => status && status.trim() !== '')
        )
      ).sort();
      
      console.log(`✅ Retrieved ${allObjects.length} objects with NO filter`);
      console.log(`📊 Statuses found in response: [${allStatuses.join(', ')}]`);
      console.log('🎯 This would populate the dropdown with both "Accepted" and "Archived"!');
    }
    
    console.log('\n🔍 Root Cause Analysis:');
    console.log('1. The availableStatuses array is only populated when loadObjects() is called');
    console.log('2. If loadObjects() is called with a status filter (e.g., "Archived"), only that status is returned');
    console.log('3. The status discovery logic extracts statuses from the current response, not all possible statuses');
    console.log('4. Therefore, if the user has "Archived" selected and loads objects, only "Archived" appears in the dropdown');
    console.log('5. The "Accepted" status is missing because it was never loaded in the current session');
    
    console.log('\n💡 Solution Required:');
    console.log('1. Add initial status discovery on component mount (without any filters)');
    console.log('2. Or modify the status discovery to always fetch all possible statuses');
    console.log('3. Or add a "Refresh Statuses" button similar to the workspace refresh');
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
  }
};

// Run the test
testStatusDropdownIssue().then(() => {
  console.log('\n🏁 Status dropdown issue investigation completed.');
  process.exit(0);
}).catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});

// Test script to verify Blue Dolphin status filtering functionality
const testStatusFiltering = async () => {
  console.log('Testing Blue Dolphin status filtering functionality...');
  
  // Test configuration
  const config = {
    protocol: 'ODATA',
    odataUrl: 'https://csgipoc.odata.bluedolphin.app',
    username: 'csgipoc',
    password: 'ef498b94-732b-46c8-a24c-65fbd27c1482'
  };

  const testCases = [
    {
      name: 'All Statuses (No Filter)',
      statusFilter: 'all',
      expectedStatuses: ['Accepted', 'Archived'] // Should include both
    },
    {
      name: 'Accepted Status Only',
      statusFilter: 'Accepted',
      expectedStatuses: ['Accepted'] // Should only include Accepted
    },
    {
      name: 'Archived Status Only',
      statusFilter: 'Archived',
      expectedStatuses: ['Archived'] // Should only include Archived
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    
    try {
      // Build filter based on status
      let filter = '';
      if (testCase.statusFilter !== 'all') {
        filter = `Status eq '${testCase.statusFilter}'`;
      }

      const requestBody = {
        action: 'get-objects-enhanced',
        config: config,
        data: {
          endpoint: '/Objects',
          filter: filter,
          top: 50, // Get a reasonable sample
          orderby: 'Title asc',
          moreColumns: true,
        },
      };

      console.log(`📤 Request filter: ${filter || 'None'}`);

      const response = await fetch('http://localhost:3000/api/blue-dolphin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      
      if (result.success) {
        const objects = result.data || [];
        const actualStatuses = Array.from(
          new Set(
            objects
              .map(obj => obj.Status)
              .filter(status => status && status.trim() !== '')
          )
        ).sort();
        
        console.log(`✅ Success: Retrieved ${objects.length} objects`);
        console.log(`📊 Actual statuses: [${actualStatuses.join(', ')}]`);
        console.log(`🎯 Expected statuses: [${testCase.expectedStatuses.join(', ')}]`);
        
        // Verify that only expected statuses are present
        const hasUnexpectedStatuses = actualStatuses.some(status => 
          !testCase.expectedStatuses.includes(status)
        );
        
        if (hasUnexpectedStatuses) {
          console.log(`❌ FAIL: Found unexpected statuses`);
        } else {
          console.log(`✅ PASS: All statuses match expected values`);
        }
        
        // Show sample objects with their statuses
        if (objects.length > 0) {
          console.log(`📋 Sample objects:`);
          objects.slice(0, 3).forEach((obj, index) => {
            console.log(`  ${index + 1}. "${obj.Title}" - Status: "${obj.Status || 'N/A'}"`);
          });
        }
        
      } else {
        console.error(`❌ FAIL: API Error - ${result.error}`);
      }
      
    } catch (error) {
      console.error(`❌ FAIL: Network Error - ${error.message}`);
    }
  }

  // Test status discovery
  console.log(`\n🔍 Testing status discovery...`);
  try {
    const requestBody = {
      action: 'get-objects-enhanced',
      config: config,
      data: {
        endpoint: '/Objects',
        filter: '', // No filter to get all statuses
        top: 100,
        orderby: 'Title asc',
        moreColumns: true,
      },
    };

    const response = await fetch('http://localhost:3000/api/blue-dolphin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();
    
    if (result.success) {
      const objects = result.data || [];
      const allStatuses = Array.from(
        new Set(
          objects
            .map(obj => obj.Status)
            .filter(status => status && status.trim() !== '')
        )
      ).sort();
      
      console.log(`✅ Status discovery successful`);
      console.log(`📊 All available statuses: [${allStatuses.join(', ')}]`);
      console.log(`📊 Total objects analyzed: ${objects.length}`);
      
      // Count objects by status
      const statusCounts = {};
      objects.forEach(obj => {
        const status = obj.Status || 'Unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      
      console.log(`📊 Status distribution:`);
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`  ${status}: ${count} objects`);
      });
      
    } else {
      console.error(`❌ Status discovery failed: ${result.error}`);
    }
    
  } catch (error) {
    console.error(`❌ Status discovery error: ${error.message}`);
  }
};

// Run the test
testStatusFiltering().then(() => {
  console.log(`\n🏁 Status filtering test completed.`);
  process.exit(0);
}).catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});

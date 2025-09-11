// Investigation script to check actual status values in Blue Dolphin OData
const investigateStatusValues = async () => {
  console.log('🔍 Investigating Blue Dolphin OData status values...');
  
  // Test configuration
  const config = {
    protocol: 'ODATA',
    odataUrl: 'https://csgipoc.odata.bluedolphin.app',
    username: 'csgipoc',
    password: 'ef498b94-732b-46c8-a24c-65fbd27c1482'
  };

  try {
    // Get a sample of objects to analyze status values
    const requestBody = {
      action: 'get-objects-enhanced',
      config: config,
      data: {
        endpoint: '/Objects',
        filter: '', // No filter to get all statuses
        top: 200, // Get a larger sample
        orderby: 'Title asc',
        moreColumns: true,
      },
    };

    console.log('📤 Requesting objects to analyze status values...');

    const response = await fetch('http://localhost:3000/api/blue-dolphin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();
    
    if (result.success) {
      const objects = result.data || [];
      console.log(`✅ Successfully retrieved ${objects.length} objects for analysis`);
      
      // Analyze the Status field
      console.log('\n📊 Status Field Analysis:');
      const statusValues = objects
        .map(obj => obj.Status)
        .filter(status => status !== null && status !== undefined);
      
      const uniqueStatuses = Array.from(new Set(statusValues)).sort();
      console.log(`📋 Unique Status values found: [${uniqueStatuses.join(', ')}]`);
      console.log(`📊 Total objects with Status field: ${statusValues.length}`);
      
      // Count occurrences of each status
      const statusCounts = {};
      statusValues.forEach(status => {
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      
      console.log('\n📊 Status Distribution:');
      Object.entries(statusCounts)
        .sort(([,a], [,b]) => b - a)
        .forEach(([status, count]) => {
          const percentage = ((count / statusValues.length) * 100).toFixed(1);
          console.log(`  "${status}": ${count} objects (${percentage}%)`);
        });
      
      // Check for "Accepted" status specifically
      const hasAccepted = uniqueStatuses.includes('Accepted');
      console.log(`\n🎯 "Accepted" status found: ${hasAccepted ? 'YES' : 'NO'}`);
      
      if (hasAccepted) {
        const acceptedCount = statusCounts['Accepted'] || 0;
        const acceptedPercentage = ((acceptedCount / statusValues.length) * 100).toFixed(1);
        console.log(`📊 "Accepted" objects: ${acceptedCount} (${acceptedPercentage}%)`);
      }
      
      // Analyze enhanced status fields
      console.log('\n🔍 Enhanced Status Fields Analysis:');
      
      // Check Deliverable_Object_Status_Status
      const deliverableStatusValues = objects
        .map(obj => obj.Deliverable_Object_Status_Status)
        .filter(status => status !== null && status !== undefined && status.trim() !== '');
      
      if (deliverableStatusValues.length > 0) {
        const uniqueDeliverableStatuses = Array.from(new Set(deliverableStatusValues)).sort();
        console.log(`📋 Deliverable_Object_Status_Status values: [${uniqueDeliverableStatuses.join(', ')}]`);
        console.log(`📊 Objects with Deliverable_Object_Status_Status: ${deliverableStatusValues.length}`);
      } else {
        console.log('📋 No Deliverable_Object_Status_Status values found');
      }
      
      // Check Object_Properties_Deliverable_Object_Status
      const objectPropsStatusValues = objects
        .map(obj => obj.Object_Properties_Deliverable_Object_Status)
        .filter(status => status !== null && status !== undefined && status.trim() !== '');
      
      if (objectPropsStatusValues.length > 0) {
        const uniqueObjectPropsStatuses = Array.from(new Set(objectPropsStatusValues)).sort();
        console.log(`📋 Object_Properties_Deliverable_Object_Status values: [${uniqueObjectPropsStatuses.join(', ')}]`);
        console.log(`📊 Objects with Object_Properties_Deliverable_Object_Status: ${objectPropsStatusValues.length}`);
      } else {
        console.log('📋 No Object_Properties_Deliverable_Object_Status values found');
      }
      
      // Show sample objects with their status values
      console.log('\n📋 Sample Objects with Status Values:');
      objects.slice(0, 10).forEach((obj, index) => {
        console.log(`  ${index + 1}. "${obj.Title}"`);
        console.log(`     Status: "${obj.Status || 'N/A'}"`);
        if (obj.Deliverable_Object_Status_Status) {
          console.log(`     Deliverable_Object_Status_Status: "${obj.Deliverable_Object_Status_Status}"`);
        }
        if (obj.Object_Properties_Deliverable_Object_Status) {
          console.log(`     Object_Properties_Deliverable_Object_Status: "${obj.Object_Properties_Deliverable_Object_Status}"`);
        }
        console.log('');
      });
      
      // Test filtering with different status values
      console.log('\n🧪 Testing Status Filtering:');
      
      for (const status of uniqueStatuses) {
        try {
          const filterRequestBody = {
            action: 'get-objects-enhanced',
            config: config,
            data: {
              endpoint: '/Objects',
              filter: `Status eq '${status}'`,
              top: 10,
              orderby: 'Title asc',
              moreColumns: true,
            },
          };

          const filterResponse = await fetch('http://localhost:3000/api/blue-dolphin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(filterRequestBody),
          });

          const filterResult = await filterResponse.json();
          
          if (filterResult.success) {
            const filteredObjects = filterResult.data || [];
            console.log(`  ✅ Status "${status}": ${filteredObjects.length} objects found`);
          } else {
            console.log(`  ❌ Status "${status}": Filter failed - ${filterResult.error}`);
          }
        } catch (error) {
          console.log(`  ❌ Status "${status}": Error - ${error.message}`);
        }
      }
      
    } else {
      console.error(`❌ Failed to retrieve objects: ${result.error}`);
    }
    
  } catch (error) {
    console.error(`❌ Investigation failed: ${error.message}`);
  }
};

// Run the investigation
investigateStatusValues().then(() => {
  console.log('\n🏁 Status investigation completed.');
  process.exit(0);
}).catch((error) => {
  console.error('Investigation failed:', error);
  process.exit(1);
});

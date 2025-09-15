// Debug script to check dashboard data availability
console.log('=== Dashboard Data Debug ===');

// Check localStorage data
console.log('1. Blue Dolphin Data:');
try {
  const blueDolphinData = localStorage.getItem('blueDolphinTraversalObjects');
  if (blueDolphinData) {
    const parsed = JSON.parse(blueDolphinData);
    console.log('   - Objects count:', parsed.objects?.length || 0);
    console.log('   - Object types:', parsed.objectTypes);
    console.log('   - Timestamp:', parsed.timestamp);
  } else {
    console.log('   - No Blue Dolphin data found');
  }
} catch (error) {
  console.error('   - Error parsing Blue Dolphin data:', error);
}

console.log('2. SpecSync Data:');
try {
  const specSyncData = localStorage.getItem('specsync-data');
  if (specSyncData) {
    const parsed = JSON.parse(specSyncData);
    console.log('   - Items count:', parsed.items?.length || 0);
    console.log('   - Counts:', parsed.counts);
  } else {
    console.log('   - No SpecSync data found');
  }
} catch (error) {
  console.error('   - Error parsing SpecSync data:', error);
}

console.log('3. CETv22 Data:');
try {
  const cetv22Data = localStorage.getItem('cetv22Data');
  if (cetv22Data) {
    const parsed = JSON.parse(cetv22Data);
    console.log('   - Resource demands:', parsed.resourceDemands?.length || 0);
    console.log('   - Job profiles:', parsed.jobProfiles?.length || 0);
    console.log('   - Phases:', parsed.phases?.length || 0);
  } else {
    console.log('   - No CETv22 data found');
  }
} catch (error) {
  console.error('   - Error parsing CETv22 data:', error);
}

console.log('4. SET Data:');
try {
  const setData = localStorage.getItem('set-data');
  if (setData) {
    const parsed = JSON.parse(setData);
    console.log('   - SET data available:', !!parsed);
  } else {
    console.log('   - No SET data found');
  }
} catch (error) {
  console.error('   - Error parsing SET data:', error);
}

console.log('=== End Debug ===');

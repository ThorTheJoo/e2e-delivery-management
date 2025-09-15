// Script to load SET data for testing
console.log('Loading SET data...');

// Sample SET data with effort values
const setData = {
  domainEfforts: {
    "Market & Sales Domain": 45,
    "Customer Domain": 120,
    "Product Domain": 85,
    "Service Domain": 60,
    "Resource Domain": 40
  },
  matchedWorkPackages: {
    "Market & Sales Domain": {
      "Campaign & Funnel Management": 20,
      "Sales Account Management": 25
    },
    "Customer Domain": {
      "Customer Onboarding": 60,
      "Customer Support": 60
    },
    "Product Domain": {
      "Product Catalog": 45,
      "Product Lifecycle": 40
    },
    "Service Domain": {
      "Service Delivery": 35,
      "Service Management": 25
    },
    "Resource Domain": {
      "Resource Planning": 20,
      "Resource Allocation": 20
    }
  },
  timestamp: new Date().toISOString(),
  totalEffort: 350
};

// Save to localStorage
try {
  localStorage.setItem('set-data', JSON.stringify(setData));
  console.log('✅ SET data loaded successfully:', setData);
  console.log('📊 Total effort:', setData.totalEffort, 'days');
  console.log('📊 Domains:', Object.keys(setData.domainEfforts).length);
} catch (error) {
  console.error('❌ Failed to load SET data:', error);
}

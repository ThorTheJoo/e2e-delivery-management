// Build information utility for header display
export interface BuildInfo {
  version: string;
  buildHash: string;
  buildTimestamp: string;
  compliance: string;
}

// Get build information from environment and package.json
export function getBuildInfo(): BuildInfo {
  // Get version from package.json (this will be replaced during build)
  const version = process.env.NEXT_PUBLIC_APP_VERSION || '1.2.2';
  
  // Get build hash from environment (set during build process)
  const buildHash = process.env.NEXT_PUBLIC_BUILD_HASH || 'main@dev';
  
  // Get build timestamp
  const buildTimestamp = process.env.NEXT_PUBLIC_BUILD_TIMESTAMP || new Date().toLocaleString();
  
  // Compliance information
  const compliance = 'ODA 2025 Compliant';
  
  return {
    version,
    buildHash,
    buildTimestamp,
    compliance
  };
}

// Get current project information
export function getProjectInfo() {
  return {
    name: 'E2E Delivery Management',
    status: 'Development',
    customer: 'CSG Systems Inc',
    build: getBuildInfo()
  };
}

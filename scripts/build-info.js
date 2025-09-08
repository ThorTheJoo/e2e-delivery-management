#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get package.json version
const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Get Git information
const { execSync } = require('child_process');

function getGitInfo() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    const commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    const shortCommit = commit.substring(0, 7);
    const timestamp = execSync('git log -1 --format=%cd --date=iso', { encoding: 'utf8' }).trim();

    return {
      branch,
      commit,
      shortCommit,
      timestamp,
    };
  } catch (error) {
    console.warn('Git information not available:', error.message);
    return {
      branch: 'main',
      commit: 'unknown',
      shortCommit: 'dev',
      timestamp: new Date().toISOString(),
    };
  }
}

function generateBuildInfo() {
  const gitInfo = getGitInfo();
  const buildInfo = {
    version: packageJson.version,
    buildHash: `${gitInfo.branch}@${gitInfo.shortCommit}`,
    buildTimestamp: gitInfo.timestamp,
    compliance: 'ODA 2025 Compliant',
  };

  // Write build info to a file that can be imported
  const buildInfoPath = path.join(process.cwd(), 'src/lib/build-info-generated.ts');
  const buildInfoContent = `// Auto-generated build information - DO NOT EDIT
export const BUILD_INFO = ${JSON.stringify(buildInfo, null, 2)};

export const APP_VERSION = '${buildInfo.version}';
export const BUILD_HASH = '${buildInfo.buildHash}';
export const BUILD_TIMESTAMP = '${buildInfo.buildTimestamp}';
export const COMPLIANCE = '${buildInfo.compliance}';
`;

  fs.writeFileSync(buildInfoPath, buildInfoContent);

  // Set environment variables
  process.env.NEXT_PUBLIC_APP_VERSION = buildInfo.version;
  process.env.NEXT_PUBLIC_BUILD_HASH = buildInfo.buildHash;
  process.env.NEXT_PUBLIC_BUILD_TIMESTAMP = buildInfo.buildTimestamp;

  console.log('Build information generated:');
  console.log(`  Version: ${buildInfo.version}`);
  console.log(`  Build Hash: ${buildInfo.buildHash}`);
  console.log(`  Build Timestamp: ${buildInfo.buildTimestamp}`);
  console.log(`  Compliance: ${buildInfo.compliance}`);

  return buildInfo;
}

// Run if called directly
if (require.main === module) {
  generateBuildInfo();
}

module.exports = { generateBuildInfo };

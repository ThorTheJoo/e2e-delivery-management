import { NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import path from 'path'

export const runtime = 'nodejs'

interface BuildInfo {
  version: string
  branch: string
  commitHash: string
  commitShort: string
  commitDate: string
  buildTime: string
  node: string
  next: string
  env: string
}

function getGitValue(cmd: string, fallback = 'unknown'): string {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return fallback
  }
}

export async function GET() {
  let version = 'unknown'
  try {
    const pkgPath = path.join(process.cwd(), 'package.json')
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
    version = pkg.version ?? 'unknown'
  } catch {
    // ignore
  }

  const branch = getGitValue('git rev-parse --abbrev-ref HEAD')
  const commitHash = getGitValue('git rev-parse HEAD')
  const commitShort = getGitValue('git rev-parse --short HEAD')
  const commitDate = getGitValue('git log -1 --pretty=%cI')

  const info: BuildInfo = {
    version,
    branch,
    commitHash,
    commitShort,
    commitDate,
    buildTime: new Date().toISOString(),
    node: process.version,
    next: (process.env.__NEXT_VERSION__ as string) || '14.x',
    env: process.env.NODE_ENV || 'development',
  }

  return NextResponse.json(info, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}



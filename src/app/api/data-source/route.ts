import { NextResponse } from 'next/server';
import { getDataSourceStatus } from '@/lib/data-source';

export async function GET() {
  const status = getDataSourceStatus();
  return NextResponse.json({ success: true, ...status });
}



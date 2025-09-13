import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface PdfIngestResult {
  files: Record<string, string>;
  meta: {
    processed: string[];
    missing: string[];
    totalChars: number;
  };
}

async function readPdfText(filePath: string): Promise<string> {
  const { default: pdf } = await import('pdf-parse');
  const data = await fs.readFile(filePath);
  const res = await pdf(Buffer.from(data));
  return res.text || '';
}

export async function GET() {
  try {
    const cwd = process.cwd();
    const candidateFiles = [
      'SV Solution Description Generator.pdf',
      'Encompass 12 Product Description Jan 2025 (1).pdf',
      'E2E Use Case.pdf',
      'Freedom Modernization Solution Description v1.0 - Final.pdf',
      'GB1033_Functional_Framework_v24.5.pdf',
    ];

    const files: Record<string, string> = {};
    const processed: string[] = [];
    const missing: string[] = [];

    for (const name of candidateFiles) {
      const full = path.join(cwd, name);
      try {
        const stat = await fs.stat(full).catch(() => null);
        if (!stat) {
          missing.push(name);
          continue;
        }
        const text = await readPdfText(full);
        files[name] = text;
        processed.push(name);
      } catch {
        missing.push(name);
      }
    }

    const totalChars = Object.values(files).reduce((acc, t) => acc + t.length, 0);
    const result: PdfIngestResult = { files, meta: { processed, missing, totalChars } };
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to ingest PDFs' }, { status: 500 });
  }
}



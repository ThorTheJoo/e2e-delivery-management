import type { SpecSyncItem } from '@/types';
import type { MappingResult, TraversalResultWithPayloads } from '@/types/blue-dolphin-relationships';
import stringSimilarity from 'string-similarity';

export interface Paragraph {
  file: string;
  index: number;
  text: string;
}

export interface MatchedRequirementContent {
  requirementId: string;
  functionName: string;
  description?: string;
  topMatches: Array<{ file: string; snippet: string; score: number }>;
}

export interface MatchedFunctionContent {
  blueDolphinId: string;
  title: string;
  topMatches: Array<{ file: string; snippet: string; score: number }>;
}

export interface MatchedContent {
  requirements: MatchedRequirementContent[];
  functions: MatchedFunctionContent[];
}

function normalize(text: string): string {
  return (text || '')
    .replace(/\s+/g, ' ')
    .replace(/\u00A0/g, ' ')
    .trim();
}

function buildParagraphs(files: Record<string, string>): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  Object.entries(files).forEach(([file, content]) => {
    if (!content) return;
    const chunks = content
      .split(/\n\s*\n/g) // blank line separators
      .map(c => normalize(c))
      .filter(c => c.length > 60); // ignore very short fragments
    chunks.forEach((text, index) => paragraphs.push({ file, index, text }));
  });
  return paragraphs;
}

function topMatchesFor(query: string, paragraphs: Paragraph[], max = 3) {
  const q = normalize(query || '');
  if (!q || paragraphs.length === 0) return [] as Array<{ file: string; snippet: string; score: number }>;
  const targets = paragraphs.map(p => p.text || '');
  const { ratings } = stringSimilarity.findBestMatch(q, targets);
  const ranked = ratings
    .map((r, i) => ({ score: r.rating, para: paragraphs[i] }))
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map(r => ({ file: r.para.file, snippet: r.para.text.slice(0, 800), score: Number(r.score.toFixed(3)) }));
  return ranked;
}

export function matchPdfContent(
  files: Record<string, string>,
  requirements: SpecSyncItem[],
  mappingResults: MappingResult[],
  traversalResults: TraversalResultWithPayloads[]
): MatchedContent {
  const paragraphs = buildParagraphs(files || {});

  const requirementsMatches: MatchedRequirementContent[] = (requirements || []).map(req => {
    const queryParts = [req.functionName, req.description || '', req.capability || '', req.domain || '']
      .filter(Boolean)
      .join(' \u2022 ');
    return {
      requirementId: req.id,
      functionName: req.functionName,
      description: req.description,
      topMatches: topMatchesFor(queryParts, paragraphs, 3),
    };
  });

  const uniqueFunctions = new Map<string, string>();
  (mappingResults || []).forEach(m => {
    if (m.blueDolphinObject?.ID && m.blueDolphinObject?.Title) {
      uniqueFunctions.set(m.blueDolphinObject.ID, m.blueDolphinObject.Title);
    }
  });
  (traversalResults || []).forEach(t => {
    if (t.applicationFunction?.ID && t.applicationFunction?.Title) {
      uniqueFunctions.set(t.applicationFunction.ID, t.applicationFunction.Title);
    }
  });

  const functionMatches: MatchedFunctionContent[] = Array.from(uniqueFunctions.entries()).map(([id, title]) => {
    return {
      blueDolphinId: id,
      title,
      topMatches: topMatchesFor(title, paragraphs, 3),
    };
  });

  return {
    requirements: requirementsMatches,
    functions: functionMatches,
  };
}



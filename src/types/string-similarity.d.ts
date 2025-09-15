declare module 'string-similarity' {
  export interface Rating {
    target: string;
    rating: number;
  }

  export interface BestMatch {
    ratings: Rating[];
    bestMatch: Rating;
    bestMatchIndex: number;
  }

  export function findBestMatch(mainString: string, targetStrings: string[]): BestMatch;

  const _default: {
    findBestMatch: typeof findBestMatch;
  };

  export default _default;
}




import { getBrowserSupabaseClient } from '@/lib/supabase';
// Use shared singleton browser client to avoid multiple GoTrueClient instances
const supabase = getBrowserSupabaseClient();

// TMF Reference Data Types
export interface TMFDomain {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  function_count?: number;
}

export interface TMFFunction {
  id: string;
  domain_id: string;
  function_name: string;
  vertical: string | null;
  af_level_1: string | null;
  af_level_2: string | null;
  function_id: number | null;
  uid: number | null;
  created_at: string;
  updated_at: string;
  domain_name?: string;
}

export interface TMFMapping {
  id: string;
  specsync_item_id: string;
  tmf_function_id: string;
  mapping_confidence: number;
  created_at: string;
  updated_at: string;
}

// Client-side TMF Reference Data Service
export class TMFReferenceServiceClient {
  // Get all TMF domains
  static async getDomains(): Promise<TMFDomain[]> {
    try {
      const { data, error } = await supabase
        .from('tmf_domains')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching TMF domains:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching TMF domains:', error);
      return [];
    }
  }

  // Get all TMF functions
  static async getAllFunctions(): Promise<TMFFunction[]> {
    try {
      const { data, error } = await supabase
        .from('tmf_functions_with_domain')
        .select('*')
        .order('function_name');

      if (error) {
        console.error('Error fetching TMF functions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching TMF functions:', error);
      return [];
    }
  }

  // Get TMF functions by domain
  static async getFunctionsByDomain(domainId: string): Promise<TMFFunction[]> {
    try {
      const { data, error } = await supabase
        .from('tmf_functions_with_domain')
        .select('*')
        .eq('domain_id', domainId)
        .order('function_name');

      if (error) {
        console.error('Error fetching TMF functions by domain:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching TMF functions by domain:', error);
      return [];
    }
  }

  // Get TMF functions by domain name
  static async getFunctionsByDomainName(domainName: string): Promise<TMFFunction[]> {
    try {
      const { data, error } = await supabase
        .from('tmf_functions_with_domain')
        .select('*')
        .eq('domain_name', domainName)
        .order('function_name');

      if (error) {
        console.error('Error fetching TMF functions by domain name:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching TMF functions by domain name:', error);
      return [];
    }
  }


  // Find best matching TMF function for a SpecSync function
  static async findBestMatch(
    specSyncFunctionName: string,
    specSyncDomain?: string
  ): Promise<{ function: TMFFunction; confidence: number } | null> {
    try {
      const allFunctions = await this.getAllFunctions();
      
      if (allFunctions.length === 0) {
        return null;
      }

      let bestMatch: { function: TMFFunction; confidence: number } | null = null;
      let bestScore = 0;

      for (const func of allFunctions) {
        let score = 0;
        
        // Exact match gets highest score
        if (func.function_name.toLowerCase() === specSyncFunctionName.toLowerCase()) {
          score = 100;
        } else {
          // Partial match scoring
          const funcWords = func.function_name.toLowerCase().split(/\s+/);
          const specWords = specSyncFunctionName.toLowerCase().split(/\s+/);
          
          let wordMatches = 0;
          for (const specWord of specWords) {
            if (funcWords.some(funcWord => funcWord.includes(specWord) || specWord.includes(funcWord))) {
              wordMatches++;
            }
          }
          
          score = (wordMatches / specWords.length) * 80;
          
          // Bonus for domain match
          if (specSyncDomain && func.domain_name?.toLowerCase() === specSyncDomain.toLowerCase()) {
            score += 10;
          }
        }

        if (score > bestScore && score >= 30) { // Minimum 30% confidence
          bestMatch = { function: func, confidence: score };
          bestScore = score;
        }
      }

      return bestMatch;
    } catch (error) {
      console.error('Error finding best TMF function match:', error);
      return null;
    }
  }

  // Create a mapping between SpecSync item and TMF function
  static async createMapping(
    specsyncItemId: string,
    tmfFunctionId: string,
    confidence: number
  ): Promise<TMFMapping | null> {
    try {
      const { data, error } = await supabase
        .from('tmf_mappings')
        .insert({
          specsync_item_id: specsyncItemId,
          tmf_function_id: tmfFunctionId,
          mapping_confidence: confidence,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating TMF mapping:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error creating TMF mapping:', error);
      return null;
    }
  }

  // Get all mappings
  static async getAllMappings(): Promise<TMFMapping[]> {
    try {
      const { data, error } = await supabase
        .from('tmf_mappings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching TMF mappings:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching TMF mappings:', error);
      return [];
    }
  }

  // Delete a mapping
  static async deleteMapping(mappingId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tmf_mappings')
        .delete()
        .eq('id', mappingId);

      if (error) {
        console.error('Error deleting TMF mapping:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting TMF mapping:', error);
      return false;
    }
  }

  // Get unmapped functions with optional filter
  static async getUnmappedFunctions(mappedFunctionIds?: string[]): Promise<TMFFunction[]> {
    try {
      let query = supabase
        .from('tmf_functions_with_domain')
        .select('*')
        .order('function_name');

      if (mappedFunctionIds && mappedFunctionIds.length > 0) {
        query = query.not('id', 'in', `(${mappedFunctionIds.map(id => `'${id}'`).join(',')})`);
      } else {
        query = query.not('id', 'in', `(SELECT tmf_function_id FROM tmf_mappings)`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching unmapped TMF functions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching unmapped TMF functions:', error);
      return [];
    }
  }

  // Search functions with optional domain filter
  static async searchFunctions(query: string, domainId?: string): Promise<TMFFunction[]> {
    try {
      let supabaseQuery = supabase
        .from('tmf_functions_with_domain')
        .select('*')
        .ilike('function_name', `%${query}%`)
        .order('function_name')
        .limit(50);

      if (domainId) {
        supabaseQuery = supabaseQuery.eq('domain_id', domainId);
      }

      const { data, error } = await supabaseQuery;

      if (error) {
        console.error('Error searching TMF functions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error searching TMF functions:', error);
      return [];
    }
  }

  // Initialize reference data (check if data exists)
  static async initializeReferenceData(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('tmf_domains')
        .select('id', { count: 'exact' })
        .limit(1);

      if (error) {
        console.error('Error checking TMF reference data:', error);
        return false;
      }

      const hasData = data && data.length > 0;
      console.log(`TMF reference data ${hasData ? 'exists' : 'needs to be loaded'}`);
      return hasData;
    } catch (error) {
      console.error('Error initializing TMF reference data:', error);
      return false;
    }
  }
}

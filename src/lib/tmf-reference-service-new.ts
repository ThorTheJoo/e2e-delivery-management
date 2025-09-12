import { getServerSupabaseClient, getBrowserSupabaseClient } from './supabase';

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

// TMF Reference Data Service
export class TMFReferenceService {
  private static client = (typeof window === 'undefined')
    ? getServerSupabaseClient()
    : getBrowserSupabaseClient();

  // Get all TMF domains
  static async getDomains(): Promise<TMFDomain[]> {
    try {
      if (!this.client) {
        console.warn('Supabase client not available, returning empty array');
        return [];
      }

      const { data, error } = await this.client
        .from('tmf_domains_with_counts')
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

  // Get TMF functions by domain
  static async getFunctionsByDomain(domainId: string): Promise<TMFFunction[]> {
    try {
      if (!this.client) {
        console.warn('Supabase client not available, returning empty array');
        return [];
      }

      const { data, error } = await this.client
        .from('tmf_functions')
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

  // Get all TMF functions
  static async getAllFunctions(): Promise<TMFFunction[]> {
    try {
      if (!this.client) {
        console.warn('Supabase client not available, returning empty array');
        return [];
      }

      const { data, error } = await this.client
        .from('tmf_functions_with_domain')
        .select('*')
        .order('domain_name, function_name');

      if (error) {
        console.error('Error fetching all TMF functions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching all TMF functions:', error);
      return [];
    }
  }

  // Search TMF functions
  static async searchFunctions(query: string, domainId?: string): Promise<TMFFunction[]> {
    try {
      if (!this.client) {
        console.warn('Supabase client not available, returning empty array');
        return [];
      }

      let queryBuilder = this.client
        .from('tmf_functions_with_domain')
        .select('*')
        .ilike('function_name', `%${query}%`);

      if (domainId) {
        queryBuilder = queryBuilder.eq('domain_id', domainId);
      }

      const { data, error } = await queryBuilder
        .order('domain_name, function_name')
        .limit(50);

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

  // Get unmapped functions (functions not in the provided list)
  static async getUnmappedFunctions(mappedFunctionIds: string[]): Promise<TMFFunction[]> {
    try {
      if (!this.client) {
        console.warn('Supabase client not available, returning empty array');
        return [];
      }

      if (mappedFunctionIds.length === 0) {
        return await this.getAllFunctions();
      }

      const { data, error } = await this.client
        .from('tmf_functions_with_domain')
        .select('*')
        .not('id', 'in', `(${mappedFunctionIds.join(',')})`)
        .order('domain_name, function_name');

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

  // Get functions by domain name
  static async getFunctionsByDomainName(domainName: string): Promise<TMFFunction[]> {
    try {
      if (!this.client) {
        console.warn('Supabase client not available, returning empty array');
        return [];
      }

      const { data, error } = await this.client
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

  // Create a mapping between SpecSync item and TMF function
  static async createMapping(
    specsyncItemId: string,
    tmfFunctionId: string,
    confidence: number = 1.0
  ): Promise<TMFMapping | null> {
    try {
      if (!this.client) {
        console.warn('Supabase client not available');
        return null;
      }

      const { data, error } = await this.client
        .from('specsync_tmf_mappings')
        .insert({
          specsync_item_id: specsyncItemId,
          tmf_function_id: tmfFunctionId,
          mapping_confidence: confidence
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

  // Get mappings for a SpecSync item
  static async getMappingsForSpecSyncItem(specsyncItemId: string): Promise<TMFMapping[]> {
    try {
      if (!this.client) {
        console.warn('Supabase client not available, returning empty array');
        return [];
      }

      const { data, error } = await this.client
        .from('specsync_tmf_mappings')
        .select('*')
        .eq('specsync_item_id', specsyncItemId);

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

  // Get all mappings
  static async getAllMappings(): Promise<TMFMapping[]> {
    try {
      if (!this.client) {
        console.warn('Supabase client not available, returning empty array');
        return [];
      }

      const { data, error } = await this.client
        .from('specsync_tmf_mappings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all TMF mappings:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching all TMF mappings:', error);
      return [];
    }
  }

  // Delete a mapping
  static async deleteMapping(mappingId: string): Promise<boolean> {
    try {
      if (!this.client) {
        console.warn('Supabase client not available');
        return false;
      }

      const { error } = await this.client
        .from('specsync_tmf_mappings')
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

  // Find best matching TMF function for a SpecSync function name
  static async findBestMatch(
    specSyncFunctionName: string,
    specSyncDomain?: string
  ): Promise<{ function: TMFFunction; confidence: number } | null> {
    try {
      if (!this.client) {
        console.warn('Supabase client not available');
        return null;
      }

      // First try exact match within domain
      if (specSyncDomain) {
        const { data: exactMatch, error: exactError } = await this.client
          .from('tmf_functions_with_domain')
          .select('*')
          .eq('domain_name', specSyncDomain)
          .eq('function_name', specSyncFunctionName)
          .single();

        if (!exactError && exactMatch) {
          return { function: exactMatch, confidence: 1.0 };
        }
      }

      // Try fuzzy match within domain
      if (specSyncDomain) {
        const { data: fuzzyMatches, error: fuzzyError } = await this.client
          .from('tmf_functions_with_domain')
          .select('*')
          .eq('domain_name', specSyncDomain)
          .ilike('function_name', `%${specSyncFunctionName}%`)
          .limit(5);

        if (!fuzzyError && fuzzyMatches && fuzzyMatches.length > 0) {
          // Return the first match with high confidence
          return { function: fuzzyMatches[0], confidence: 0.8 };
        }
      }

      // Try cross-domain fuzzy match
      const { data: crossDomainMatches, error: crossError } = await this.client
        .from('tmf_functions_with_domain')
        .select('*')
        .ilike('function_name', `%${specSyncFunctionName}%`)
        .limit(5);

      if (!crossError && crossDomainMatches && crossDomainMatches.length > 0) {
        // Return the first match with lower confidence
        return { function: crossDomainMatches[0], confidence: 0.6 };
      }

      return null;
    } catch (error) {
      console.error('Error finding best TMF function match:', error);
      return null;
    }
  }

  // Initialize reference data (check if data exists)
  static async initializeReferenceData(): Promise<boolean> {
    try {
      if (!this.client) {
        console.warn('Supabase client not available');
        return false;
      }

      const { data, error } = await this.client
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

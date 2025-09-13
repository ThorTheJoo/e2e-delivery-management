'use client';

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';
import type { EnhancedSolutionDescriptionData } from './enhanced-solution-description-service';
import type { MatchedContent } from './pdf-matcher';

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: 'Helvetica' },
  h1: { fontSize: 18, marginBottom: 8, fontWeight: 700 },
  h2: { fontSize: 14, marginTop: 16, marginBottom: 6, fontWeight: 700 },
  h3: { fontSize: 12, marginTop: 10, marginBottom: 4, fontWeight: 700 },
  p: { marginBottom: 6, lineHeight: 1.4 },
  small: { fontSize: 8, color: '#555' },
  listItem: { marginBottom: 4 },
  code: { fontFamily: 'Courier', fontSize: 8, backgroundColor: '#f2f2f2', padding: 4, borderRadius: 2 },
});

interface SolutionPdfProps {
  data: Partial<EnhancedSolutionDescriptionData> & { projectName?: string; clientName?: string; version?: string; date?: string; status?: string };
  matches?: MatchedContent;
}

export function SolutionPdf({ data, matches }: SolutionPdfProps) {
  const safe = {
    projectName: data.projectName || 'Project',
    clientName: data.clientName || 'Client',
    version: data.version || '1.0.0',
    date: data.date || new Date().toISOString().slice(0, 10),
    status: data.status || 'Draft',
    documentOverview: {
      scope: data.documentOverview?.scope || '',
      purpose: data.documentOverview?.purpose || '',
    },
    businessContext: {
      clientUnderstanding: {
        customerSegments: data.businessContext?.clientUnderstanding?.customerSegments || [],
        productServiceSegments: data.businessContext?.clientUnderstanding?.productServiceSegments || [],
        missionCritical: data.businessContext?.clientUnderstanding?.missionCritical || '',
      },
      projectUnderstanding: data.businessContext?.projectUnderstanding || '',
      solutionAbout: data.businessContext?.solutionAbout || '',
    },
    solutionOverview: {
      highLevelArchitecture: data.solutionOverview?.highLevelArchitecture || '',
      capabilityView: data.solutionOverview?.capabilityView || '',
      csgSolutionComponents: data.solutionOverview?.csgSolutionComponents || {
        revenueManagement: '',
        customerManagement: '',
        ratingCharging: '',
        consumerCatalog: '',
        enterpriseCatalog: '',
        cpq: '',
        activeMediationManager: '',
      },
      partnerSolutionComponents: data.solutionOverview?.partnerSolutionComponents || [],
      externalSolutionComponents: data.solutionOverview?.externalSolutionComponents || [],
      endToEndProcessFlows: data.solutionOverview?.endToEndProcessFlows || '',
      integrationArchitecture: data.solutionOverview?.integrationArchitecture || {
        detailedIntegrationLandscape: '',
        fileInterfaces: '',
        onlineInterfaces: '',
        coreNetworkInterfaces: '',
      },
    },
    traceabilityMap: Array.isArray((data as any).traceabilityMap) ? (data as any).traceabilityMap : [],
  };
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Solution Description</Text>
        <Text style={styles.p}>Project: {safe.projectName} | Client: {safe.clientName} | Version: {safe.version} | Date: {safe.date}</Text>

        <Text style={styles.h2}>1. Document Overview</Text>
        <Text style={styles.h3}>1.1 Scope</Text>
        <Text style={styles.p}>{safe.documentOverview.scope}</Text>
        <Text style={styles.h3}>1.2 Purpose</Text>
        <Text style={styles.p}>{safe.documentOverview.purpose}</Text>

        <Text style={styles.h2}>2. Business Context</Text>
        <Text style={styles.h3}>2.1 About the Client</Text>
        <View>
          {safe.businessContext.clientUnderstanding.customerSegments.map((s: string, i: number) => (
            <Text key={i} style={styles.listItem}>• {s}</Text>
          ))}
        </View>

        <Text style={styles.h2}>3. Solution Overview</Text>
        <Text style={styles.p}>{safe.solutionOverview.highLevelArchitecture}</Text>

        <Text style={styles.h2}>4. Traceability</Text>
        <View>
          {safe.traceabilityMap.slice(0, 20).map((m: any, i: number) => (
            <Text key={i} style={styles.listItem}>
              {m.relationship}: {m.sourceName} → {m.targetName}
            </Text>
          ))}
        </View>

        {matches && (
          <>
            <Text style={styles.h2}>Appendix A. Matched PDF Snippets</Text>
            <Text style={styles.h3}>A.1 Requirements</Text>
            {matches.requirements.slice(0, 8).map((r) => (
              <View key={r.requirementId} wrap={false}>
                <Text style={styles.listItem}>• {r.functionName} ({r.requirementId})</Text>
                {r.topMatches.map((tm, j) => (
                  <Text key={j} style={styles.code}>
                    [{tm.file}] ({tm.score}) {tm.snippet}
                  </Text>
                ))}
              </View>
            ))}

            <Text style={styles.h3}>A.2 TMF/Blue Dolphin Functions</Text>
            {matches.functions.slice(0, 8).map((f) => (
              <View key={f.blueDolphinId} wrap={false}>
                <Text style={styles.listItem}>• {f.title} ({f.blueDolphinId})</Text>
                {f.topMatches.map((tm, j) => (
                  <Text key={j} style={styles.code}>
                    [{tm.file}] ({tm.score}) {tm.snippet}
                  </Text>
                ))}
              </View>
            ))}
          </>
        )}

        <Text style={styles.small}>Generated automatically from SpecSync, Blue Dolphin, and referenced PDFs.</Text>
      </Page>
    </Document>
  );
}



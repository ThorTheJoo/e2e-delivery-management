'use client';

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { EnhancedSolutionDescriptionData } from './enhanced-solution-description-service';
import type { MatchedContent } from './pdf-matcher';
import type { SolutionDescriptionData } from './solution-description-service';

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

type BaseDocMeta = { projectName?: string; clientName?: string; version?: string; date?: string; status?: string };
type LegacySolutionData = SolutionDescriptionData & BaseDocMeta;
type CompatibleSolutionData = Partial<EnhancedSolutionDescriptionData> | LegacySolutionData;

interface SolutionPdfProps {
  data: CompatibleSolutionData;
  matches?: MatchedContent;
}

export function SolutionPdf({ data, matches }: SolutionPdfProps) {
  function isEnhanced(d: CompatibleSolutionData): d is Partial<EnhancedSolutionDescriptionData> {
    return typeof (d as any).solutionOverview !== 'undefined' || typeof (d as any).businessContext !== 'undefined' || typeof (d as any).documentOverview !== 'undefined';
  }

  function isLegacy(d: CompatibleSolutionData): d is LegacySolutionData {
    return Array.isArray((d as any).requirements) && Array.isArray((d as any).tmfFunctions);
  }

  const projectName = (data as any).projectName || 'Project';
  const clientName = isEnhanced(data) ? (data.clientName || 'Client') : 'Client';
  const version = (data as any).version || '1.0.0';
  const date = isEnhanced(data)
    ? (data.date || new Date().toISOString().slice(0, 10))
    : (() => {
        const gd = isLegacy(data) ? (data.generatedDate as string | undefined) : undefined;
        return (gd ? new Date(gd) : new Date()).toISOString().slice(0, 10);
      })();
  const status = isEnhanced(data) ? (data.status || 'Draft') : 'Draft';

  const safe = {
    projectName,
    clientName,
    version,
    date,
    status,
    documentOverview: {
      scope: isEnhanced(data) && data.documentOverview ? (data.documentOverview.scope || '') : '',
      purpose: isEnhanced(data) && data.documentOverview ? (data.documentOverview.purpose || '') : '',
    },
    businessContext: {
      clientUnderstanding: {
        customerSegments: isEnhanced(data) && data.businessContext?.clientUnderstanding?.customerSegments ? data.businessContext.clientUnderstanding.customerSegments : [],
        productServiceSegments: isEnhanced(data) && data.businessContext?.clientUnderstanding?.productServiceSegments ? data.businessContext.clientUnderstanding.productServiceSegments : [],
        missionCritical: isEnhanced(data) && data.businessContext?.clientUnderstanding?.missionCritical ? data.businessContext.clientUnderstanding.missionCritical : '',
      },
      projectUnderstanding: isEnhanced(data) && data.businessContext?.projectUnderstanding ? data.businessContext.projectUnderstanding : '',
      solutionAbout: isEnhanced(data) && data.businessContext?.solutionAbout ? data.businessContext.solutionAbout : '',
    },
    solutionOverview: {
      highLevelArchitecture: isEnhanced(data) && data.solutionOverview?.highLevelArchitecture ? data.solutionOverview.highLevelArchitecture : '',
      capabilityView: isEnhanced(data) && data.solutionOverview?.capabilityView ? data.solutionOverview.capabilityView : '',
      csgSolutionComponents: isEnhanced(data) && data.solutionOverview?.csgSolutionComponents
        ? data.solutionOverview.csgSolutionComponents
        : {
            revenueManagement: '',
            customerManagement: '',
            ratingCharging: '',
            consumerCatalog: '',
            enterpriseCatalog: '',
            cpq: '',
            activeMediationManager: '',
          },
      partnerSolutionComponents: isEnhanced(data) && data.solutionOverview?.partnerSolutionComponents ? data.solutionOverview.partnerSolutionComponents : [],
      externalSolutionComponents: isEnhanced(data) && data.solutionOverview?.externalSolutionComponents ? data.solutionOverview.externalSolutionComponents : [],
      endToEndProcessFlows: isEnhanced(data) && data.solutionOverview?.endToEndProcessFlows ? data.solutionOverview.endToEndProcessFlows : '',
      integrationArchitecture: isEnhanced(data) && data.solutionOverview?.integrationArchitecture
        ? data.solutionOverview.integrationArchitecture
        : {
            detailedIntegrationLandscape: '',
            fileInterfaces: '',
            onlineInterfaces: '',
            coreNetworkInterfaces: '',
          },
    },
  } as const;

  const traceabilityItems: Array<{ relationship: string; sourceName: string; targetName: string }> = [];
  if (isEnhanced(data) && (data as any).traceability) {
    const tr = (data as any).traceability;
    const lists: any[] = [tr.requirementsToFunctions, tr.functionsToServices, tr.servicesToComponents].filter(Array.isArray);
    lists.flat().forEach((m: any) => {
      if (m && m.sourceName && m.targetName) {
        traceabilityItems.push({ relationship: m.relationship || 'trace', sourceName: m.sourceName, targetName: m.targetName });
      }
    });
  } else if (isLegacy(data) && Array.isArray((data as any).traceabilityMap)) {
    (data as any).traceabilityMap.forEach((m: any) => {
      traceabilityItems.push({ relationship: 'requirement-to-function', sourceName: m.requirementText, targetName: m.tmfFunction });
    });
  }
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
          {traceabilityItems.slice(0, 20).map((m, i) => (
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



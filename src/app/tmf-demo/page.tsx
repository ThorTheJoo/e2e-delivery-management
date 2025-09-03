'use client';

import { useState } from 'react';
import { TMFOdaManager } from '@/components/tmf-oda-manager';
import { TMFOdaState } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';

export default function TMFOdaDemoPage() {
  const [tmfState, setTmfState] = useState<TMFOdaState | null>(null);

  const handleStateChange = (state: TMFOdaState) => {
    setTmfState(state);
    console.log('TMF ODA State updated:', state);
  };

  const exportState = () => {
    if (!tmfState) return;
    
    const dataStr = JSON.stringify(tmfState, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tmf-oda-state.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importState = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const state = JSON.parse(e.target?.result as string);
        setTmfState(state);
      } catch (error) {
        console.error('Error parsing imported file:', error);
        alert('Invalid file format. Please import a valid TMF ODA state JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="hover:bg-blue-700 p-2 rounded-lg transition-colors">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold">TMF ODA Management Demo</h1>
                <p className="text-blue-100">Interactive domain and capability management system</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-blue-100">
                {tmfState ? (
                  <>
                    <span className="font-medium">{tmfState.domains.length}</span> domains,{' '}
                    <span className="font-medium">
                      {tmfState.domains.reduce((sum, domain) => sum + domain.capabilities.length, 0)}
                    </span>{' '}
                    capabilities
                  </>
                ) : (
                  'No data loaded'
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Import State
                  </label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={importState}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                
                <Button
                  onClick={exportState}
                  disabled={!tmfState}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export State
                </Button>

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Features</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Add/Remove TMF ODA domains</li>
                    <li>• Add/Remove capabilities per domain</li>
                    <li>• Select/Deselect domains & capabilities</li>
                    <li>• Edit names and descriptions</li>
                    <li>• Expandable domain views</li>
                    <li>• Real-time state management</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <TMFOdaManager
              onStateChange={handleStateChange}
              initialState={tmfState || undefined}
            />
          </div>
        </div>

        {/* State Display */}
        {tmfState && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Current State</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-xs text-gray-700 overflow-auto max-h-64">
                  {JSON.stringify(tmfState, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

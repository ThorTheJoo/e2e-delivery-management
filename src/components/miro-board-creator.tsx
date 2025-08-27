'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layout, ExternalLink, Plus, FileText, Network, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { miroService } from '@/lib/miro-service';
import { Project, TMFOdaDomain, SpecSyncItem } from '@/types';
import Link from 'next/link';

interface MiroBoardCreatorProps {
  project: Project;
  tmfDomains: TMFOdaDomain[];
  specSyncItems: SpecSyncItem[];
}

interface BoardLinks {
  tmfBoard?: string;
  specSyncBoard?: string;
}

export function MiroBoardCreator({ project, tmfDomains, specSyncItems }: MiroBoardCreatorProps) {
  const [boardLinks, setBoardLinks] = useState<BoardLinks>({});
  const [isCreatingTMF, setIsCreatingTMF] = useState(false);
  const [isCreatingSpecSync, setIsCreatingSpecSync] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateTMFBoard = async () => {
    setIsCreatingTMF(true);
    setError(null);
    
    console.log('Creating TMF board with project:', project);
    console.log('TMF domains:', tmfDomains);
    console.log('Selected domains:', tmfDomains.filter(d => d.isSelected));
    
    try {
      const board = await miroService.createTMFBoard(project, tmfDomains);
      setBoardLinks(prev => ({ ...prev, tmfBoard: board.viewLink }));
    } catch (error) {
      console.error('Failed to create TMF board:', error);
      
      // Check if it's a token-related error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('token') || errorMessage.includes('authentication') || errorMessage.includes('401') || errorMessage.includes('403')) {
        setError('Miro access token is invalid or expired. Please check your token in the Miro Developer Platform and update the MIRO_ACCESS_TOKEN in your .env.local file.');
      } else {
        setError('Failed to create TMF Architecture board. Please check your Miro credentials and try again.');
      }
    } finally {
      setIsCreatingTMF(false);
    }
  };

  const handleCreateSpecSyncBoard = async () => {
    setIsCreatingSpecSync(true);
    setError(null);
    
    console.log('Creating SpecSync board with items:', specSyncItems);
    console.log('SpecSync items length:', specSyncItems.length);
    console.log('First few items:', specSyncItems.slice(0, 3));
    
    try {
      const board = await miroService.createSpecSyncBoard(specSyncItems);
      setBoardLinks(prev => ({ ...prev, specSyncBoard: board.viewLink }));
    } catch (error) {
      console.error('Failed to create SpecSync board:', error);
      
      // Check if it's a token-related error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('token') || errorMessage.includes('authentication') || errorMessage.includes('401') || errorMessage.includes('403')) {
        setError('Miro access token is invalid or expired. Please check your token in the Miro Developer Platform and update the MIRO_ACCESS_TOKEN in your .env.local file.');
      } else {
        setError('Failed to create SpecSync Requirements board. Please check your Miro credentials and try again.');
      }
    } finally {
      setIsCreatingSpecSync(false);
    }
  };

  const totalCapabilities = tmfDomains.reduce((acc, domain) => acc + domain.capabilities.length, 0);
  const selectedDomains = tmfDomains.filter(domain => domain.isSelected).length;
  const selectedCapabilities = tmfDomains.reduce((acc, domain) => 
    acc + domain.capabilities.filter(cap => cap.isSelected).length, 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Layout className="h-5 w-5" />
            <span>Miro Visual Mapping</span>
          </CardTitle>
          <CardDescription>
            Create interactive visual boards for TMF domains, capabilities, and SpecSync requirements
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TMF Architecture Board */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Network className="h-5 w-5" />
            <span>TMF Architecture Board</span>
            {boardLinks.tmfBoard && (
              <Badge variant="secondary" className="ml-2">
                <CheckCircle className="h-3 w-3 mr-1" />
                Created
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Visual mapping of TMF domains and capabilities with organizational frames
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground">Domains:</span>
                <Badge variant="outline">{selectedDomains} / {tmfDomains.length}</Badge>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground">Capabilities:</span>
                <Badge variant="outline">{selectedCapabilities} / {totalCapabilities}</Badge>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground">Project:</span>
                <Badge variant="outline">{project.name}</Badge>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button 
                onClick={handleCreateTMFBoard} 
                disabled={isCreatingTMF || selectedDomains === 0}
                className="flex items-center space-x-2"
              >
                {isCreatingTMF ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating Board...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Create TMF Architecture Board</span>
                  </>
                )}
              </Button>

              {boardLinks.tmfBoard && (
                <Link href={boardLinks.tmfBoard} target="_blank">
                  <Button variant="outline" className="flex items-center space-x-2">
                    <ExternalLink className="h-4 w-4" />
                    <span>Open in Miro</span>
                  </Button>
                </Link>
              )}
            </div>

            {selectedDomains === 0 && (
              <div className="text-sm text-muted-foreground">
                Please select at least one TMF domain before creating the board.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* SpecSync Requirements Board */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>SpecSync Requirements Board</span>
            {boardLinks.specSyncBoard && (
              <Badge variant="secondary" className="ml-2">
                <CheckCircle className="h-3 w-3 mr-1" />
                Created
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Visual mapping of SpecSync requirements with domain and function categorization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground">Requirements:</span>
                <Badge variant="outline">{specSyncItems.length}</Badge>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground">Domains:</span>
                <Badge variant="outline">
                  {new Set(specSyncItems.map(item => item.domain)).size}
                </Badge>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button 
                onClick={handleCreateSpecSyncBoard} 
                disabled={isCreatingSpecSync || specSyncItems.length === 0}
                className="flex items-center space-x-2"
              >
                {isCreatingSpecSync ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating Board...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Create SpecSync Requirements Board</span>
                  </>
                )}
              </Button>

              {boardLinks.specSyncBoard && (
                <Link href={boardLinks.specSyncBoard} target="_blank">
                  <Button variant="outline" className="flex items-center space-x-2">
                    <ExternalLink className="h-4 w-4" />
                    <span>Open in Miro</span>
                  </Button>
                </Link>
              )}
            </div>

            {specSyncItems.length === 0 && (
              <div className="text-sm text-muted-foreground">
                Please import SpecSync data before creating the requirements board.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Board Management */}
      {(boardLinks.tmfBoard || boardLinks.specSyncBoard) && (
        <Card>
          <CardHeader>
            <CardTitle>Board Management</CardTitle>
            <CardDescription>
              Manage your created Miro boards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {boardLinks.tmfBoard && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Network className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">TMF Architecture Board</div>
                      <div className="text-sm text-muted-foreground">
                        {selectedDomains} domains, {selectedCapabilities} capabilities
                      </div>
                    </div>
                  </div>
                  <Link href={boardLinks.tmfBoard} target="_blank">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Open
                    </Button>
                  </Link>
                </div>
              )}

              {boardLinks.specSyncBoard && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">SpecSync Requirements Board</div>
                      <div className="text-sm text-muted-foreground">
                        {specSyncItems.length} requirements
                      </div>
                    </div>
                  </div>
                  <Link href={boardLinks.specSyncBoard} target="_blank">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Open
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

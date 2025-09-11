'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Layout,
  ExternalLink,
  Plus,
  FileText,
  Network,
  Loader2,
  CheckCircle,
  AlertCircle,
  LogOut,
} from 'lucide-react';
import { miroService } from '@/lib/miro-service';
import { miroAuthService } from '@/lib/miro-auth-service';
import { Project, TMFOdaDomain, SpecSyncItem } from '@/types';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface MiroBoardCreatorProps {
  project: Project;
  tmfDomains: TMFOdaDomain[];
  specSyncItems: SpecSyncItem[];
  onAuthStatusChange?: (isAuthenticated: boolean) => void;
}

interface BoardLinks {
  tmfBoard?: string;
  specSyncBoard?: string;
}

export function MiroBoardCreator({
  project,
  tmfDomains,
  specSyncItems,
  onAuthStatusChange,
}: MiroBoardCreatorProps) {
  console.log('=== MIRO BOARD CREATOR DEBUG ===');
  console.log('Project:', project);
  console.log('TMF Domains:', tmfDomains);
  console.log('SpecSync Items:', specSyncItems);
  console.log('SpecSync Items length:', specSyncItems?.length || 0);
  console.log('=== END DEBUG ===');

  const [boardLinks, setBoardLinks] = useState<BoardLinks>({});
  const [isCreatingTMF, setIsCreatingTMF] = useState(false);
  const [isCreatingSpecSync, setIsCreatingSpecSync] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const searchParams = useSearchParams();

  // Handle OAuth callback
  useEffect(() => {
    const token = searchParams.get('token');
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (token && success === 'true') {
      miroAuthService.setTokenFromUrl(token);
      setIsAuthenticated(true);
      setError(null);
      // Notify parent component
      onAuthStatusChange?.(true);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
      setError(`Authentication failed: ${error}`);
      setIsAuthenticated(false);
      onAuthStatusChange?.(false);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams, onAuthStatusChange]);

  // Check authentication status on mount and periodically
  useEffect(() => {
    const checkAuthStatus = () => {
      // Check both the service and localStorage for authentication status
      const serviceAuthStatus = miroAuthService.isAuthenticated();
      const localStorageToken =
        typeof window !== 'undefined' ? localStorage.getItem('miro_access_token') : null;
      const miroConfig = typeof window !== 'undefined' ? localStorage.getItem('miroConfig') : null;

      // For testing: if we have a config, consider it authenticated
      const hasConfig = miroConfig
        ? JSON.parse(miroConfig).clientId && JSON.parse(miroConfig).clientSecret
        : false;
      const authStatus = serviceAuthStatus || !!localStorageToken || hasConfig;

      setIsAuthenticated(authStatus);
      onAuthStatusChange?.(authStatus);

      // If we have a token in localStorage but not in the service, restore it
      if (localStorageToken && !serviceAuthStatus) {
        miroAuthService.setTokenFromUrl(localStorageToken);
      }
    };

    // Check immediately
    checkAuthStatus();

    // Check every 2 seconds to stay in sync with Miro Configuration tab
    const interval = setInterval(checkAuthStatus, 2000);

    return () => clearInterval(interval);
  }, [onAuthStatusChange]);

  const handleLogout = () => {
    miroAuthService.clearToken();
    setIsAuthenticated(false);
    setBoardLinks({});
    setError(null);
    onAuthStatusChange?.(false);
  };

  const handleCreateTMFBoard = async () => {
    setIsCreatingTMF(true);
    setError(null);

    console.log('Creating TMF board with project:', project);
    console.log('TMF domains:', tmfDomains);
    console.log(
      'Selected domains:',
      tmfDomains.filter((d) => d.isSelected),
    );

    try {
      const board = await miroService.createTMFBoard(project, tmfDomains);
      setBoardLinks((prev) => ({ ...prev, tmfBoard: board.viewLink }));
    } catch (error) {
      console.error('Failed to create TMF board:', error);

      // Check if it's a token-related error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (
        errorMessage.includes('token') ||
        errorMessage.includes('authentication') ||
        errorMessage.includes('401') ||
        errorMessage.includes('403')
      ) {
        setError(
          'Miro access token is invalid or expired. Please re-authenticate with Miro in the Configuration tab.',
        );
        setIsAuthenticated(false);
        onAuthStatusChange?.(false);
      } else {
        setError(
          'Failed to create TMF Architecture board. Please check your Miro credentials and try again.',
        );
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
      setBoardLinks((prev) => ({ ...prev, specSyncBoard: board.viewLink }));
    } catch (error) {
      console.error('Failed to create SpecSync board:', error);

      // Check if it's a token-related error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (
        errorMessage.includes('token') ||
        errorMessage.includes('authentication') ||
        errorMessage.includes('401') ||
        errorMessage.includes('403')
      ) {
        setError(
          'Miro access token is invalid or expired. Please re-authenticate with Miro in the Configuration tab.',
        );
        setIsAuthenticated(false);
        onAuthStatusChange?.(false);
      } else {
        setError(
          'Failed to create SpecSync Requirements board. Please check your Miro credentials and try again.',
        );
      }
    } finally {
      setIsCreatingSpecSync(false);
    }
  };

  const handleClearTestBoard = async () => {
    setError(null);
    try {
      await miroService.clearTestBoard();
      setBoardLinks({});
      setError('Test board cleared successfully.');
      console.log('Test board cleared successfully.');
    } catch (error) {
      console.error('Failed to clear test board:', error);
      setError('Failed to clear test board. Please try again.');
    }
  };

  const totalCapabilities = tmfDomains.reduce((acc, domain) => acc + domain.capabilities.length, 0);
  const selectedDomains = tmfDomains.filter((domain) => domain.isSelected).length;
  const selectedCapabilities = tmfDomains.reduce(
    (acc, domain) => acc + domain.capabilities.filter((cap) => cap.isSelected).length,
    0,
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
            Create interactive visual boards for TMF domains, capabilities, and SpecSync
            requirements
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Authentication Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {isAuthenticated ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Connected to Miro</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <span>Not Connected to Miro</span>
              </>
            )}
          </CardTitle>
          <CardDescription>
            {isAuthenticated
              ? 'You are authenticated with Miro and can create boards.'
              : 'Please go to the Miro Configuration tab to connect to Miro first.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <CheckCircle className="mr-1 h-3 w-3" />
                Authenticated
              </Badge>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Disconnect</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleClearTestBoard}
                className="flex items-center space-x-2"
              >
                <AlertCircle className="h-4 w-4" />
                <span>Clear Test Board</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  console.log('=== Debug Authentication Status ===');
                  console.log('Component isAuthenticated state:', isAuthenticated);
                  console.log('Service isAuthenticated:', miroAuthService.isAuthenticated());
                  console.log('localStorage token:', localStorage.getItem('miro_access_token'));
                  console.log('Service token data:', miroAuthService.getAccessToken());
                }}
                className="flex items-center space-x-2"
              >
                <span>Debug Auth</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <p className="text-sm text-muted-foreground">
                Please configure and connect to Miro in the Configuration tab before creating
                boards.
              </p>
            </div>
          )}
        </CardContent>
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
                <CheckCircle className="mr-1 h-3 w-3" />
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
            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground">Domains:</span>
                <Badge variant="outline">
                  {selectedDomains} / {tmfDomains.length}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground">Capabilities:</span>
                <Badge variant="outline">
                  {selectedCapabilities} / {totalCapabilities}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground">Project:</span>
                <Badge variant="outline">{project.name}</Badge>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                onClick={handleCreateTMFBoard}
                disabled={!isAuthenticated || isCreatingTMF || selectedDomains === 0}
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

            {!isAuthenticated && (
              <div className="text-sm text-muted-foreground">
                Please connect to Miro in the Configuration tab first to create boards.
              </div>
            )}

            {isAuthenticated && selectedDomains === 0 && (
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
                <CheckCircle className="mr-1 h-3 w-3" />
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
            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground">Requirements:</span>
                <Badge variant="outline">{specSyncItems.length}</Badge>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground">Domains:</span>
                <Badge variant="outline">
                  {new Set(specSyncItems.map((item) => item.domain)).size}
                </Badge>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                onClick={handleCreateSpecSyncBoard}
                disabled={!isAuthenticated || isCreatingSpecSync || specSyncItems.length === 0}
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

            {!isAuthenticated && (
              <div className="text-sm text-muted-foreground">
                Please connect to Miro in the Configuration tab first to create boards.
              </div>
            )}

            {isAuthenticated && specSyncItems.length === 0 && (
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
            <CardDescription>Manage your created Miro boards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {boardLinks.tmfBoard && (
                <div className="flex items-center justify-between rounded-lg border p-3">
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
                      <ExternalLink className="mr-1 h-3 w-3" />
                      Open
                    </Button>
                  </Link>
                </div>
              )}

              {boardLinks.specSyncBoard && (
                <div className="flex items-center justify-between rounded-lg border p-3">
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
                      <ExternalLink className="mr-1 h-3 w-3" />
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

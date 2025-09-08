'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, CheckCircle, AlertTriangle, X, FileSpreadsheet } from 'lucide-react';
import { CETv22FileUploadProps } from '@/types';
import { CETv22ParserService } from '@/services/cet-v22-parser';
import { CETv22Error } from '@/types';

export const CETv22FileUpload: React.FC<CETv22FileUploadProps> = ({
  onFileProcessed,
  onError,
  maxFileSize = 50 * 1024 * 1024, // 50MB default
  allowedTypes = ['.xlsx', '.xls'],
  dragAndDrop = true,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File validation
  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file size
      if (file.size > maxFileSize) {
        return `File size exceeds ${Math.round(maxFileSize / 1024 / 1024)}MB limit`;
      }

      // Check file type
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      if (!allowedTypes.includes(fileExtension)) {
        return `Invalid file type. Please upload ${allowedTypes.join(' or ')} files only`;
      }

      // Check file name pattern (optional - CET v22.0 files typically have specific naming)
      if (!file.name.toLowerCase().includes('cet') && !file.name.toLowerCase().includes('v22')) {
        console.warn(
          'File name does not contain "CET" or "v22" - this may not be a CET v22.0 file',
        );
      }

      return null;
    },
    [maxFileSize, allowedTypes],
  );

  // Process uploaded file
  const processFile = useCallback(
    async (file: File) => {
      try {
        setIsProcessing(true);
        setProgress(0);
        setError(null);

        // Update progress
        setProgress(25);

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        setProgress(50);

        // Parse the Excel file
        const parserService = new CETv22ParserService();
        const cetData = await parserService.parseExcelFile(buffer);

        setProgress(75);

        // Validate parsed data
        if (!cetData.project || !cetData.resourceDemands) {
          throw new CETv22Error('INVALID_DATA', 'Parsed data is incomplete or invalid');
        }

        setProgress(100);

        // Success - call the callback
        onFileProcessed(cetData);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error occurred');
        setError(error.message);
        onError(error);
      } finally {
        setIsProcessing(false);
      }
    },
    [onFileProcessed, onError],
  );

  // Handle file selection
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate the file
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        onError(new Error(validationError));
        return;
      }

      setSelectedFile(file);
      setError(null);

      // Auto-process if not disabled
      processFile(file);
    },
    [validateFile, processFile, onError],
  );

  // Handle drag and drop
  const handleDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragActive(false);

      const files = event.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const file = files[0];

      // Validate the file
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        onError(new Error(validationError));
        return;
      }

      setSelectedFile(file);
      setError(null);

      // Auto-process if not disabled
      processFile(file);
    },
    [validateFile, processFile, onError],
  );

  // Handle manual upload trigger
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Handle file removal
  const handleFileRemove = useCallback(() => {
    setSelectedFile(null);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileSpreadsheet className="h-5 w-5" />
          <span>Upload CET v22.0 Excel File</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : selectedFile
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={dragAndDrop ? handleDragEnter : undefined}
          onDragLeave={dragAndDrop ? handleDragLeave : undefined}
          onDragOver={dragAndDrop ? handleDragOver : undefined}
          onDrop={dragAndDrop ? handleDrop : undefined}
        >
          {selectedFile ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <div>
                <div className="flex items-center justify-center space-x-2">
                  <FileText className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-green-700">{selectedFile.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleFileRemove}
                    className="h-6 w-6 p-0 hover:bg-red-100"
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  Size: {formatFileSize(selectedFile.size)}
                </div>
                <div className="text-sm text-gray-500">
                  Last modified:{' '}
                  {selectedFile.lastModified
                    ? new Date(selectedFile.lastModified).toLocaleDateString()
                    : 'Unknown'}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <Upload
                  className={`h-12 w-12 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`}
                />
              </div>
              <div>
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  {isDragActive ? 'Drop your CET v22.0 file here' : 'Upload CET v22.0 Excel File'}
                </h3>
                <p className="mb-4 text-gray-600">
                  {dragAndDrop
                    ? 'Drag and drop your Excel file here, or click to browse'
                    : 'Click to browse and select your Excel file'}
                </p>
                <Button onClick={handleUploadClick} disabled={isProcessing}>
                  Choose File
                </Button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isProcessing}
          />
        </div>

        {/* File Requirements */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h4 className="mb-2 text-sm font-medium text-blue-900">File Requirements:</h4>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• Excel format (.xlsx or .xls)</li>
            <li>• Maximum size: {Math.round(maxFileSize / 1024 / 1024)}MB</li>
            <li>• Should contain CET v22.0 resource demand data</li>
            <li>
              • Required sheets: Attributes, JobProfiles, demand sheets (Ph1Demand, Ph2Demand, etc.)
            </li>
          </ul>
        </div>

        {/* Processing Progress */}
        {isProcessing && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Processing file...</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
            <div className="text-center text-xs text-gray-500">
              This may take a few moments for large files
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Upload Error</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setError(null);
                  handleFileRemove();
                }}
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Processing Complete */}
        {selectedFile && !isProcessing && !error && progress === 100 && (
          <Alert variant="success">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Upload Complete</AlertTitle>
            <AlertDescription>
              File processed successfully! Analysis results are now available in the other tabs.
            </AlertDescription>
          </Alert>
        )}

        {/* File Info */}
        {selectedFile && (
          <div className="rounded-lg bg-gray-50 p-4">
            <h4 className="mb-2 text-sm font-medium text-gray-900">File Information:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <div className="font-medium">{selectedFile.name}</div>
              </div>
              <div>
                <span className="text-gray-600">Size:</span>
                <div className="font-medium">{formatFileSize(selectedFile.size)}</div>
              </div>
              <div>
                <span className="text-gray-600">Type:</span>
                <div className="font-medium">{selectedFile.type || 'Unknown'}</div>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <Badge variant={isProcessing ? 'secondary' : error ? 'destructive' : 'default'}>
                  {isProcessing ? 'Processing' : error ? 'Error' : 'Ready'}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

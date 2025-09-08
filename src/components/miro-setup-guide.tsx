'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, ExternalLink, Copy, Settings } from 'lucide-react';
import { useState } from 'react';

export function MiroSetupGuide() {
  const [currentStep, setCurrentStep] = useState(1);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const steps = [
    {
      id: 1,
      title: 'Create Miro App',
      description: 'Set up your application in the Miro Developer Platform',
      content: (
        <div className="space-y-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h4 className="mb-2 font-medium text-blue-900">
              Step 1: Access Miro Developer Platform
            </h4>
            <Button
              variant="outline"
              onClick={() => window.open('https://developers.miro.com/', '_blank')}
              className="w-full"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Go to Miro Developers
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Sign in with your Miro account</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Click "Create new app"</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Choose "OAuth 2.0" as the app type</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      title: 'Configure OAuth Settings',
      description: 'Set up the OAuth 2.0 configuration for your app',
      content: (
        <div className="space-y-4">
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <h4 className="mb-2 font-medium text-yellow-900">Important: OAuth Configuration</h4>
            <div className="space-y-2 text-sm text-yellow-800">
              <div className="flex items-center justify-between">
                <span>Redirect URI:</span>
                <div className="flex items-center space-x-2">
                  <code className="rounded border bg-white px-2 py-1 text-xs">
                    http://localhost:3000/api/auth/miro/callback
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard('http://localhost:3000/api/auth/miro/callback', 'redirect')
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Scopes:</span>
                <code className="rounded border bg-white px-2 py-1 text-xs">
                  boards:read boards:write boards:write:team
                </code>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Set App Name: "E2E Delivery Management"</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Set App Description: "TMF Architecture and Requirements Mapping"</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Add the redirect URI exactly as shown above</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Save the configuration</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      title: 'Get Credentials',
      description: 'Copy your Client ID and Client Secret',
      content: (
        <div className="space-y-4">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <h4 className="mb-2 font-medium text-green-900">Your App Credentials</h4>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-green-800">Client ID</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Copy from Miro Developer Platform"
                    className="flex-1 rounded-md border border-green-300 px-3 py-2 text-sm"
                    readOnly
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard('Client ID copied!', 'clientId')}
                  >
                    {copiedField === 'clientId' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-green-800">
                  Client Secret
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="password"
                    placeholder="Copy from Miro Developer Platform"
                    className="flex-1 rounded-md border border-green-300 px-3 py-2 text-sm"
                    readOnly
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard('Client Secret copied!', 'clientSecret')}
                  >
                    {copiedField === 'clientSecret' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
            <h4 className="mb-2 font-medium text-orange-900">⚠️ Security Note</h4>
            <p className="text-sm text-orange-800">
              Keep your Client Secret secure and never share it publicly. These credentials will be
              stored in your local environment file.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 4,
      title: 'Configure Application',
      description: 'Set up Miro integration in the application',
      content: (
        <div className="space-y-4">
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
            <h4 className="mb-2 font-medium text-purple-900">Configure in Application</h4>
            <p className="mb-3 text-sm text-purple-800">
              Now configure the Miro integration directly in the application interface.
            </p>

            <div className="rounded border border-purple-300 bg-white p-3">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Go to "Configurations" → "Miro Configuration" in the navigation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Enter your Client ID and Client Secret from Miro</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Verify the Redirect URI matches exactly</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Click "Save Configuration" to store settings</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Configuration is stored securely in your browser</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Settings are automatically synced with the server</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>No environment files or server restarts required</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 5,
      title: 'Test Connection',
      description: 'Verify your Miro integration is working',
      content: (
        <div className="space-y-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h4 className="mb-2 font-medium text-blue-900">Ready to Test!</h4>
            <p className="mb-3 text-sm text-blue-800">
              Now that you've configured everything, let's test the connection:
            </p>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Go to the "Visual Mapping" tab</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Click "Create TMF Architecture Board"</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Verify the board is created successfully in Miro</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Check that all domain frames and capability cards are created</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <h4 className="mb-2 font-medium text-green-900">🎉 Success Indicators</h4>
            <div className="space-y-1 text-sm text-green-800">
              <div>• Configuration shows "Configured" status</div>
              <div>• You can create TMF Architecture boards successfully</div>
              <div>• You can create SpecSync Requirements boards successfully</div>
              <div>• No configuration or authentication errors</div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Miro Integration Setup Guide</h2>
        <p className="text-gray-600">
          Follow this step-by-step guide to set up Miro integration for visual mapping and board
          creation.
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-6 flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                step.id <= currentStep
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-gray-300 bg-gray-200 text-gray-500'
              }`}
            >
              {step.id < currentStep ? <CheckCircle className="h-5 w-5" /> : step.id}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`mx-2 h-0.5 w-16 ${
                  step.id < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Current Step Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-blue-200 bg-blue-100">
              <Settings className="h-6 w-6 text-blue-700" />
            </div>
            <div>
              <CardTitle className="text-lg">
                Step {currentStep}: {steps[currentStep - 1].title}
              </CardTitle>
              <CardDescription>{steps[currentStep - 1].description}</CardDescription>
            </div>
            <Badge variant="outline" className="ml-auto">
              {currentStep} of {steps.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {steps[currentStep - 1].content}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between border-t pt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
            >
              Previous
            </Button>

            <Button
              onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
              disabled={currentStep === steps.length}
            >
              {currentStep === steps.length ? 'Finish' : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-orange-200 bg-orange-100">
              <AlertTriangle className="h-6 w-6 text-orange-700" />
            </div>
            <div>
              <CardTitle className="text-lg">Troubleshooting Common Issues</CardTitle>
              <CardDescription>Solutions for typical setup problems</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <h4 className="mb-1 font-medium text-red-900">
                ❌ "Miro configuration missing" Error
              </h4>
              <p className="text-sm text-red-800">
                <strong>Solution:</strong> Ensure you have saved your Miro configuration in the
                "Miro Configuration" tab. The configuration must be saved and synced with the server
                before attempting to connect.
              </p>
            </div>

            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <h4 className="mb-1 font-medium text-red-900">❌ "Invalid redirect URI" Error</h4>
              <p className="text-sm text-red-800">
                <strong>Solution:</strong> Verify the redirect URI in your Miro app settings exactly
                matches{' '}
                <code className="rounded bg-white px-1 py-0.5 text-xs">
                  http://localhost:3000/api/auth/miro/callback
                </code>
              </p>
            </div>

            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <h4 className="mb-1 font-medium text-red-900">❌ "Invalid client" Error</h4>
              <p className="text-sm text-red-800">
                <strong>Solution:</strong> Double-check your Client ID and Client Secret are copied
                correctly from the Miro Developer Platform and saved in the application
                configuration.
              </p>
            </div>

            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <h4 className="mb-1 font-medium text-red-900">❌ Configuration Not Saving</h4>
              <p className="text-sm text-red-800">
                <strong>Solution:</strong> Ensure you click "Save Configuration" after entering your
                credentials. Check the browser console for any error messages during the save
                process.
              </p>
            </div>

            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <h4 className="mb-1 font-medium text-red-900">❌ Board Creation Fails</h4>
              <p className="text-sm text-red-800">
                <strong>Solution:</strong> Verify you are authenticated with Miro. Check that the
                access token is valid and not expired. Try reconnecting to Miro if the issue
                persists.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

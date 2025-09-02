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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Step 1: Access Miro Developer Platform</h4>
            <Button 
              variant="outline" 
              onClick={() => window.open('https://developers.miro.com/', '_blank')}
              className="w-full"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Go to Miro Developers
            </Button>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Sign in with your Miro account</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Click &quot;Create new app&quot;</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Choose &quot;OAuth 2.0&quot; as the app type</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: 'Configure OAuth Settings',
      description: 'Set up the OAuth 2.0 configuration for your app',
      content: (
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">Important: OAuth Configuration</h4>
            <div className="space-y-2 text-sm text-yellow-800">
              <div className="flex items-center justify-between">
                <span>Redirect URI:</span>
                <div className="flex items-center space-x-2">
                  <code className="bg-white px-2 py-1 rounded border text-xs">
                    http://localhost:3000/api/auth/miro/callback
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('http://localhost:3000/api/auth/miro/callback', 'redirect')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Scopes:</span>
                <code className="bg-white px-2 py-1 rounded border text-xs">
                  boards:read boards:write boards:write:team
                </code>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Set App Name: &quot;E2E Delivery Management&quot;</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Set App Description: &quot;TMF Architecture and Requirements Mapping&quot;</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Add the redirect URI exactly as shown above</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Save the configuration</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: 'Get Credentials',
      description: 'Copy your Client ID and Client Secret',
      content: (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">Your App Credentials</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-green-800 mb-1">Client ID</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Copy from Miro Developer Platform"
                    className="flex-1 px-3 py-2 border border-green-300 rounded-md text-sm"
                    readOnly
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard('Client ID copied!', 'clientId')}
                  >
                    {copiedField === 'clientId' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-green-800 mb-1">Client Secret</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="password"
                    placeholder="Copy from Miro Developer Platform"
                    className="flex-1 px-3 py-2 border border-green-300 rounded-md text-sm"
                    readOnly
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard('Client Secret copied!', 'clientSecret')}
                  >
                    {copiedField === 'clientSecret' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-medium text-orange-900 mb-2">⚠️ Security Note</h4>
            <p className="text-sm text-orange-800">
              Keep your Client Secret secure and never share it publicly. These credentials will be stored in your local environment file.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: 'Configure Application',
      description: 'Set up Miro integration in the application',
      content: (
        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-medium text-purple-900 mb-2">Configure in Application</h4>
            <p className="text-sm text-purple-800 mb-3">
              Now configure the Miro integration directly in the application interface.
            </p>
            
            <div className="bg-white border border-purple-300 rounded p-3">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Go to "Configurations" → "Miro Configuration" in the navigation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Enter your Client ID and Client Secret from Miro</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Verify the Redirect URI matches exactly</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Click "Save Configuration" to store settings</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Configuration is stored securely in your browser</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Settings are automatically synced with the server</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>No environment files or server restarts required</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: 'Test Connection',
      description: 'Verify your Miro integration is working',
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Ready to Test!</h4>
            <p className="text-sm text-blue-800 mb-3">
              Now that you've configured everything, let's test the connection:
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Go to the &quot;Visual Mapping&quot; tab</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Click &quot;Create TMF Architecture Board&quot;</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Verify the board is created successfully in Miro</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Check that all domain frames and capability cards are created</span>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">🎉 Success Indicators</h4>
            <div className="text-sm text-green-800 space-y-1">
              <div>• Configuration shows "Configured" status</div>
              <div>• You can create TMF Architecture boards successfully</div>
              <div>• You can create SpecSync Requirements boards successfully</div>
              <div>• No configuration or authentication errors</div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Miro Integration Setup Guide</h2>
        <p className="text-gray-600">
          Follow this step-by-step guide to set up Miro integration for visual mapping and board creation.
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-6">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
              step.id <= currentStep 
                ? 'bg-blue-600 border-blue-600 text-white' 
                : 'bg-gray-200 border-gray-300 text-gray-500'
            }`}>
              {step.id < currentStep ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                step.id
              )}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-16 h-0.5 mx-2 ${
                step.id < currentStep ? 'bg-blue-600' : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Current Step Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg border-2 border-blue-200">
              <Settings className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <CardTitle className="text-lg">Step {currentStep}: {steps[currentStep - 1].title}</CardTitle>
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
          <div className="flex items-center justify-between pt-6 border-t">
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
            <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-lg border-2 border-orange-200">
              <AlertTriangle className="w-6 h-6 text-orange-700" />
            </div>
            <div>
              <CardTitle className="text-lg">Troubleshooting Common Issues</CardTitle>
              <CardDescription>Solutions for typical setup problems</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <h4 className="font-medium text-red-900 mb-1">❌ "Miro configuration missing" Error</h4>
              <p className="text-sm text-red-800">
                <strong>Solution:</strong> Ensure you have saved your Miro configuration in the "Miro Configuration" tab. The configuration must be saved and synced with the server before attempting to connect.
              </p>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <h4 className="font-medium text-red-900 mb-1">❌ "Invalid redirect URI" Error</h4>
              <p className="text-sm text-red-800">
                <strong>Solution:</strong> Verify the redirect URI in your Miro app settings exactly matches <code className="bg-white px-1 py-0.5 rounded text-xs">http://localhost:3000/api/auth/miro/callback</code>
              </p>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <h4 className="font-medium text-red-900 mb-1">❌ "Invalid client" Error</h4>
              <p className="text-sm text-red-800">
                <strong>Solution:</strong> Double-check your Client ID and Client Secret are copied correctly from the Miro Developer Platform and saved in the application configuration.
              </p>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <h4 className="font-medium text-red-900 mb-1">❌ Configuration Not Saving</h4>
              <p className="text-sm text-red-800">
                <strong>Solution:</strong> Ensure you click "Save Configuration" after entering your credentials. Check the browser console for any error messages during the save process.
              </p>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <h4 className="font-medium text-red-900 mb-1">❌ Board Creation Fails</h4>
              <p className="text-sm text-red-800">
                <strong>Solution:</strong> Verify you are authenticated with Miro. Check that the access token is valid and not expired. Try reconnecting to Miro if the issue persists.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// src/app/test/page.tsx

"use client";

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MapPin,
  Shield,
  AlertTriangle,
  Vibrate,
  Navigation,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
interface TestResults {
  safety?: any;
  emergency?: any;
  motion?: any;
  monitoring?: any;
}

interface LoadingState {
  safety?: boolean;
  emergency?: boolean;
  motion?: boolean;
  monitoring?: boolean;
}

interface ErrorState {
  safety?: string;
  emergency?: string;
  motion?: string;
  monitoring?: string;
}

// API Configuration
const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include' as RequestCredentials
};

// Test locations - San Francisco landmarks
const TEST_LOCATIONS = {
  ferryBuilding: {
    name: 'Ferry Building',
    coords: { lat: 37.7955, lng: -122.3937 }
  },
  missionDistrict: {
    name: 'Mission District',
    coords: { lat: 37.7599, lng: -122.4148 }
  },
  financialDistrict: {
    name: 'Financial District',
    coords: { lat: 37.7946, lng: -122.3999 }
  }
};

export default function TestPage() {
  const [testResults, setTestResults] = React.useState<TestResults>({});
  const [loading, setLoading] = React.useState<LoadingState>({});
  const [errors, setErrors] = React.useState<ErrorState>({});

  const clearError = (feature: keyof ErrorState) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[feature];
      return newErrors;
    });
  };

  const runSafetyAnalysis = async () => {
    clearError('safety');
    setLoading(prev => ({ ...prev, safety: true }));
    
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/safety/analyze-route`, {
        method: 'POST',
        headers: API_CONFIG.headers,
        credentials: API_CONFIG.credentials,
        body: JSON.stringify({
          start_location: TEST_LOCATIONS.missionDistrict.coords,
          end_location: TEST_LOCATIONS.financialDistrict.coords
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setTestResults(prev => ({ ...prev, safety: data }));
    } catch (err) {
      setErrors(prev => ({
        ...prev,
        safety: err instanceof Error ? err.message : "Safety analysis failed"
      }));
    } finally {
      setLoading(prev => ({ ...prev, safety: false }));
    }
  };

  const triggerEmergencyAlert = async () => {
    clearError('emergency');
    setLoading(prev => ({ ...prev, emergency: true }));
    
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/emergency/alert`, {
        method: 'POST',
        headers: API_CONFIG.headers,
        credentials: API_CONFIG.credentials,
        body: JSON.stringify({
          type: 'test_emergency',
          location: TEST_LOCATIONS.missionDistrict.coords,
          description: 'Test emergency alert'
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setTestResults(prev => ({ ...prev, emergency: data }));
    } catch (err) {
      setErrors(prev => ({
        ...prev,
        emergency: err instanceof Error ? err.message : "Emergency alert failed"
      }));
    } finally {
      setLoading(prev => ({ ...prev, emergency: false }));
    }
  };

  const testMotionDetection = async () => {
    clearError('motion');
    setLoading(prev => ({ ...prev, motion: true }));
    
    try {
      // Simulate accelerometer data for phone shake
      const motionData = [
        { x: 0.1, y: 0.2, z: 9.8 },  // Normal position
        { x: 5.1, y: 4.2, z: 12.8 }, // Sharp movement right
        { x: 0.1, y: 0.2, z: 9.8 },  // Return to normal
        { x: -4.1, y: -3.2, z: 6.8 }, // Sharp movement left
        { x: 0.1, y: 0.2, z: 9.8 }   // Return to normal
      ];

      const response = await fetch(`${API_CONFIG.baseURL}/monitoring/motion`, {
        method: 'POST',
        headers: API_CONFIG.headers,
        credentials: API_CONFIG.credentials,
        body: JSON.stringify({
          acceleration_data: motionData,
          timestamp: Date.now() / 1000,
          location: TEST_LOCATIONS.missionDistrict.coords
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setTestResults(prev => ({ ...prev, motion: data }));
    } catch (err) {
      setErrors(prev => ({
        ...prev,
        motion: err instanceof Error ? err.message : "Motion detection failed"
      }));
    } finally {
      setLoading(prev => ({ ...prev, motion: false }));
    }
  };

  const startMonitoring = async () => {
    clearError('monitoring');
    setLoading(prev => ({ ...prev, monitoring: true }));
    
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/monitoring/start`, {
        method: 'POST',
        headers: API_CONFIG.headers,
        credentials: API_CONFIG.credentials,
        body: JSON.stringify({
          user_id: 1,
          route: {
            start: TEST_LOCATIONS.missionDistrict.coords,
            end: TEST_LOCATIONS.financialDistrict.coords
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setTestResults(prev => ({ ...prev, monitoring: data }));
    } catch (err) {
      setErrors(prev => ({
        ...prev,
        monitoring: err instanceof Error ? err.message : "Monitoring failed"
      }));
    } finally {
      setLoading(prev => ({ ...prev, monitoring: false }));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Feature Testing Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Testing location: {TEST_LOCATIONS.missionDistrict.name}
          </p>
        </div>

        {/* Error Alerts */}
        <div className="space-y-2">
          {Object.entries(errors).map(([feature, error]) => (
            error && (
              <Alert key={feature} variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )
          ))}
        </div>

        {/* Test Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Safety Analysis Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Safety Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={runSafetyAnalysis} 
                disabled={loading.safety}
                className="w-full"
              >
                {loading.safety ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Navigation className="h-4 w-4 mr-2" />
                )}
                Test Route Analysis
              </Button>

              {testResults.safety && (
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                  <div className="p-4 space-y-2">
                    <h4 className="font-medium">Results:</h4>
                    <pre className="p-2 rounded bg-muted text-sm overflow-auto">
                      {JSON.stringify(testResults.safety, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Emergency Alert Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Emergency Alert</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={triggerEmergencyAlert} 
                disabled={loading.emergency}
                variant="destructive"
                className="w-full"
              >
                {loading.emergency ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <AlertTriangle className="h-4 w-4 mr-2" />
                )}
                Trigger Emergency Alert
              </Button>

              {testResults.emergency && (
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                  <div className="p-4 space-y-2">
                    <h4 className="font-medium">Response:</h4>
                    <pre className="p-2 rounded bg-muted text-sm overflow-auto">
                      {JSON.stringify(testResults.emergency, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Motion Detection Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Vibrate className="h-5 w-5" />
                <span>Motion Detection</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={testMotionDetection} 
                disabled={loading.motion}
                className="w-full"
              >
                {loading.motion ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Vibrate className="h-4 w-4 mr-2" />
                )}
                Test Motion Detection
              </Button>

              {testResults.motion && (
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                  <div className="p-4 space-y-2">
                    <h4 className="font-medium">Detection Results:</h4>
                    <pre className="p-2 rounded bg-muted text-sm overflow-auto">
                      {JSON.stringify(testResults.motion, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Journey Monitoring Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Journey Monitoring</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={startMonitoring} 
                disabled={loading.monitoring}
                className="w-full"
              >
                {loading.monitoring ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4 mr-2" />
                )}
                Start Test Journey
              </Button>

              {testResults.monitoring && (
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                  <div className="p-4 space-y-2">
                    <h4 className="font-medium">Monitoring Status:</h4>
                    <pre className="p-2 rounded bg-muted text-sm overflow-auto">
                      {JSON.stringify(testResults.monitoring, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
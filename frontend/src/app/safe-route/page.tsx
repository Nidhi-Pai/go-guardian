// frontend/src/app/safe-route/page.tsx

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Shield,
  Sun,
  Moon,
} from "lucide-react";
import { SafeRouteMap } from "@/components/SafeRouteMap";
import LocationSearch from "@/components/LocationSearch";
import { DirectionsPanel } from "@/components/DirectionsPanel";
import { SafetyAnalysisPanel } from "@/components/SafetyAnalysisPanel";
import { ContextualSafety } from "@/components/ContextualSafety";
import { EmergencyAlert } from "@/components/EmergencyAlert";
import type { SafetyAlert } from "@/types";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoiceCommand } from "@/components/VoiceCommand";
import { SafePlacesSearch } from "@/components/SafePlacesSearch";

// Update API base URL to match your Flask backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Location {
  lat: number;
  lng: number;
  address?: string;
  timestamp: Date;
}

interface SafetyAnalysis {
  safety_score: number;
  risk_level: string;
  primary_concerns: string[];
  recommendations: string[];
  safe_spots: string[];
  emergency_resources: string[];
  safer_alternatives?: string[];
  confidence_score: number;
  risks: string[];
  safe_spaces: string[];
}

interface RouteInfo {
  distance: string;
  duration: string;
  steps: google.maps.DirectionsStep[];
}

interface RouteResponse {
  status: string;
  data?: {
    route_id: number;
    analysis: SafetyAnalysis;
    distance: number;
  };
  error?: string;
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

interface FromLocationProps {
  currentLocation: Location | null;
  locationStatus: 'loading' | 'denied' | 'error' | 'success';
  onLocationSelect: (location: Location) => void;
}

function FromLocationInput({ currentLocation, locationStatus, onLocationSelect }: FromLocationProps) {
  return (
    <div>
      <label className="text-sm font-medium mb-2 block">From</label>
      <div className="space-y-2">
        <LocationSearch
          onLocationSelect={(location) => onLocationSelect({ ...location, timestamp: new Date() })}
          placeholder="Enter starting location"
          initialValue={currentLocation?.address}
          showCurrentLocationButton={true}
          showFindRouteButton={false}
        />
        {locationStatus === 'loading' && (
          <p className="text-sm text-muted-foreground">Getting your location...</p>
        )}
        {locationStatus === 'denied' && (
          <p className="text-sm text-muted-foreground">Please enable location access</p>
        )}
      </div>
    </div>
  );
}

export default function SafeRoutePage() {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [safetyAnalysis, setSafetyAnalysis] = useState<SafetyAnalysis | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeRouteId, setActiveRouteId] = useState<number | null>(null);
  const [locationStatus, setLocationStatus] = useState<'loading' | 'denied' | 'error' | 'success'>('loading');
  const [isInitializing, setIsInitializing] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const [startLocation, setStartLocation] = useState<Location | null>(null);

  const locationOptions = {
    enableHighAccuracy: true,
    timeout: 20000, // Increase timeout to 20 seconds
    maximumAge: 0
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsInitializing(false);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if ("geolocation" in navigator) {
      if (typeof google === "undefined") {
        console.error("Google Maps API not loaded");
        setLocationStatus('error');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const geocoder = new google.maps.Geocoder();
          const latlng = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          try {
            const result = await new Promise<google.maps.GeocoderResult>((resolve, reject) => {
              geocoder.geocode({ location: latlng }, (results, status) => {
                if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
                  resolve(results[0]);
                } else {
                  reject(new Error('Geocoding failed'));
                }
              });
            });

            const newLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              address: result.formatted_address,
              timestamp: new Date()
            };
            setCurrentLocation(newLocation);
            setStartLocation(newLocation);
            setLocationStatus('success');
          } catch (error) {
            console.error('Geocoding error:', error);
            setLocationStatus('error');
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLocationStatus('denied');
          setError("Please enable location services to use route planning.");
        },
        locationOptions
      );
    }
  }, []);

  const analyzeSafetyForRoute = async (
    start: Location,
    end: Location,
    routeDetails: RouteInfo
  ): Promise<SafetyAnalysis | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/safety/analyze-route`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          start_location: {
            lat: start.lat,
            lng: start.lng,
            address: start.address
          },
          end_location: {
            lat: end.lat,
            lng: end.lng,
            address: end.address
          },
          distance: routeDetails.distance,
          duration: routeDetails.duration,
          time_of_day: getTimeOfDay(),
          steps: routeDetails.steps.map(step => ({
            instructions: step.instructions,
            distance: step.distance?.text,
            duration: step.duration?.text,
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze route safety');
      }

      const data = await response.json();
      if (data.status === 'success' && data.data?.analysis) {
        return {
          ...data.data.analysis,
          risks: data.data.analysis.primary_concerns || [],
          safe_spaces: data.data.analysis.safe_spots || [],
          safety_score: data.data.analysis.safety_score || 0,
          risk_level: data.data.analysis.risk_level || 'unknown',
          primary_concerns: data.data.analysis.primary_concerns || [],
          recommendations: data.data.analysis.recommendations || [],
          safe_spots: data.data.analysis.safe_spots || [],
          emergency_resources: data.data.analysis.emergency_resources || [],
          confidence_score: data.data.analysis.confidence_score || 0
        };
      }
      throw new Error(data.error || 'Failed to analyze route');
    } catch (err) {
      console.error('Error analyzing route safety:', err);
      return null;
    }
  };

  const handleLocationSelect = async (location: Omit<Location, 'timestamp'>) => {
    if (!currentLocation) return;

    const locationWithTimestamp: Location = {
      ...location,
      timestamp: new Date()
    };

    setLoading(true);
    setError(null);
    setDestination(locationWithTimestamp);
    
    try {
      // Wait for a short delay to allow Google Maps to initialize
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!routeInfo) {
        setLoading(false);
        return;
      }

      setIsAnalyzing(true);
      const analysis = await analyzeSafetyForRoute(
        currentLocation,
        locationWithTimestamp,
        routeInfo
      );
      
      if (analysis) {
        setSafetyAnalysis(analysis);
      }
    } catch (err) {
      console.error('🔴 Route analysis error:', err);
      setError(err instanceof Error ? err.message : "Failed to analyze route");
    } finally {
      setLoading(false);
      setIsAnalyzing(false);
    }
  };

  const handleRouteCalculated = async (route: google.maps.DirectionsResult) => {
    if (!route.routes?.[0]?.legs?.[0]) {
      setError("Could not calculate route");
      return;
    }
    
    const leg = route.routes[0].legs[0];
    const newRouteInfo = {
      distance: leg.distance?.text || "",
      duration: leg.duration?.text || "",
      steps: leg.steps || [],
    };
    
    // Only update if route info has changed
    if (JSON.stringify(newRouteInfo) !== JSON.stringify(routeInfo)) {
      setRouteInfo(newRouteInfo);
      
      // Only trigger safety analysis if we have a destination
      if (destination && !isAnalyzing) {
        const analysis = await analyzeSafetyForRoute(
          currentLocation!,
          destination,
          newRouteInfo
        );
        if (analysis) {
          setSafetyAnalysis(analysis);
        }
      }
    }
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18 ? "day" : "night";
  };

  const requestLocationPermission = async () => {
    try {
      const result = await navigator.permissions.query({ 
        name: 'geolocation' as PermissionName 
      });
      if (result.state === 'prompt') {
        navigator.geolocation.getCurrentPosition(() => {}, () => {});
      }
    } catch (error) {
      console.error('Permission check failed:', error);
    }
  };

  const retryLocationRequest = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      setLocationStatus('loading');
      requestLocationPermission();
    }
  };

  const handleStartLocationSelect = (location: Location) => {
    setStartLocation(location);
  };

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Google Maps API key is required. Please add it to your environment variables.
        </AlertDescription>
      </Alert>
    );
  }

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">Initializing location services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">Plan Safe Route</h1>
          <p className="text-muted-foreground mt-1">
            Find the safest path to your destination
          </p>
        </div>

        <div className="flex items-center gap-4">
          <VoiceCommand />
          <Badge 
            variant={getTimeOfDay() === "day" ? "default" : "secondary"}
            className="px-4 py-1 text-sm"
          >
            {getTimeOfDay() === "day" ? (
              <Sun className="h-4 w-4 mr-2" />
            ) : (
              <Moon className="h-4 w-4 mr-2" />
            )}
            {getTimeOfDay() === "day" ? "Daytime Route" : "Nighttime Route"}
          </Badge>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search Bar */}
      <Card className="shadow-lg">
        <CardContent className="pt-6 space-y-4">
          <FromLocationInput
            currentLocation={currentLocation}
            locationStatus={locationStatus}
            onLocationSelect={handleStartLocationSelect}
          />

          {/* To Location */}
          <div>
            <label className="text-sm font-medium mb-2 block">To</label>
            <LocationSearch
              onLocationSelect={handleLocationSelect}
              loading={loading}
              disabled={!startLocation}
              placeholder="Where do you want to go?"
              showFindRouteButton={true}
            />
          </div>

          {/* Existing status messages */}
          {locationStatus === 'denied' && (
            <p className="text-sm text-muted-foreground">
              Please enable location access in your browser settings to use route planning
            </p>
          )}
          {locationStatus === 'error' && (
            <Button 
              onClick={retryLocationRequest}
              variant="outline"
              size="sm"
            >
              Retry Location Request
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Contextual Safety */}
      {destination && (
        <ContextualSafety location={destination} />
      )}

      {/* Main Content */}
      <Tabs defaultValue="map" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="map">Map View</TabsTrigger>
          <TabsTrigger value="turn-by-turn">Turn-by-Turn</TabsTrigger>
          <TabsTrigger value="safety">Safety Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="map">
          <Card className="overflow-hidden shadow-lg">
            <CardContent className="p-0 relative" style={{ height: '600px' }}>
              <div className="absolute inset-0">
                {currentLocation && (
                  <SafeRouteMap
                    initialLocation={{ lat: currentLocation.lat, lng: currentLocation.lng }}
                    fromLocation={startLocation ? `${startLocation.lat},${startLocation.lng}` : ''}
                    toLocation={destination ? `${destination.lat},${destination.lng}` : ''}
                    onRouteCalculated={handleRouteCalculated}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="turn-by-turn">
          <DirectionsPanel
            destination={destination}
            routeInfo={routeInfo}
            safetyScore={safetyAnalysis?.safety_score}
          />
        </TabsContent>

        <TabsContent value="safety">
          <SafetyAnalysisPanel 
            safetyAnalysis={safetyAnalysis}
            routeInfo={routeInfo}
          />
        </TabsContent>
      </Tabs>

      {/* Emergency Alert */}
      {currentLocation && (
        <EmergencyAlert
          currentLocation={{
            lat: currentLocation.lat,
            lng: currentLocation.lng,
            address: currentLocation.address || '',
            timestamp: new Date()
          }}
          onAlertSent={(alert: SafetyAlert) => {
            console.log('Emergency alert sent:', alert);
          }}
        />
      )}
    </div>
  );
}
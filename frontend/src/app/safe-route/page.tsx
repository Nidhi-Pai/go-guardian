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

// Update API base URL to match your Flask backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Location {
  lat: number;
  lng: number;
  address?: string;
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

export default function SafeRoutePage() {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [safetyAnalysis, setSafetyAnalysis] = useState<SafetyAnalysis | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeRouteId, setActiveRouteId] = useState<number | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          
          try {
            // Use Google Maps Geocoding service directly instead of API call
            const geocoder = new google.maps.Geocoder();
            const result = await geocoder.geocode({ location });
            
            if (result.results?.[0]) {
              setCurrentLocation({
                ...location,
                address: result.results[0].formatted_address,
              });
            } else {
              setCurrentLocation(location);
            }
          } catch (err) {
            console.error('Error getting address:', err);
            setCurrentLocation(location);
          }
        },
        (error) => {
          setError("Please enable location services to use route planning.");
        },
        { 
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    }
  }, []);

  const analyzeSafetyForRoute = async (
    start: Location,
    end: Location,
    routeDetails: RouteInfo
  ): Promise<SafetyAnalysis | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/safety/analyze-route`, {
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
          safe_spaces: data.data.analysis.safe_spots || []
        };
      }
      throw new Error(data.error || 'Failed to analyze route');
    } catch (err) {
      console.error('Error analyzing route safety:', err);
      return null;
    }
  };

  const handleLocationSelect = async (location: Location) => {
    if (!currentLocation) return;

    setLoading(true);
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Keep the destination state update after route calculation
      const directionsService = new google.maps.DirectionsService();
      const routeResult = await directionsService.route({
        origin: { lat: currentLocation.lat, lng: currentLocation.lng },
        destination: { lat: location.lat, lng: location.lng },
        travelMode: google.maps.TravelMode.WALKING,
      });

      if (!routeResult.routes?.[0]?.legs?.[0]) {
        throw new Error("Could not calculate route");
      }

      const leg = routeResult.routes[0].legs[0];
      const routeDetails = {
        distance: leg.distance?.text || "",
        duration: leg.duration?.text || "",
        steps: leg.steps || [],
      };
      
      // Set route info before making the safety analysis request
      setRouteInfo(routeDetails);
      
      // Now set destination after successful route calculation
      setDestination(location);

      const safetyResponse = await fetch(`${API_BASE_URL}/api/safety/analyze-route`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          start_location: {
            lat: currentLocation.lat,
            lng: currentLocation.lng,
            address: currentLocation.address
          },
          end_location: {
            lat: location.lat,
            lng: location.lng,
            address: location.address
          },
          distance: routeDetails.distance,
          duration: routeDetails.duration,
          time_of_day: new Date().toLocaleTimeString()
        }),
      });

      const responseData = await safetyResponse.json();

      if (responseData.status === 'success' && responseData.data?.analysis) {
        setSafetyAnalysis({
          safety_score: responseData.data.analysis.safety_score,
          risk_level: responseData.data.analysis.risk_level,
          primary_concerns: responseData.data.analysis.primary_concerns || [],
          recommendations: responseData.data.analysis.recommendations || [],
          safe_spots: responseData.data.analysis.safe_spots || [],
          emergency_resources: responseData.data.analysis.emergency_resources || [],
          safer_alternatives: responseData.data.analysis.safer_alternatives,
          confidence_score: responseData.data.analysis.confidence_score
        });
        setActiveRouteId(responseData.data.route_id);
      } else {
        throw new Error(responseData.error || 'Failed to analyze route');
      }

    } catch (err) {
      console.error('🔴 Route analysis error:', err);
      setError(err instanceof Error ? err.message : "Failed to plan route");
      // Don't reset destination and safety analysis on error
    } finally {
      setLoading(false);
      setIsAnalyzing(false);
    }
  };

  const handleRouteCalculated = async (route: google.maps.DirectionsResult) => {
    if (!route.routes?.[0]?.legs?.[0]) return;
    
    const leg = route.routes[0].legs[0];
    const routeInfo = {
      distance: leg.distance?.text || "",
      duration: leg.duration?.text || "",
      steps: leg.steps || [],
    };
    
    setRouteInfo(routeInfo);
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18 ? "day" : "night";
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

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search Bar */}
      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <LocationSearch
            onLocationSelect={handleLocationSelect}
            loading={loading}
            disabled={!currentLocation}
          />
          {!currentLocation && (
            <p className="text-sm text-muted-foreground mt-2">
              Please enable location services to use route planning
            </p>
          )}
          {currentLocation?.address && (
            <p className="text-sm text-muted-foreground mt-2">
              Current location: {currentLocation.address}
            </p>
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
            <CardContent className="p-0">
              <div className="h-[600px]">
                {currentLocation && (
                  <SafeRouteMap
                    apiKey={GOOGLE_MAPS_API_KEY}
                    initialLocation={currentLocation}
                    destination={destination}
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
          currentLocation={currentLocation}
          onAlertSent={(alert: SafetyAlert) => {
            console.log('Emergency alert sent:', alert);
            // Handle the alert as needed
          }}
        />
      )}
    </div>
  );
}
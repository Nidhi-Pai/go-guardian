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
  risks: string[];
  recommendations: string[];
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
          start_location: currentLocation,
          end_location: location,
          distance: routeDetails.distance,
          time_of_day: getTimeOfDay()
        }),
      });

      if (!safetyResponse.ok) {
        const errorText = await safetyResponse.text();
        throw new Error(`Server error: ${safetyResponse.status} - ${errorText}`);
      }

      const responseData: RouteResponse = await safetyResponse.json();
      
      if (responseData.status === 'success' && responseData.data) {
        setSafetyAnalysis(responseData.data.analysis);
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

  const handleRouteCalculated = async (result: google.maps.DirectionsResult) => {
    if (!result.routes?.[0]?.legs?.[0]) return;
    
    console.log('🔵 Route calculated:', result);
    
    const leg = result.routes[0].legs[0];
    const routeInfo = {
      distance: leg.distance?.text || "",
      duration: leg.duration?.text || "",
      steps: leg.steps || [],
    };
    
    setRouteInfo(routeInfo);
    console.log('🟢 Updated route info:', routeInfo);

    // Update active route if we have one
    if (activeRouteId && safetyAnalysis && currentLocation && destination) {
      try {
        console.log('🔵 Updating active route:', activeRouteId);
        const response = await fetch(`${API_BASE_URL}/api/safety/active-route/${activeRouteId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            route: routeInfo,
            current_analysis: safetyAnalysis,
          }),
        });

        if (!response.ok) {
          console.error('🔴 Failed to update active route:', response.statusText);
          return;
        }

        const updatedData = await response.json();
        console.log('🟢 Route update response:', updatedData);
        
        if (updatedData.status === 'success' && updatedData.data) {
          setSafetyAnalysis(updatedData.data.analysis);
          console.log('🟢 Updated safety analysis:', updatedData.data.analysis);
        }
      } catch (err) {
        console.error('🔴 Error updating route analysis:', err);
      }
    }
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
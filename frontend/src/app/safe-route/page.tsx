// src/app/safe-route/page.tsx
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

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function SafeRoutePage() {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [safetyAnalysis, setSafetyAnalysis] = useState<SafetyAnalysis | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Get user's current location with address lookup
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          
          try {
            // If you want to get the address for the current location
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.lat},${location.lng}&key=${GOOGLE_MAPS_API_KEY}`
            );
            const data = await response.json();
            
            if (data.results?.[0]) {
              setCurrentLocation({
                ...location,
                address: data.results[0].formatted_address,
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
    setDestination(location);

    try {
      // First, get safety analysis
      const safetyResponse = await fetch("http://localhost:5000/api/safety/analyze-route", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          start_location: currentLocation,
          end_location: location,
          time_of_day: getTimeOfDay()
        }),
      });

      if (!safetyResponse.ok) {
        throw new Error(`Server error: ${safetyResponse.status}`);
      }

      const analysis = await safetyResponse.json();
      setSafetyAnalysis(analysis);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to plan route");
      setDestination(null);
      setSafetyAnalysis(null);
    } finally {
      setLoading(false);
      setIsAnalyzing(false);
    }
  };

  const handleRouteCalculated = async (result: google.maps.DirectionsResult) => {
    if (!result.routes?.[0]?.legs?.[0]) return;
    
    const leg = result.routes[0].legs[0];
    const routeInfo = {
      distance: leg.distance?.text || "",
      duration: leg.duration?.text || "",
      steps: leg.steps || [],
    };
    
    setRouteInfo(routeInfo);

    // Optionally update safety analysis with route information
    if (safetyAnalysis && currentLocation && destination) {
      try {
        const response = await fetch("http://localhost:5000/api/safety/update-analysis", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            route: routeInfo,
            current_analysis: safetyAnalysis,
          }),
        });

        if (response.ok) {
          const updatedAnalysis = await response.json();
          setSafetyAnalysis(updatedAnalysis);
        }
      } catch (err) {
        console.error('Error updating safety analysis:', err);
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
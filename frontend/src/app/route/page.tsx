// src/app/route/page.tsx

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { LocationSearch } from "@/components/LocationSearch";
import { DirectionsPanel } from "@/components/DirectionsPanel";
import { SafetyAnalysisPanel } from "@/components/SafetyAnalysisPanel";

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

export default function RoutePlannerPage() {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [safetyAnalysis, setSafetyAnalysis] = useState<SafetyAnalysis | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

  // Get user's current location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          setError("Please enable location services to use route planning.");
        }
      );
    }
  }, []);

  const handleLocationSelect = async (location: Location) => {
    if (!currentLocation) return;

    setLoading(true);
    setError(null);
    setDestination(location);

    try {
      const response = await fetch("http://localhost:5000/api/safety/analyze-route", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          start_location: currentLocation,
          end_location: location,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const analysis = await response.json();
      setSafetyAnalysis(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to plan route");
      setDestination(null);
      setSafetyAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRouteCalculated = (result: google.maps.DirectionsResult) => {
    if (!result.routes?.[0]?.legs?.[0]) return;
    
    const leg = result.routes[0].legs[0];
    setRouteInfo({
      distance: leg.distance?.text || "",
      duration: leg.duration?.text || "",
      steps: leg.steps || [],
    });
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18 ? "day" : "night";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Plan Safe Route</h1>
          <p className="text-muted-foreground">
            Find the safest path to your destination
          </p>
        </div>
        <Badge variant={getTimeOfDay() === "day" ? "default" : "secondary"}>
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
      <Card>
        <CardContent className="pt-6">
          <LocationSearch
            onLocationSelect={handleLocationSelect}
            loading={loading}
            disabled={!currentLocation}
          />
          {!currentLocation && (
            <p className="text-sm text-muted-foreground mt-2">
              Please enable location services to use route planning.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="map" className="space-y-4">
        <TabsList>
          <TabsTrigger value="map">Map View</TabsTrigger>
          <TabsTrigger value="directions">Turn-by-Turn</TabsTrigger>
          <TabsTrigger value="analysis">Safety Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="map">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="h-[500px]">
                {currentLocation && GOOGLE_MAPS_API_KEY && (
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

        <TabsContent value="directions">
          <DirectionsPanel
            destination={destination}
            routeInfo={routeInfo}
            safetyScore={safetyAnalysis?.safety_score}
          />
        </TabsContent>

        <TabsContent value="analysis">
          {safetyAnalysis && (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Safety Score Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Route Safety Score</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* ... Safety analysis content ... */}
                </CardContent>
              </Card>

              {/* Rest of your safety analysis cards */}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
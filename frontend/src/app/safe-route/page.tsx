"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Map,
  AlertTriangle,
  Shield,
  Navigation,
  Lightbulb,
  AlertOctagon,
  Search,
  Sun,
  Moon,
} from "lucide-react";
import { SafeRouteMap } from "@/components/SafeRouteMap";
import { aiService } from "@/lib/ai.service";
import type { Location, Route, AIAnalysisResult } from "@/types/index";

export default function SafeRoutePage() {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [destination, setDestination] = useState("");
  const [destinationCoords, setDestinationCoords] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routeAnalysis, setRouteAnalysis] = useState<AIAnalysisResult | null>(null);
  const [searchingAddress, setSearchingAddress] = useState(false);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: new Date(position.timestamp),
          });
        },
        (error) => {
          setError("Unable to get your location. Please enable location services.");
        }
      );
    }
  }, []);

  const searchAddress = async () => {
    if (!destination) return;

    setSearchingAddress(true);
    setError(null);

    try {
      const geocoder = new google.maps.Geocoder();
      const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoder.geocode({ address: destination }, (results, status) => {
          if (status === "OK" && results) {
            resolve(results);
          } else {
            reject(new Error("Could not find address"));
          }
        });
      });

      setDestinationCoords({
        lat: result[0].geometry.location.lat(),
        lng: result[0].geometry.location.lng(),
      });
    } catch (err) {
      setError("Could not find the specified address. Please try again.");
    } finally {
      setSearchingAddress(false);
    }
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18 ? "day" : "night";
  };

  const getRiskColor = (score: number) => {
    if (score > 70) return "text-green-500";
    if (score > 40) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="container space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plan Safe Route</h1>
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

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Navigation className="h-5 w-5 mr-2" />
            Route Planning
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter your destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="pl-9"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    searchAddress();
                  }
                }}
              />
            </div>
            <Button
              onClick={searchAddress}
              disabled={!destination || searchingAddress}
              className="min-w-[120px]"
            >
              {searchingAddress ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Searching
                </div>
              ) : (
                <span className="flex items-center">
                  <Map className="h-4 w-4 mr-2" />
                  Find Route
                </span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {currentLocation && (
        <Tabs defaultValue="map" className="space-y-4">
          <TabsList>
            <TabsTrigger value="map" className="flex items-center">
              <Map className="h-4 w-4 mr-2" />
              Map View
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Safety Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map">
            <Card>
              <CardContent className="pt-6">
                <div className="h-[500px] rounded-lg overflow-hidden">
                  <SafeRouteMap
                    apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
                    initialLocation={currentLocation}
                    destination={destinationCoords}
                    onRouteCalculated={async (route: any) => {
                      setLoading(true);
                      try {
                        const analysis = await aiService.analyzeRoute(route);
                        setRouteAnalysis(analysis);
                      } catch (err) {
                        setError("Failed to analyze route safety");
                      } finally {
                        setLoading(false);
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis">
            {loading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="space-y-2 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      Analyzing route safety...
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : routeAnalysis ? (
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Safety Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">
                          {routeAnalysis.safetyScore}%
                        </span>
                        <Shield className={getRiskColor(routeAnalysis.safetyScore)} />
                      </div>
                      <Progress
                        value={routeAnalysis.safetyScore}
                        className="h-2"
                      />
                      <p className="text-sm text-muted-foreground">
                        {routeAnalysis.safetyScore > 70
                          ? "This route appears to be safe"
                          : routeAnalysis.safetyScore > 40
                          ? "Exercise caution on this route"
                          : "Consider alternative routes"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Lightbulb className="h-5 w-5 mr-2" />
                      Safety Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {routeAnalysis.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="h-6 w-6 flex items-center justify-center rounded-full bg-primary/10">
                            <Lightbulb className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center text-destructive">
                      <AlertOctagon className="h-5 w-5 mr-2" />
                      Potential Risks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      {routeAnalysis.threats.map((threat, index) => (
                        <Alert key={index} variant="destructive">
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          <AlertDescription>{threat}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <div className="space-y-2">
                    <Map className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-lg font-medium">
                      Enter a destination to see route analysis
                    </p>
                    <p className="text-sm text-muted-foreground">
                      We'll analyze the safety of your route and provide recommendations
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
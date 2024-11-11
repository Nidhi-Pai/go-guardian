"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import {
  MapPin,
  Shield,
  Users,
  Settings,
  AlertTriangle,
  Bell,
  Phone,
  Info,
  ArrowRight,
} from "lucide-react";
import { SafeRouteMap } from "@/components/SafeRouteMap";
import { EmergencyAlert } from "@/components/EmergencyAlert";
import { SafetyTips } from "@/components/SafetyTips";
import { RecentActivity } from "@/components/RecentActivity";
import { WeatherAlert } from "@/components/WeatherAlert";
import type { Location, SafetyAnalysis, SafetyAlert } from "@/types/index";
import { aiService } from "@/lib/ai.service";
import { toast, useToast } from "@/hooks/use-toast";

const quickActions = [
  {
    title: "Plan Safe Route",
    description: "Find the safest path with real-time safety analysis",
    icon: MapPin,
    href: "/safe-route",
    color: "bg-gradient-to-br from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700",
  },
  {
    title: "Emergency Contacts", 
    description: "Set up and manage your trusted safety network",
    icon: Shield,
    href: "/emergency-contacts",
    color: "bg-gradient-to-br from-red-400 to-red-600 hover:from-red-500 hover:to-red-700",
  },
  {
    title: "Community",
    description: "Join local safety groups and share alerts",
    icon: Users,
    href: "/community",
    color: "bg-gradient-to-br from-green-400 to-green-600 hover:from-green-500 hover:to-green-700",
  },
  {
    title: "Settings",
    description: "Customize alerts and safety preferences",
    icon: Settings,
    href: "/profile",
    color: "bg-gradient-to-br from-purple-400 to-purple-600 hover:from-purple-500 hover:to-purple-700",
  }
];

const emergencyContacts = [
  { name: "Police", number: "911", icon: Phone },
  { name: "Safety Hotline", number: "1-800-SAFE", icon: Bell },
  { name: "Support", number: "1-888-HELP", icon: Info }
];

export default function HomePage() {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [safetyAnalysis, setSafetyAnalysis] = useState<SafetyAnalysis | null>(null);
  const { toast } = useToast();

  const locationOptions = {
    enableHighAccuracy: true,
    timeout: 20000,
    maximumAge: 0
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: new Date(position.timestamp),
          };
          setCurrentLocation(location);
          
          try {
            const analysis = await aiService.analyzeSafetyForLocation(location);
            setSafetyAnalysis(analysis);
          } catch (err) {
            console.error('Safety analysis error:', err);
          }
          
          setLocationError(null);
          setIsLoading(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLocationError("Unable to get your location. Please enable location services.");
          setIsLoading(false);
        },
        locationOptions
      );

      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setLocationError("Geolocation is not supported by your browser.");
      setIsLoading(false);
    }
  }, []);

  const handleRouteCalculated = async (route: google.maps.DirectionsResult) => {
    try {
      const monitoringData = await aiService.startRouteMonitoring(route);
      console.log("Route monitoring started:", monitoringData);
    } catch (error) {
      console.error("Failed to start route monitoring:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-gradient-to-r from-primary/10 to-transparent p-6 rounded-lg">
        <div className="space-y-3">
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Welcome to Go Guardian
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Your intelligent safety companion - providing real-time protection wherever you go
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {emergencyContacts.map((contact) => (
            <Button
              key={contact.number}
              variant="outline"
              size="lg"
              className="flex items-center gap-3 hover:bg-primary/10 hover:border-primary transition-colors"
            >
              <contact.icon className="h-5 w-5 text-primary" />
              <span className="hidden sm:inline font-medium">{contact.name}</span>
            </Button>
          ))}
        </div>
      </div>

      {locationError && (
        <Alert variant="destructive" className="animate-fadeIn">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{locationError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => (
          <Card key={action.href} className="group hover:shadow-xl transition-all duration-300 border-none">
            <CardHeader className="space-y-3">
              <div className={`w-14 h-14 rounded-xl ${action.color} flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                <action.icon className="h-7 w-7" />
              </div>
              <CardTitle className="text-2xl">{action.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{action.description}</p>
              <Button asChild className="w-full group-hover:translate-x-1 transition-transform">
                <Link href={action.href} className="flex items-center justify-center gap-2">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {currentLocation && (
            <Card className="overflow-hidden shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-primary/10 to-transparent">
                <CardTitle className="text-2xl">Safety Map</CardTitle>
                <Button variant="outline" size="sm" className="hover:bg-primary/10">
                  View Full Map
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[500px]">
                  <SafeRouteMap
                    apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
                    initialLocation={currentLocation}
                    destination={null}
                    onRouteCalculated={handleRouteCalculated}
                  />
                </div>
              </CardContent>
            </Card>
          )}
          
          {currentLocation && (
            <EmergencyAlert
              currentLocation={currentLocation}
              onAlertSent={async (alert: SafetyAlert) => {
                try {
                  await aiService.sendEmergencyAlert(currentLocation, alert.message);
                  toast({
                    title: "Emergency Alert Sent",
                    description: "Emergency services have been notified.",
                  });
                } catch (error) {
                  console.error("Failed to send emergency alert:", error);
                  toast({
                    title: "Error",
                    description: "Failed to send emergency alert. Please try again.",
                    variant: "destructive",
                  });
                }
              }}
            />
          )}
        </div>

        <div className="space-y-8">
          <WeatherAlert location={currentLocation} />
          <SafetyTips />
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}
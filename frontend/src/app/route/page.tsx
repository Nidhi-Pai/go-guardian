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
} from "lucide-react";
import { SafeRouteMap } from "@/components/SafeRouteMap";
import { EmergencyAlert } from "@/components/EmergencyAlert";
import type { Location } from "@/types/index";

const quickActions = [
  {
    title: "Plan Safe Route",
    description: "Find the safest path to your destination",
    icon: MapPin,
    href: "/route",
    color: "bg-blue-500",
  },
  {
    title: "Emergency Contacts",
    description: "Manage your trusted contacts",
    icon: Shield,
    href: "/emergency-contacts",
    color: "bg-red-500",
  },
  {
    title: "Community",
    description: "Connect with other users",
    icon: Users,
    href: "/community",
    color: "bg-green-500",
  },
  {
    title: "Settings",
    description: "Customize your preferences",
    icon: Settings,
    href: "/profile",
    color: "bg-purple-500",
  },
];

export default function HomePage() {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

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
          setLocationError("Unable to get your location. Please enable location services.");
        }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser.");
    }
  }, []);

  const handleRouteCalculated = async (route: google.maps.DirectionsRoute) => {
    console.log("Route calculated:", route);
  };

  return (
    <div className="container space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Welcome to Go Guardian</h1>
        <p className="text-muted-foreground">
          Your AI-powered safety companion
        </p>
      </div>

      {locationError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{locationError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => (
          <Card key={action.href} className="hover:shadow-lg transition-all">
            <CardHeader>
              <div className={`w-12 h-12 rounded-full ${action.color} flex items-center justify-center text-white mb-4`}>
                <action.icon className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl">{action.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{action.description}</p>
              <Button asChild className="w-full">
                <Link href={action.href}>Get Started</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {currentLocation && (
        <Card>
          <CardHeader>
            <CardTitle>Current Location</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <SafeRouteMap
              apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
              initialLocation={currentLocation}
              destination={null}
              onRouteCalculated={handleRouteCalculated}
            />
          </CardContent>
        </Card>
      )}

      {currentLocation && (
        <EmergencyAlert
          currentLocation={currentLocation}
          onAlertSent={(alert) => {
            console.log("Emergency alert sent:", alert);
          }}
        />
      )}
    </div>
  );
}
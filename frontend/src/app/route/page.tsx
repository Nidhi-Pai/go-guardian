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
  Loader2
} from "lucide-react";
import { SafeRouteMap } from "@/components/SafeRouteMap";
import { EmergencyAlert } from "@/components/EmergencyAlert";

// Types
interface Location {
  lat: number;
  lng: number;
  timestamp?: Date;
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const quickActions: QuickAction[] = [
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
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  useEffect(() => {
    const getLocation = async () => {
      setIsLoadingLocation(true);
      setLocationError(null);

      try {
        if ("geolocation" in navigator) {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
            });
          });

          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: new Date(position.timestamp),
          });
        } else {
          throw new Error("Geolocation is not supported by your browser.");
        }
      } catch (error) {
        setLocationError(
          error instanceof Error 
            ? error.message 
            : "Unable to get your location. Please enable location services."
        );
      } finally {
        setIsLoadingLocation(false);
      }
    };

    getLocation();
  }, []);

  const handleRouteCalculated = async (route: google.maps.DirectionsResult) => {
    if (route.routes?.[0]) {
      console.log("Route calculated:", {
        distance: route.routes[0].legs?.[0]?.distance?.text,
        duration: route.routes[0].legs?.[0]?.duration?.text,
        start_location: route.routes[0].legs?.[0]?.start_location?.toJSON(),
        end_location: route.routes[0].legs?.[0]?.end_location?.toJSON(),
      });
    }
  };

  const renderMap = () => {
    if (!GOOGLE_MAPS_API_KEY) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Google Maps API key is not configured. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables.
          </AlertDescription>
        </Alert>
      );
    }

    if (isLoadingLocation) {
      return (
        <div className="h-[400px] flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Getting your location...</p>
          </div>
        </div>
      );
    }

    if (locationError) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{locationError}</AlertDescription>
        </Alert>
      );
    }

    if (!currentLocation) {
      return (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Location not available</AlertDescription>
        </Alert>
      );
    }

    return (
      <SafeRouteMap
        apiKey={GOOGLE_MAPS_API_KEY}
        initialLocation={currentLocation}
        destination={null}
        onRouteCalculated={handleRouteCalculated}
      />
    );
  };

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Welcome to Go Guardian</h1>
        <p className="text-muted-foreground">
          Your AI-powered safety companion
        </p>
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Current Location</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          {renderMap()}
        </CardContent>
      </Card>

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
// src/components/DirectionsPanel.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Navigation,
  Clock,
  ArrowRight,
  ChevronRight,
  Shield,
} from "lucide-react";

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface RouteInfo {
  distance: string;
  duration: string;
  steps: google.maps.DirectionsStep[];
}

interface DirectionsPanelProps {
  destination: Location | null;
  routeInfo: RouteInfo | null;
  safetyScore?: number;
}

export function DirectionsPanel({
  destination,
  routeInfo,
  safetyScore,
}: DirectionsPanelProps) {
  if (!destination || !routeInfo) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Navigation className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium">
            Enter a destination to see directions
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            We'll show you the safest route to get there
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Route Overview */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <CardTitle>Route Overview</CardTitle>
              <p className="text-sm text-muted-foreground">
                {destination.address}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {safetyScore && (
                <Badge
                  variant={safetyScore > 70 ? "default" : "secondary"}
                  className="flex items-center gap-1"
                >
                  <Shield className="h-3 w-3" />
                  {safetyScore}% Safe
                </Badge>
              )}
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {routeInfo.duration}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {routeInfo.distance}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {routeInfo.steps.map((step, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="mt-1">
                  {index === 0 ? (
                    <ArrowRight className="h-4 w-4 text-primary" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div
                    className="text-sm"
                    dangerouslySetInnerHTML={{ __html: step.instructions }}
                  />
                  <p className="text-sm text-muted-foreground">
                    {step.distance?.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

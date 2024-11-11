// src/components/SafetyAnalysisPanel.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, MapPin, Building, Clock } from "lucide-react";

interface RouteInfo {
  distance: string;
  duration: string;
  steps: google.maps.DirectionsStep[];
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

interface SafetyAnalysisPanelProps {
  safetyAnalysis: SafetyAnalysis | null;
  routeInfo: RouteInfo | null;
}

export function SafetyAnalysisPanel({
  safetyAnalysis,
  routeInfo,
}: SafetyAnalysisPanelProps) {
  if (!safetyAnalysis) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium">
            Select a destination for safety analysis
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            We'll analyze the route and provide safety recommendations
          </p>
        </CardContent>
      </Card>
    );
  }

  const getSafetyColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Safety Score Card */}
      <Card>
        <CardHeader>
          <CardTitle>Route Safety Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span
                className={`text-4xl font-bold ${getSafetyColor(safetyAnalysis.safety_score)}`}
              >
                {safetyAnalysis.safety_score}%
              </span>
              <Shield
                className={`h-8 w-8 ${getSafetyColor(safetyAnalysis.safety_score)}`}
              />
            </div>
            <Progress value={safetyAnalysis.safety_score} className="h-2" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Risk Level:</span>
              <Badge
                variant={
                  safetyAnalysis.risk_level === "low"
                    ? "default"
                    : "destructive"
                }
              >
                {safetyAnalysis.risk_level.toUpperCase()}
              </Badge>
            </div>
            {routeInfo && (
              <div className="flex justify-between items-center pt-2 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {routeInfo.duration}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {routeInfo.distance}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Risks Card */}
      <Card>
        <CardHeader>
          <CardTitle>Potential Risks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {safetyAnalysis.primary_concerns.map((risk, index) => (
              <div key={index} className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <span>{risk}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations Card */}
      <Card>
        <CardHeader>
          <CardTitle>Safety Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {safetyAnalysis.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-2">
                <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Safe Spaces Card */}
      <Card>
        <CardHeader>
          <CardTitle>Safe Spaces Nearby</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {safetyAnalysis.safe_spots.map((space, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 rounded-lg border bg-muted/50"
              >
                <Building className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm">{space}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

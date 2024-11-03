// src/components/ContextualSafety.tsx

"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Clock,
  Users,
  Sun,
  Moon,
  Building,
  Train,
  AlertTriangle
} from "lucide-react";

interface Location {
  lat: number;
  lng: number;
}

interface ContextualSafetyProps {
  location: Location;
}

interface SafetyContext {
  timeOfDay: 'day' | 'night';
  crowdDensity: string;
  nearbyTransit: string[];
  safeSpaces: string[];
  businessHours: string[];
  riskFactors: string[];
  safetyTips: string[];
}

export function ContextualSafety({ location }: ContextualSafetyProps) {
  const [context, setContext] = useState<SafetyContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContextData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/safety/context', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            location,
            timestamp: new Date().toISOString()
          }),
        });

        if (!response.ok) throw new Error('Failed to fetch safety context');
        
        const data = await response.json();
        setContext(data);
      } catch (error) {
        console.error('Context fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContextData();
  }, [location]);

  if (!context) return null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Current Area Safety
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Badge variant="outline" className="w-full justify-start gap-2">
                {context.timeOfDay === 'day' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
                {context.timeOfDay === 'day' ? 'Daytime' : 'Nighttime'}
              </Badge>
              
              <Badge variant="outline" className="w-full justify-start gap-2">
                <Users className="h-4 w-4" />
                {context.crowdDensity} Foot Traffic
              </Badge>

              <Badge variant="outline" className="w-full justify-start gap-2">
                <Clock className="h-4 w-4" />
                {context.businessHours[0]}
              </Badge>
            </div>

            <div className="space-y-2">
              <Badge variant="outline" className="w-full justify-start gap-2">
                <Train className="h-4 w-4" />
                {context.nearbyTransit.length} Transit Options
              </Badge>
              
              <Badge variant="outline" className="w-full justify-start gap-2">
                <Building className="h-4 w-4" />
                {context.safeSpaces.length} Safe Spaces
              </Badge>
              
              <Badge variant="outline" className="w-full justify-start gap-2">
                <AlertTriangle className="h-4 w-4" />
                {context.riskFactors.length} Risk Factors
              </Badge>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <h4 className="font-medium">Safety Tips</h4>
            <ul className="space-y-1">
              {context.safetyTips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Shield className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Cloud, Thermometer } from "lucide-react";
import type { Location } from "@/types/index";

interface WeatherAlertProps {
  location: Location | null;
}

export function WeatherAlert({ location }: WeatherAlertProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5 text-primary" />
          Weather Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          No active weather alerts for your area
        </p>
      </CardContent>
    </Card>
  );
}
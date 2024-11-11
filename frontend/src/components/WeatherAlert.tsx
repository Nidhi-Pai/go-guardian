import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Cloud,
  Thermometer,
  Wind,
  Droplets,
  AlertTriangle,
} from "lucide-react";
import type { Location, WeatherData } from "@/types/index";
import { Badge } from "@/components/ui/badge";

interface WeatherAlertProps {
  location: Location | null;
}

export function WeatherAlert({ location }: WeatherAlertProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWeatherData() {
      if (!location) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/weather?lat=${location.lat}&lng=${location.lng}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch weather data");
        }

        const data = await response.json();
        setWeatherData(data);
      } catch (err) {
        console.error("Weather fetch error:", err);
        setError("Unable to load weather data");
      } finally {
        setLoading(false);
      }
    }

    fetchWeatherData();
  }, [location]);

  if (!location) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5 text-blue-500" />
          Weather Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground">Loading weather data...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : weatherData?.current ? (
          <div className="space-y-4">
            {weatherData.alerts && weatherData.alerts.length > 0 && (
              <div className="space-y-2">
                {weatherData.alerts.map((alert, index) => (
                  <Badge
                    key={index}
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    {alert.headline}
                  </Badge>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Thermometer className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Temperature</p>
                  <p className="font-medium">{weatherData.current.temp_c}°C</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Wind className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Wind Speed</p>
                  <p className="font-medium">
                    {weatherData.current.wind_kph} km/h
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Precipitation</p>
                  <p className="font-medium">
                    {weatherData.current.precip_mm} mm
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Condition</p>
                  <p className="font-medium">{weatherData.current.condition}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">No weather data available</p>
        )}
      </CardContent>
    </Card>
  );
}

import { NextResponse } from "next/server";
import type { WeatherData } from "@/types/index";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json(
      { error: "Missing latitude or longitude" },
      { status: 400 },
    );
  }

  const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

  if (!WEATHER_API_KEY) {
    console.error("Weather API key not configured");
    return NextResponse.json(
      { error: "Weather API key not configured" },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lng}&appid=${WEATHER_API_KEY}&units=metric`,
      { next: { revalidate: 300 } },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenWeather API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(`Weather service error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json({
      alerts: data.alerts || [],
      current: {
        temp_c: data.current.temp,
        condition: data.current.weather[0].description,
        wind_kph: (data.current.wind_speed * 3.6).toFixed(1),
        precip_mm: data.current.rain ? data.current.rain["1h"] || 0 : 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Weather API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch weather data" },
      { status: 500 },
    );
  }
}

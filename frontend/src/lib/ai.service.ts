import type { AIAnalysisResult, Location, SafetyAnalysis } from "@/types";

export interface MonitoringStatus {
  routeId: string;
  status: "active" | "paused" | "completed";
  lastUpdate: Date;
  checkpoints: Array<{
    location: Location;
    timestamp: Date;
    status: "pending" | "reached" | "missed";
  }>;
}

export interface VoiceCommandResult {
  command_type: "emergency" | "navigation" | "safety_check" | "contact";
  action_required: string;
  parameters: Record<string, any>;
  confirmation_required: boolean;
  response_message: string;
}

export interface SearchResult {
  place_id: string;
  name: string;
  formatted_address: string;
  location: Location;
  safety_score: number;
  risk_factors: string[];
  safe_times: string[];
  distance: number;
  incident_categories?: string[];
  infrastructure?: {
    light_coverage: number;
    safe_spaces_count: number;
    working_lights: number;
    total_lights: number;
  };
  emergency_metrics?: {
    avg_response_time: number;
    resolution_rate: number;
    recent_incidents: number;
  };
}

interface SafetyMetrics {
  overall_score: number;
  incident_analysis?: {
    total_incidents: number;
    hourly_distribution: Record<string, number>;
    time_patterns: Record<string, number>;
  };
  infrastructure?: {
    total_lights: number;
    working_lights: number;
    coverage_score: number;
  };
  response_metrics?: {
    mean_response_time: number;
    resolution_rate: number;
  };
}

interface EmergencyResource {
  id: string;
  name: string;
  address: string;
  distance: string;
  type: 'police' | 'hospital' | 'safe_place';
  safetyScore?: number;
  phone?: string;
  emergency?: boolean;
  hours?: string;
  infrastructure?: {
    total_lights: number;
    working_lights: number;
  };
}

export type EmergencyResources = {
  police: EmergencyResource[];
  hospitals: EmergencyResource[];
  safe_places: EmergencyResource[];
  safety_metrics?: SafetyMetrics;
  _error?: string;
}

export class AIService {
  private readonly apiUrl: string;
  private readonly referrer: string;

  constructor() {
    this.apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    this.referrer = typeof window !== "undefined" ? window.location.origin : "";
  }

  async analyzeRoute(
    route: google.maps.DirectionsRoute,
  ): Promise<AIAnalysisResult> {
    try {
      const response = await fetch(`${this.apiUrl}/safety/analyze-route`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Referer: this.referrer,
        },
        credentials: "include",
        body: JSON.stringify({
          start_location: this.convertToLocation(route.legs[0].start_location),
          end_location: this.convertToLocation(route.legs[0].end_location),
          distance: route.legs[0].distance?.text,
          duration: route.legs[0].duration?.text,
          time_of_day: this.getTimeOfDay(),
          steps: route.legs[0].steps.map((step) => ({
            start_location: this.convertToLocation(step.start_location),
            end_location: this.convertToLocation(step.end_location),
            instructions: step.instructions,
            distance: step.distance?.text,
            duration: step.duration?.text,
            maneuver: step.maneuver || null,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze route");
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error("Error analyzing route:", error);
      return this.getFallbackAnalysis();
    }
  }

  async analyzeSafetyForLocation(location: Location): Promise<SafetyAnalysis> {
    try {
      const response = await fetch(`${this.apiUrl}/safety/analyze-area`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Referer: this.referrer,
        },
        credentials: "include",
        body: JSON.stringify({
          location,
          time_of_day: this.getTimeOfDay(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze location safety");
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error("Error analyzing location safety:", error);
      return this.getFallbackSafetyAnalysis();
    }
  }

  async sendEmergencyAlert(location: Location, message: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/safety/emergency-alert`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Referer: this.referrer,
      },
      credentials: "include",
      body: JSON.stringify({
        location,
        message,
        timestamp: new Date(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to send emergency alert");
    }
  }

  async startRouteMonitoring(
    route: google.maps.DirectionsRoute,
  ): Promise<MonitoringStatus> {
    try {
      const response = await fetch(`${this.apiUrl}/monitoring/start`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Referer: this.referrer,
        },
        credentials: "include",
        body: JSON.stringify({
          route: {
            start_location: this.convertToLocation(
              route.legs[0].start_location,
            ),
            end_location: this.convertToLocation(route.legs[0].end_location),
            waypoints: route.legs[0].steps.map((step) => ({
              location: this.convertToLocation(step.end_location),
              arrival_time: new Date(
                Date.now() + (step.duration?.value || 0) * 1000,
              ),
            })),
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start route monitoring");
      }

      return await response.json();
    } catch (error) {
      console.error("Error starting route monitoring:", error);
      throw error;
    }
  }

  async stopRouteMonitoring(routeId: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/monitoring/stop/${routeId}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Referer: this.referrer,
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to stop route monitoring");
    }
  }

  async processVoiceCommand(transcript: string, context: any) {
    const response = await fetch("/api/voice-command", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transcript, context }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Server error: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    return response.json();
  }

  async searchSafePlaces(
    query: string,
    location: Location,
    radius: number = 5000,
  ): Promise<SearchResult[]> {
    try {
      const response = await fetch(
        `${this.apiUrl}/search/places?` +
          new URLSearchParams({
            query,
            lat: location.lat.toString(),
            lng: location.lng.toString(),
            radius: radius.toString(),
          }),
        {
          headers: {
            Accept: "application/json",
            Referer: this.referrer,
          },
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to search places");
      }

      const data = await response.json();
      return data.results;
    } catch (error) {
      console.error("Error searching places:", error);
      throw error;
    }
  }

  async getNearbyEmergencyResources(location: Location, signal?: AbortSignal): Promise<EmergencyResources> {
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      return this.getEmptyResourcesResponse('Invalid location data');
    }

    try {
      const response = await fetch(`${this.apiUrl}/safety/emergency-resources`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Referer": this.referrer,
        },
        credentials: "include",
        body: JSON.stringify({ location }),
        signal
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      return this.getEmptyResourcesResponse(
        error instanceof Error ? error.message : 'Network request failed'
      );
    }
  }

  private convertToLocation(googleLocation: google.maps.LatLng): Location {
    return {
      lat: googleLocation.lat(),
      lng: googleLocation.lng(),
      timestamp: new Date(),
    };
  }

  private getFallbackAnalysis(): AIAnalysisResult {
    return {
      safetyScore: 70,
      risk_level: "medium",
      threats: ["Limited visibility in some areas", "Low pedestrian traffic"],
      recommendations: [
        "Stay on well-lit main streets",
        "Share your location with trusted contacts",
        "Keep emergency contacts readily available",
      ],
      safe_spots: ["Police Station (0.5 km)", "24/7 Store (0.3 km)"],
      emergency_resources: ["Hospital (1.2 km)", "Police Station (0.5 km)"],
      confidence_score: 0.8,
    };
  }

  private getFallbackSafetyAnalysis(): SafetyAnalysis {
    return {
      safety_score: 75,
      risk_level: "low",
      primary_concerns: [],
      recommendations: [
        "Stay aware of your surroundings",
        "Keep emergency contacts readily available",
      ],
      safe_spots: ["Police Station (0.8 km)"],
      emergency_resources: ["Hospital (1.5 km)"],
      confidence_score: 0.8,
      safer_alternatives: [],
    };
  }

  private getTimeOfDay(): string {
    const now = new Date();
    const hours = now.getHours();

    if (hours < 6) {
      return "night";
    } else if (hours < 12) {
      return "morning";
    } else if (hours < 18) {
      return "afternoon";
    } else {
      return "evening";
    }
  }

  private getEmptyResourcesResponse(errorMessage: string): EmergencyResources {
    return {
      police: [],
      hospitals: [],
      safe_places: [],
      safety_metrics: {
        overall_score: 0,
        infrastructure: {
          coverage_score: 0,
          working_lights: 0,
          total_lights: 0
        }
      },
      _error: errorMessage
    };
  }
}

export const aiService = new AIService();

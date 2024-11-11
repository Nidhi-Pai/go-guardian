import type { AIAnalysisResult, Location, SafetyAnalysis } from "@/types";

export class AIService {
  private readonly apiUrl: string;
  private readonly referrer: string;

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    this.referrer = typeof window !== 'undefined' ? window.location.origin : '';
  }

  async analyzeRoute(route: google.maps.DirectionsRoute): Promise<AIAnalysisResult> {
    try {
      const response = await fetch(`${this.apiUrl}/safety/analyze-route`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Referer': this.referrer
        },
        credentials: 'include',
        body: JSON.stringify({
          start_location: this.convertToLocation(route.legs[0].start_location),
          end_location: this.convertToLocation(route.legs[0].end_location),
          distance: route.legs[0].distance?.text,
          duration: route.legs[0].duration?.text,
          time_of_day: this.getTimeOfDay(),
          steps: route.legs[0].steps.map(step => ({
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
        throw new Error(errorData.error || 'Failed to analyze route');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error analyzing route:', error);
      return this.getFallbackAnalysis();
    }
  }

  async analyzeSafetyForLocation(location: Location): Promise<SafetyAnalysis> {
    try {
      const response = await fetch(`${this.apiUrl}/safety/analyze-area`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Referer': this.referrer
        },
        credentials: 'include',
        body: JSON.stringify({
          location,
          time_of_day: this.getTimeOfDay()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze location safety');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error analyzing location safety:', error);
      return this.getFallbackSafetyAnalysis();
    }
  }

  async sendEmergencyAlert(location: Location, message: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/safety/emergency-alert`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Referer': this.referrer
      },
      credentials: 'include',
      body: JSON.stringify({
        location,
        message,
        timestamp: new Date(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send emergency alert');
    }
  }

  async startRouteMonitoring(route: google.maps.DirectionsResult): Promise<any> {
    const response = await fetch(`${this.apiUrl}/route/monitor`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Referer': this.referrer
      },
      credentials: 'include',
      body: JSON.stringify({ route }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to start route monitoring');
    }

    const data = await response.json();
    return data.data;
  }

  private convertToLocation(googleLocation: google.maps.LatLng): Location {
    return {
      lat: googleLocation.lat(),
      lng: googleLocation.lng(),
      timestamp: new Date()
    };
  }

  private getFallbackAnalysis(): AIAnalysisResult {
    return {
      safetyScore: 70,
      risk_level: 'medium',
      threats: [
        'Limited visibility in some areas',
        'Low pedestrian traffic',
      ],
      recommendations: [
        'Stay on well-lit main streets',
        'Share your location with trusted contacts',
        'Keep emergency contacts readily available',
      ],
      safe_spots: [
        'Police Station (0.5 km)',
        '24/7 Store (0.3 km)',
      ],
      emergency_resources: [
        'Hospital (1.2 km)',
        'Police Station (0.5 km)',
      ],
      confidence_score: 0.8,
    };
  }

  private getFallbackSafetyAnalysis(): SafetyAnalysis {
    return {
      safety_score: 75,
      risk_level: 'low',
      primary_concerns: [],
      recommendations: [
        'Stay aware of your surroundings',
        'Keep emergency contacts readily available',
      ],
      safe_spots: ['Police Station (0.8 km)'],
      emergency_resources: ['Hospital (1.5 km)'],
      confidence_score: 0.8,
      safer_alternatives: []
    };
  }

  private getTimeOfDay(): string {
    const now = new Date();
    const hours = now.getHours();

    if (hours < 6) {
      return 'night';
    } else if (hours < 12) {
      return 'morning';
    } else if (hours < 18) {
      return 'afternoon';
    } else {
      return 'evening';
    }
  }
}

export const aiService = new AIService();
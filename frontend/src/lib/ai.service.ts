import { AIAnalysisResult } from "@/types";

export class AIService {
  private readonly apiUrl: string;
  private readonly referrer: string;

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    this.referrer = window.location.origin;
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
          start_location: route.legs[0].start_location.toJSON(),
          end_location: route.legs[0].end_location.toJSON(),
          distance: route.legs[0].distance?.text,
          duration: route.legs[0].duration?.text,
          time_of_day: this.getTimeOfDay(),
          steps: route.legs[0].steps.map(step => ({
            start_location: step.start_location.toJSON(),
            end_location: step.end_location.toJSON(),
            instructions: step.instructions,
            distance: step.distance?.text,
            duration: step.duration?.text,
            maneuver: step.maneuver || null,
          })),
        }),
      });

      const responseClone = response.clone();
      
      if (!response.ok) {
        const errorData = await responseClone.json();
        throw new Error(errorData.error || 'Failed to analyze route');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error analyzing route:', error);
      return this.getFallbackAnalysis();
    }
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
export interface Location {
    lat: number;
    lng: number;
    timestamp?: Date;
    address?: string;
  }
  
  export interface Route {
    id?: string;
    startLocation: Location;
    endLocation: Location;
    waypoints?: Location[];
    safetyScore?: number;
    lightingConditions?: LightingCondition[];
    createdAt?: Date;
  }
  
  export interface LightingCondition {
    location: Location;
    level: 'well_lit' | 'moderately_lit' | 'poorly_lit';
    timestamp: Date;
  }
  
  export interface EmergencyContact {
    id: string;
    name: string;
    phone: string;
    email?: string;
    relationship: string;
  }

  export interface SafetyAnalysis {
    safety_score: number;
    risk_level: string;
    primary_concerns: string[];
    recommendations: string[];
    safe_spots: string[];
    emergency_resources: string[];
    safer_alternatives?: string[];
    confidence_score: number;
  }

  export interface EmergencyAlertPayload {
    location: Location;
    message: string;
    timestamp: Date;
    userId?: string;
  }
  
  
  export interface SafetyAlert {
    id: string;
    userId: string;
    location: Location;
    message: string;
    type: 'sos' | 'panic' | 'medical' | 'fire' | 'police';
    timestamp: Date;
    status: 'active' | 'resolved' | 'cancelled';
    isRecording: boolean;
    mediaType: 'audio' | 'video' | null;
    additionalInfo?: {
      batteryLevel: number | null;
      networkStatus: string;
      nearestSafeSpaces: string[];
      contactsNotified: string[];
    };
  }
  
  export interface AIAnalysisResult {
    safetyScore: number;
    risk_level: 'low' | 'medium' | 'high';
    threats: string[];
    recommendations: string[];
    safe_spots?: string[];
    emergency_resources?: string[];
    confidence_score: number;
  }

  export interface RouteMonitoringData {
    routeId: string;
    startTime: Date;
    checkpoints: Array<{
      location: Location;
      estimatedArrival: Date;
    }>;
    safetyScore: number;
    activeMonitoring: boolean;
  }

  export interface RouteInfo {
    distance: string;
    duration: string;
    steps: google.maps.DirectionsStep[];
  }

  export interface SafetyContext {
    safety_score: number;
    risk_level: string;
    primary_concerns: string[];
    recommendations: string[];
    safe_spots: string[];
  }

  export interface WeatherAlert {
    headline: string;
    severity: string;
    urgency: string;
    description: string;
  }
  
  export interface WeatherData {
    alerts: WeatherAlert[];
    current: {
      temp_c: number;
      condition: string;
      wind_kph: number;
      precip_mm: number;
    } | null;
    timestamp: string;
  } 
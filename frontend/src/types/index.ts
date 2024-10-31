export interface Location {
    lat: number;
    lng: number;
    timestamp?: Date;
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
  
  export interface SafetyAlert {
    id: string;
    userId: string;
    location: Location;
    type: 'sos' | 'unsafe_area' | 'deviation' | 'custom';
    timestamp: Date;
    status: 'active' | 'resolved';
    description?: string;
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
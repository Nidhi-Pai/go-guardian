# Go Guardian: AI-Powered Safety Companion for Women

## Overview
Go Guardian is an AI-powered safety companion application specifically designed to help women navigate cities safely. Using advanced AI capabilities through Google's Gemini API, the app provides real-time safety analysis, intelligent route planning, and emergency assistance with immediate response protocols in threatening situations.

## Project Purpose & Impact

### Current Challenges
- 1 in 3 women worldwide experience physical or sexual violence
- Limited access to real-time safety information
- Lack of community-based safety networks
- Insufficient emergency response systems

### Competition Category
Women and Girl's Safety

### Go Guardian's Solution
- Real-time AI-powered safety analysis
- Community-driven safety networks
- Emergency response optimization
- Behavioral pattern recognition
- Safe route planning

### Measurable Impact
- Reduced response time to safety incidents
- Increased community safety awareness
- Enhanced emergency service coordination
- Improved access to safe spaces
- Data-driven safety improvements

## Technology Stack

### Google Gemini Pro Integration
- Real-time safety analysis of routes and areas
- Visual analysis of surroundings using Gemini Pro Vision
- Natural language processing for emergency response
- Contextual safety recommendations
- Behavior pattern analysis
- Environmental threat detection

Key Features:
- Multi-modal analysis (text, image, location data)
- Real-time safety scoring
- Contextual recommendations
- Emergency response generation

### Additional Google Technologies
- Google Maps Platform
  - Routes API for safe path planning
  - Places API for safe location identification
  - Geocoding API for location services
  - Distance Matrix API for route optimization
- Google Cloud Platform
  - App Engine for deployment
  - Cloud Storage for data
  - Cloud Logging for monitoring

## Features

### 🗺️ Smart Route Planning
- AI-powered route recommendations based on:
  - Street lighting infrastructure analysis (working vs total lights)
  - Time-of-day safety scoring
  - Historical incident data
  - Real-time crowd density
  - Public transit accessibility
- Natural language processing for intuitive destination input
- Dynamic rerouting based on real-time safety conditions
- Safety score visualization for each route

### 🚨 Emergency Response System
- Motion-triggered SOS activation
- Intelligent emergency contact management with relationship categorization
- One-tap emergency services access with:
  - Automatic location sharing
  - Audio/video recording
  - Custom emergency scripts
- Real-time situation analysis with AI guidance
- Fallback emergency protocols when offline

### 🤖 AI Safety Analysis
- Real-time environment analysis using:
  - Street lighting conditions monitoring
  - Infrastructure status assessment
  - Time-based risk evaluation
  - Pattern recognition for threat assessment
  - Voice command recognition for hands-free operation
- Contextual safety recommendations based on:
  - Current location
  - Time of day
  - Historical data
  - Environmental factors
- Safety score calculation with multiple parameters:
  - Area coverage
  - Working infrastructure
  - Historical incidents
  - Emergency resource proximity

### 📱 Community Safety Network
Features referenced from ```typescript:frontend/src/app/community/page.tsx```:
- Neighborhood safety groups
- Real-time safety alerts
- Verified incident reporting
- Community-driven safety updates
- Location-based group suggestions
- Active member monitoring

### 🏥 Safe Places Network
Features referenced from ```typescript:frontend/src/components/SafePlacesSearch.tsx```:
- Categorized safe locations:
  - Police stations
  - Hospitals
  - Safe businesses
  - Community safe spaces
- Real-time availability status
- Distance and routing information
- Emergency contact information
- Operating hours tracking

### 📊 Safety Analytics
Features referenced from ```typescript:frontend/src/components/SafetyDataVisualization.tsx```:
- Infrastructure status monitoring
- Working lights percentage
- Area safety trends
- Risk level assessment
- Emergency resource mapping

## Technical Implementation

### AI Integration
Referenced from ```python:backend/app/services/gemini_service.py```:
- Real-time route safety analysis
- Time-aware risk assessment
- Multi-factor safety scoring
- Contextual recommendation generation

### Safety Monitoring
Referenced from ```python:backend/app/services/monitoring_service.py```:
- Real-time location tracking
- Route deviation detection
- Dynamic safety assessment
- Automated alert triggering

### Emergency Response
Referenced from ```python:backend/app/services/emergency_service.py```:
- Intelligent response routing
- Safe place identification
- Emergency guidance generation
- Fallback protocol management

## Technical Stack

### Core Technologies
- **Frontend**: Next.js 14
  - App Router for improved routing
  - Server Components for better performance
  - Tailwind CSS for styling
  - shadcn/ui for beautiful, accessible components
  - Server Actions for form handling
  - Edge Runtime support
- **Backend**: Flask/Python
  - Fast API responses
  - Efficient data processing
  - Scalable architecture
- **AI/ML**: Google Gemini API
  - Image processing
  - Natural language understanding
  - Contextual analysis
- **Maps**: Google Maps API
- **Database**: TBD

### Data Sources
- Street lighting data
- Crime statistics
- Public transit schedules
- Business operating hours
- Emergency service locations
- Community-reported incidents

## Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/go-guardian.git
cd go-guardian
```

2. Install frontend dependencies
```bash
# Install frontend dependencies
cd frontend
npm install
```

3. Install shadcn/ui components (if needed)
```bash
npx shadcn-ui@latest init
```

4. Create and configure environment variables
```bash
# Frontend
cp .env.example .env.local

# Backend
cd ../backend
cp .env.example .env
```

5. Add your API keys to the respective `.env` files:
```bash
# Frontend (.env.local)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here

# Backend (.env)
GEMINI_API_KEY=your_gemini_api_key_here
```

6. Install backend dependencies
```bash
pip install -r requirements.txt
```

7. Run the tests
```bash
python -m pytest tests/
```

## Development Setup

### Prerequisites
- Node.js 18.17 or later
- Python 3.8+
- Google Cloud account with Gemini API access
- Google Maps API key

### Running the Application

1. Start the frontend development server:
```bash
# From the frontend directory
npm run dev
```

2. Start the backend server:
```bash
# From the backend directory
python run.py
```

## Project Structure
```
go-guardian/
├── frontend/
│   ├── app/
│   │   ├── community/
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── SafePlacesSearch.tsx
│   │   │   └── SafetyDataVisualization.tsx
│   │   ├── lib/
│   │   └── public/
├── backend/
│   ├── app/
│   │   ├── services/
│   │   │   ├── gemini_service.py
│   │   │   ├── monitoring_service.py
│   │   │   └── emergency_service.py
│   │   └── routes/
│   └── tests/
└── README.md
```

## Testing
Run the automated test suite:
```bash
# Frontend tests
cd frontend
npm run test

# Backend tests
cd backend
python -m pytest tests/
```

## Social Impact

- Empowering women's safe mobility in urban environments
- Reducing barriers to women's freedom of movement
- Creating safer communities through technology
- Optimizing emergency response for women's safety
- Building a supportive safety network for women
- Contributing to violence prevention through early warning systems

## Future Development

- Beta testing with women's organizations
- Strategic partnerships with:
  - Law enforcement agencies
  - Emergency services
  - Transportation providers
  - Women's safety organizations
- Global scaling initiatives

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Support

For support, email nidhispai@gmail.com.

## Acknowledgments

- San Francisco Open Data Portal
- Women's safety organizations

---
Made with ❤️ for women's safety worldwide
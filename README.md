# Go Guardian: AI-Powered Safety Companion for Women

## Overview
Go Guardian is an AI-powered safety companion application that helps women navigate cities safely by providing real-time safety analysis, intelligent route planning, and emergency assistance. Using advanced AI capabilities through Google's Gemini API, the app offers contextual safety recommendations and immediate response protocols in threatening situations.

## Features

### 🗺️ Smart Route Planning
- AI-powered route recommendations based on:
  - Street lighting conditions
  - Time-of-day analysis
  - Historical safety data
  - Real-time crowd density
  - Public transit schedules
- Natural language processing for intuitive destination input
- Dynamic rerouting based on safety conditions

### 🚨 Emergency Response System
- Motion-triggered SOS activation (phone shake)
- Automatic alerting of trusted contacts with location
- One-tap audio/video recording
- Emergency services quick-dial
- AI-powered situation analysis and guidance
- Custom emergency script generation

### 🤖 AI Integration Features
- Real-time environment analysis using phone camera
- Voice command recognition for hands-free operation
- Contextual safety recommendations
- Pattern recognition and threat assessment
- Natural language processing for user commands

### 📱 User Safety Features
- Dynamic safe zone mapping
- Community safety network
- Real-time location monitoring
- Smart schedule advisor
- Personalized safety learning
- Behavior pattern prediction

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
│   ├── components/
│   │   └── ui/          # shadcn/ui components
│   ├── lib/
│   └── public/
├── backend/
│   ├── app/
│   │   ├── services/
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

- Aligned with UN Sustainable Development Goal 5 (Gender Equality)
- Empowering women's mobility in urban environments
- Contributing to safer communities
- Optimizing emergency response systems
- Building a supportive safety network

## Future Development

- Beta testing with women's organizations
- Feature expansion based on user feedback
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

For support, email support@goguardian.com or join our Slack community.

## Acknowledgments

- San Francisco Open Data Portal
- Women's safety organizations
- Beta testing participants
- Contributing developers

---
Made with ❤️ for a safer world
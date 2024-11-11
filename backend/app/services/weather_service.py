from typing import Dict, Any, List
import aiohttp
import logging
from datetime import datetime

class WeatherService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.logger = logging.getLogger(__name__)
        self.base_url = "https://api.openweathermap.org/data/3.0"

    async def get_weather_alerts(self, lat: float, lng: float) -> Dict[str, Any]:
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.base_url}/onecall",
                    params={
                        "appid": self.api_key,
                        "lat": lat,
                        "lon": lng,
                        "units": "metric"
                    }
                ) as response:
                    response.raise_for_status()
                    data = await response.json()
                    
                    return {
                        "alerts": data.get("alerts", []),
                        "current": {
                            "temp_c": data["current"]["temp"],
                            "condition": data["current"]["weather"][0]["description"],
                            "wind_kph": data["current"]["wind_speed"] * 3.6,
                            "precip_mm": data["current"].get("rain", {}).get("1h", 0)
                        },
                        "timestamp": datetime.now().isoformat()
                    }
        except Exception as e:
            self.logger.error(f"Failed to fetch weather alerts: {e}")
            raise
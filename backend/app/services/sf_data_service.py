from typing import Dict, List, Optional, Tuple
import aiohttp
import pandas as pd
from datetime import datetime, timedelta
import numpy as np
import time
from ..utils.logger import SafetyLogger

class SFDataService:
    def __init__(self):
        self.base_url = "https://data.sfgov.org/resource/"
        self.datasets = {
            'police_incidents': 'wg3w-h783.json',
            'street_lights': '2gc3-4hv4.json',
            '311_cases': 'vw6y-z8j6.json',
        }
        self.logger = SafetyLogger("SFDataService")

    async def fetch_dataset(
        self,
        dataset_name: str,
        query_params: Dict,
        timeout: int = 30
    ) -> List[Dict]:
        """Fetch data from SF OpenData API with logging"""
        if dataset_name not in self.datasets:
            self.logger.log_error(
                "InvalidDataset",
                f"Unknown dataset: {dataset_name}"
            )
            raise ValueError(f"Unknown dataset: {dataset_name}")

        url = f"{self.base_url}{self.datasets[dataset_name]}"
        start_time = time.time()
        
        try:
            self.logger.log_api_request(dataset_name, query_params)
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=query_params, timeout=timeout) as response:
                    response_time = (time.time() - start_time) * 1000  # Convert to ms
                    
                    self.logger.log_api_response(
                        dataset_name,
                        response.status,
                        response_time
                    )
                    
                    if response.status == 200:
                        return await response.json()
                    
                    self.logger.log_error(
                        "APIError",
                        f"API error for {dataset_name}",
                        {"status_code": response.status}
                    )
                    return []
                    
        except aiohttp.ClientError as e:
            self.logger.log_error(
                "NetworkError",
                str(e),
                {"dataset": dataset_name}
            )
            return []
        except Exception as e:
            self.logger.log_error(
                "UnexpectedError",
                str(e),
                {"dataset": dataset_name}
            )
            return []

    async def get_area_safety_data(
        self,
        lat: float,
        lng: float,
        radius_meters: int = 500,
        time_window_days: int = 30
    ) -> Dict:
        """Get safety data for an area with logging"""
        start_time = time.time()
        location = {"lat": lat, "lng": lng}
        
        self.logger.log_api_request(
            "area_safety",
            {
                "location": location,
                "radius_meters": radius_meters,
                "time_window_days": time_window_days
            }
        )

        try:
            datasets = await asyncio.gather(
                self.fetch_dataset('police_incidents', self._build_incident_query(lat, lng, radius_meters, time_window_days)),
                self.fetch_dataset('street_lights', self._build_light_query(lat, lng, radius_meters)),
                self.fetch_dataset('311_cases', self._build_cases_query(lat, lng, radius_meters, time_window_days))
            )
            
            safety_data = self.analyze_safety_data(*datasets)
            
            response_time = (time.time() - start_time) * 1000
            self.logger.log_api_response("area_safety", 200, response_time)
            
            if safety_data.get('safety_score'):
                self.logger.log_safety_calculation(
                    location,
                    safety_data['safety_score']
                )
            
            return safety_data
            
        except Exception as e:
            self.logger.log_error(
                "SafetyAnalysisError",
                str(e),
                {"location": location}
            )
            raise

    def _build_incident_query(self, lat: float, lng: float, radius: int, days: int) -> Dict:
        """Build query for incident data"""
        time_threshold = datetime.now() - timedelta(days=days)
        return {
            '$where': f"""
                within_circle(location, {lat}, {lng}, {radius})
                AND date >= '{time_threshold.isoformat()}'
            """,
            '$select': 'category,date,time,location'
        }

    def _build_light_query(self, lat: float, lng: float, radius: int) -> Dict:
        """Build query for street light data"""
        return {
            '$where': f"within_circle(location, {lat}, {lng}, {radius})",
            '$select': 'status,installation_date,maintenance_date'
        }

    def _build_cases_query(self, lat: float, lng: float, radius: int, days: int) -> Dict:
        """Build query for 311 cases data"""
        time_threshold = datetime.now() - timedelta(days=days)
        return {
            '$where': f"""
                within_circle(location, {lat}, {lng}, {radius})
                AND created_date >= '{time_threshold.isoformat()}'
            """,
            '$select': 'category,status,created_date,closed_date'
        }

    def analyze_safety_data(self, incidents, lights, cases) -> Dict:
        """Analyze safety data with logging"""
        try:
            metrics = {}
            
            if incidents:
                df_incidents = pd.DataFrame(incidents)
                metrics['incident_analysis'] = self._analyze_incidents(df_incidents)
                
                self.logger.log_api_response(
                    "incident_analysis",
                    200,
                    {"total_incidents": len(df_incidents)}
                )
            
            if lights:
                df_lights = pd.DataFrame(lights)
                metrics['infrastructure'] = self._analyze_infrastructure(df_lights)
                
                self.logger.log_api_response(
                    "infrastructure_analysis",
                    200,
                    {"total_lights": len(df_lights)}
                )
            
            if cases:
                df_cases = pd.DataFrame(cases)
                metrics['response_metrics'] = self._analyze_response_times(df_cases)
                
                self.logger.log_api_response(
                    "response_analysis",
                    200,
                    {"total_cases": len(df_cases)}
                )
            
            metrics['safety_score'] = self._calculate_safety_score(metrics)
            
            return metrics
            
        except Exception as e:
            self.logger.log_error(
                "AnalysisError",
                str(e),
                {"data_sizes": {
                    "incidents": len(incidents),
                    "lights": len(lights),
                    "cases": len(cases)
                }}
            )
            raise


        def _analyze_incidents(self, df: pd.DataFrame) -> Dict:
        """Analyze incident patterns and trends"""
        try:
            if df.empty:
                return {}
            
            # Convert date column to datetime if not already
            df['date'] = pd.to_datetime(df['date'])
            
            # Hourly distribution
            hourly_counts = df.groupby(df['date'].dt.hour).size()
            
            # Category analysis
            category_counts = df['category'].value_counts()
            
            # Time-based patterns
            time_patterns = {
                'morning': len(df[df['date'].dt.hour.between(6, 11)]),
                'afternoon': len(df[df['date'].dt.hour.between(12, 17)]),
                'evening': len(df[df['date'].dt.hour.between(18, 23)]),
                'night': len(df[df['date'].dt.hour.between(0, 5)])
            }
            
            # Recent trend (last 7 days vs previous 7 days)
            recent_mask = df['date'] >= (datetime.now() - timedelta(days=7))
            previous_mask = ((df['date'] < (datetime.now() - timedelta(days=7))) & 
                           (df['date'] >= (datetime.now() - timedelta(days=14))))
            
            recent_count = len(df[recent_mask])
            previous_count = len(df[previous_mask])
            trend_change = ((recent_count - previous_count) / previous_count * 100) if previous_count > 0 else 0
            
            return {
                'total_incidents': len(df),
                'hourly_distribution': hourly_counts.to_dict(),
                'category_distribution': category_counts.to_dict(),
                'time_patterns': time_patterns,
                'trend_change_percentage': trend_change,
                'high_risk_hours': hourly_counts.nlargest(3).index.tolist(),
                'most_common_categories': category_counts.nlargest(3).index.tolist()
            }
            
        except Exception as e:
            self.logger.log_error(
                "IncidentAnalysisError",
                str(e),
                {"dataframe_info": str(df.info())}
            )
            return {}

    def _analyze_infrastructure(self, df: pd.DataFrame) -> Dict:
        """Analyze infrastructure status and coverage"""
        try:
            if df.empty:
                return {}
            
            # Basic counts
            total_lights = len(df)
            status_counts = df['status'].value_counts()
            working_lights = status_counts.get('WORKING', 0)
            
            # Maintenance analysis
            df['maintenance_date'] = pd.to_datetime(df['maintenance_date'])
            recent_maintenance = len(df[
                df['maintenance_date'] >= (datetime.now() - timedelta(days=90))
            ])
            
            # Coverage calculation
            coverage_score = (working_lights / total_lights * 100) if total_lights > 0 else 0
            
            return {
                'total_lights': total_lights,
                'working_lights': working_lights,
                'status_distribution': status_counts.to_dict(),
                'coverage_score': coverage_score,
                'recent_maintenance_count': recent_maintenance,
                'maintenance_percentage': (recent_maintenance / total_lights * 100) if total_lights > 0 else 0
            }
            
        except Exception as e:
            self.logger.log_error(
                "InfrastructureAnalysisError",
                str(e),
                {"dataframe_info": str(df.info())}
            )
            return {}

    def _analyze_response_times(self, df: pd.DataFrame) -> Dict:
        """Analyze emergency response patterns and efficiency"""
        try:
            if df.empty:
                return {}
            
            # Convert date columns
            df['created_date'] = pd.to_datetime(df['created_date'])
            df['closed_date'] = pd.to_datetime(df['closed_date'])
            
            # Calculate response times in hours
            df['response_time'] = (df['closed_date'] - df['created_date']).dt.total_seconds() / 3600
            
            # Calculate response time metrics
            response_metrics = {
                'mean_response_time': df['response_time'].mean(),
                'median_response_time': df['response_time'].median(),
                'percentiles': {
                    '90th': df['response_time'].quantile(0.9),
                    '95th': df['response_time'].quantile(0.95)
                }
            }
            
            # Category analysis
            category_response_times = df.groupby('category')['response_time'].agg([
                'mean',
                'median',
                'count'
            ]).to_dict('index')
            
            # Time of day analysis
            df['hour'] = df['created_date'].dt.hour
            hourly_response_times = df.groupby('hour')['response_time'].mean().to_dict()
            
            return {
                'response_metrics': response_metrics,
                'category_performance': category_response_times,
                'hourly_performance': hourly_response_times,
                'total_cases': len(df),
                'open_cases': len(df[df['closed_date'].isna()]),
                'resolution_rate': (len(df[~df['closed_date'].isna()]) / len(df) * 100) if len(df) > 0 else 0
            }
            
        except Exception as e:
            self.logger.log_error(
                "ResponseAnalysisError",
                str(e),
                {"dataframe_info": str(df.info())}
            )
            return {}

    def _calculate_safety_score(self, metrics: Dict) -> float:
        """Calculate composite safety score based on all metrics"""
        try:
            score = 100.0
            weights = {
                'incidents': 0.4,
                'infrastructure': 0.3,
                'response': 0.3
            }
            
            # Incident impact
            if 'incident_analysis' in metrics:
                incident_data = metrics['incident_analysis']
                total_incidents = incident_data.get('total_incidents', 0)
                trend_change = incident_data.get('trend_change_percentage', 0)
                
                # Reduce score based on incident count and trend
                incident_impact = min(50, total_incidents * 2)  # Cap at 50 point reduction
                trend_impact = max(-10, min(10, trend_change / 10))  # +/- 10 points max
                
                score -= incident_impact * weights['incidents']
                score += trend_impact * weights['incidents']
            
            # Infrastructure impact
            if 'infrastructure' in metrics:
                infra_data = metrics['infrastructure']
                coverage_score = infra_data.get('coverage_score', 0)
                
                # Reduce score based on infrastructure coverage
                score += (coverage_score - 100) * weights['infrastructure']
            
            # Response time impact
            if 'response_metrics' in metrics:
                response_data = metrics['response_metrics']
                resolution_rate = response_data.get('resolution_rate', 0)
                
                # Reduce score based on response performance
                score += (resolution_rate - 100) * weights['response']
            
            return max(0, min(100, score))
            
        except Exception as e:
            self.logger.log_error(
                "ScoreCalculationError",
                str(e),
                {"metrics": metrics}
            )
            return 0.0
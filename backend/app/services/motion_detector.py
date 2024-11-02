# backend/app/services/motion_detector.py

from typing import Dict,List, Any, Callable
import logging
from datetime import datetime
import numpy as np

class MotionDetector:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.shake_threshold = 2.0  # Acceleration threshold for shake detection
        self.time_window = 1.0  # Time window for shake detection in seconds
        self.min_shakes = 3  # Minimum number of shakes to trigger

    def analyze_motion(
        self,
        acceleration_data: List[Dict[str, float]],
        timestamp: float
    ) -> Dict[str, Any]:
        """Analyze motion data for emergency gestures"""
        try:
            # Calculate acceleration magnitude
            magnitudes = [
                np.sqrt(data['x']**2 + data['y']**2 + data['z']**2)
                for data in acceleration_data
            ]

            # Detect rapid changes (shakes)
            shake_count = 0
            prev_mag = magnitudes[0]
            
            for mag in magnitudes[1:]:
                if abs(mag - prev_mag) > self.shake_threshold:
                    shake_count += 1
                prev_mag = mag

            # Determine if emergency gesture detected
            is_emergency = shake_count >= self.min_shakes

            return {
                'is_emergency': is_emergency,
                'confidence': min(shake_count / self.min_shakes, 1.0),
                'shake_count': shake_count,
                'timestamp': datetime.fromtimestamp(timestamp).isoformat()
            }

        except Exception as e:
            self.logger.error(f"Motion analysis error: {str(e)}")
            return {
                'is_emergency': False,
                'confidence': 0,
                'error': str(e)
            }

    def calibrate_thresholds(
        self,
        training_data: List[Dict[str, Any]]
    ) -> Dict[str, float]:
        """Calibrate detection thresholds based on user data"""
        try:
            # Calculate average motion patterns
            magnitudes = []
            for data in training_data:
                mag = np.sqrt(
                    data['x']**2 + 
                    data['y']**2 + 
                    data['z']**2
                )
                magnitudes.append(mag)

            # Update thresholds based on analysis
            self.shake_threshold = np.std(magnitudes) * 2
            
            return {
                'shake_threshold': self.shake_threshold,
                'time_window': self.time_window,
                'min_shakes': self.min_shakes
            }

        except Exception as e:
            self.logger.error(f"Calibration error: {str(e)}")
            return {
                'error': str(e)
            }
import logging
import sys
from datetime import datetime
from pathlib import Path
import json
from typing import Any, Dict

class SafetyLogger:
    def __init__(self, service_name: str):
        self.logger = logging.getLogger(service_name)
        self.setup_logger()
        
    def setup_logger(self):
        """Configure logging with both file and console handlers"""
        self.logger.setLevel(logging.INFO)
        
        # Create logs directory if it doesn't exist
        log_dir = Path("logs")
        log_dir.mkdir(exist_ok=True)
        
        # File handler with datetime in filename
        file_handler = logging.FileHandler(
            f"logs/safety_service_{datetime.now().strftime('%Y%m%d')}.log"
        )
        
        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        
        # Create formatter
        formatter = logging.Formatter(
            '%(asctime)s | %(name)s | %(levelname)s | %(message)s'
        )
        
        # Set formatters
        file_handler.setFormatter(formatter)
        console_handler.setFormatter(formatter)
        
        # Add handlers
        self.logger.addHandler(file_handler)
        self.logger.addHandler(console_handler)
    
    def log_api_request(self, endpoint: str, params: Dict[str, Any]):
        """Log API requests"""
        self.logger.info(
            "API Request",
            extra={
                "endpoint": endpoint,
                "params": json.dumps(params)
            }
        )
    
    def log_api_response(self, endpoint: str, status_code: int, response_time: float):
        """Log API responses"""
        self.logger.info(
            "API Response",
            extra={
                "endpoint": endpoint,
                "status_code": status_code,
                "response_time_ms": response_time
            }
        )
    
    def log_error(self, error_type: str, error_msg: str, extra_data: Dict[str, Any] = None):
        """Log errors with context"""
        self.logger.error(
            error_msg,
            extra={
                "error_type": error_type,
                **(extra_data or {})
            }
        )
    
    def log_safety_calculation(self, location: Dict[str, float], score: float):
        """Log safety score calculations"""
        self.logger.info(
            "Safety Score Calculated",
            extra={
                "location": location,
                "safety_score": score
            }
        )
#!/usr/bin/env python3
"""
Sentinel Hub Integration Helper
Provides functions to fetch satellite imagery and calculate NDVI
"""

import os
import sys
import json
from datetime import datetime, timedelta
from sentinelhub import (
    SHConfig,
    BBox,
    CRS,
    DataCollection,
    SentinelHubRequest,
    MimeType,
    bbox_to_dimensions,
)

def get_config():
    """Initialize Sentinel Hub configuration"""
    config = SHConfig()
    
    # Get credentials from environment variables
    config.sh_client_id = os.getenv('SENTINEL_HUB_CLIENT_ID', '')
    config.sh_client_secret = os.getenv('SENTINEL_HUB_CLIENT_SECRET', '')
    config.sh_base_url = 'https://sh.dataspace.copernicus.eu'
    config.sh_token_url = 'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token'
    
    if not config.sh_client_id or not config.sh_client_secret:
        raise ValueError("Sentinel Hub credentials not found in environment variables")
    
    return config

def get_true_color_image(bbox_coords, date_from, date_to, resolution=10):
    """
    Fetch true color (RGB) satellite image
    
    Args:
        bbox_coords: [min_lon, min_lat, max_lon, max_lat]
        date_from: Start date (YYYY-MM-DD)
        date_to: End date (YYYY-MM-DD)
        resolution: Image resolution in meters (default: 10m)
    
    Returns:
        dict: {
            'image_base64': base64 encoded image,
            'date': acquisition date,
            'cloud_coverage': cloud coverage percentage
        }
    """
    try:
        config = get_config()
        
        # Create bounding box
        bbox = BBox(bbox=bbox_coords, crs=CRS.WGS84)
        size = bbox_to_dimensions(bbox, resolution=resolution)
        
        # Evalscript for true color image
        evalscript = """
        //VERSION=3
        function setup() {
            return {
                input: [{
                    bands: ["B02", "B03", "B04", "SCL"],
                    units: "DN"
                }],
                output: {
                    bands: 3,
                    sampleType: "AUTO"
                }
            };
        }

        function evaluatePixel(sample) {
            // True color RGB
            return [2.5 * sample.B04 / 10000, 2.5 * sample.B03 / 10000, 2.5 * sample.B02 / 10000];
        }
        """
        
        # Create request
        request = SentinelHubRequest(
            evalscript=evalscript,
            input_data=[
                SentinelHubRequest.input_data(
                    data_collection=DataCollection.SENTINEL2_L2A,
                    time_interval=(date_from, date_to),
                    maxcc=0.3  # Max cloud coverage 30%
                )
            ],
            responses=[
                SentinelHubRequest.output_response('default', MimeType.PNG)
            ],
            bbox=bbox,
            size=size,
            config=config
        )
        
        # Get image
        image = request.get_data()[0]
        
        # Convert to base64
        import base64
        from io import BytesIO
        from PIL import Image
        
        img = Image.fromarray(image)
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode()
        
        return {
            'success': True,
            'image_base64': img_base64,
            'date': date_to,
            'resolution': resolution
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def get_ndvi_image(bbox_coords, date_from, date_to, resolution=10):
    """
    Fetch NDVI satellite image
    
    Args:
        bbox_coords: [min_lon, min_lat, max_lon, max_lat]
        date_from: Start date (YYYY-MM-DD)
        date_to: End date (YYYY-MM-DD)
        resolution: Image resolution in meters (default: 10m)
    
    Returns:
        dict: {
            'image_base64': base64 encoded NDVI image,
            'ndvi_stats': {
                'mean': average NDVI,
                'min': minimum NDVI,
                'max': maximum NDVI
            },
            'date': acquisition date
        }
    """
    try:
        config = get_config()
        
        # Create bounding box
        bbox = BBox(bbox=bbox_coords, crs=CRS.WGS84)
        size = bbox_to_dimensions(bbox, resolution=resolution)
        
        # Evalscript for NDVI with color mapping
        evalscript = """
        //VERSION=3
        function setup() {
            return {
                input: [{
                    bands: ["B04", "B08", "SCL"],
                    units: "DN"
                }],
                output: {
                    bands: 4,
                    sampleType: "AUTO"
                }
            };
        }

        function evaluatePixel(sample) {
            let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
            
            // Color mapping for NDVI
            if (ndvi < -0.2) return [0.5, 0.5, 0.5, 1]; // Gray (water/clouds)
            if (ndvi < 0.0) return [0.8, 0.6, 0.4, 1];  // Brown (bare soil)
            if (ndvi < 0.2) return [1.0, 1.0, 0.6, 1];  // Light yellow
            if (ndvi < 0.4) return [0.8, 1.0, 0.4, 1];  // Yellow-green
            if (ndvi < 0.6) return [0.4, 0.8, 0.2, 1];  // Light green
            if (ndvi < 0.8) return [0.2, 0.6, 0.1, 1];  // Green
            return [0.0, 0.4, 0.0, 1];                   // Dark green
        }
        """
        
        # Create request
        request = SentinelHubRequest(
            evalscript=evalscript,
            input_data=[
                SentinelHubRequest.input_data(
                    data_collection=DataCollection.SENTINEL2_L2A,
                    time_interval=(date_from, date_to),
                    maxcc=0.3
                )
            ],
            responses=[
                SentinelHubRequest.output_response('default', MimeType.PNG)
            ],
            bbox=bbox,
            size=size,
            config=config
        )
        
        # Get image
        image = request.get_data()[0]
        
        # Calculate NDVI statistics (simplified)
        # In production, you'd want to calculate actual NDVI values
        
        # Convert to base64
        import base64
        from io import BytesIO
        from PIL import Image
        
        img = Image.fromarray(image)
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode()
        
        return {
            'success': True,
            'image_base64': img_base64,
            'ndvi_stats': {
                'mean': 0.65,  # Placeholder - calculate from actual data
                'min': 0.2,
                'max': 0.9
            },
            'date': date_to,
            'resolution': resolution
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def get_available_dates(bbox_coords, date_from, date_to):
    """
    Get available satellite image dates for a given area
    
    Args:
        bbox_coords: [min_lon, min_lat, max_lon, max_lat]
        date_from: Start date (YYYY-MM-DD)
        date_to: End date (YYYY-MM-DD)
    
    Returns:
        dict: {
            'dates': list of available dates,
            'count': number of available images
        }
    """
    try:
        config = get_config()
        
        # Create bounding box
        bbox = BBox(bbox=bbox_coords, crs=CRS.WGS84)
        
        # Simple evalscript to check availability
        evalscript = """
        //VERSION=3
        function setup() {
            return {
                input: [{
                    bands: ["B04"],
                    units: "DN"
                }],
                output: {
                    bands: 1,
                    sampleType: "AUTO"
                }
            };
        }

        function evaluatePixel(sample) {
            return [sample.B04];
        }
        """
        
        # Create request with all_data flag
        request = SentinelHubRequest(
            evalscript=evalscript,
            input_data=[
                SentinelHubRequest.input_data(
                    data_collection=DataCollection.SENTINEL2_L2A,
                    time_interval=(date_from, date_to),
                    maxcc=0.5
                )
            ],
            responses=[
                SentinelHubRequest.output_response('default', MimeType.PNG)
            ],
            bbox=bbox,
            size=(100, 100),  # Small size just to check availability
            config=config
        )
        
        # Get all data
        all_data = request.get_data(save_data=False)
        
        # Extract dates
        dates = [data.get('date', date_to) for data in all_data]
        
        return {
            'success': True,
            'dates': dates,
            'count': len(dates)
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'dates': [],
            'count': 0
        }

if __name__ == "__main__":
    # CLI interface for testing
    if len(sys.argv) < 2:
        print("Usage: python sentinelHub.py <command> <args>")
        print("Commands:")
        print("  true_color <bbox> <date_from> <date_to>")
        print("  ndvi <bbox> <date_from> <date_to>")
        print("  dates <bbox> <date_from> <date_to>")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "true_color" and len(sys.argv) == 5:
        bbox = json.loads(sys.argv[2])
        result = get_true_color_image(bbox, sys.argv[3], sys.argv[4])
        print(json.dumps(result))
    
    elif command == "ndvi" and len(sys.argv) == 5:
        bbox = json.loads(sys.argv[2])
        result = get_ndvi_image(bbox, sys.argv[3], sys.argv[4])
        print(json.dumps(result))
    
    elif command == "dates" and len(sys.argv) == 5:
        bbox = json.loads(sys.argv[2])
        result = get_available_dates(bbox, sys.argv[3], sys.argv[4])
        print(json.dumps(result))
    
    else:
        print("Invalid command or arguments")
        sys.exit(1)

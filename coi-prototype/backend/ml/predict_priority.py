#!/usr/bin/env python3
"""
Priority Prediction Script
Called by Node.js to get ML predictions for priority scoring.

Usage: python predict_priority.py <model_path> <features_json>
"""

import sys
import json
from pathlib import Path

# Add parent directory to path to import modules
sys.path.insert(0, str(Path(__file__).parent))

from priority_ml_model import PriorityMLModel


def main():
    if len(sys.argv) < 3:
        print(json.dumps({
            'error': 'Usage: python predict_priority.py <model_path> <features_json>'
        }), file=sys.stderr)
        sys.exit(1)
    
    model_path = sys.argv[1]
    features_json = sys.argv[2]
    
    try:
        # Parse features
        features = json.loads(features_json)
        
        # Load model
        model = PriorityMLModel.load_model(model_path)
        
        # Make prediction
        prediction = model.predict_priority(features)
        
        # Get explanation
        explanation = model.explain_prediction(features)
        
        # Return result as JSON
        result = {
            'score': prediction['score'],
            'level': prediction['level'],
            'probability': prediction['probability'],
            'explanation': explanation
        }
        
        print(json.dumps(result))
        
    except FileNotFoundError as e:
        print(json.dumps({
            'error': f'Model file not found: {e}'
        }), file=sys.stderr)
        sys.exit(1)
    except ValueError as e:
        print(json.dumps({
            'error': f'Model error: {e}'
        }), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(json.dumps({
            'error': f'Unexpected error: {str(e)}'
        }), file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()

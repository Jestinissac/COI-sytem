#!/usr/bin/env python3
"""
Priority ML Model Training Pipeline
Run monthly to update weights based on latest data.

Usage: python train_priority_model.py
"""

import pandas as pd
import json
import sys
from datetime import datetime
from pathlib import Path
from priority_ml_model import PriorityMLModel
import database


def main():
    print(f"=== Priority ML Training Pipeline ===")
    print(f"Started: {datetime.now()}")
    
    # Step 1: Extract training data
    print("\n[1/5] Extracting training data...")
    try:
        df = database.get_training_data()
        print(f"      Records: {len(df)}")
        
        if len(df) == 0:
            print("\n❌ No training data found.")
            print("   Ensure there are completed requests in the database.")
            return
        
        if 'bad_outcome' not in df.columns:
            print("\n❌ Target variable 'bad_outcome' not found in data.")
            return
        
        positive_count = df['bad_outcome'].sum()
        print(f"      Bad outcomes: {positive_count} ({positive_count/len(df)*100:.1f}%)")
    except Exception as e:
        print(f"\n❌ Error extracting training data: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Step 2: Check minimum data requirement
    MIN_RECORDS = 500
    MIN_POSITIVE = 50
    
    if len(df) < MIN_RECORDS:
        print(f"\n❌ Insufficient data. Need {MIN_RECORDS} records, have {len(df)}.")
        print("   Continue collecting data. ML training skipped.")
        return
    
    if positive_count < MIN_POSITIVE:
        print(f"\n❌ Insufficient positive cases. Need {MIN_POSITIVE}, have {positive_count}.")
        print("   Continue collecting data. ML training skipped.")
        return
    
    # Step 3: Train model
    print("\n[2/5] Training model...")
    try:
        model = PriorityMLModel()
        metrics = model.train(df)
        
        print(f"      Train accuracy: {metrics['train_accuracy']:.3f}")
        print(f"      Test accuracy:  {metrics['test_accuracy']:.3f}")
        print(f"      CV score:       {metrics['cv_mean']:.3f} (+/- {metrics['cv_std']:.3f})")
        print(f"      Samples:       {metrics['n_samples']}")
        print(f"      Positive:       {metrics['n_positive']}")
        print(f"      Negative:       {metrics['n_negative']}")
    except Exception as e:
        print(f"\n❌ Error training model: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Step 4: Extract learned weights
    print("\n[3/5] Extracting learned weights...")
    try:
        weights = model.get_learned_weights()
        
        print("      Top factors by importance:")
        for i, (feature, weight) in enumerate(list(weights.items())[:5]):
            direction = "↑" if weight > 0 else "↓"
            print(f"        {i+1}. {feature}: {weight:+.4f} {direction}")
    except Exception as e:
        print(f"\n❌ Error extracting weights: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Step 5: Save model
    print("\n[4/5] Saving model...")
    try:
        # Create models directory if it doesn't exist
        models_dir = Path(__file__).parent / 'models'
        models_dir.mkdir(exist_ok=True)
        
        model_filename = f"priority_model_{datetime.now().strftime('%Y%m%d_%H%M%S')}.joblib"
        model_path = models_dir / model_filename
        model.save_model(str(model_path))
        print(f"      Saved to: {model_path}")
    except Exception as e:
        print(f"\n❌ Error saving model: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Step 6: Store in database
    print("\n[5/5] Recording in database...")
    try:
        weights_json = json.dumps(weights)
        model_path_str = str(model_path)
        
        database.execute("""
            INSERT INTO ml_weights (model_type, model_path, weights, accuracy, training_records, trained_at, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            'priority_weights',
            model_path_str,
            weights_json,
            metrics['test_accuracy'],
            metrics['n_samples'],
            datetime.now().isoformat(),
            0  # Don't auto-activate, require manual review
        ))
        
        print("      Model recorded in database (inactive)")
    except Exception as e:
        print(f"\n❌ Error storing in database: {e}")
        import traceback
        traceback.print_exc()
        return
    
    print("\n✅ Training complete!")
    print(f"   Model saved but NOT active. Review and activate manually.")
    print(f"   To activate: UPDATE ml_weights SET is_active = 1 WHERE model_type = 'priority_weights' ORDER BY trained_at DESC LIMIT 1")
    
    # Generate comparison report
    print("\n=== Weight Comparison: Manual vs Learned ===")
    try:
        manual_config = database.query("""
            SELECT factor_id, weight, value_mappings 
            FROM priority_config 
            WHERE is_active = 1
        """)
        
        if manual_config:
            print(f"{'Factor':<30} {'Manual Weight':>15} {'Learned Weight':>15} {'Note':>20}")
            print("-" * 80)
            
            # Map feature names to factor IDs for comparison
            feature_to_factor = {
                'sla_percent_elapsed': 'sla_status',
                'has_external_deadline': 'external_deadline',
                'is_pie': 'pie_status',
                'is_statutory_audit': 'service_type',
                'escalation_count': 'escalation_count'
            }
            
            for feature, learned_weight in weights.items():
                factor_id = feature_to_factor.get(feature)
                if factor_id:
                    # Find matching manual config
                    manual = next((c for c in manual_config if c['factor_id'] == factor_id), None)
                    if manual:
                        manual_weight = manual['weight']
                        note = "Match" if abs(learned_weight - manual_weight) < 1.0 else "Different"
                        print(f"{feature:<30} {manual_weight:>15.2f} {learned_weight:>15.4f} {note:>20}")
        else:
            print("   No manual priority config found for comparison.")
    except Exception as e:
        print(f"   Note: Could not generate comparison report: {e}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Training interrupted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

import pandas as pd
import os

# Path to your CSV files
csv_paths = [
    '/Users/macos/Desktop/AquaGreen_Monitoring/frontend/public/sample_lettuce.csv',
    '/Users/macos/Desktop/AquaGreen_Monitoring/frontend/public/fixed_sample_lettuce.csv',
    '/Users/macos/Desktop/AquaGreen_Monitoring/frontend/public/test_lettuce.csv'
]

for csv_path in csv_paths:
    if not os.path.exists(csv_path):
        print(f"File not found: {csv_path}")
        continue
        
    print(f"\n\nProcessing: {csv_path}")
    try:
        # Read the CSV file exactly as the backend would
        df = pd.read_csv(csv_path)
        
        # Print column names
        print(f"Columns: {df.columns.tolist()}")
        
        # Check if 'sample_id' exists
        if 'sample_id' in df.columns:
            print("'sample_id' column found!")
            # Print first few sample IDs
            print("First 3 sample IDs:")
            for i, row in df.head(3).iterrows():
                print(f"  {row['sample_id']}")
        else:
            print("ERROR: 'sample_id' column NOT found!")
            
            # Try case-insensitive search
            lowercase_cols = [col.lower() for col in df.columns]
            if 'sample_id' in lowercase_cols:
                idx = lowercase_cols.index('sample_id')
                actual_col = df.columns[idx]
                print(f"Found similar column: '{actual_col}'")
                print("This might be the issue - column name case mismatch")
            
            # Check for whitespace issues
            for col in df.columns:
                if col.strip() == 'sample_id':
                    print(f"Found column with whitespace: '{col}'")
                    print("This might be the issue - column name has extra whitespace")
                    
            # Check for BOM marker
            if df.columns[0].startswith('\ufeff'):
                print(f"BOM marker detected in first column: '{df.columns[0]}'")
                print("This is likely the issue - CSV has a BOM marker")
                
    except Exception as e:
        print(f"Error processing file: {e}")

print("\n\nRecommendation:")
print("If none of your CSV files show 'sample_id' column found, try creating a new CSV file")
print("with exactly this content (including the header line) and save it as UTF-8 without BOM:")
print("\nsample_id,species,cultivation_date\nCROP_001,Lettuce,2025-01-15\nCROP_002,Lettuce,2025-01-15")

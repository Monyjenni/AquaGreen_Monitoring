import pandas as pd

# Path to your CSV file
csv_path = '/Users/macos/Desktop/AquaGreen_Monitoring/frontend/public/fixed_sample_lettuce.csv'

# Read the CSV file
df = pd.read_csv(csv_path)

# Print column names to check exact format
print("Column names in CSV:")
print(df.columns.tolist())

# Check if 'sample_id' exists
print("\nDoes 'sample_id' exist in columns?")
print('sample_id' in df.columns)

# Print first few rows
print("\nFirst 3 rows of data:")
print(df.head(3))

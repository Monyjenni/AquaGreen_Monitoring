import pandas as pd

csv_path = '/Users/macos/Desktop/AquaGreen_Monitoring/frontend/public/fixed_sample_lettuce.csv'

df = pd.read_csv(csv_path)

print("Column names in CSV:")
print(df.columns.tolist())

print("\nDoes 'sample_id' exist in columns?")
print('sample_id' in df.columns)

print("\nFirst 3 rows of data:")
print(df.head(3))

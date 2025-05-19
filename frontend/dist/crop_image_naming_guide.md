# AquaGreen Crop Image Naming and CSV Mapping Guide

This guide explains how to properly structure your crop image folders and CSV metadata files for successful upload and processing in the AquaGreen Monitoring System.

## CSV Metadata File Format

Your CSV metadata file should contain these columns:
- `sample_id` (Required): Unique identifier for each crop sample (e.g., CROP_001)
- Additional fields (Optional): Add any relevant metadata like species, growth stage, health status, etc.

### Example CSV Structure

```
sample_id,species,cultivation_date,plant_age_days,growth_stage,health_status,description
CROP_001,Lettuce,2025-01-15,45,Mature,Healthy,Romaine lettuce sample with normal growth pattern
CROP_002,Lettuce,2025-01-15,45,Mature,Infected,Romaine lettuce sample showing early signs of fungal infection
```

## Image Naming Convention

When uploading crop images, follow these naming conventions:

1. **Basic Format**: `{SAMPLE_ID}V{VERSION_NUMBER}`
   - Example: `CROP_001V1.jpg`, `CROP_001V2.jpg`, `CROP_001V3.jpg`

2. **Sample ID**: Must match exactly with the `sample_id` field in your CSV file
   - Example: If CSV has `CROP_001`, your image should start with `CROP_001`

3. **Version Number**: Append `V{number}` to indicate different versions/angles of the same sample
   - Example: `CROP_001V1.jpg` (first view), `CROP_001V2.jpg` (second view)

## Folder Structure (Recommended)

Organize your image files in folders by crop type or experiment:

```
Lettuce_Experiment_2025/
├── CROP_001V1.jpg
├── CROP_001V2.jpg
├── CROP_002V1.jpg
├── CROP_002V2.jpg
└── ...
```

## Upload Workflow

1. First, upload your CSV metadata file through the "Upload CSV Mapping File" section
2. Process the CSV file by clicking "Process Now" after upload
3. Select the processed CSV file when uploading images
4. Upload your crop images - they will be automatically validated against the CSV sample IDs

## Validation Process

The system ensures that:
- All uploaded images have corresponding sample IDs in the CSV file
- Image names follow the correct naming convention
- Required metadata fields are present in the CSV file

## Best Practices

- Keep sample IDs consistent across related experiments
- Use descriptive names for CSV files (e.g., `lettuce_growth_study_2025.csv`)
- Include sufficient metadata in your CSV to support later analysis
- Take multiple viewpoints (versions) of the same sample when relevant

---

*For questions or technical support, contact the AquaGreen Monitoring System administrator.*

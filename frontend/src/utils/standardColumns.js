/**
 * Standard column definitions for data visualization in AquaGreen Monitoring
 * These columns will be used as the standard format for data visualization
 */

export const STANDARD_COLUMNS = [
  { id: 'plot_id', name: 'Plot ID', type: 'string', required: true },
  { id: 'crop', name: 'Crop', type: 'string', required: true },
  { id: 'year', name: 'Year', type: 'number', required: true },
  { id: 'plant', name: 'Plant', type: 'string', required: true },
  { id: 'variety', name: 'Variety', type: 'string', required: true },
  { id: 'area_hectares', name: 'Area (ha)', type: 'number', required: false },
  { id: 'production_tons', name: 'Production (tons)', type: 'number', required: false },
  { id: 'yield_tons_per_hectare', name: 'Yield (tons/ha)', type: 'number', required: false },
  { id: 'annual_rainfall_mm', name: 'Annual Rainfall (mm)', type: 'number', required: false },
  { id: 'avg_temperature_c', name: 'Avg. Temperature (°C)', type: 'number', required: false },
  { id: 'fertilizer_type_kg_ha', name: 'Fertilizer Type/Rate (kg/ha)', type: 'string', required: false },
  { id: 'pesticide_used_kg_ha', name: 'Pesticide Used (kg/ha)', type: 'number', required: false },
  { id: 'irrigation_type', name: 'Irrigation Type', type: 'string', required: false },
  { id: 'soil_ph', name: 'Soil pH', type: 'number', required: false },
  { id: 'organic_matter', name: 'Organic Matter (%)', type: 'number', required: false },
  { id: 'p_level_mg_kg', name: 'P Level (mg/kg)', type: 'number', required: false },
  { id: 'k_level_mg_kg', name: 'K Level (mg/kg)', type: 'number', required: false },
  { id: 'n_level_mg_kg', name: 'N Level (mg/kg)', type: 'number', required: false },
  { id: 'planting_date', name: 'Planting Date', type: 'date', required: false },
  { id: 'harvest_date', name: 'Harvest Date', type: 'date', required: false }
];

/**
 * Function to validate if a dataset has the required standard columns
 * @param {Object[]} data - The dataset to validate
 * @returns {Object} - Validation result with success flag and missing columns if any
 */
export function validateDataAgainstStandard(data) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return { 
      success: false, 
      message: 'No data provided or data is not in the correct format'
    };
  }

  // Check first row for column headers
  const firstRow = data[0];
  const missingRequiredColumns = [];
  
  // Check for required columns
  STANDARD_COLUMNS.forEach(column => {
    if (column.required && !(column.id in firstRow)) {
      missingRequiredColumns.push(column.name);
    }
  });

  if (missingRequiredColumns.length > 0) {
    return {
      success: false,
      message: `Missing required columns: ${missingRequiredColumns.join(', ')}`,
      missingColumns: missingRequiredColumns
    };
  }

  return { success: true };
}

/**
 * Transform data to fit standard column structure, filling in missing columns
 * @param {Object[]} data - Original data
 * @returns {Object[]} - Transformed data with standard columns
 */
export function transformToStandardFormat(data) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return [];
  }
  
  return data.map(row => {
    const standardRow = {};
    
    // Add all standard columns (with null for missing values)
    STANDARD_COLUMNS.forEach(column => {
      standardRow[column.id] = row[column.id] !== undefined ? row[column.id] : null;
    });
    
    return standardRow;
  });
}

/**
 * Generate a template CSV with standard columns
 * @returns {string} - CSV content with header row
 */
export function generateTemplateCSV() {
  const headers = STANDARD_COLUMNS.map(col => col.name).join(',');
  return headers;
}

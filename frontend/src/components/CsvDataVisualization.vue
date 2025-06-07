<template>
  <div class="csv-data-visualization">
    <!-- File selection and column selection -->
    <div v-if="dashboardMode || selectedFileId" class="mb-4">
      <h5>CSV Data Visualization</h5>
      
      <!-- Visualization Presets -->
      <div class="visualization-presets mb-3">
        <label for="visualizationPreset">Visualization Preset:</label>
        <select id="visualizationPreset" class="form-control" v-model="selectedPreset">
          <option v-for="preset in visualizationPresets" :key="preset.value" :value="preset.value">
            {{ preset.label }}
          </option>
        </select>
        <div v-if="selectedPreset !== 'custom'" class="preset-info mt-2 text-muted small">
          <i class="fas fa-info-circle"></i> 
          Using preset visualization. Selected columns will be updated automatically.
        </div>
      </div>
      
      <!-- Chart Type Selection -->
      <div class="chart-type-selection mb-3">
        <label for="chartType">Chart Type:</label>
        <select id="chartType" class="form-control" v-model="chartType">
          <option v-for="type in availableChartTypes" :key="type.value" :value="type.value">
            {{ type.label }}
          </option>
        </select>
      </div>
      
      <!-- Column Filter -->
      <div class="column-filter mb-2">
        <label for="columnFilter">Filter Columns:</label>
        <input 
          id="columnFilter" 
          type="text" 
          class="form-control" 
          v-model="filterValue" 
          placeholder="Type to filter columns..."
        />
      </div>
      
      <!-- Column Selection -->
      <div class="column-selection mb-3">
        <label>Select Columns for Visualization:</label>
        <div class="column-chips">
          <div 
            v-for="column in filteredColumns" 
            :key="column"
            :class="['column-chip', { 'selected': selectedColumns.includes(column) }]"
            @click="toggleColumn(column)"
          >
            {{ column }}
          </div>
        </div>
        <small class="form-text mt-2">
          <span v-if="selectedColumns.length === 0">Select columns to visualize data</span>
          <span v-else>Selected {{ selectedColumns.length }} column(s)</span>
        </small>
        <div v-if="selectedPreset !== 'custom'" class="mt-2 text-info">
          <i class="bi bi-info-circle"></i>
          Using preset: {{ visualizationPresets.find(p => p.value === selectedPreset)?.label }}
        </div>
      </div>
      
      <!-- Removed duplicate chart type selection -->
      
      <!-- Fetch and apply button -->
      <button 
        class="btn btn-success" 
        @click="fetchData" 
        :disabled="!canFetchData || loading"
      >
        <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
        <i v-else class="bi bi-graph-up me-2"></i>
        {{ dataLoaded ? 'Update Chart' : 'Generate Chart' }}
      </button>
    </div>
    
    <!-- Chart display area -->
    <div v-if="dataLoaded" class="chart-container">
      <div v-if="loading" class="chart-loading">
        <div class="spinner-border text-primary"></div>
        <p class="mt-2">Loading chart data...</p>
      </div>
      
      <div v-else>
        <!-- Table view of data -->
        <div v-if="chartType === 'table'" class="table-responsive">
          <table class="table table-sm table-hover">
            <thead>
              <tr>
                <th v-for="col in selectedColumns" :key="col">{{ col }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in csvData.slice(0, 100)" :key="index">
                <td v-for="col in selectedColumns" :key="col">{{ row[col] }}</td>
              </tr>
            </tbody>
          </table>
          <div v-if="csvData.length > 100" class="text-muted text-center mt-2">
            Showing first 100 rows of {{ csvData.length }} total
          </div>
        </div>
        
        <!-- Simple text message if no suitable visualization -->
        <div v-else-if="!canVisualize" class="alert alert-info">
          <i class="bi bi-info-circle me-2"></i>
          The selected columns cannot be visualized with the current chart type.
          Please select different columns or chart type.
        </div>
        
        <!-- Chart View -->
        <div v-else class="chart-container">
          <canvas ref="chartCanvas"></canvas>
        </div>
      </div>
    </div>
    
    <!-- No data selected message -->
    <div v-else-if="selectedFileId && !loading" class="alert alert-light text-center p-5">
      <i class="bi bi-file-earmark-bar-graph display-4 text-muted"></i>
      <h5 class="mt-3">No Data Visualized Yet</h5>
      <p class="text-muted">Select columns and click "Generate Chart" to visualize your data.</p>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export default {
  name: 'CsvDataVisualization',
  props: {
    selectedFileId: {
      type: [Number, String],
      default: null
    },
    dashboardMode: {
      type: Boolean,
      default: false
    }
  },
  beforeDestroy() {

    if (this.chart) {
      this.chart.destroy();
    }
  },
  data() {
    return {
      selectedColumns: [],
      dataLoaded: false,
      chartType: 'bar',
      availableChartTypes: [
        { label: 'Table', value: 'table' },
        { label: 'Bar Chart', value: 'bar' },
        { label: 'Line Chart', value: 'line' },
        { label: 'Scatter Plot', value: 'scatter' },
        { label: 'Pie Chart', value: 'pie' }
      ],
      visualizationPresets: [
        { label: 'Custom (Manual Selection)', value: 'custom' },
        { label: 'Crop Distribution', value: 'crop_distribution', columns: ['crop_type'] },
        { label: 'Growth Stage Distribution', value: 'growth_stage', columns: ['growth_stage'] },
        { label: 'Health Score Categories', value: 'health_score', columns: ['health_score'] },
        { label: 'Leaf Count vs Health Score', value: 'leaf_count_health', columns: ['leaf_count', 'health_score'] },
        { label: 'Growth Production', value: 'nethouse', columns: ['nethouse_id', 'nethouse id'] },
        { label: 'Growth Production Bar Chart', value: 'nethouse-bar', columns: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'] }
      ],
      selectedPreset: 'custom',
      filterValue: '',
      chart: null,
      localFileId: null
    };
  },
  computed: {
    ...mapGetters('crop', [
      'getCsvColumns',
      'getCsvColumnTypes', 
      'getCsvData', 
      'isLoading', 
      'getError'
    ]),
    
    // Filter columns based on search input
    filteredColumns() {
      if (!this.filterValue) {
        return this.availableColumns;
      }
      
      const lowerFilter = this.filterValue.toLowerCase();
      return this.availableColumns.filter(col => 
        col.toLowerCase().includes(lowerFilter)
      );
    },
    columnTypes() {
      return this.getCsvColumnTypes || {};
    },
    csvData() {
      return this.getCsvData || [];
    },
    loading() {
      return this.isLoading;
    },
    canFetchData() {
      return (this.localFileId || this.dashboardMode) && !this.loading;
    },
    canVisualize() {
      return this.dataLoaded && this.selectedColumns.length > 0;
    }
  },
  mounted() {
    if (this.selectedFileId) {
      this.localFileId = this.selectedFileId;
    }
    
    if (this.dashboardMode) {
        this.selectedPreset = 'nethouse-bar';
      this.chartType = 'bar';
      this.loadDashboardData();
    }
  },
  watch: {
    selectedFileId(newVal) {
      if (newVal) {
        this.localFileId = newVal;
        this.fetchData();
      }
    },
    localFileId(newVal) {
      if (newVal) {
        this.fetchData();
      }
    },
    selectedColumns: {
      handler() {
        if (this.selectedColumns.length > 0 && this.csvData.length > 0) {
          this.createChart();
        }
      },
      deep: true
    },
    chartType() {
      if (this.selectedColumns.length > 0 && this.csvData.length > 0) {
        this.createChart();
      }
    },
    selectedPreset() {
      this.applyPreset();
      this.fetchData();
    },
    csvData: {
      handler() {
        if (this.csvData.length > 0 && this.selectedColumns.length > 0) {
          this.$nextTick(() => {
            this.createChart();
          });
        }
      },
      deep: true
    }
  },
  methods: {
    ...mapActions('crop', ['fetchCsvFilePreview', 'fetchCsvData']),
    
    async loadDashboardData() {
      try {
        await this.$store.dispatch('crop/fetchCsvFiles');
        const csvFiles = this.$store.getters['crop/getCsvFiles'];
        
        if (csvFiles && csvFiles.length > 0) {
          const sortedFiles = [...csvFiles].sort((a, b) => {
            const dateA = new Date(a.created_at);
            const dateB = new Date(b.created_at);
            return dateB - dateA;
          });
          
          const latestFile = sortedFiles[0];
          this.localFileId = latestFile.id;
          
          await this.fetchColumnInfo();
          
          setTimeout(() => {
            this.applyPreset('nethouse-bar');
          }, 300);
        } else {
          console.log('No CSV files available for dashboard visualization');
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    },
    
    applyPreset(presetName) {
      if (presetName) {
        this.selectedPreset = presetName;
      }
      
      if (this.selectedPreset === 'custom') {
        this.selectedColumns = [];
        return;
      }
      
      const preset = this.visualizationPresets.find(p => p.value === this.selectedPreset);
      if (!preset || !preset.columns) return;
      
      const validColumns = preset.columns.filter(col => this.availableColumns.includes(col));
      this.selectedColumns = validColumns;
      
      switch(this.selectedPreset) {
        case 'crop_distribution':
        case 'growth_stage':
        case 'health_score':
          this.chartType = 'pie';
          break;
        case 'leaf_count_health':
          this.chartType = 'scatter';
          break;
        case 'nethouse-bar':
          this.chartType = 'bar';
          break;
        default:
          break;
      }
      
      if (validColumns.length > 0 && this.canFetchData) {
        this.fetchData();
      }
    },
    
    async fetchColumnInfo() {
      if (!this.localFileId) return;
      
      try {
        // Reset current selection
        this.selectedColumns = [];
        this.dataLoaded = false;
        
        // Fetch column information from the CSV file
        const result = await this.fetchCsvFilePreview(this.localFileId);
        
        // If sample_id column exists, pre-select it
        if (result.columns && result.columns.includes('sample_id')) {
          this.selectedColumns = ['sample_id'];
        }
      } catch (error) {
        console.error('Error fetching CSV column info:', error);
        this.$toast?.error('Failed to fetch CSV column information');
      }
    },
    
    toggleColumn(column) {
      const index = this.selectedColumns.indexOf(column);
      if (index === -1) {
        // Add column
        this.selectedColumns.push(column);
      } else {
        // Remove column
        this.selectedColumns.splice(index, 1);
      }
    },
    
    async fetchData() {
      if (this.canFetchData) {
        this.loading = true;
        try {
          await this.$store.dispatch('crop/fetchCsvData', { fileId: this.localFileId });
          await this.$store.dispatch('crop/fetchCsvColumns', { fileId: this.localFileId });
          this.dataLoaded = true;
        } catch (error) {
          console.error('Error fetching CSV data:', error);
        } finally {
          this.loading = false;
        }
      }
    },
    
    createChart() {
      // Destroy existing chart if it exists
      if (this.chart) {
        this.chart.destroy();
      }
      
      // Get the canvas element
      const canvas = this.$refs.chartCanvas;
      if (!canvas) return;
      
      // Handle based on chart type
      if (this.chartType === 'pie') {
        this.createPieChart(canvas);
        return;
      }
      
      // Get numeric columns for chart data (for non-pie charts)
      const numericColumns = this.selectedColumns.filter(col => 
        this.columnTypes[col] === 'numeric'
      );
      
      if (numericColumns.length === 0) {
        console.warn('No numeric columns found for chart visualization');
        return;
      }
      
      // Prepare data for the chart based on chart type
      const chartData = this.prepareChartData(numericColumns);
      
      // Default chart title
      let chartTitle = `CSV Data Visualization (${this.chartType})`;
      
      // Use specific titles based on preset
      if (this.selectedPreset !== 'custom') {
        const preset = this.visualizationPresets.find(p => p.value === this.selectedPreset);
        if (preset) {
          chartTitle = preset.label;
        }
      }
      
      // Create the chart with the selected type
      this.chart = new Chart(canvas, {
        type: this.chartType,
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: chartTitle,
              font: {
                size: 18
              }
            },
            tooltip: {
              mode: 'index',
              intersect: false
            },
            legend: {
              position: 'top'
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    },
    
    createPieChart(canvas) {
      // Make sure we have a column selected for the pie chart
      if (!this.selectedColumns.length) {
        console.error('No column selected for pie chart');
        return;
      }
      
      // Use the first selected column for the pie chart data
      const selectedColumn = this.selectedColumns[0];
      
      // Prepare pie chart data based on the selected column
      const chartData = this.preparePieChartData(selectedColumn);
      
      // Determine chart title based on preset or selected column
      let chartTitle = 'Distribution of ' + selectedColumn;
      if (this.selectedPreset !== 'custom') {
        const preset = this.visualizationPresets.find(p => p.value === this.selectedPreset);
        if (preset) {
          chartTitle = preset.label;
        }
      }
      
      // Create the pie chart
      this.chart = new Chart(canvas, {
        type: 'pie',
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right'
            },
            title: {
              display: true,
              text: chartTitle,
              font: { size: 16 }
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.label || '';
                  const value = context.raw || 0;
                  const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                  const percentage = Math.round((value * 100) / total) + '%';
                  return `${label}: ${value} (${percentage})`;
                }
              }
            }
          }
        }
      });
    },
    
    preparePieChartData(categoryColumn) {
      // Count occurrences of each category value
      const categoryCounts = {};
      this.csvData.forEach(row => {
        // For 'processed' column, convert to Yes/No instead of N/A
        let value;
        if (categoryColumn.toLowerCase().includes('process')) {
          // Convert any processed value to Yes/No - handle all cases
          if (row[categoryColumn] === true || row[categoryColumn] === 'true' || row[categoryColumn] === 1 || row[categoryColumn] === '1') {
            value = 'Yes';
          } else {
            value = 'No';
          }
        } else {
          value = row[categoryColumn] || 'N/A';
        }
        
        if (!categoryCounts[value]) {
          categoryCounts[value] = 0;
        }
        categoryCounts[value]++;
      });
      
      // Convert to labels and data arrays
      const labels = Object.keys(categoryCounts);
      const dataPoints = labels.map(label => categoryCounts[label]);
      
      // Generate background colors
      const backgroundColors = labels.map((_, index) => {
        const colorIndex = index % this.colorPalette.length;
        return this.colorPalette[colorIndex];
      });
      
      return {
        labels,
        datasets: [{
          data: dataPoints,
          backgroundColor: backgroundColors,
          borderWidth: 1
        }]
      };
    },
    
    prepareChartData(numericColumns) {
      const nonNumericColumns = this.selectedColumns.filter(col => 
        this.columnTypes[col] === 'string' || this.columnTypes[col] === 'date'
      );
      
      // Handle special case for bar chart showing nethouse_id count
      if (this.chartType === 'bar' && this.selectedPreset === 'nethouse') {
        return this.prepareNethouseBarData();
      }
      
      // Use the first non-numeric column as labels if available, otherwise use row indices
      let labels = [];
      if (nonNumericColumns.length > 0) {
        labels = this.csvData.map(row => row[nonNumericColumns[0]]);
      } else {
        labels = this.csvData.map((_, index) => `Row ${index + 1}`);
      }
      
      // Create datasets for each numeric column
      const datasets = numericColumns.map((column, index) => {
        // Generate random color with some opacity
        const colorIndex = index % this.colorPalette.length;
        const color = this.colorPalette[colorIndex];
        
        return {
          label: column,
          data: this.csvData.map(row => parseFloat(row[column]) || 0),
          backgroundColor: color.replace('1.0', '0.2'),
          borderColor: color,
          borderWidth: 1,
        };
      });
      
      return { labels, datasets };
    },
    
    prepareNethouseBarData() {
      const nethouseCountMap = {};
      
      this.csvData.forEach(row => {
        const nethouseId = row['Nethouse id'] || row['nethouse_id'] || row['nethouse id'];
        if (nethouseId) {
          if (!nethouseCountMap[nethouseId]) {
            nethouseCountMap[nethouseId] = 0;
          }
          nethouseCountMap[nethouseId]++;
        }
        
        this.selectedColumns.forEach(col => {
          if (col.length === 1 && col.match(/[A-Z]/i)) {
            const colIndex = col.toUpperCase().charCodeAt(0) - 64;
            if (colIndex >= 1 && colIndex <= 31) {
              const dayLabel = colIndex.toString();
              if (!nethouseCountMap[dayLabel]) {
                nethouseCountMap[dayLabel] = 0;
              }
              
              const cellValue = row[col];
              if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
                nethouseCountMap[dayLabel]++;
              }
            }
          }
        });
      });
      
      const labels = Object.keys(nethouseCountMap).sort((a, b) => {
        const aIsNumber = !isNaN(parseInt(a));
        const bIsNumber = !isNaN(parseInt(b));
        
        if (aIsNumber && bIsNumber) {
          return parseInt(a) - parseInt(b);
        } else if (aIsNumber) {
          return -1;
        } else if (bIsNumber) {
          return 1;
        } else {
          return a.localeCompare(b);
        }
      });
      
      const dataPoints = labels.map(label => nethouseCountMap[label]);
      
      return {
        labels: labels,
        datasets: [{
          label: 'Growth Production Data',
          data: dataPoints,
          backgroundColor: labels.map((_, i) => this.colorPalette[i % this.colorPalette.length].replace('1.0', '0.6')),
          borderColor: labels.map((_, i) => this.colorPalette[i % this.colorPalette.length]),
          borderWidth: 1,
        }]
      };
    }
  }
};
</script>

<style scoped>
.csv-data-visualization {
  padding: 20px;
}

.column-selection {
  margin-bottom: 15px;
}

.column-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.column-chip {
  padding: 6px 12px;
  background-color: #eee;
  border-radius: 16px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s ease;
}

.column-chip.selected {
  background-color: #007bff;
  color: white;
}

.column-chip.numeric {
  border-left: 3px solid #28a745;
}

.column-chip.string {
  border-left: 3px solid #fd7e14;
}

.column-chip.date {
  border-left: 3px solid #6610f2;
}

.preset-info {
  background-color: #f8f9fa;
  border-left: 4px solid #17a2b8;
  padding: 8px 12px;
  border-radius: 4px;
}

.chart-container {
  min-height: 300px;
  margin-top: 2rem;
  border: 1px solid #dee2e6;
  border-radius: 0.5rem;
  overflow: hidden;
}

.chart-placeholder {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-loading {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>

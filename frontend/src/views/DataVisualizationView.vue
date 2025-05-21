<template>
  <div class="visualization-view container py-4">
    <div class="mb-4">
      <button @click="$router.go(-1)" class="btn btn-sm btn-outline-secondary">
        <i class="bi bi-arrow-left me-1"></i> Back
      </button>
    </div>
    
    <h2 class="mb-4">Data Visualization</h2>
    
    <div class="alert alert-info mb-4">
      <div class="d-flex align-items-center">
        <i class="bi bi-info-circle-fill me-2 fs-4"></i>
        <div>
          <strong>Standardized Column Format</strong>
          <p class="mb-1">For best visualization results, your data should include these key columns:</p>
          <div class="d-flex flex-wrap gap-2 mb-2">
            <span v-for="col in standardRequiredColumns" :key="col.id" class="badge bg-primary">{{ col.name }}</span>
          </div>
          <button @click="downloadTemplate" class="btn btn-sm btn-outline-primary">
            <i class="bi bi-download me-1"></i> Download Template
          </button>
        </div>
      </div>
    </div>
    
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Loading your files...</p>
    </div>
    
    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>
    
    <div v-else-if="processedFiles.length === 0" class="alert alert-info">
      <div class="text-center">
        <i class="bi bi-file-earmark-x fs-1 mb-2"></i>
        <p>No processed files available. Process a file to see visualizations.</p>
      </div>
    </div>
    
    <div v-else class="row">
      <div v-for="file in processedFiles" :key="file.id" class="col-md-6 col-lg-4 mb-4">
        <div class="card h-100 shadow-sm">
          <div class="card-header bg-success text-white d-flex justify-content-between align-items-center">
            <div class="text-truncate" :title="file.title">{{ file.title }}</div>
            <span class="badge bg-light text-dark">{{ formatDate(file.processed_at) }}</span>
          </div>
          
          <div class="card-body">
            <div class="chart-preview">
              <canvas :ref="`chart-${file.id}`"></canvas>
            </div>
            
            <div class="mt-3 text-center">
              <router-link :to="`/files/${file.id}`" class="btn btn-outline-success btn-sm">
                <i class="bi bi-graph-up me-1"></i> View All Charts
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import { STANDARD_COLUMNS } from '@/utils/standardColumns';

export default {
  name: 'DataVisualizationView',
  data() {
    return {
      chartInstances: {},
      chartRenderTimeout: null,
      standardRequiredColumns: STANDARD_COLUMNS.filter(col => col.required)
    };
  },
  computed: {
    ...mapState(['files', 'loading', 'error']),
    processedFiles() {
      return this.files.filter(file => file.processed);
    }
  },
  mounted() {
    this.fetchFiles();
    // Give time for the DOM to load before attempting to render charts
    this.chartRenderTimeout = setTimeout(() => {
      this.renderCharts();
    }, 500);
  },
  
  updated() {
    // Wait for the DOM to be fully updated
    this.$nextTick(() => {
      this.renderCharts();
    });
  },
  beforeUnmount() {
    // Important: Clean up all chart instances before component is destroyed
    this.destroyAllCharts();
    // Cancel any pending chart renders
    if (this.chartRenderTimeout) {
      clearTimeout(this.chartRenderTimeout);
    }
  },
  methods: {
    ...mapActions(['fetchFiles']),
    
    downloadTemplate() {
      // Generate CSV content with headers from standard columns
      const headers = STANDARD_COLUMNS.map(col => col.name).join(',');
      const csvContent = 'data:text/csv;charset=utf-8,' + headers;
      
      // Create a download link and trigger it
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'aquagreen_data_template.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      this.$toast?.success('Template downloaded successfully');
    },
    
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString();
    },
    
    destroyAllCharts() {
      // Safely destroy all chart instances
      Object.values(this.chartInstances).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
          chart.destroy();
        }
      });
      this.chartInstances = {};
    },
    
    renderCharts() {
      // First destroy any existing charts
      this.destroyAllCharts();
      
      // Import Chart.js dynamically to avoid SSR issues
      import('chart.js/auto').then((Chart) => {
        // Make sure the component is still mounted
        if (!this.$refs) return;
        
        // Render charts for each file
        this.processedFiles.forEach(file => {
          const refName = `chart-${file.id}`;
          // Using $refs safely
          const elements = this.$refs[refName];
          
          // Check if the ref exists and is an array
          if (!elements || !elements.length) return;
          
          // Get the canvas element
          const canvas = elements[0];
          if (!canvas) return;
          
          // Ensure canvas has dimensions
          if (canvas.offsetWidth === 0 || canvas.offsetHeight === 0) return;
          
          // Fetch the processed data for this file
          this.$store.dispatch('fetchProcessedData', file.id)
            .then(data => {
              // Check if data is valid for visualization
              if (!data || !Array.isArray(data)) {
                if (data && data.error) {
                  // Show a placeholder instead of an error
                  this.renderEmptyChart(Chart.default, canvas, `File cannot be previewed: ${data.error}`);
                  this.$toast?.warning(`File "${file.title}": ${data.error}, please check file content again.`);
                }
                return;
              }
              
              if (data.length <= 1) {
                this.renderEmptyChart(Chart.default, canvas, "Not enough rows");
                this.$toast?.warning(`File "${file.title}" doesn't have enough data for visualization, please check file content again.`);
                return;
              }
              
              const keys = data[0] ? Object.keys(data[0]) : [];
              if (keys.length <= 1) {
                this.renderEmptyChart(Chart.default, canvas, "Not enough columns");
                this.$toast?.warning(`File "${file.title}" doesn't have enough columns for visualization, please check file content again.`);
                return;
              }
              
              // Create random data for preview or use actual data
              const chartLabels = data.slice(0, 5).map(row => row[keys[0]]);
              const chartData = data.slice(0, 5).map(row => {
                const val = row[keys[1]];
                return isNaN(val) ? Math.random() * 100 : parseFloat(val);
              });
              
              try {
                // Create the chart
                this.chartInstances[file.id] = new Chart.default(canvas, {
                  type: 'bar',
                  data: {
                    labels: chartLabels.length ? chartLabels : ['Cat 1', 'Cat 2', 'Cat 3', 'Cat 4', 'Cat 5'],
                    datasets: [{
                      label: keys[1] || 'Sample Data',
                      data: chartData.length ? chartData : [Math.random() * 100, Math.random() * 100, Math.random() * 100, Math.random() * 100, Math.random() * 100],
                      backgroundColor: '#198754'
                    }]
                  },
                  options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      },
                      title: {
                        display: true,
                        text: 'Preview'
                      }
                    }
                  }
                });
              } catch (error) {
                console.error('Error creating chart:', error);
                this.renderEmptyChart(Chart.default, canvas, "Error creating chart");
              }
            })
            .catch(error => {
              console.error(`Error fetching data for file ${file.id}:`, error);
              this.renderEmptyChart(Chart.default, canvas, "Cannot load data");
              if (error.response?.data?.error) {
                this.$toast?.error(`Error with file "${file.title}": ${error.response.data.error}, please check file content again.`);
              }
            });
        });
      }).catch(error => {
        console.error('Failed to load Chart.js:', error);
      });
    },
    
    renderEmptyChart(Chart, canvas, message) {
      try {
        // Create a placeholder chart with a message
        this.chartInstances[`empty-${Date.now()}`] = new Chart(canvas, {
          type: 'bar',
          data: {
            labels: [''],
            datasets: [{
              data: [0],
              backgroundColor: '#f8f9fa'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                display: false,
                beginAtZero: true
              },
              x: {
                display: false
              }
            },
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                enabled: false
              },
              title: {
                display: true,
                text: message || 'No data available',
                color: '#6c757d',
                font: {
                  size: 14
                }
              }
            }
          }
        });
      } catch (error) {
        console.error('Error creating empty chart:', error);
      }
    },
  }
};
</script>

<style scoped>
.chart-preview {
  height: 150px;
  width: 100%;
  position: relative;
}
</style>

<template>
  <div class="file-detail">
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Loading data...</p>
    </div>

    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>

    <div v-else-if="!currentFile" class="alert alert-warning">
      File not found. <router-link to="/files">Return to files list</router-link>.
    </div>

    <div v-else>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1>{{ currentFile.title }}</h1>
        <router-link to="/files" class="btn btn-outline-secondary">
          <i class="bi bi-arrow-left me-1"></i> Back to Files
        </router-link>
      </div>

      <div class="card mb-4">
        <div class="card-header bg-light d-flex justify-content-between align-items-center">
          <h5 class="card-title mb-0">File Information</h5>
          <div>
            <button @click="confirmDeleteFile" class="btn btn-sm btn-outline-danger ms-2">
              <i class="bi bi-trash"></i> Delete
            </button>
          </div>
          <span 
            :class="currentFile.processed ? 'badge bg-success' : 'badge bg-warning text-dark'"
          >
            {{ currentFile.processed ? 'Processed' : 'Pending' }}
          </span>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <ul class="list-group">
                <li class="list-group-item"><strong>File Name:</strong> {{ currentFile.title }}</li>
                <li class="list-group-item"><strong>Upload Date:</strong> {{ formatDate(currentFile.uploaded_at) }}</li>
                <li class="list-group-item"><strong>Uploaded By:</strong> {{ currentFile.uploaded_by?.username || 'Unknown' }}</li>
              </ul>
            </div>
            <div class="col-md-6">
              <ul class="list-group">
                <li class="list-group-item"><strong>File Size:</strong> {{ formatFileSize(currentFile.file_size_in_bytes) }}</li>
                <li class="list-group-item"><strong>File Type:</strong> {{ getFileExtension(currentFile.file) }}</li>
                <li class="list-group-item">
                  <div v-if="!currentFile.processed" class="d-grid gap-2">
                    <button 
                      class="btn btn-success"
                      @click="processFile(currentFile.id)"
                      :disabled="processingFile"
                    >
                      <span v-if="processingFile" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                      {{ processingFile ? 'Processing...' : 'Process File' }}
                    </button>
                  </div>
                  <div v-else>
                    <span class="text-success"><i class="bi bi-check-circle me-1"></i> Processed successfully</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Processing status and work in progress message -->
      <div v-if="showProcessingMessage && !currentFile.processed" class="alert alert-info mb-4">
        <div class="d-flex align-items-center">
          <div class="spinner-border spinner-border-sm text-info me-2" role="status"></div>
          <div>
            <strong>Work in progress:</strong> Processing your file. This may take a moment...
          </div>
        </div>
      </div>

      <!-- Processing result graph (simplified visualization) -->
      <div v-if="currentFile.processed" class="card mb-4">
        <div class="card-header bg-light">
          <h5 class="card-title mb-0">Data Analysis</h5>
        </div>
        <div class="card-body">
          <!-- Simple summary stats -->
          <div class="row mb-4">
            <div class="col-md-3 mb-3">
              <div class="card bg-success text-white h-100">
                <div class="card-body">
                  <h5 class="card-title">Rows</h5>
                  <h3>{{ processedData?.length || 0 }}</h3>
                </div>
              </div>
            </div>
            <div class="col-md-3 mb-3">
              <div class="card bg-info text-white h-100">
                <div class="card-body">
                  <h5 class="card-title">Columns</h5>
                  <h3>{{ processedData && processedData[0] ? Object.keys(processedData[0]).length : 0 }}</h3>
                </div>
              </div>
            </div>
            <div class="col-md-3 mb-3">
              <div class="card bg-warning text-dark h-100">
                <div class="card-body">
                  <h5 class="card-title">File Size</h5>
                  <h3>{{ formatFileSize(currentFile.file_size_in_bytes) }}</h3>
                </div>
              </div>
            </div>
            <div class="col-md-3 mb-3">
              <div class="card bg-primary text-white h-100">
                <div class="card-body">
                  <h5 class="card-title">Processed</h5>
                  <h3>{{ formatDate(currentFile.processed_at) || 'Yes' }}</h3>
                </div>
              </div>
            </div>
          </div>

          <!-- Bar chart for simple visualization -->
          <div class="row">
            <div class="col-md-6 mb-4">
              <canvas ref="barChart"></canvas>
            </div>
            <div class="col-md-6 mb-4">
              <canvas ref="pieChart"></canvas>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header bg-light d-flex justify-content-between align-items-center">
          <h5 class="card-title mb-0">Processed Data</h5>
          <div class="btn-group" role="group">
            <button class="btn btn-sm btn-outline-primary" @click="refreshData">
              <i class="bi bi-arrow-clockwise me-1"></i> Refresh
            </button>
          </div>
        </div>
        <div class="card-body">
          <div v-if="!currentFile.processed && !processedData" class="alert alert-warning">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            This file has not been processed yet. Click "Process File" above to extract the data.
          </div>
          
          <div v-else-if="!processedData || processedData.length === 0" class="alert alert-info">
            <i class="bi bi-info-circle-fill me-2"></i>
            No processed data available for this file.
          </div>
          
          <div v-else>
            <!-- Excel Viewer -->
            <excel-viewer 
              :data="processedData" 
              @export-csv="exportCSV"
            />
            
            <!-- Data Visualization Section -->
            <div class="mt-4">
              <h5 class="mb-3">Data Visualization</h5>
              
              <div class="row">
                <!-- Soil Metrics Charts -->
                <div class="col-md-6 mb-4">
                  <chart-container
                    v-if="soilMetricsData.datasets.length > 0"
                    title="Soil Metrics Comparison"
                    :chart-data="soilMetricsData"
                    :options="barChartOptions"
                    description="Comparison of soil pH, moisture, temperature and EC"
                    initial-chart-type="bar"
                  />
                </div>
                
                <!-- Plant Health Chart -->
                <div class="col-md-6 mb-4">
                  <chart-container
                    v-if="plantHealthData.datasets.length > 0"
                    title="Plant Health Metrics"
                    :chart-data="plantHealthData"
                    :options="lineChartOptions"
                    description="Death plants count over time"
                  />
                </div>
                
                <!-- Financial Overview -->
                <div class="col-md-6 mb-4">
                  <chart-container
                    v-if="financialData.labels.length > 0"
                    title="Financial Overview"
                    :chart-data="financialData"
                    :options="pieChartOptions"
                    description="Income vs Expenses breakdown"
                    initial-chart-type="pie"
                  />
                </div>
                
                <!-- Soil pH Distribution -->
                <div class="col-md-6 mb-4">
                  <chart-container
                    v-if="soilPhDistributionData.labels.length > 0"
                    title="Soil pH Distribution"
                    :chart-data="soilPhDistributionData"
                    :options="pieChartOptions"
                    description="Distribution of soil pH levels"
                    initial-chart-type="pie"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import ExcelViewer from '@/components/ExcelViewer.vue'

export default {
  name: 'FileDetailView',
  components: {
    ChartContainer,
    ExcelViewer
  },
  // Remove props and use route params directly
  data() {
    return {
      processingFile: false,
      showProcessingMessage: false,
      barChartOptions: {
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Value'
            }
          }
        },
        plugins: {
          legend: {
            position: 'top'
          }
        }
      },
      lineChartOptions: {
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Count'
            }
          }
        }
      },
      pieChartOptions: {
        plugins: {
          legend: {
            position: 'right'
          }
        }
      },
      // Sample financial data - this would typically come from your backend
      financialSummary: {
        income: 12500,
        expenses: 7800,
        categories: {
          income: {
            'Crop Sales': 9500,
            'Equipment Rental': 2000,
            'Subsidies': 1000
          },
          expenses: {
            'Seeds': 1200,
            'Fertilizer': 2500,
            'Labor': 3000,
            'Equipment': 1100
          }
        }
      },
      barChartInstance: null,
      pieChartInstance: null,
      pollingInterval: null
    }
  },
  computed: {
    ...mapState(['currentFile', 'processedData', 'loading', 'error']),
    
    // Soil metrics chart data
    soilMetricsData() {
      if (!this.processedData || !this.processedData.length) return { labels: [], datasets: [] };
      
      // Get record numbers for labels
      const labels = this.processedData.map(item => `Record ${item.record_no || ''}`).slice(0, 10);
      
      // Extract soil metrics data
      const soilPhData = this.processedData.map(item => parseFloat(item.soil_ph || 0)).slice(0, 10);
      const soilMoistureData = this.processedData.map(item => parseFloat(item.soil_moisture || 0)).slice(0, 10);
      const soilTempData = this.processedData.map(item => parseFloat(item.soil_temp || 0)).slice(0, 10);
      const soilEcData = this.processedData.map(item => parseFloat(item.soil_ec || 0) * 100).slice(0, 10); // Scale EC for visibility
      
      return {
        labels: labels,
        datasets: [
          {
            label: 'Soil pH',
            data: soilPhData,
            backgroundColor: 'rgba(255, 99, 132, 0.7)',
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 1
          },
          {
            label: 'Soil Moisture',
            data: soilMoistureData,
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgb(54, 162, 235)',
            borderWidth: 1
          },
          {
            label: 'Soil Temp',
            data: soilTempData,
            backgroundColor: 'rgba(255, 206, 86, 0.7)',
            borderColor: 'rgb(255, 206, 86)',
            borderWidth: 1
          },
          {
            label: 'Soil EC (x100)',
            data: soilEcData,
            backgroundColor: 'rgba(75, 192, 192, 0.7)',
            borderColor: 'rgb(75, 192, 192)',
            borderWidth: 1
          }
        ]
      };
    },
    
    // Plant health data
    plantHealthData() {
      if (!this.processedData || !this.processedData.length) return { labels: [], datasets: [] };
      
      // Get dates for labels
      const labels = this.processedData.map(item => item.date || '');
      
      // Extract plant health data
      const deathPlantsData = this.processedData.map(item => parseInt(item.death_plants || 0));
      
      return {
        labels: labels,
        datasets: [
          {
            label: 'Death Plants',
            data: deathPlantsData,
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderWidth: 2,
            tension: 0.2,
            fill: true
          }
        ]
      };
    },
    
    // Financial data for income/expense tracking
    financialData() {
      // This would typically come from your backend
      // Using sample data for now
      return {
        labels: ['Income', 'Expenses'],
        datasets: [
          {
            data: [this.financialSummary.income, this.financialSummary.expenses],
            backgroundColor: [
              'rgba(75, 192, 192, 0.7)',
              'rgba(255, 99, 132, 0.7)'
            ],
            borderColor: [
              'rgb(75, 192, 192)',
              'rgb(255, 99, 132)'
            ],
            borderWidth: 1
          }
        ]
      };
    },
    
    // Soil pH distribution data
    soilPhDistributionData() {
      if (!this.processedData || !this.processedData.length) return { labels: [], datasets: [] };
      
      // Count occurrences of different pH ranges
      const phRanges = {
        'Very Acidic (<5.5)': 0,
        'Acidic (5.5-6.5)': 0,
        'Neutral (6.5-7.5)': 0,
        'Alkaline (>7.5)': 0
      };
      
      this.processedData.forEach(item => {
        const ph = parseFloat(item.soil_ph || 0);
        if (ph < 5.5) {
          phRanges['Very Acidic (<5.5)']++;
        } else if (ph >= 5.5 && ph < 6.5) {
          phRanges['Acidic (5.5-6.5)']++;
        } else if (ph >= 6.5 && ph < 7.5) {
          phRanges['Neutral (6.5-7.5)']++;
        } else if (ph >= 7.5) {
          phRanges['Alkaline (>7.5)']++;
        }
      });
      
      return {
        labels: Object.keys(phRanges),
        datasets: [
          {
            data: Object.values(phRanges),
            backgroundColor: [
              'rgba(255, 99, 132, 0.7)',
              'rgba(255, 206, 86, 0.7)',
              'rgba(75, 192, 192, 0.7)',
              'rgba(153, 102, 255, 0.7)'
            ],
            borderColor: [
              'rgb(255, 99, 132)',
              'rgb(255, 206, 86)',
              'rgb(75, 192, 192)',
              'rgb(153, 102, 255)'
            ],
            borderWidth: 1
          }
        ]
      };
    }
  },
  mounted() {
    this.fetchFileData()
    this.startDataPolling()
  },
  beforeUnmount() {
    this.stopDataPolling()
  },
  methods: {
    ...mapActions(['fetchFile', 'fetchProcessedData', 'processFile', 'deleteFile']),
    async fetchFileData() {
      // Get ID from route params
      const fileId = this.$route.params.id;
      
      // Validate ID before making API calls
      if (!fileId || fileId === 'undefined' || fileId === 'null') {
        console.error('Invalid file ID:', fileId);
        this.$toast.error('Invalid file ID');
        this.$router.push('/files');
        return;
      }
      
      console.log('Fetching file data for ID:', fileId);
      
      try {
        // Show loading indicator
        this.$store.commit('setLoading', true);
        
        // First fetch basic file information
        await this.$store.dispatch('fetchFile', fileId);
        
        // Only fetch processed data if file is marked as processed
        if (this.currentFile && this.currentFile.processed) {
          try {
            await this.$store.dispatch('fetchProcessedData', fileId);
            
            // Only attempt to generate charts if we have data
            if (this.processedData && this.processedData.length > 0) {
              // Small delay to ensure DOM is updated before chart generation
              setTimeout(() => {
                this.generateDummyCharts();
              }, 200);
            }
          } catch (processedDataError) {
            console.error('Error fetching processed data:', processedDataError);
            this.$toast.error('Could not load processed data');
          }
        }
      } catch (error) {
        console.error('Error fetching file data:', error);
        this.$toast.error(`Error loading file: ${error.response?.data?.error || error.message || 'Unknown error'}`);
      } finally {
        // Always ensure loading state is cleared
        this.$store.commit('setLoading', false);
      }
    },
    startDataPolling() {
      // For newly uploaded files, poll for data availability a few times
      const fileId = this.$route.params.id;
      
      // Only poll if we have a valid file ID and no polling is active
      if (fileId && !this.pollingInterval) {
        let attempts = 0;
        
        this.pollingInterval = setInterval(() => {
          // Stop polling after 5 attempts or if data is loaded
          if (attempts >= 5 || (this.currentFile && this.processedData && this.processedData.length > 0)) {
            this.stopDataPolling();
            return;
          }
          
          console.log('Polling for data, attempt:', attempts + 1);
          this.fetchFileData();
          attempts++;
        }, 2000); // Poll every 2 seconds
      }
    },
    stopDataPolling() {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
    },
    refreshData() {
      this.fetchFileData()
    },
    async processFile(fileId) {
      if (!fileId) {
        fileId = this.currentFile?.id;
      }
      
      if (!fileId) {
        this.$toast?.error('No file selected for processing');
        return;
      }
      
      try {
        // Show processing indicator
        this.$store.commit('setLoading', true);
        this.$toast?.info('Processing file, please wait...');
        
        // Process the file through the API
        const response = await this.$store.dispatch('processFile', fileId);
        this.$toast?.success('File processed successfully');
        
        // Wait for the next tick to ensure UI is updated
        await this.$nextTick();
        
        // Fetch updated file data including processed status
        try {
          await this.$store.dispatch('fetchFile', fileId);
          
          // Only fetch processed data if file is marked as processed
          if (this.currentFile && this.currentFile.processed) {
            // Add a small delay to ensure backend processing is complete
            setTimeout(async () => {
              try {
                await this.$store.dispatch('fetchProcessedData', fileId);
                
                // Only generate charts if we have data
                if (this.processedData && this.processedData.length > 0) {
                  this.generateDummyCharts();
                } else {
                  console.warn('No processed data available for charts');
                }
              } catch (dataError) {
                console.error('Error fetching processed data:', dataError);
                this.$toast?.error('Could not load processed data. Please try again.');
              } finally {
                this.$store.commit('setLoading', false);
              }
            }, 1000);
          } else {
            this.$store.commit('setLoading', false);
            console.warn('File is not marked as processed');
          }
        } catch (fetchError) {
          this.$store.commit('setLoading', false);
          console.error('Error fetching updated file data:', fetchError);
          this.$toast?.error('Error refreshing file data');
        }
        
        return response;
      } catch (error) {
        this.$store.commit('setLoading', false);
        this.$toast?.error(`Error processing file: ${error.response?.data?.error || error.message || 'Unknown error'}`);
        console.error('Error processing file:', error);
      } finally {
        // Keep the processing message visible for a moment
        setTimeout(() => {
          this.showProcessingMessage = false;
          this.processingFile = false;
        }, 1500);
      }
    },
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    },
    formatFileSize(bytes) {
      if (!bytes || bytes === 0) return 'Empty file (0 Bytes)';
      
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      
      return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
    },
    formatColumnName(key) {
      if (!key) return ''
      
      // Convert snake_case or camelCase to Title Case
      return key
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim()
    },
    getFileExtension(file) {
      if (!file) return ''
      
      const parts = file.split('.')
      return parts[parts.length - 1].toUpperCase()
    },
    exportCSV() {
      if (!this.processedData || this.processedData.length === 0) {
        this.$toast.error('No data to export')
        return
      }
      
      // Get all unique keys from all objects
      const allKeys = this.processedData.reduce((keys, item) => {
        Object.keys(item).forEach(key => {
          if (!keys.includes(key)) {
            keys.push(key)
          }
        })
        return keys
      }, [])
      
      // Create CSV header row
      let csv = allKeys.map(key => `"${this.formatColumnName(key)}"`).join(',') + '\n'
      
      // Add data rows
      this.processedData.forEach(item => {
        const row = allKeys.map(key => {
          const value = item[key] !== undefined ? item[key] : ''
          return `"${value}"`
        }).join(',')
        csv += row + '\n'
      })
      
      // Create download link
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `${this.currentFile?.title || 'data'}_export.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },
    generateDummyCharts() {
      // Import Chart.js dynamically to avoid SSR issues
      import('chart.js').then((ChartModule) => {
        // Wait for the next tick to ensure DOM is updated
        this.$nextTick(() => {
          try {
            // Get the correct Chart constructor from the module
            // Handle different module formats (ESM vs CommonJS)
            const Chart = ChartModule.Chart || ChartModule.default || ChartModule;

            // Create bar chart
            if (this.$refs.barChart) {
              // Destroy existing chart instance if it exists
              if (this.barChartInstance && typeof this.barChartInstance.destroy === 'function') {
                this.barChartInstance.destroy();
              }
              
              // Generate dummy data based on the first few columns of processed data
              const labels = [];
              const data = [];
              
              if (this.processedData && this.processedData.length > 0) {
                // Get first 5 rows for sample data
                const sampleData = this.processedData.slice(0, 5);
                const keys = Object.keys(sampleData[0]).slice(0, 5); // First 5 fields
                
                // Use first column as labels (often dates, IDs, etc)
                sampleData.forEach(row => {
                  labels.push(row[keys[0]]);
                });
                
                // Use second column as data values if it's numeric
                sampleData.forEach(row => {
                  const val = row[keys[1]];
                  data.push(isNaN(val) ? Math.floor(Math.random() * 100) : parseFloat(val));
                });
              } else {
                // If no data, use dummy values
                labels.push('Sample 1', 'Sample 2', 'Sample 3', 'Sample 4', 'Sample 5');
                data.push(65, 59, 80, 81, 56);
              }

              // Ensure the canvas element exists and has dimensions
              const barCanvas = this.$refs.barChart;
              if (!barCanvas || barCanvas.offsetWidth === 0 || barCanvas.offsetHeight === 0) {
                console.warn('Bar chart canvas not properly initialized');
                return;
              }
              
              // Make sure we have a valid 2D context before creating the chart
              const ctx = barCanvas.getContext('2d');
              if (!ctx) {
                console.warn('Failed to get 2D context from bar chart canvas');
                return;
              }
              
              // Create the chart
              this.barChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                  labels: labels,
                  datasets: [{
                    label: 'Sample Data',
                    data: data,
                    backgroundColor: '#198754',
                    borderColor: '#157347',
                    borderWidth: 1
                  }]
                },
                options: this.barChartOptions
              });
            }
            
            // Create pie chart with similar safety checks
            if (this.$refs.pieChart) {
              // Destroy existing chart instance if it exists
              if (this.pieChartInstance && typeof this.pieChartInstance.destroy === 'function') {
                this.pieChartInstance.destroy();
              }
              
              // Ensure the canvas element exists and has dimensions
              const pieCanvas = this.$refs.pieChart;
              if (!pieCanvas || pieCanvas.offsetWidth === 0 || pieCanvas.offsetHeight === 0) {
                console.warn('Pie chart canvas not properly initialized');
                return;
              }
              
              // Make sure we have a valid 2D context before creating the chart
              const ctx = pieCanvas.getContext('2d');
              if (!ctx) {
                console.warn('Failed to get 2D context from pie chart canvas');
                return;
              }
              
              // Generate dummy data for pie chart
              let pieLabels = [];
              let pieData = [];
              
              if (this.processedData && this.processedData.length > 0) {
                // Get unique values from third column if available
                const keys = Object.keys(this.processedData[0]);
                if (keys.length >= 3) {
                  const categoryField = keys[2];
                  const categories = {};
                  
                  // Count occurrences of each category
                  this.processedData.forEach(row => {
                    const category = row[categoryField] || 'Unknown';
                    categories[category] = (categories[category] || 0) + 1;
                  });
                  
                  // Convert to arrays for chart
                  pieLabels = Object.keys(categories);
                  pieData = Object.values(categories);
                } else {
                  // Fallback to dummy categories
                  pieLabels = ['Category A', 'Category B', 'Category C'];
                  pieData = [300, 50, 100];
                }
              } else {
                // If no data, use dummy values
                pieLabels = ['Red', 'Blue', 'Yellow', 'Green', 'Purple'];
                pieData = [12, 19, 3, 5, 2];
              }
              
              // Random colors for pie segments
              const backgroundColors = pieLabels.map(() => {
                return `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.7)`;
              });
              
              // Create the chart
              this.pieChartInstance = new Chart(ctx, {
                type: 'pie',
                data: {
                  labels: pieLabels,
                  datasets: [{
                    data: pieData,
                    backgroundColor: backgroundColors,
                    borderWidth: 1
                  }]
                },
                options: this.pieChartOptions
              });
            }
          } catch (error) {
            console.error('Error creating charts:', error);
          }
        });
      }).catch(error => {
        console.error('Failed to load Chart.js:', error);
      });
    },
    confirmDeleteFile() {
      if (confirm(`Are you sure you want to delete the file "${this.currentFile.title}"?`)) {
        this.deleteFile();
      }
    },
    async deleteFile() {
      try {
        await this.$store.dispatch('deleteFile', this.currentFile.id);
        this.$toast?.success('File deleted successfully');
        this.$router.push('/files'); // Navigate back to files list
      } catch (error) {
        this.$toast?.error(`Error deleting file: ${error.response?.data?.error || 'Unknown error'}`);
        console.error('Error deleting file:', error);
      }
    }
  }
}
</script>

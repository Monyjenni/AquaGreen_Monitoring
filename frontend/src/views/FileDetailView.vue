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
      <div class="mb-4">
        <router-link to="/files" class="btn btn-sm btn-outline-secondary">
          <i class="bi bi-arrow-left me-1"></i> Back to Files
        </router-link>
        <h1 class="mt-3">{{ currentFile.title }}</h1>
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
                  <h3>{{ currentFile.processed ? 'Yes' : 'No' }}</h3>
                </div>
              </div>
            </div>
          </div>

          <!-- Bar chart for simple visualization -->
          <div class="row">
            <div class="col-md-12 mb-4">
              <h5>Growth Production</h5>
              <canvas ref="barChart"></canvas>
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
                <!-- Crop Growth Metrics -->
                <div class="col-md-6 mb-4">
                  <chart-container
                    v-if="cropGrowthData.datasets.length > 0"
                    title="Crop Growth Metrics"
                    :chart-data="cropGrowthData"
                    :options="barChartOptions"
                    description="Comparison of Height and Width by Crop"
                    initial-chart-type="bar"
                    :showControls="true"
                  />
                </div>
                
                <!-- Health Indicators Chart -->
                <div class="col-md-6 mb-4">
                  <chart-container
                    v-if="healthIndicatorsData.datasets.length > 0"
                    title="Health Indicators"
                    :chart-data="healthIndicatorsData"
                    :options="lineChartOptions"
                    description="NDVI and Health Score over time"
                    initial-chart-type="line"
                    :showControls="true"
                  />
                </div>
                
                <!-- Crop Distribution -->
                <div class="col-md-6 mb-4">
                  <chart-container
                    v-if="cropDistributionData.labels.length > 0"
                    title="Crop Distribution"
                    :chart-data="cropDistributionData"
                    :options="pieChartOptions"
                    description="Distribution of crops in dataset"
                    initial-chart-type="pie"
                    :showControls="true"
                  />
                </div>
                
                <!-- Growth Stage Distribution -->
                <div class="col-md-6 mb-4">
                  <chart-container
                    v-if="growthStageData.labels.length > 0"
                    title="Growth Stage Distribution"
                    :chart-data="growthStageData"
                    :options="pieChartOptions"
                    description="Distribution of plant growth stages"
                    initial-chart-type="pie"
                    :showControls="true"
                  />
                </div>

                <!-- Health Score Categories -->
                <div class="col-md-6 mb-4">
                  <chart-container
                    v-if="healthCategoriesData.labels.length > 0"
                    title="Health Score Categories"
                    :chart-data="healthCategoriesData"
                    :options="pieChartOptions"
                    description="Distribution of plants by health score"
                    initial-chart-type="pie"
                    :showControls="true"
                  />
                </div>
                
                <!-- Leaf Count vs Health Score -->
                <div class="col-md-6 mb-4">
                  <chart-container
                    v-if="leafHealthData.datasets.length > 0"
                    title="Leaf Count vs Health Score"
                    :chart-data="leafHealthData"
                    :options="scatterChartOptions"
                    description="Correlation between leaf count and health score"
                    initial-chart-type="scatter"
                    :showControls="true"
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
              text: 'NDVI'
            },
            position: 'left'
          },
          y1: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Health Score'
            },
            position: 'right',
            grid: {
              drawOnChartArea: false
            }
          },
          y2: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Chlorophyll Index'
            },
            position: 'right',
            grid: {
              drawOnChartArea: false
            }
          }
        }
      },
      scatterChartOptions: {
        scales: {
          x: {
            title: {
              display: true,
              text: 'Leaf Count'
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Health Score'
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return `Leaf Count: ${context.parsed.x}, Health Score: ${context.parsed.y}`;
              }
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
    
    // Crop Growth Metrics chart data
    cropGrowthData() {
      if (!this.processedData || !this.processedData.length) return { labels: [], datasets: [] };
      
      // Group data by crop type
      const cropGroups = {};
      this.processedData.forEach(item => {
        const cropType = item.Crop || 'Unknown';
        if (!cropGroups[cropType]) {
          cropGroups[cropType] = { 
            heights: [], 
            widths: [] 
          };
        }
        
        // Extract height and width data based on the Excel column names
        if (item['Height (cm)']) cropGroups[cropType].heights.push(parseFloat(item['Height (cm)']));
        if (item['Width (cm)']) cropGroups[cropType].widths.push(parseFloat(item['Width (cm)']));
      });
      
      // Prepare labels and datasets
      const labels = Object.keys(cropGroups);
      const heightData = [];
      const widthData = [];
      
      labels.forEach(crop => {
        const heights = cropGroups[crop].heights;
        const widths = cropGroups[crop].widths;
        
        // Calculate averages
        heightData.push(heights.length ? 
          heights.reduce((sum, val) => sum + val, 0) / heights.length : 0);
        widthData.push(widths.length ? 
          widths.reduce((sum, val) => sum + val, 0) / widths.length : 0);
      });
      
      return {
        labels: labels,
        datasets: [
          {
            label: 'Average Height (cm)',
            data: heightData,
            backgroundColor: 'rgba(75, 192, 192, 0.7)',
            borderColor: 'rgb(75, 192, 192)',
            borderWidth: 1
          },
          {
            label: 'Average Width (cm)',
            data: widthData,
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgb(54, 162, 235)',
            borderWidth: 1
          }
        ]
      };
    },
    
    // Health indicators chart data
    healthIndicatorsData() {
      if (!this.processedData || !this.processedData.length) return { labels: [], datasets: [] };
      
      // Sort by date if available
      const sortedData = [...this.processedData];
      if (sortedData[0]['Measurement Date']) {
        sortedData.sort((a, b) => new Date(a['Measurement Date']) - new Date(b['Measurement Date']));
      }
      
      // Get dates for labels, limit to a reasonable number of points
      const maxPoints = 15;
      const step = Math.max(1, Math.floor(sortedData.length / maxPoints));
      const filteredData = sortedData.filter((_, index) => index % step === 0);
      
      const labels = filteredData.map(item => item['Measurement Date'] || `Plot ${item['Plot ID'] || ''}`);
      
      // Extract health indicator data
      const ndviData = filteredData.map(item => parseFloat(item['NDVI'] || 0));
      const healthScoreData = filteredData.map(item => parseFloat(item['Health Score'] || 0));
      const chlorophyllData = filteredData.map(item => parseFloat(item['Chlorophyll Index'] || 0));
      
      return {
        labels: labels,
        datasets: [
          {
            label: 'NDVI',
            data: ndviData,
            borderColor: 'rgb(54, 162, 235)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderWidth: 2,
            tension: 0.2,
            fill: true,
            yAxisID: 'y'
          },
          {
            label: 'Health Score',
            data: healthScoreData,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderWidth: 2,
            tension: 0.2,
            fill: true,
            yAxisID: 'y1'
          },
          {
            label: 'Chlorophyll Index',
            data: chlorophyllData,
            borderColor: 'rgb(153, 102, 255)',
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            borderWidth: 2,
            tension: 0.2,
            fill: true,
            yAxisID: 'y2'
          }
        ]
      };
    },
    
    // Crop distribution data
    cropDistributionData() {
      if (!this.processedData || !this.processedData.length) return { labels: [], datasets: [] };
      
      // Count occurrences of different crop types
      const cropCounts = {};
      
      this.processedData.forEach(item => {
        const cropType = item.Crop || 'Unknown';
        cropCounts[cropType] = (cropCounts[cropType] || 0) + 1;
      });
      
      return {
        labels: Object.keys(cropCounts),
        datasets: [
          {
            data: Object.values(cropCounts),
            backgroundColor: [
              'rgba(255, 99, 132, 0.7)',
              'rgba(54, 162, 235, 0.7)',
              'rgba(255, 206, 86, 0.7)',
              'rgba(75, 192, 192, 0.7)',
              'rgba(153, 102, 255, 0.7)',
              'rgba(255, 159, 64, 0.7)'
            ],
            borderColor: [
              'rgb(255, 99, 132)',
              'rgb(54, 162, 235)',
              'rgb(255, 206, 86)',
              'rgb(75, 192, 192)',
              'rgb(153, 102, 255)',
              'rgb(255, 159, 64)'
            ],
            borderWidth: 1
          }
        ]
      };
    },
    
    // Growth Stage distribution data
    growthStageData() {
      if (!this.processedData || !this.processedData.length) return { labels: [], datasets: [] };
      
      // Count occurrences of different growth stages
      const stageCounts = {};
      
      this.processedData.forEach(item => {
        const growthStage = item['Growth Stage'] || 'Unknown';
        stageCounts[growthStage] = (stageCounts[growthStage] || 0) + 1;
      });
      
      return {
        labels: Object.keys(stageCounts),
        datasets: [
          {
            data: Object.values(stageCounts),
            backgroundColor: [
              'rgba(75, 192, 192, 0.7)',  // Teal
              'rgba(153, 102, 255, 0.7)', // Purple
              'rgba(255, 205, 86, 0.7)',  // Yellow
              'rgba(54, 162, 235, 0.7)',  // Blue
              'rgba(255, 99, 132, 0.7)',  // Pink
              'rgba(201, 203, 207, 0.7)'  // Grey
            ],
            borderColor: [
              'rgb(75, 192, 192)',
              'rgb(153, 102, 255)',
              'rgb(255, 205, 86)',
              'rgb(54, 162, 235)',
              'rgb(255, 99, 132)',
              'rgb(201, 203, 207)'
            ],
            borderWidth: 1
          }
        ]
      };
    },
    
    // Health Score Categories data
    healthCategoriesData() {
      if (!this.processedData || !this.processedData.length) return { labels: [], datasets: [] };
      
      // Define health score categories
      const categories = {
        'Excellent (90-100)': 0,
        'Good (75-89)': 0,
        'Fair (60-74)': 0,
        'Poor (40-59)': 0,
        'Critical (<40)': 0
      };
      
      // Count occurrences of different health score categories
      this.processedData.forEach(item => {
        const healthScore = parseFloat(item['Health Score'] || 0);
        
        if (healthScore >= 90) {
          categories['Excellent (90-100)']++;
        } else if (healthScore >= 75) {
          categories['Good (75-89)']++;
        } else if (healthScore >= 60) {
          categories['Fair (60-74)']++;
        } else if (healthScore >= 40) {
          categories['Poor (40-59)']++;
        } else {
          categories['Critical (<40)']++;
        }
      });
      
      return {
        labels: Object.keys(categories),
        datasets: [
          {
            data: Object.values(categories),
            backgroundColor: [
              'rgba(75, 192, 192, 0.7)',   // Teal - Excellent
              'rgba(54, 162, 235, 0.7)',   // Blue - Good
              'rgba(255, 205, 86, 0.7)',   // Yellow - Fair
              'rgba(255, 159, 64, 0.7)',   // Orange - Poor
              'rgba(255, 99, 132, 0.7)'    // Red - Critical
            ],
            borderColor: [
              'rgb(75, 192, 192)',
              'rgb(54, 162, 235)',
              'rgb(255, 205, 86)',
              'rgb(255, 159, 64)',
              'rgb(255, 99, 132)'
            ],
            borderWidth: 1
          }
        ]
      };
    },
    
    // Leaf Count vs Health Score scatter plot
    leafHealthData() {
      if (!this.processedData || !this.processedData.length) return { labels: [], datasets: [] };
      
      // Extract data points for the scatter plot
      const dataPoints = this.processedData
        .filter(item => item['Leaf Count'] && item['Health Score'])
        .map(item => ({
          x: parseFloat(item['Leaf Count']),
          y: parseFloat(item['Health Score'])
        }));
      
      return {
        labels: [],  // Scatter plots don't need labels
        datasets: [
          {
            label: 'Leaf Count vs Health Score',
            data: dataPoints,
            backgroundColor: 'rgba(75, 192, 192, 0.7)',
            borderColor: 'rgb(75, 192, 192)',
            pointRadius: 5,
            pointHoverRadius: 8
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
                    label: 'Growth Production',
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

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

      <div v-if="showProcessingMessage && !currentFile.processed" class="alert alert-info mb-4">
        <div class="d-flex align-items-center">
          <div class="spinner-border spinner-border-sm text-info me-2" role="status"></div>
          <div>
            <strong>Work in progress:</strong> Processing your file. This may take a moment...
          </div>
        </div>
      </div>

      <div v-if="currentFile.processed" class="card mb-4">
        <div class="card-header bg-light">
          <h5 class="card-title mb-0">Data Analysis</h5>
        </div>
        <div class="card-body">

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

          <div class="row">
            <div class="col-md-12 mb-4">
              <h5>Nethouse ID Frequency</h5>
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

            <excel-viewer 
              :data="processedData" 
              @export-csv="exportCSV"
            />

            <div class="mt-4">
              <h5 class="mb-3">Data Visualization</h5>

              <h5 class="mb-3 mt-4">Advanced Nethouse Analytics</h5>
              <div class="row">

                <div class="col-md-6 mb-4">
                  <chart-container
                    v-if="nethousePerformanceData.datasets.length > 0"
                    title="Nethouse ID Performance Comparison"
                    :chart-data="nethousePerformanceData"
                    :options="barChartOptions"
                    description="Average performance metrics by Nethouse ID"
                    initial-chart-type="bar"
                    :showControls="true"
                    :allowedChartTypes="['bar', 'line']"
                  />
                </div>

                <div class="col-md-6 mb-4">
                  <chart-container
                    v-if="environmentalVsGrowthData.datasets.length > 0"
                    title="Environmental Conditions vs. Growth"
                    :chart-data="environmentalVsGrowthData"
                    :options="scatterChartOptions"
                    description="Relationship between environmental factors and growth"
                    initial-chart-type="scatter"
                    :showControls="true"
                    :allowedChartTypes="['scatter', 'line']"
                  />
                </div>

                <div class="col-md-6 mb-4">
                  <chart-container
                    v-if="resourceEfficiencyData.datasets.length > 0"
                    title="Resource Efficiency by Nethouse"
                    :chart-data="resourceEfficiencyData"
                    :options="{
                      plugins: {
                        legend: { position: 'bottom' },
                        tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${context.raw.toFixed(1)}%` } }
                      },
                      scales: {
                        r: {
                          min: 0,
                          max: 100,
                          ticks: { stepSize: 20 }
                        }
                      }
                    }"
                    description="Relative utilization efficiency compared between nethouses"
                    initial-chart-type="radar"
                    :showControls="true"
                    :allowedChartTypes="['radar', 'line']"
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
      pollingInterval: null
    }
  },
  computed: {
    ...mapState(['currentFile', 'processedData', 'loading', 'error']),

    nethousePerformanceData() {
      if (!this.processedData || !this.processedData.length) return { labels: [], datasets: [] };

      let nethouseIdColumn = null;
      let performanceColumn = null;

      const headers = Object.keys(this.processedData[0] || {});

      for (const header of headers) {
        if (header && typeof header === 'string' && 
            (header.toLowerCase().includes('nethouse') || 
             header.toLowerCase().includes('house') || 
             header.toLowerCase().includes('id') ||
             header.toLowerCase().includes('nh'))) {
          nethouseIdColumn = header;
          break;
        }
      }

      if (!nethouseIdColumn) {
        for (const header of headers) {
          let idCandidates = 0;
          const checkRows = Math.min(10, this.processedData.length);

          for (let i = 0; i < checkRows; i++) {
            const value = this.processedData[i][header];
            if (value && 
                (typeof value === 'number' || 
                 (typeof value === 'string' && /^\d{3,4}$/.test(value)))) {
              idCandidates++;
            }
          }

          if (idCandidates > checkRows * 0.7) {
            nethouseIdColumn = header;
            break;
          }
        }
      }

      const performanceColumns = [
        'yield', 'growth', 'height', 'weight', 'biomass', 'production'
      ];

      for (const metric of performanceColumns) {
        const matchingHeader = headers.find(h => 
          h && typeof h === 'string' && h.toLowerCase().includes(metric));

        if (matchingHeader) {
          performanceColumn = matchingHeader;
          break;
        }
      }

      if (!performanceColumn) {
        for (const header of headers) {

          if (header === nethouseIdColumn) continue;

          const firstValue = this.processedData[0][header];
          if (firstValue && (typeof firstValue === 'number' || !isNaN(parseFloat(firstValue)))) {
            performanceColumn = header;
            break;
          }
        }
      }

      if (nethouseIdColumn && performanceColumn) {

        const nethouseData = {};

        this.processedData.forEach(item => {
          if (item[nethouseIdColumn]) {
            const nethouseId = String(item[nethouseIdColumn]);
            if (!nethouseData[nethouseId]) {
              nethouseData[nethouseId] = {
                sum: 0,
                count: 0
              };
            }

            const value = parseFloat(item[performanceColumn]);
            if (!isNaN(value)) {
              nethouseData[nethouseId].sum += value;
              nethouseData[nethouseId].count += 1;
            }
          }
        });

        const nethouseIds = Object.keys(nethouseData).sort((a, b) => parseInt(a) - parseInt(b));
        const performanceData = nethouseIds.map(id => {
          return nethouseData[id].count > 0 ? 
            nethouseData[id].sum / nethouseData[id].count : 0;
        });

        return {
          labels: nethouseIds,
          datasets: [
            {
              label: `Average ${this.formatColumnName(performanceColumn)}`,
              data: performanceData,
              backgroundColor: 'rgba(40, 167, 69, 0.7)',
              borderColor: 'rgb(40, 167, 69)',
              borderWidth: 1
            }
          ]
        };
      }

      return { 
        labels: ['No Nethouse Data Found'],
        datasets: [{
          label: 'No Data',
          data: [0],
          backgroundColor: 'rgba(200, 200, 200, 0.7)'
        }]
      };
    },

    environmentalVsGrowthData() {
      if (!this.processedData || !this.processedData.length) return { labels: [], datasets: [] };

      const headers = Object.keys(this.processedData[0] || {});

      let nethouseIdColumn = null;
      let growthColumn = null;
      let environmentColumns = [];

      for (const header of headers) {
        if (header && typeof header === 'string' && 
            (header.toLowerCase().includes('nethouse') || 
             header.toLowerCase().includes('house') || 
             header.toLowerCase().includes('id') ||
             header.toLowerCase().includes('nh'))) {
          nethouseIdColumn = header;
          break;
        }
      }

      if (!nethouseIdColumn) {
        for (const header of headers) {
          let idCandidates = 0;
          const checkRows = Math.min(10, this.processedData.length);

          for (let i = 0; i < checkRows; i++) {
            const value = this.processedData[i][header];
            if (value && 
                (typeof value === 'number' || 
                 (typeof value === 'string' && /^\d{3,4}$/.test(value)))) {
              idCandidates++;
            }
          }

          if (idCandidates > checkRows * 0.7) {
            nethouseIdColumn = header;
            break;
          }
        }
      }

      for (const header of headers) {
        if (header && typeof header === 'string' && 
            (header.toLowerCase().includes('growth') || 
             header.toLowerCase().includes('yield') ||
             header.toLowerCase().includes('production') ||
             header.toLowerCase().includes('biomass'))) {
          growthColumn = header;
          break;
        }
      }

      if (!growthColumn) {
        for (const header of headers) {
          if (header && typeof header === 'string' && 
              (header.toLowerCase().includes('height') || 
               header.toLowerCase().includes('width') ||
               header.toLowerCase().includes('weight'))) {
            growthColumn = header;
            break;
          }
        }
      }

      for (const header of headers) {
        if (header && typeof header === 'string') {
          if (header.toLowerCase().includes('temp') || 
              header.toLowerCase().includes('humidity') ||
              header.toLowerCase().includes('co2') ||
              header.toLowerCase().includes('light') ||
              header.toLowerCase().includes('ph') ||
              header.toLowerCase().includes('nutrient') ||
              header.toLowerCase().includes('water')) {
            environmentColumns.push(header);
          }
        }
      }

      if (!nethouseIdColumn || !growthColumn || environmentColumns.length === 0) {
        return { 
          labels: ['No Environmental Data Available'],
          datasets: [{
            label: 'No Data',
            data: [0],
            backgroundColor: 'rgba(200, 200, 200, 0.7)'
          }]
        };
      }

      let selectedEnvColumn = environmentColumns.find(col => 
        col.toLowerCase().includes('temp')) || environmentColumns[0];

      const nethouseColors = {
        '112': 'rgba(255, 99, 132, 1)',
        '113': 'rgba(54, 162, 235, 1)',
        '114': 'rgba(255, 206, 86, 1)',
        '115': 'rgba(75, 192, 192, 1)',
        '116': 'rgba(153, 102, 255, 1)',
        '117': 'rgba(255, 159, 64, 1)'
      };

      const uniqueNethouses = new Set();
      this.processedData.forEach(item => {
        if (item[nethouseIdColumn]) {
          uniqueNethouses.add(String(item[nethouseIdColumn]));
        }
      });

      const datasets = [];

      Array.from(uniqueNethouses).forEach(nethouseId => {

        const dataPoints = this.processedData
          .filter(item => String(item[nethouseIdColumn]) === nethouseId)
          .map(item => {

            const envValue = parseFloat(item[selectedEnvColumn]);
            const growthValue = parseFloat(item[growthColumn]);

            if (!isNaN(envValue) && !isNaN(growthValue)) {
              return {
                x: envValue,
                y: growthValue
              };
            }
            return null;
          })
          .filter(point => point !== null);

        if (dataPoints.length > 0) {

          const color = nethouseColors[nethouseId] || 
            `rgba(${Math.floor(Math.random() * 200)}, ${Math.floor(Math.random() * 200)}, ${Math.floor(Math.random() * 200)}, 1)`;

          datasets.push({
            label: `NH ${nethouseId}`,
            data: dataPoints,
            backgroundColor: color.replace('1)', '0.6)'),
            borderColor: color,
            borderWidth: 1,
            pointRadius: 5,
            pointHoverRadius: 7
          });
        }
      });

      return {

        labels: [],
        datasets: datasets,

        options: {
          scales: {
            x: {
              title: {
                display: true,
                text: this.formatColumnName(selectedEnvColumn)
              }
            },
            y: {
              title: {
                display: true,
                text: this.formatColumnName(growthColumn)
              }
            }
          },
          plugins: {
            title: {
              display: true,
              text: `${this.formatColumnName(selectedEnvColumn)} vs ${this.formatColumnName(growthColumn)}`,
              font: {
                size: 16
              }
            }
          }
        }
      };
    },

    resourceEfficiencyData() {
      if (!this.processedData || !this.processedData.length) return { labels: [], datasets: [] };

      const headers = Object.keys(this.processedData[0] || {});

      let nethouseIdColumn = null;
      const resourceColumns = [];

      for (const header of headers) {
        if (header && typeof header === 'string' && 
            (header.toLowerCase().includes('nethouse') || 
             header.toLowerCase().includes('house') || 
             header.toLowerCase().includes('id') ||
             header.toLowerCase().includes('nh'))) {
          nethouseIdColumn = header;
          break;
        }
      }

      if (!nethouseIdColumn) {
        for (const header of headers) {
          let idCandidates = 0;
          const checkRows = Math.min(10, this.processedData.length);

          for (let i = 0; i < checkRows; i++) {
            const value = this.processedData[i][header];
            if (value && 
                (typeof value === 'number' || 
                 (typeof value === 'string' && /^\d{3,4}$/.test(value)))) {
              idCandidates++;
            }
          }

          if (idCandidates > checkRows * 0.7) {
            nethouseIdColumn = header;
            break;
          }
        }
      }

      const resourceKeywords = [
        'water', 'nutrient', 'light', 'electricity', 'energy', 
        'fertilizer', 'efficiency', 'consumption', 'usage', 'co2', 
        'yield', 'productivity'
      ];

      for (const header of headers) {
        if (header && typeof header === 'string') {
          for (const keyword of resourceKeywords) {
            if (header.toLowerCase().includes(keyword)) {
              resourceColumns.push(header);
              break;
            }
          }
        }
      }

      const maxResources = 6;
      const selectedResources = resourceColumns.slice(0, maxResources);

      if (!nethouseIdColumn || selectedResources.length < 3) {
        return { 
          labels: ['Insufficient Resource Data Available'],
          datasets: [{
            label: 'No Data',
            data: [0],
            backgroundColor: 'rgba(200, 200, 200, 0.2)',
            borderColor: 'rgba(200, 200, 200, 0.7)',
          }]
        };
      }

      const uniqueNethouses = new Set();
      this.processedData.forEach(item => {
        if (item[nethouseIdColumn]) {
          uniqueNethouses.add(String(item[nethouseIdColumn]));
        }
      });

      const nethouseColors = {
        '112': 'rgba(255, 99, 132, 0.7)',
        '113': 'rgba(54, 162, 235, 0.7)',
        '114': 'rgba(255, 206, 86, 0.7)',
        '115': 'rgba(75, 192, 192, 0.7)',
        '116': 'rgba(153, 102, 255, 0.7)',
        '117': 'rgba(255, 159, 64, 0.7)'
      };

      const normalizedData = {};

      const resourceRanges = {};
      selectedResources.forEach(resource => {
        const values = this.processedData
          .map(item => parseFloat(item[resource]))
          .filter(val => !isNaN(val));

        if (values.length > 0) {
          resourceRanges[resource] = {
            min: Math.min(...values),
            max: Math.max(...values)
          };
        }
      });

      Array.from(uniqueNethouses).forEach(nethouseId => {

        const nethouseData = this.processedData.filter(item => 
          String(item[nethouseIdColumn]) === nethouseId
        );

        if (nethouseData.length > 0) {
          normalizedData[nethouseId] = {};

          selectedResources.forEach(resource => {
            const values = nethouseData
              .map(item => parseFloat(item[resource]))
              .filter(val => !isNaN(val));

            if (values.length > 0) {
              const avg = values.reduce((sum, val) => sum + val, 0) / values.length;

              const range = resourceRanges[resource];
              if (range && range.max !== range.min) {
                if (resource.toLowerCase().includes('consumption') || 
                    resource.toLowerCase().includes('usage')) {
                  normalizedData[nethouseId][resource] = 
                    100 - (((avg - range.min) / (range.max - range.min)) * 100);
                } else {
                  normalizedData[nethouseId][resource] = 
                    ((avg - range.min) / (range.max - range.min)) * 100;
                }
              } else {
                normalizedData[nethouseId][resource] = 50;
              }
            }
          });
        }
      });

      const datasets = [];
      Object.keys(normalizedData).forEach(nethouseId => {
        const resourceData = [];
        selectedResources.forEach(resource => {
          resourceData.push(normalizedData[nethouseId][resource] || 0);
        });

        const color = nethouseColors[nethouseId] || 
          `rgba(${Math.floor(Math.random() * 200)}, ${Math.floor(Math.random() * 200)}, ${Math.floor(Math.random() * 200)}, 0.7)`;

        const borderColor = color.replace('0.7)', '1)');

        datasets.push({
          label: `Nethouse ${nethouseId}`,
          data: resourceData,
          backgroundColor: color,
          borderColor: borderColor,
          borderWidth: 1,
          pointRadius: 3,
          pointBackgroundColor: borderColor
        });
      });

      return {
        labels: selectedResources.map(resource => this.formatColumnName(resource)),
        datasets: datasets
      };
    }
  },
  mounted() {
    this.fetchFileData();
    this.startDataPolling();
  },
  beforeUnmount() {
    this.stopDataPolling();
  },
  methods: {
    ...mapActions(['fetchFile', 'fetchProcessedData', 'processFile', 'deleteFile']),
    async fetchFileData() {
      const fileId = this.$route.params.id;

      if (!fileId || fileId === 'undefined' || fileId === 'null') {
        console.error('Invalid file ID:', fileId);
        this.$toast.error('Invalid file ID');
        this.$router.push('/files');
        return;
      }

      console.log('Fetching file data for ID:', fileId);

      try {
        this.$store.commit('setLoading', true);

        await this.$store.dispatch('fetchFile', fileId);

        if (this.currentFile && this.currentFile.processed) {
          try {
            await this.$store.dispatch('fetchProcessedData', fileId);

            if (this.processedData && this.processedData.length > 0) {
              setTimeout(() => {
                this.generateDummyCharts();
              }, 500);
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
        this.$store.commit('setLoading', false);
      }
    },
    startDataPolling() {
      const fileId = this.$route.params.id;

      if (fileId && !this.pollingInterval) {
        let attempts = 0;

        this.pollingInterval = setInterval(() => {
          if (attempts >= 5 || (this.currentFile && this.processedData && this.processedData.length > 0)) {
            this.stopDataPolling();
            return;
          }

          console.log('Polling for data, attempt:', attempts + 1);
          this.fetchFileData();
          attempts++;
        }, 2000);
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
        this.$toast.error('No file selected for processing');
        return;
      }

      try {
        this.$store.commit('setLoading', true);
        this.$toast.info('Processing file, please wait...');

        const response = await this.$store.dispatch('processFile', fileId);
        this.$toast.success('File processed successfully');

        await this.$nextTick();

        try {
          await this.$store.dispatch('fetchFile', fileId);

          if (this.currentFile && this.currentFile.processed) {
            setTimeout(async () => {
              try {
                await this.$store.dispatch('fetchProcessedData', fileId);

                if (this.processedData && this.processedData.length > 0) {
                  this.generateDummyCharts();
                } else {
                  console.warn('No processed data available for charts');
                }
              } catch (dataError) {
                console.error('Error fetching processed data:', dataError);
                this.$toast.error('Could not load processed data. Please try again.');
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
          this.$toast.error('Error refreshing file data');
        }

        return response;
      } catch (error) {
        this.$store.commit('setLoading', false);
        this.$toast.error(`Error processing file: ${error.response?.data?.error || error.message || 'Unknown error'}`);
        console.error('Error processing file:', error);
      } finally {
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

      const allKeys = this.processedData.reduce((keys, item) => {
        Object.keys(item).forEach(key => {
          if (!keys.includes(key)) {
            keys.push(key)
          }
        })
        return keys
      }, [])

      let csv = allKeys.map(key => `"${this.formatColumnName(key)}"`).join(',') + '\n'

      this.processedData.forEach(item => {
        const row = allKeys.map(key => {
          const value = item[key] !== undefined ? item[key] : ''
          return `"${value}"`
        }).join(',')
        csv += row + '\n'
      })

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
      import('chart.js').then(ChartModule => {
        this.$nextTick(() => {
          requestAnimationFrame(() => {
            try {
              const Chart = ChartModule.Chart || ChartModule.default || ChartModule;

              if (this.$refs.barChart) {
                if (this.barChartInstance && typeof this.barChartInstance.destroy === 'function') {
                  this.barChartInstance.destroy();
                }

                const labels = [];
                const data = [];
                const nethouseIdCounts = {};

                if (this.processedData && this.processedData.length > 0) {
                  const keys = Object.keys(this.processedData[0]);
                  let nethouseIdColumn = null;

                  this.processedData.forEach(item => {
                    if (nethouseIdColumn === null) {
                      nethouseIdColumn = keys.find(key => key.toLowerCase().includes('nethouse_id'));
                    }

                    if (nethouseIdColumn) {
                      const nethouseId = item[nethouseIdColumn];
                      if (nethouseIdCounts[nethouseId]) {
                        nethouseIdCounts[nethouseId]++;
                      } else {
                        nethouseIdCounts[nethouseId] = 1;
                      }
                    }
                  });

                  Object.keys(nethouseIdCounts).sort().forEach(id => {
                    labels.push(id);
                    data.push(nethouseIdCounts[id]);
                  });
                } else {
                  labels.push('112', '113', '114', '115', '116');
                  data.push(65, 59, 80, 81, 56);
                }

                const barCanvas = this.$refs.barChart;
                if (!barCanvas || barCanvas.offsetWidth === 0 || barCanvas.offsetHeight === 0) {
                  console.warn('Bar chart canvas not properly initialized');
                  return;
                }

                let ctx;
                try {
                  ctx = barCanvas.getContext('2d');
                  if (!ctx) {
                    console.warn('Failed to get 2D context from bar chart canvas');
                    return;
                  }
                  if (typeof ctx.save !== 'function') {
                    console.warn('Canvas context missing required methods');
                    return;
                  }
                } catch (e) {
                  console.warn('Error accessing canvas context:', e);
                  return;
                }

                this.barChartInstance = new Chart(ctx, {
                  type: 'bar',
                  data: {
                    labels: labels,
                    datasets: [{
                      label: 'Nethouse ID Frequency',
                      data: data,
                      backgroundColor: '#198754',
                      borderColor: '#157347',
                      borderWidth: 1
                    }]
                  },
                  options: this.barChartOptions
                });
              }
            } catch (err) {
              console.error('Error generating charts:', err);
            }
          });
        });
      }).catch(error => {
        console.error('Error loading Chart.js:', error);
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
        this.$router.push('/files');
      } catch (error) {
        this.$toast?.error(`Error deleting file: ${error.response?.data?.error || 'Unknown error'}`);
        console.error('Error deleting file:', error);
      }
    }
  }
}
</script>

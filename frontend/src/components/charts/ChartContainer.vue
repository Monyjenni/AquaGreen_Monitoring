<template>
  <div class="chart-section">
    <div class="chart-header d-flex justify-content-between align-items-center mb-3">
      <h5>{{ title }}</h5>
      <div class="btn-group" v-if="showControls">
        <button 
          v-for="type in availableChartTypes" 
          :key="type.value"
          class="btn btn-sm" 
          :class="chartType === type.value ? 'btn-success' : 'btn-outline-success'"
          @click="setChartType(type.value)"
        >
          <i :class="type.icon" class="me-1"></i> {{ type.label }}
        </button>
      </div>
    </div>
    
    <div class="chart-wrapper">
      <line-chart 
        v-if="chartType === 'line'" 
        :chart-data="chartData" 
        :options="chartOptions"
      />
      <bar-chart 
        v-else-if="chartType === 'bar'" 
        :chart-data="chartData" 
        :options="chartOptions"
      />
      <pie-chart 
        v-else-if="chartType === 'pie'" 
        :chart-data="chartData" 
        :options="chartOptions"
      />
      <radar-chart 
        v-else-if="chartType === 'radar'" 
        :chart-data="chartData" 
        :options="chartOptions"
      />
      <scatter-chart 
        v-else-if="chartType === 'scatter'" 
        :chart-data="chartData" 
        :options="chartOptions"
      />
    </div>
    
    <div class="chart-description text-muted small mt-2" v-if="description">
      {{ description }}
    </div>
  </div>
</template>

<script>
import LineChart from './LineChart.vue';
import BarChart from './BarChart.vue';
import PieChart from './PieChart.vue';
import RadarChart from './RadarChart.vue';
import ScatterChart from './ScatterChart.vue';

export default {
  name: 'ChartContainer',
  mounted() {
    // Validate chart type against allowed types
    if (!this.allowedChartTypes.includes(this.chartType) && this.availableChartTypes.length > 0) {
      this.chartType = this.availableChartTypes[0].value;
    }
  },
  components: {
    LineChart,
    BarChart,
    PieChart,
    RadarChart,
    ScatterChart
  },
  props: {
    title: {
      type: String,
      required: true
    },
    chartData: {
      type: Object,
      required: true
    },
    options: {
      type: Object,
      default: () => ({})
    },
    description: {
      type: String,
      default: ''
    },
    initialChartType: {
      type: String,
      default: 'line'
    },
    showControls: {
      type: Boolean,
      default: true
    },
    allowedChartTypes: {
      type: Array,
      default: () => ['line', 'bar', 'pie', 'radar', 'scatter']
    }
  },
  data() {
    // Define all possible chart types
    const allChartTypes = [
      { value: 'line', label: 'Line', icon: 'bi bi-graph-up' },
      { value: 'bar', label: 'Bar', icon: 'bi bi-bar-chart' },
      { value: 'pie', label: 'Pie', icon: 'bi bi-pie-chart' },
      { value: 'radar', label: 'Radar', icon: 'bi bi-bullseye' },
      { value: 'scatter', label: 'Scatter', icon: 'bi bi-stars' }
    ];
    
    // Filter to only show allowed chart types
    const availableChartTypes = allChartTypes.filter(type => 
      this.allowedChartTypes.includes(type.value)
    );
    
    // Make sure initialChartType is in the allowed types
    let chartType = this.initialChartType;
    if (!this.allowedChartTypes.includes(this.initialChartType) && availableChartTypes.length > 0) {
      chartType = availableChartTypes[0].value;
    }
    
    return {
      chartType,
      availableChartTypes
    };
  },
  computed: {
    chartOptions() {
      return {
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        ...this.options
      };
    }
  },
  methods: {
    setChartType(type) {
      this.chartType = type;
    }
  }
};
</script>

<style scoped>
.chart-section {
  background-color: #fff;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
}

.chart-wrapper {
  position: relative;
  width: 100%;
}
</style>

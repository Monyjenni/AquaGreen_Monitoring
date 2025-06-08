<template>
  <div class="chart-container">
    <canvas ref="chart"></canvas>
  </div>
</template>

<script>
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export default {
  name: 'BarChart',
  props: {
    chartData: {
      type: Object,
      required: true
    },
    options: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      chart: null
    };
  },
  mounted() {
    this.renderChart();
  },
  methods: {
    renderChart() {
      this.$nextTick(() => {
        requestAnimationFrame(() => {
          try {
            // Check if the canvas element exists and has dimensions
            if (!this.$refs.chart || this.$refs.chart.offsetWidth === 0 || this.$refs.chart.offsetHeight === 0) {
              console.warn('Bar chart: Canvas not properly initialized or has zero dimensions');
              return;
            }

            // Safely get the canvas context with checks
            let ctx;
            try {
              ctx = this.$refs.chart.getContext('2d');
              if (!ctx || typeof ctx.save !== 'function') {
                console.warn('Bar chart: Canvas context missing required methods');
                return;
              }
            } catch (ctxError) {
              console.error('Bar chart: Error getting canvas context:', ctxError);
              return;
            }
            
            // Destroy previous chart instance if it exists
            if (this.chart) {
              try {
                this.chart.destroy();
              } catch (destroyError) {
                console.error('Bar chart: Error destroying previous chart instance:', destroyError);
              }
            }
            
            // Create new chart instance with error handling
            try {
              this.chart = new Chart(ctx, {
                type: 'bar',
                data: this.chartData,
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  ...this.options
                }
              });
            } catch (chartError) {
              console.error('Bar chart: Error creating chart instance:', chartError);
            }
          } catch (error) {
            console.error('Bar chart: Unexpected error in renderChart:', error);
          }
        });
      });
    }
  },
  watch: {
    chartData: {
      deep: true,
      handler() {
        this.renderChart();
      }
    }
  },
  beforeDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }
};
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 350px;
  width: 100%;
}
</style>

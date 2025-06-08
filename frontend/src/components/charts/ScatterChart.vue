<template>
  <div class="scatter-chart-container">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script>
import { Chart, ScatterController, LineElement, PointElement, LinearScale } from 'chart.js';

// Register required components
Chart.register(ScatterController, LineElement, PointElement, LinearScale);

export default {
  name: 'ScatterChart',
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
      chartInstance: null
    }
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
            if (!this.$refs.canvas || this.$refs.canvas.offsetWidth === 0 || this.$refs.canvas.offsetHeight === 0) {
              console.warn('Scatter chart: Canvas not properly initialized or has zero dimensions');
              return;
            }

            // Safely get the canvas context with checks
            let ctx;
            try {
              ctx = this.$refs.canvas.getContext('2d');
              if (!ctx || typeof ctx.save !== 'function') {
                console.warn('Scatter chart: Canvas context missing required methods');
                return;
              }
            } catch (ctxError) {
              console.error('Scatter chart: Error getting canvas context:', ctxError);
              return;
            }
            
            // Destroy previous chart instance if it exists
            if (this.chartInstance) {
              try {
                this.chartInstance.destroy();
              } catch (destroyError) {
                console.error('Scatter chart: Error destroying previous chart instance:', destroyError);
              }
            }
            
            // Create new chart instance with error handling
            try {
              this.chartInstance = new Chart(ctx, {
                type: 'scatter',
                data: this.chartData,
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  ...this.options
                }
              });
            } catch (chartError) {
              console.error('Scatter chart: Error creating chart instance:', chartError);
            }
          } catch (error) {
            console.error('Scatter chart: Unexpected error in renderChart:', error);
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
    },
    options: {
      deep: true,
      handler() {
        this.renderChart();
      }
    }
  },
  beforeUnmount() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  }
}
</script>

<style scoped>
.scatter-chart-container {
  position: relative;
  width: 100%;
}
</style>

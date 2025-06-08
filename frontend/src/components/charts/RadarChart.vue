<template>
  <div class="radar-chart-container">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script>
import { Chart, RadarController, LineElement, PointElement, RadialLinearScale } from 'chart.js';

// Register required components
Chart.register(RadarController, LineElement, PointElement, RadialLinearScale);

export default {
  name: 'RadarChart',
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
              console.warn('Radar chart: Canvas not properly initialized or has zero dimensions');
              return;
            }

            // Safely get the canvas context with checks
            let ctx;
            try {
              ctx = this.$refs.canvas.getContext('2d');
              if (!ctx || typeof ctx.save !== 'function') {
                console.warn('Radar chart: Canvas context missing required methods');
                return;
              }
            } catch (ctxError) {
              console.error('Radar chart: Error getting canvas context:', ctxError);
              return;
            }
            
            // Destroy previous chart instance if it exists
            if (this.chartInstance) {
              try {
                this.chartInstance.destroy();
              } catch (destroyError) {
                console.error('Radar chart: Error destroying previous chart instance:', destroyError);
              }
            }
            
            // Create new chart instance with error handling
            try {
              this.chartInstance = new Chart(ctx, {
                type: 'radar',
                data: this.chartData,
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  ...this.options
                }
              });
            } catch (chartError) {
              console.error('Radar chart: Error creating chart instance:', chartError);
            }
          } catch (error) {
            console.error('Radar chart: Unexpected error in renderChart:', error);
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
.radar-chart-container {
  position: relative;
  width: 100%;
}
</style>

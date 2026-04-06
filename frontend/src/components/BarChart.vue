<template>
  <div ref="chartRef" :style="{ width: width, height: height }"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

// Props
const props = defineProps({
  width: {
    type: String,
    default: '100%'
  },
  height: {
    type: String,
    default: '400px'
  },
  title: {
    type: String,
    default: 'ECharts 入门示例'
  },
  xAxisData: {
    type: Array,
    default: () => ['衬衫', '羊毛衫', '雪纺衫', '裤子', '高跟鞋', '袜子']
  },
  seriesData: {
    type: Array,
    default: () => [5, 20, 36, 10, 10, 20]
  }
})

// Refs
const chartRef = ref(null)
let chartInstance = null

// Initialize chart
const initChart = () => {
  console.log('initChart called', chartRef.value, echarts)
  if (chartRef.value) {
    try {
      chartInstance = echarts.init(chartRef.value)
      console.log('ECharts instance created', chartInstance)
      updateChart()
    } catch (error) {
      console.error('Failed to init ECharts:', error)
    }
  } else {
    console.warn('chartRef is null')
  }
}

// Update chart options
const updateChart = () => {
  console.log('updateChart called, chartInstance:', chartInstance, 'props:', props)
  if (chartInstance) {
    try {
      chartInstance.setOption({
        title: {
          text: props.title
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        xAxis: {
          type: 'category',
          data: props.xAxisData
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: '销量',
            type: 'bar',
            data: props.seriesData,
            itemStyle: {
              borderRadius: [4, 4, 0, 0],
              color: '#5470c6'
            }
          }
        ]
      })
      console.log('Chart option set')
    } catch (error) {
      console.error('Failed to set option:', error)
    }
  } else {
    console.warn('No chartInstance')
  }
}

// Watch for prop changes
watch([() => props.xAxisData, () => props.seriesData], () => {
  updateChart()
})

// Handle window resize
const handleResize = () => {
  chartInstance?.resize()
}

// Lifecycle hooks
onMounted(() => {
  console.log('BarChart mounted, chartRef:', chartRef.value)
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})
</script>
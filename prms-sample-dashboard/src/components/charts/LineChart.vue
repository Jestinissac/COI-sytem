<template>
  <div class="h-full">
    <canvas ref="canvasRef" class="w-full h-full"></canvas>
  </div>
  </template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import {
  Chart as ChartJS,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import { applyChartTheme } from './theme'

ChartJS.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend)
applyChartTheme()

interface Props { data: any; options?: any }
const props = defineProps<Props>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let chart: ChartJS | null = null

const render = () => {
  if (!canvasRef.value) return
  if (chart) chart.destroy()
  chart = new ChartJS(canvasRef.value, {
    type: 'line',
    data: props.data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      ...props.options,
    },
  })
}

onMounted(render)
onBeforeUnmount(() => chart?.destroy())
watch(() => props.data, render, { deep: true })
</script>



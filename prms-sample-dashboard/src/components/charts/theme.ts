import { Chart as ChartJS } from 'chart.js'

export function applyChartTheme() {
  ChartJS.defaults.font.family = 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji"'
  ChartJS.defaults.color = '#6B7280'
  ChartJS.defaults.borderColor = 'rgba(0,0,0,0.06)'
  ChartJS.defaults.plugins.legend.labels.boxWidth = 12
  ChartJS.defaults.plugins.tooltip.backgroundColor = 'rgba(17,24,39,0.9)'
  ChartJS.defaults.plugins.tooltip.titleColor = '#F9FAFB'
  ChartJS.defaults.plugins.tooltip.bodyColor = '#E5E7EB'
}



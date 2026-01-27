<template>
  <div class="stats-dashboard">
    <el-card class="stats-filter-card" shadow="never">
      <template #header>
        <div class="stats-filter-header">
          <span>统计筛选</span>
          <div class="stats-filter-actions">
            <el-button text size="small" @click="handleResetFilters">
              重置
            </el-button>
            <el-button type="primary" size="small" @click="fetchStats">
              刷新数据
            </el-button>
          </div>
        </div>
      </template>

      <div class="stats-filter-grid">
        <div class="stats-filter-item">
          <label>时间粒度</label>
          <el-segmented
            v-model="filters.group_by"
            :options="groupByOptions"
            size="small"
          />
        </div>

        <div class="stats-filter-item">
          <label>Top N</label>
          <div class="topn-control">
            <el-slider
              v-model="filters.top"
              :min="3"
              :max="30"
              :step="1"
              :show-tooltip="false"
            />
            <span class="topn-value">{{ filters.top }}</span>
          </div>
        </div>

        <div class="stats-filter-item">
          <label>是否官谷</label>
          <el-select
            v-model="filters.is_official"
            placeholder="全部"
            clearable
            size="small"
          >
            <el-option :value="true" label="官谷" />
            <el-option :value="false" label="同人/非官谷" />
          </el-select>
        </div>

        <div class="stats-filter-item">
          <label>状态</label>
          <el-checkbox-group
            v-model="selectedStatuses"
            class="status-group"
            size="small"
          >
            <el-checkbox-button label="in_cabinet">在馆</el-checkbox-button>
            <el-checkbox-button label="outdoor">出街中</el-checkbox-button>
            <el-checkbox-button label="sold">已售出</el-checkbox-button>
          </el-checkbox-group>
        </div>

        <div class="stats-filter-item">
          <label>IP作品</label>
          <el-select
            v-model="filters.ip"
            placeholder="全部IP"
            clearable
            filterable
            size="small"
          >
            <el-option
              v-for="ip in ipOptions"
              :key="ip.id"
              :label="ip.name"
              :value="ip.id"
            />
          </el-select>
        </div>

        <div class="stats-filter-item">
          <label>品类</label>
          <el-tree-select
            v-model="filters.category"
            :data="categoryTreeData"
            :props="{ label: 'label', value: 'id', children: 'children' }"
            placeholder="全部品类"
            clearable
            size="small"
          />
        </div>

        <div class="stats-filter-item">
          <label>入手日期区间</label>
          <el-date-picker
            v-model="purchaseDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            size="small"
          />
        </div>

        <div class="stats-filter-item">
          <label>录入日期区间</label>
          <el-date-picker
            v-model="createdDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            size="small"
          />
        </div>
      </div>
    </el-card>

    <div class="stats-content" v-loading="loading">
      <el-row :gutter="16" class="overview-row">
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="overview-card" shadow="hover">
            <div class="overview-label">谷子件数</div>
            <div class="overview-value">{{ overview?.goods_count ?? 0 }}</div>
            <div class="overview-sub">不同 Asset 记录数</div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="overview-card" shadow="hover">
            <div class="overview-label">总数量</div>
            <div class="overview-value">{{ overview?.quantity_sum ?? 0 }}</div>
            <div class="overview-sub">合计 quantity</div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="overview-card" shadow="hover">
            <div class="overview-label">估算总金额</div>
            <div class="overview-value">
              ¥{{ formattedValueSum }}
            </div>
            <div class="overview-sub">price×quantity 汇总</div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="overview-card" shadow="hover">
            <div class="overview-label">数据完整度</div>
            <div class="overview-progress-group" v-if="overview">
              <div class="progress-item">
                <span>价格</span>
                <el-progress
                  :percentage="completionRate(overview.with_price_count)"
                  :stroke-width="8"
                  :show-text="false"
                />
              </div>
              <div class="progress-item">
                <span>入手日期</span>
                <el-progress
                  :percentage="
                    completionRate(overview.with_purchase_date_count)
                  "
                  :stroke-width="8"
                  :show-text="false"
                  status="success"
                />
              </div>
              <div class="progress-item">
                <span>位置</span>
                <el-progress
                  :percentage="completionRate(overview.with_location_count)"
                  :stroke-width="8"
                  :show-text="false"
                  status="warning"
                />
              </div>
            </div>
            <div v-else class="overview-sub">暂无统计数据</div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="charts-row">
        <el-col :xs="24" :md="8">
          <el-card shadow="hover" class="chart-card">
            <div class="chart-title">状态分布</div>
            <div ref="statusChartRef" class="chart-container" />
          </el-card>
        </el-col>
        <el-col :xs="24" :md="8">
          <el-card shadow="hover" class="chart-card">
            <div class="chart-title">官谷 / 同人</div>
            <div ref="officialChartRef" class="chart-container" />
          </el-card>
        </el-col>
        <el-col :xs="24" :md="8">
          <el-card shadow="hover" class="chart-card">
            <div class="chart-title">作品类型结构</div>
            <div ref="subjectChartRef" class="chart-container" />
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="charts-row">
        <el-col :xs="24" :md="12">
          <el-card shadow="hover" class="chart-card">
            <div class="chart-title">IP Top {{ filters.top }}</div>
            <div ref="ipTopChartRef" class="chart-container" />
          </el-card>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-card shadow="hover" class="chart-card">
            <div class="chart-title">品类 Top {{ filters.top }}</div>
            <div ref="categoryTopChartRef" class="chart-container" />
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="charts-row">
        <el-col :xs="24">
          <el-card shadow="hover" class="chart-card">
            <div class="chart-title">
              入手趋势（{{ groupByLabel }}）
            </div>
            <div ref="purchaseTrendChartRef" class="chart-container chart-container--wide" />
          </el-card>
        </el-col>
      </el-row>

      <div v-if="!loading && !overview" class="empty-tip">
        <el-empty description="暂无统计数据，请调整筛选条件后重试" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { getGoodsStats } from '@/api/goods'
import { getIPList, getCategoryTree } from '@/api/metadata'
import { useLocationStore } from '@/stores/location'
import type {
  GoodsStatsOverview,
  GoodsStatsParams,
  GoodsStatsResponse,
  GoodsStatus,
  IP,
  Category,
} from '@/api/types'

const loading = ref(false)
const statsData = ref<GoodsStatsResponse | null>(null)

const filters = reactive<GoodsStatsParams>({
  group_by: 'month',
  top: 10,
})

const selectedStatuses = ref<GoodsStatus[]>([])

const purchaseDateRange = ref<[string, string] | null>(null)
const createdDateRange = ref<[string, string] | null>(null)

const overview = computed<GoodsStatsOverview | null>(() =>
  statsData.value ? statsData.value.overview : null,
)

const formattedValueSum = computed(() => {
  if (!overview.value) return '0.00'
  const num = Number(overview.value.value_sum || 0)
  if (Number.isNaN(num)) return overview.value.value_sum
  return num.toFixed(2)
})

const completionRate = (filledCount: number) => {
  if (!overview.value || !overview.value.goods_count) return 0
  return Math.round((filledCount / overview.value.goods_count) * 100)
}

const groupByOptions = [
  { label: '按月', value: 'month' },
  { label: '按周', value: 'week' },
  { label: '按日', value: 'day' },
] as const

const groupByLabel = computed(() => {
  switch (filters.group_by) {
    case 'week':
      return '按周'
    case 'day':
      return '按日'
    default:
      return '按月'
  }
})

// 基础数据（IP / 品类树 / 位置树）
const ipOptions = ref<IP[]>([])
const categoryList = ref<Category[]>([])
const locationStore = useLocationStore()

interface CategoryTreeNode {
  id: number
  label: string
  children?: CategoryTreeNode[]
}

const categoryTreeData = computed<CategoryTreeNode[]>(() => {
  const list = categoryList.value
  if (!list.length) return []

  const nodeMap = new Map<number, CategoryTreeNode>()
  const roots: CategoryTreeNode[] = []

  list.forEach((c) => {
    nodeMap.set(c.id, {
      id: c.id,
      label: c.name,
      children: [],
    })
  })

  list.forEach((c) => {
    const node = nodeMap.get(c.id)!
    if (c.parent === null) {
      roots.push(node)
    } else {
      const parent = nodeMap.get(c.parent)
      if (parent) {
        parent.children = parent.children || []
        parent.children.push(node)
      }
    }
  })

  const sortTree = (nodes: CategoryTreeNode[]) => {
    nodes.sort((a, b) => a.label.localeCompare(b.label))
    nodes.forEach((n) => n.children && sortTree(n.children))
  }
  sortTree(roots)
  return roots
})

// ECharts 图表实例
const statusChartRef = ref<HTMLDivElement | null>(null)
const officialChartRef = ref<HTMLDivElement | null>(null)
const subjectChartRef = ref<HTMLDivElement | null>(null)
const ipTopChartRef = ref<HTMLDivElement | null>(null)
const categoryTopChartRef = ref<HTMLDivElement | null>(null)
const purchaseTrendChartRef = ref<HTMLDivElement | null>(null)

const chartInstances: echarts.ECharts[] = []

const getCssVar = (name: string, fallback: string) => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

const initChart = (el: HTMLDivElement | null): echarts.ECharts | null => {
  if (!el) return null
  let chart = echarts.getInstanceByDom(el)
  if (!chart) {
    chart = echarts.init(el)
    chartInstances.push(chart)
  }
  return chart
}

const disposeCharts = () => {
  chartInstances.splice(0).forEach((instance) => {
    instance.dispose()
  })
}

const updateCharts = () => {
  if (!statsData.value) return

  const { distributions, trends } = statsData.value

  const theme = {
    text: getCssVar('--text-dark', '#303133'),
    textSub: getCssVar('--text-light', '#909399'),
    border: getCssVar('--border-color', 'rgba(212, 175, 55, 0.3)'),
    gold: getCssVar('--primary-gold', '#D4AF37'),
    goldLight: getCssVar('--primary-gold-light', '#EACDA3'),
    purple: getCssVar('--accent-purple', '#A29BFE'),
    purpleLight: getCssVar('--accent-purple-light', '#C4B5FD'),
    grid: getCssVar('--secondary-gray-dark', '#E5E5E7'),
  }

  const palette = [
    theme.gold,
    theme.purple,
    theme.goldLight,
    theme.purpleLight,
    '#67C23A',
    '#E6A23C',
    '#F56C6C',
    theme.textSub,
  ]

  const baseTextStyle = { color: theme.text }
  const baseLegend = {
    bottom: 0,
    textStyle: { color: theme.textSub },
    itemWidth: 10,
    itemHeight: 10,
  }
  const baseTooltip = {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: theme.border,
    borderWidth: 1,
    textStyle: { color: theme.text },
    extraCssText:
      'backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border-radius: 10px;',
  }

  // 状态分布饼图
  const statusChart = initChart(statusChartRef.value)
  if (statusChart) {
    const data = (distributions.status || []).map((item) => ({
      name: item.label,
      value: item.goods_count,
    }))
    statusChart.setOption({
      color: palette,
      textStyle: baseTextStyle,
      tooltip: { ...baseTooltip, trigger: 'item' },
      legend: baseLegend,
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          data,
          label: { color: theme.textSub },
          itemStyle: { borderColor: 'rgba(255,255,255,0.7)', borderWidth: 1 },
        },
      ],
    })
  }

  // 官谷 / 同人饼图
  const officialChart = initChart(officialChartRef.value)
  if (officialChart) {
    const data = (distributions.is_official || []).map((item) => ({
      name: item.label,
      value: item.goods_count,
    }))
    officialChart.setOption({
      color: palette,
      textStyle: baseTextStyle,
      tooltip: { ...baseTooltip, trigger: 'item' },
      legend: baseLegend,
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          data,
          label: { color: theme.textSub },
          itemStyle: { borderColor: 'rgba(255,255,255,0.7)', borderWidth: 1 },
        },
      ],
    })
  }

  // 作品类型柱状图
  const subjectChart = initChart(subjectChartRef.value)
  if (subjectChart) {
    const items = distributions.ip_subject_type || []
    subjectChart.setOption({
      color: palette,
      textStyle: baseTextStyle,
      tooltip: { ...baseTooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 36, right: 18, top: 24, bottom: 48, containLabel: true },
      xAxis: {
        type: 'category',
        data: items.map((i) => i.label),
        axisLine: { lineStyle: { color: theme.grid } },
        axisTick: { alignWithLabel: true },
        axisLabel: { interval: 0, color: theme.textSub },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: 'rgba(0,0,0,0.05)' } },
        axisLabel: { color: theme.textSub },
      },
      series: [
        {
          type: 'bar',
          data: items.map((i) => i.goods_count),
          barMaxWidth: 28,
          itemStyle: { borderRadius: [8, 8, 0, 0] },
        },
      ],
    })
  }

  // IP TopN 横向条形
  const ipTopChart = initChart(ipTopChartRef.value)
  if (ipTopChart) {
    const items = (distributions.ip_top || []).slice().reverse()
    ipTopChart.setOption({
      color: palette,
      textStyle: baseTextStyle,
      tooltip: { ...baseTooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 110, right: 18, top: 24, bottom: 24, containLabel: true },
      xAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: 'rgba(0,0,0,0.05)' } },
        axisLabel: { color: theme.textSub },
      },
      yAxis: {
        type: 'category',
        data: items.map((i) => i.ip__name),
        axisLine: { lineStyle: { color: theme.grid } },
        axisTick: { show: false },
        axisLabel: { color: theme.textSub },
      },
      series: [
        {
          type: 'bar',
          data: items.map((i) => i.goods_count),
          barMaxWidth: 18,
          itemStyle: { borderRadius: [0, 10, 10, 0] },
        },
      ],
    })
  }

  // 品类 TopN 横向条形
  const categoryTopChart = initChart(categoryTopChartRef.value)
  if (categoryTopChart) {
    const items = (distributions.category_top || []).slice().reverse()
    categoryTopChart.setOption({
      color: palette,
      textStyle: baseTextStyle,
      tooltip: { ...baseTooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 130, right: 18, top: 24, bottom: 24, containLabel: true },
      xAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: 'rgba(0,0,0,0.05)' } },
        axisLabel: { color: theme.textSub },
      },
      yAxis: {
        type: 'category',
        data: items.map((i) => i.category__path_name || i.category__name),
        axisLine: { lineStyle: { color: theme.grid } },
        axisTick: { show: false },
        axisLabel: { color: theme.textSub },
      },
      series: [
        {
          type: 'bar',
          data: items.map((i) => i.goods_count),
          barMaxWidth: 18,
          itemStyle: { borderRadius: [0, 10, 10, 0] },
        },
      ],
    })
  }

  // 入手趋势折线图
  const purchaseTrendChart = initChart(purchaseTrendChartRef.value)
  if (purchaseTrendChart) {
    const buckets = trends.purchase_date || []
    purchaseTrendChart.setOption({
      color: palette,
      textStyle: baseTextStyle,
      tooltip: { ...baseTooltip, trigger: 'axis' },
      legend: {
        top: 0,
        right: 0,
        textStyle: { color: theme.textSub },
      },
      grid: { left: 40, right: 22, top: 40, bottom: 26, containLabel: true },
      xAxis: {
        type: 'category',
        data: buckets.map((b) => b.bucket),
        axisLine: { lineStyle: { color: theme.grid } },
        axisTick: { alignWithLabel: true },
        axisLabel: { color: theme.textSub },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: 'rgba(0,0,0,0.05)' } },
        axisLabel: { color: theme.textSub },
      },
      series: [
        {
          name: '件数',
          type: 'line',
          smooth: true,
          data: buckets.map((b) => b.goods_count),
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 3 },
          areaStyle: { opacity: 0.08 },
        },
      ],
    })
  }

  chartInstances.forEach((c) => c.resize())
}

const buildRequestParams = (): GoodsStatsParams => {
  const params: GoodsStatsParams = {
    group_by: filters.group_by,
    top: filters.top,
    ip: filters.ip,
    category: filters.category,
    is_official: filters.is_official,
  }

  if (selectedStatuses.value.length === 1) {
    params.status = selectedStatuses.value[0]
    params.status__in = undefined
  } else if (selectedStatuses.value.length > 1) {
    params.status = undefined
    params.status__in = selectedStatuses.value.join(',')
  }

  if (purchaseDateRange.value) {
    params.purchase_start = purchaseDateRange.value[0]
    params.purchase_end = purchaseDateRange.value[1]
  } else {
    params.purchase_start = undefined
    params.purchase_end = undefined
  }

  if (createdDateRange.value) {
    params.created_start = createdDateRange.value[0]
    params.created_end = createdDateRange.value[1]
  } else {
    params.created_start = undefined
    params.created_end = undefined
  }

  return params
}

const fetchStats = async () => {
  if (loading.value) return
  loading.value = true
  try {
    const params = buildRequestParams()
    const data = await getGoodsStats(params)
    statsData.value = data
    if (!data || !data.overview) {
      ElMessage.info('当前筛选条件下暂无统计数据')
    }
    // 下一帧更新图表，确保 DOM 已渲染
    requestAnimationFrame(() => {
      updateCharts()
    })
  } catch (err: any) {
    console.error('加载统计数据失败', err)
    ElMessage.error(err?.message || '加载统计数据失败')
    statsData.value = null
  } finally {
    loading.value = false
  }
}

const handleResetFilters = () => {
  filters.group_by = 'month'
  filters.top = 10
  filters.ip = undefined
  filters.category = undefined
  filters.is_official = undefined
  selectedStatuses.value = []
  purchaseDateRange.value = null
  createdDateRange.value = null
  fetchStats()
}

const initMetadata = async () => {
  try {
    const [ips, categories] = await Promise.all([getIPList(), getCategoryTree()])
    ipOptions.value = ips
    categoryList.value = categories
  } catch {
    ElMessage.error('加载基础筛选数据失败')
  }
  // 确保位置树也加载好，便于后续扩展位置相关图表
  locationStore.fetchNodes()
}

const handleResize = () => {
  chartInstances.forEach((c) => c.resize())
}

onMounted(async () => {
  await initMetadata()
  await fetchStats()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  disposeCharts()
})

watch(
  () => statsData.value,
  () => {
    requestAnimationFrame(() => {
      updateCharts()
    })
  },
)
</script>

<style scoped>
.stats-dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stats-filter-card {
  border-radius: var(--card-radius);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: var(--shadow-sm);
}

.stats-filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: var(--primary-gold);
}

.stats-filter-actions {
  display: flex;
  gap: 8px;
}

.stats-filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px 16px;
}

.stats-filter-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stats-filter-item label {
  font-size: 12px;
  color: var(--text-light);
  font-weight: 500;
}

.topn-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.topn-value {
  width: 32px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: var(--text-dark);
}

.status-group {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
}

.stats-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.overview-row {
  margin-bottom: 8px;
}

.overview-card {
  border-radius: var(--card-radius);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: var(--shadow-sm);
}

.overview-label {
  font-size: 13px;
  color: var(--text-light);
  margin-bottom: 6px;
}

.overview-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: 4px;
}

.overview-sub {
  font-size: 12px;
  color: var(--text-light);
}

.overview-progress-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-dark);
}

.progress-item span {
  width: 60px;
}

.charts-row {
  margin-bottom: 4px;
}

.chart-card {
  border-radius: var(--card-radius);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: var(--shadow-sm);
}

.chart-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  background: linear-gradient(45deg, var(--primary-gold), var(--primary-gold-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.chart-container {
  width: 100%;
  height: 260px;
}

.chart-container--wide {
  height: 320px;
}

.empty-tip {
  margin-top: 24px;
}

:deep(.el-card__header) {
  border-bottom: 1px solid var(--border-color);
}

:deep(.el-segmented) {
  --el-segmented-color: var(--text-dark);
  --el-segmented-bg-color: rgba(245, 245, 247, 0.9);
  --el-segmented-item-selected-bg-color: rgba(212, 175, 55, 0.18);
}

:deep(.el-card) {
  border-color: var(--border-color);
}

@media (max-width: 768px) {
  .chart-container {
    height: 220px;
  }

  .chart-container--wide {
    height: 260px;
  }
}
</style>


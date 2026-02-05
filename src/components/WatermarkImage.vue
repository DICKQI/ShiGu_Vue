<template>
  <div class="watermark-wrapper" ref="wrapperRef">
    <div v-if="!isVisible" class="placeholder" :style="{ height: height || '200px' }"></div>

    <template v-else>
      <img
        v-if="dataUrl"
        :src="dataUrl"
        :alt="alt"
        class="secure-image"
        :style="{ objectFit: fit, cursor: 'default' }"
        @contextmenu.prevent="handleContextMenu"
        @dragstart.prevent
      />

      <div v-else-if="loading" class="loading-state">
        <el-skeleton-item variant="image" style="width: 100%; height: 100%" />
      </div>

      <div v-else class="error-state">
        <el-icon><Picture /></el-icon>
      </div>
    </template>

    <!-- 静态DOM水印（降级方案） -->
    <div v-if="useStaticWatermark" class="static-watermark">
      <div class="static-watermark-inner" :style="staticWatermarkStyle"></div>
    </div>

    <!-- 全屏安全遮罩（按需显示） -->
    <div v-if="showSecurityOverlay" class="security-overlay">
      <div class="overlay-pattern" :style="overlayStyle"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { Picture } from '@element-plus/icons-vue'
import MD5Worker from '@/workers/md5.worker.js?worker'

const props = withDefaults(defineProps<{
  src: string
  alt?: string
  fit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
  userId?: string
  platformName?: string
  height?: string
}>(), {
  fit: 'cover',
  platformName: '拾谷ShiGu',
  userId: 'Unknown'
})

const wrapperRef = ref<HTMLElement | null>(null)
const isVisible = ref(false)
const loading = ref(true)
const dataUrl = ref<string | null>(null)
const showSecurityOverlay = ref(false)
const useStaticWatermark = ref(false)

// 缓存：URL -> Base64
const imageCache = new Map<string, string>()

let observer: IntersectionObserver | null = null
let domCheckTimer: number | null = null

const overlayStyle = computed(() => {
  // 生成简单的SVG背景作为全屏水印
  const text = `${props.platformName} ${props.userId}`
  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'>
      <text x='50%' y='50%' fill='rgba(255,255,255,0.2)' font-size='20' font-family='sans-serif'
            transform='rotate(-30 150 150)' text-anchor='middle'>
        ${text} (ALERT)
      </text>
    </svg>`
  const bg = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
  return { backgroundImage: bg }
})

const staticWatermarkStyle = computed(() => {
  // 复用相同的SVG作为背景，但透明度略低以免遮挡太多
  return overlayStyle.value
})

const processImage = async () => {
  if (!props.src) return

  // 检查缓存
  if (imageCache.has(props.src)) {
    dataUrl.value = imageCache.get(props.src)!
    loading.value = false
    return
  }

  loading.value = true
  try {
    // 1. 加载图片
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = props.src
    })

    // 2. 获取图片Blob用于计算Hash (为了性能，这里使用较小的canvas提取数据或者fetch blob)
    // 注意：直接fetch可能跨域，使用img绘制到canvas提取数据更稳妥
    const hash = await computeImageHash(img)

    // 3. 绘制水印
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not supported')

    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0)

    // 4. 添加水印
    renderWatermark(ctx, img.width, img.height, hash)

    // 5. 导出
    const result = canvas.toDataURL('image/jpeg', 0.85)
    dataUrl.value = result
    imageCache.set(props.src, result)
  } catch (err) {
    console.error('Watermark processing failed, falling back to static watermark:', err)
    // 降级：显示原图并叠加静态水印
    dataUrl.value = props.src
    useStaticWatermark.value = true
  } finally {
    loading.value = false
  }
}

const initObserver = () => {
  observer = new IntersectionObserver((entries) => {
    if (entries[0]?.isIntersecting) {
      isVisible.value = true
      observer?.disconnect()
      processImage()
    }
  })
  if (wrapperRef.value) observer.observe(wrapperRef.value)
}

const computeImageHash = (img: HTMLImageElement): Promise<string> => {
  return new Promise((resolve) => {
    // 性能优化：对于大图，缩放到小尺寸计算Hash作为指纹即可
    const canvas = document.createElement('canvas')
    canvas.width = 200
    canvas.height = 200 * (img.height / img.width)
    const ctx = canvas.getContext('2d')
    if (!ctx) return resolve('00000000')

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    canvas.toBlob((blob) => {
      if (!blob) return resolve('00000000')

      const worker = new MD5Worker()
      worker.onmessage = (e) => {
        resolve(e.data.hash ? e.data.hash.substring(0, 8) : '00000000')
        worker.terminate()
      }
      worker.postMessage({ blob })
    })
  })
}

const renderWatermark = (ctx: CanvasRenderingContext2D, w: number, h: number, hash: string) => {
  const text = `${props.platformName} ${props.userId} ${hash}`
  const fontSize = Math.max(12, w * 0.02) // 最小12px，否则看不清
  ctx.font = `${fontSize}px "Source Han Sans", "Microsoft YaHei", sans-serif`
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)' // 描边也带透明度融合更好
  ctx.lineWidth = 1

  // 旋转绘制
  const angle = -30 * Math.PI / 180
  const stepX = w * 0.15 + ctx.measureText(text).width
  const stepY = w * 0.15

  ctx.save()
  // 简单的平铺逻辑
  for (let y = 0; y < h; y += stepY) {
    // 错位平铺
    const offsetX = (y / stepY) % 2 === 0 ? 0 : stepX / 2
    for (let x = -w; x < w * 2; x += stepX) {
      ctx.save()
      ctx.translate(x + offsetX, y)
      ctx.rotate(angle)
      ctx.strokeText(text, 0, 0)
      ctx.fillText(text, 0, 0)
      ctx.restore()
    }
  }
  ctx.restore()
}

const handleContextMenu = () => {
  showSecurityOverlay.value = true
  setTimeout(() => {
    showSecurityOverlay.value = false
  }, 2000)
}

const handleKeyUp = (e: KeyboardEvent) => {
  if (e.key === 'PrintScreen') {
    showSecurityOverlay.value = true
    // 隐藏内容（虽然PrintScreen已经发生，但可以阻挡连续截图）
    setTimeout(() => {
      showSecurityOverlay.value = false
    }, 5000)
  }
}

// DOM 防删除检测
const startDomCheck = () => {
  domCheckTimer = window.setInterval(() => {
    if (!wrapperRef.value) return
    // 检查是否有 display: none 或者 visibility: hidden
    const style = window.getComputedStyle(wrapperRef.value)
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
       // 恢复样式或报警（此处简单恢复）
       wrapperRef.value.style.display = 'block'
       wrapperRef.value.style.visibility = 'visible'
       wrapperRef.value.style.opacity = '1'
    }
  }, 500)
}

onMounted(() => {
  initObserver()
  window.addEventListener('keyup', handleKeyUp)
  startDomCheck()
})

onBeforeUnmount(() => {
  if (observer) observer.disconnect()
  window.removeEventListener('keyup', handleKeyUp)
  if (domCheckTimer) clearInterval(domCheckTimer)
})
</script>

<style scoped>
.watermark-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
}

.static-watermark {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
  overflow: hidden;
}

.static-watermark-inner {
  width: 100%;
  height: 100%;
  background-repeat: repeat;
}

.secure-image {
  width: 100%;
  height: 100%;
  display: block;
  pointer-events: auto; /* 允许右键触发事件，但被prevent */
}

.loading-state, .error-state {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #909399;
}

.security-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  pointer-events: none;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.overlay-pattern {
  width: 100%;
  height: 100%;
  opacity: 0.8;
}
</style>

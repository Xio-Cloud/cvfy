<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useCvState } from '~/data/useCvState'

const CVFY_IMAGE = 'http://cv.xio.vn/CvFy-no-border.png'

const { setUpCvSettings } = useCvState()
const route = useRoute()
const { t, locale } = useI18n()

const href = `http://cv.xio.vn${route.path}`

// Resizable Sidebar State (Default: 320px - exact classic size)
const DEFAULT_SIDEBAR_WIDTH = 320
const MIN_SIDEBAR_WIDTH = 220
const MAX_SIDEBAR_WIDTH = 650

const sidebarWidth = ref(DEFAULT_SIDEBAR_WIDTH)
const isResizing = ref(false)

onMounted(() => {
  setUpCvSettings()
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('cvxio_sidebar_width')
    if (saved) {
      const parsed = Number.parseInt(saved, 10)
      if (parsed >= MIN_SIDEBAR_WIDTH && parsed <= MAX_SIDEBAR_WIDTH) {
        sidebarWidth.value = parsed
      }
    }
  }
})

function startResizing() {
  isResizing.value = true
  document.addEventListener('mousemove', handlePointerMove)
  document.addEventListener('mouseup', stopResizing)
  document.addEventListener('touchmove', handlePointerMove)
  document.addEventListener('touchend', stopResizing)
}

function handlePointerMove(event: MouseEvent | TouchEvent) {
  if (!isResizing.value)
    return
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const constrainedWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, clientX))
  sidebarWidth.value = constrainedWidth
}

function stopResizing() {
  if (isResizing.value) {
    isResizing.value = false
    document.removeEventListener('mousemove', handlePointerMove)
    document.removeEventListener('mouseup', stopResizing)
    document.removeEventListener('touchmove', handlePointerMove)
    document.removeEventListener('touchend', stopResizing)
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('cvxio_sidebar_width', sidebarWidth.value.toString())
    }
  }
}

onUnmounted(() => {
  stopResizing()
})

useHead({
  htmlAttrs: {
    lang: locale,
  },
  title: t('title-tag'),
  link: [
    {
      rel: 'preload',
      as: 'image',
      href: 'https://cdn.ko-fi.com/cdn/kofi5.png?v=3',
    },
    {
      rel: 'canonical',
      href,
    },
  ],
  meta: [
    {
      name: 'description',
      content: t('description'),
    },
    {
      name: 'author',
      content: 'Xio-Cloud',
    },
    {
      property: 'og:image',
      content: CVFY_IMAGE,
    },
    {
      property: 'og:author',
      content: 'Xio-Cloud',
    },
    {
      property: 'og:title',
      content: t('title-tag'),
    },
    {
      property: 'og:description',
      content: t('description'),
    },
    {
      name: 'twitter:creator',
      content: '@Xio-Cloud',
    },
    {
      name: 'twitter:title',
      content: t('title-tag'),
    },
    {
      name: 'twitter:url',
      content: href,
    },
    {
      name: 'twitter:description',
      content: t('description'),
    },
    {
      name: 'twitter:card',
      content: 'summary_large_image',
    },
    {
      name: 'twitter:image',
      content: CVFY_IMAGE,
    },
    {
      name: 'twitter:image:alt',
      content: t('description'),
    },
  ],
})
</script>

<template>
  <main
    class="font-app main relative flex flex-col lg:flex-row h-screen overflow-hidden"
    :class="{ 'select-none cursor-col-resize': isResizing }"
  >
    <!-- Resizable Sidebar -->
    <CvSettings
      class="sidebar-container w-full h-full shrink-0 overflow-y-auto"
      :style="{ '--sidebar-width': `${sidebarWidth}px` }"
    />

    <!-- Resizer Handle Bar -->
    <div
      class="resizer-handle hidden lg:flex items-center justify-center w-2 hover:w-3 bg-slate-200 hover:bg-violet-500 cursor-col-resize select-none transition-all duration-150 z-10 group relative shrink-0"
      :class="{ 'bg-violet-600 w-3': isResizing }"
      @mousedown="startResizing"
      @touchstart.prevent="startResizing"
    >
      <div class="w-0.5 h-8 bg-slate-400 group-hover:bg-white rounded-full transition-colors" />
    </div>

    <!-- CV Preview Canvas -->
    <CvPreview class="preview-container flex-1 h-full overflow-y-auto min-w-0" />
  </main>
</template>

<style lang="postcss">
@import '@/assets/styles/form.postcss';

@media screen and (min-width: 1024px) {
  .main {
    @apply flex h-screen overflow-hidden;
  }

  .sidebar-container {
    width: var(--sidebar-width, 320px) !important;
    min-width: 220px !important;
    max-width: 650px !important;
  }
}

@media print {
  .resizer-handle {
    display: none !important;
  }
}
</style>

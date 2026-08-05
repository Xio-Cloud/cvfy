<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { renderMarkdown } from '~/utils/markdown'

const props = withDefaults(
  defineProps<{
    id?: string
    modelValue?: string | null
    readOnly?: boolean
    class?: string
  }>(),
  {
    id: undefined,
    modelValue: '',
    readOnly: false,
    class: '',
  },
)

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const activeTab = ref<'write' | 'preview'>('write')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const markdownHtml = computed(() => renderMarkdown(props.modelValue))

function insertMarkdown(prefix: string, suffix = '') {
  if (!textareaRef.value)
    return
  const el = textareaRef.value
  const start = el.selectionStart
  const end = el.selectionEnd
  const currentText = el.value || ''
  const selectedText = currentText.substring(start, end) || 'text'
  const replacement = `${prefix}${selectedText}${suffix}`
  const newValue = currentText.substring(0, start) + replacement + currentText.substring(end)
  emit('update:modelValue', newValue)

  nextTick(() => {
    el.focus()
    el.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length)
  })
}

function insertLinePrefix(linePrefix: string) {
  if (!textareaRef.value)
    return
  const el = textareaRef.value
  const start = el.selectionStart
  const currentText = el.value || ''
  const lineStart = currentText.lastIndexOf('\n', start - 1) + 1
  const newValue = `${currentText.substring(0, lineStart)}${linePrefix}${currentText.substring(lineStart)}`
  emit('update:modelValue', newValue)

  nextTick(() => {
    el.focus()
    el.setSelectionRange(start + linePrefix.length, start + linePrefix.length)
  })
}
</script>

<template>
  <div v-if="readOnly" class="markdown-content" :class="props.class" v-html="markdownHtml" />
  <div v-else class="markdown-editor flex flex-col rounded-md border border-slate-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-violet-600 focus-within:border-transparent">
    <!-- Toolbar -->
    <div class="toolbar flex items-center justify-between bg-slate-50 border-b border-slate-200 px-2 py-1 text-xs select-none">
      <div class="flex items-center gap-1">
        <button
          type="button"
          title="Bold"
          class="toolbar-btn font-bold"
          @click="insertMarkdown('**', '**')"
        >
          B
        </button>
        <button
          type="button"
          title="Italic"
          class="toolbar-btn italic"
          @click="insertMarkdown('*', '*')"
        >
          I
        </button>
        <div class="h-3 w-px bg-slate-300 mx-1" />
        <button
          type="button"
          title="Bullet List"
          class="toolbar-btn"
          @click="insertLinePrefix('- ')"
        >
          • List
        </button>
        <button
          type="button"
          title="Numbered List"
          class="toolbar-btn"
          @click="insertLinePrefix('1. ')"
        >
          1. List
        </button>
        <div class="h-3 w-px bg-slate-300 mx-1" />
        <button
          type="button"
          title="Heading"
          class="toolbar-btn font-semibold"
          @click="insertLinePrefix('### ')"
        >
          H
        </button>
        <button
          type="button"
          title="Link"
          class="toolbar-btn"
          @click="insertMarkdown('[', '](https://example.com)')"
        >
          🔗
        </button>
      </div>

      <!-- Mode Toggle -->
      <div class="flex items-center bg-slate-200 rounded p-0.5 text-[11px] font-medium">
        <button
          type="button"
          class="px-2 py-0.5 rounded transition-colors"
          :class="activeTab === 'write' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
          @click="activeTab = 'write'"
        >
          Write
        </button>
        <button
          type="button"
          class="px-2 py-0.5 rounded transition-colors"
          :class="activeTab === 'preview' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
          @click="activeTab = 'preview'"
        >
          Preview
        </button>
      </div>
    </div>

    <!-- Content Area -->
    <div class="p-2">
      <textarea
        v-if="activeTab === 'write'"
        :id="id"
        ref="textareaRef"
        :value="modelValue ?? ''"
        class="w-full bg-transparent border-0 outline-none resize-y text-xs text-slate-800 font-mono leading-relaxed focus:ring-0 p-1"
        rows="6"
        placeholder="Write Markdown text here (supports **bold**, *italic*, lists)..."
        @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      />
      <div
        v-else
        class="markdown-content min-h-[140px] text-xs text-slate-800 p-1 bg-slate-50/50 rounded border border-dashed border-slate-200"
        v-html="markdownHtml"
      />
    </div>
  </div>
</template>

<style lang="postcss">
.toolbar-btn {
  @apply px-1.5 py-0.5 rounded hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors text-xs font-mono;
}

.markdown-content {
  font-weight: 300;
  line-height: 1.5;

  ul,
  ol {
    @apply pl-4;
    list-style: initial;
  }

  li::marker {
    color: var(--primary);
  }

  p + p {
    @apply mt-2;
  }
}
</style>

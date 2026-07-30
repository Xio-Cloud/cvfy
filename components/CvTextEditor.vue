<script setup lang="ts">
import { renderMarkdown } from '~/utils/markdown'

const props = withDefaults(
  defineProps<{
    id?: string
    modelValue?: string | null
    readOnly: boolean
    class: string
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

const markdownHtml = computed(() => renderMarkdown(props.modelValue))
</script>

<template>
  <div v-if="readOnly" class="markdown-content" :class="props.class" v-html="markdownHtml" />
  <textarea
    v-else
    :id="id"
    :value="modelValue ?? ''"
    :class="props.class"
    rows="6"
    placeholder="Write using Markdown"
    @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
  />
</template>

<style lang="postcss">
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

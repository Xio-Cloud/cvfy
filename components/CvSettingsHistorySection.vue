<script lang="ts" setup>
import { useCvState } from '~/data/useCvState'
import type { CvPart, SectionName, SectionNameList } from '~/types/cvxio'

defineProps<
  {
    section: SectionName
    name: typeof SectionNameList[SectionName]
    index?: number
    totalSections?: number
  }
>()

const { formSettings, moveSection } = useCvState()
const displaySectionMap = {
  work: 'displayWork',
  education: 'displayEducation',
  projects: 'displayProjects',
} as const
</script>

<template>
  <fieldset class="form__section grid gap-3">
    <expansion-panel :panel-name="$t(name)">
      <template #title>
        <legend class="form__legend flex items-center justify-between w-full pr-2">
          <span class="flex items-center gap-1.5 cursor-grab active:cursor-grabbing" title="Drag to reorder section">
            <span class="text-slate-400 hover:text-slate-700 text-sm">⋮⋮</span>
            <span>{{ $t(name) }}</span>
          </span>
          <span
            v-if="index !== undefined && totalSections !== undefined"
            class="flex items-center gap-1"
            @click.stop
          >
            <button
              type="button"
              class="hover:bg-slate-200 p-0.5 rounded text-[10px] text-slate-500 disabled:opacity-20 transition-colors"
              :disabled="index === 0"
              title="Move section up"
              @click.stop="moveSection({ section: section as CvPart, direction: 'up' })"
            >
              ▲
            </button>
            <button
              type="button"
              class="hover:bg-slate-200 p-0.5 rounded text-[10px] text-slate-500 disabled:opacity-20 transition-colors"
              :disabled="index === totalSections - 1"
              title="Move section down"
              @click.stop="moveSection({ section: section as CvPart, direction: 'down' })"
            >
              ▼
            </button>
          </span>
        </legend>
      </template>
      <template #content>
        <div>
          <CvDisplayCheckbox
            class="mb-10"
            :display-section="formSettings[displaySectionMap[section]]"
            :section-name="section"
          />
          <CvDynamicSection
            :section-name="section"
            :entries="formSettings[section]"
          />
        </div>
      </template>
    </expansion-panel>
  </fieldset>
</template>

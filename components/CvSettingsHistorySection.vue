<script lang="ts" setup>
import { useCvState } from '~/data/useCvState'
import type { SectionName, SectionNameList } from '~/types/cvxio'

defineProps<
  {
    section: SectionName
    name: typeof SectionNameList[SectionName]
  }
>()

const { formSettings } = useCvState()
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
        <legend class="form__legend">
          {{ $t(name) }}
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

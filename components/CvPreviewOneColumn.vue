<script lang="ts" setup>
import type { Component } from 'vue'
import CvPreviewAbout from '~/components/CvPreviewAbout.vue'
import CvPreviewEducation from '~/components/CvPreviewEducation.vue'
import CvPreviewExperience from '~/components/CvPreviewExperience.vue'
import CvPreviewProjects from '~/components/CvPreviewProjects.vue'
import CvPreviewSkills from '~/components/CvPreviewSkills.vue'
import CvPreviewSocial from '~/components/CvPreviewSocial.vue'
import { useCvState } from '~/data/useCvState'
import { CV_PARTS, type CvPart } from '~/types/cvfy'

const { formSettings } = useCvState()

const previewSectionMap: Record<CvPart, Component> = {
  about: CvPreviewAbout,
  skills: CvPreviewSkills,
  social: CvPreviewSocial,
  work: CvPreviewExperience,
  education: CvPreviewEducation,
  projects: CvPreviewProjects,
}

function shouldDisplaySection(section: CvPart) {
  const displaySectionMap: Record<CvPart, boolean> = {
    about: Boolean(formSettings.value.displayAbout),
    skills: Boolean(formSettings.value.displaySkills),
    social: Boolean(formSettings.value.displaySocial),
    work: Boolean(formSettings.value.displayWork),
    education: Boolean(formSettings.value.displayEducation),
    projects: Boolean(formSettings.value.displayProjects),
  }
  return displaySectionMap[section]
}

const orderedSections = computed(() => {
  const sectionOrder = formSettings.value.sectionOrder ?? [...CV_PARTS]
  return sectionOrder.filter(shouldDisplaySection)
})
</script>

<template>
  <div class="flex justify-between gap-1">
    <div class="flex flex-col gap-1 justify-between">
      <div class="flex flex-col justify-center">
        <CvPreviewName />
        <CvPreviewTitle />
      </div>
      <div class="flex gap-2">
        <CvPreviewContact />
      </div>
    </div>
    <CvProfileImageViewer class="rounded ml-2" />
  </div>

  <component
    :is="previewSectionMap[section]"
    v-for="section in orderedSections"
    :key="section"
  />
</template>

<style lang="postcss" scoped>
:deep(h4.cv__section-title) {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  word-break: keep-all;
}

:deep(h4.cv__section-title::after) {
  content: '';
  width: 100%;
  height: 2px;
  margin-left: 10px;
  background-color: var(--primary);
  border-radius: 10px;
}
</style>

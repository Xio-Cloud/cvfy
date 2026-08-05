<script lang="ts" setup>
import type { Component } from 'vue'
import CvPreviewAbout from '~/components/CvPreviewAbout.vue'
import CvPreviewEducation from '~/components/CvPreviewEducation.vue'
import CvPreviewExperience from '~/components/CvPreviewExperience.vue'
import CvPreviewProjects from '~/components/CvPreviewProjects.vue'
import CvPreviewSkills from '~/components/CvPreviewSkills.vue'
import CvPreviewSocial from '~/components/CvPreviewSocial.vue'
import { useCvState } from '~/data/useCvState'
import { CV_PARTS, type CvPart } from '~/types/cvxio'

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

const sidebarSections = computed(() => {
  return orderedSections.value.filter(section => ['skills', 'social'].includes(section))
})

const mainSections = computed(() => {
  return orderedSections.value.filter(section => ['about', 'work', 'education', 'projects'].includes(section))
})
</script>

<template>
  <div
    class="flex flex-col gap-4 p-6 py-7 col-span-1 bg-slate-50"
    :class="formSettings.profileImageDataUri ? 'py-7' : 'py-8'"
  >
    <CvProfileImageViewer class="border-white border-8" />

    <div>
      <CvPreviewName />
      <CvPreviewTitle />
    </div>

    <CvPreviewContact />

    <component
      :is="previewSectionMap[section]"
      v-for="section in sidebarSections"
      :key="section"
    />
  </div>
  <div class="pr-8 pl-5 py-8 col-span-2">
    <template
      v-for="(section, index) in mainSections"
      :key="section"
    >
      <hr
        v-if="index > 0"
        class="cv__bar"
      >
      <component :is="previewSectionMap[section]" />
    </template>
  </div>
</template>

<style lang="postcss" scoped>
.cv {
  display: grid;
  grid-template-columns: 1fr 2fr;
  background-image: linear-gradient(to right,
      #f8fafc 33%,
      rgba(255, 255, 255, 0) 0%);

  :deep(&__tags) {
    @apply flex flex-wrap gap-2;
  }

  :deep(&__tag) {
    @apply px-2 py-1 rounded text-white text-xs/normal;
    background-color: var(--primary);
  }

  &__bar {
    @apply my-3 border-slate-100 border bg-slate-100;
    list-style: none;
    padding: 0;

    li {
      @apply flex justify-between;
    }

    li+li {
      @apply mt-3;
    }
  }

}
</style>

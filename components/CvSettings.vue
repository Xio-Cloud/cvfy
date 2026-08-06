<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CV_PARTS, type CvPart, SectionNameList } from '~/types/cvxio'
import { useCvState } from '~/data/useCvState'

const {
  formSettings,
  uploadCV,
  clearForm,
  resetForm,
  moveSection,
} = useCvState()
const switchLocalePath = useSwitchLocalePath()
const i18n = useI18n()
const { downloadPdf } = usePrint()

const config = {
  layouts: ['one-column', 'two-column'],
  colors: [
    { name: 'pink', color: '#9D174D', darker: '#831843' },
    { name: 'purple', color: '#5B21B6', darker: '#4C1D95' },
    { name: 'blue', color: '#1E40AF', darker: '#1E3A8A' },
    { name: 'green', color: '#065F46', darker: '#064E3B' },
    { name: 'black', color: '#1F2937', darker: '#111827' },
  ],
  languages: [
    { name: 'es-name', code: 'es' },
    { name: 'en-name', code: 'en' },
    { name: 'id-name', code: 'id' },
    { name: 'fr-name', code: 'fr' },
    { name: 'zh-name', code: 'zh' },
    { name: 'de-name', code: 'de' },
    { name: 'ar-name', code: 'ar' },
    { name: 'pt-name', code: 'pt' },
  ],
}

const orderedSections = computed(() => formSettings.value.sectionOrder ?? [...CV_PARTS])

// Drag and drop state
const draggedSection = ref<CvPart | null>(null)
const dragOverSection = ref<CvPart | null>(null)

function onDragStart(section: CvPart, event: DragEvent) {
  draggedSection.value = section
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', section)
  }
}

function onDragOver(section: CvPart, event: DragEvent) {
  event.preventDefault()
  if (draggedSection.value && draggedSection.value !== section) {
    dragOverSection.value = section
  }
}

function onDragLeave(section: CvPart) {
  if (dragOverSection.value === section) {
    dragOverSection.value = null
  }
}

function onDrop(section: CvPart, event: DragEvent) {
  event.preventDefault()
  const source = draggedSection.value
  const target = section
  if (source && target && source !== target) {
    reorderSection(source, target)
  }
  draggedSection.value = null
  dragOverSection.value = null
}

function onDragEnd() {
  draggedSection.value = null
  dragOverSection.value = null
}

function reorderSection(source: CvPart, target: CvPart) {
  const currentOrder = [...orderedSections.value]
  const sourceIdx = currentOrder.indexOf(source)
  const targetIdx = currentOrder.indexOf(target)
  if (sourceIdx !== -1 && targetIdx !== -1) {
    currentOrder.splice(sourceIdx, 1)
    currentOrder.splice(targetIdx, 0, source)
    formSettings.value.sectionOrder = currentOrder
  }
}

watch(
  () => formSettings.value,
  (newValue, oldValue) => {
    localStorage.setItem(`cvSettings-${i18n.locale.value}`, JSON.stringify(newValue))
    if (newValue.activeColor !== oldValue.activeColor) {
      const newColor = getCurrentColor(newValue.activeColor)
      changeColor(newColor.color, newColor.darker)
    }
  },
  { deep: true },
)

const formSettingsHref = computed(() => {
  return `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify({ formSettings: formSettings.value }),
  )}`
})

const availableLocales = computed(() => {
  return i18n.localeCodes.value.filter((locale: any) => !locale.includes('-'))
})

function changeColor(color: string, darker: string): void {
  formSettings.value.activeColor = color
  document.documentElement.style.setProperty('--primary', color)
  document.documentElement.style.setProperty('--primary-darker', darker)
}

function getCurrentColor(colorValue: string): {
  color: string
  darker: string
} {
  return (
    config.colors.find(color => color.color === colorValue)
    || config.colors[1]
  )
}
</script>

<template>
  <div class="settings">
    <div class="flex justify-between items-center title pt-2 px-6">
      <LandingLogo />
      <a
        class="buy-me-a-coffee"
        href="https://ko-fi.com/X8X4COWK0"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Buy me a coffee"
      >
        <img
          class="buy-me-a-coffee__image"
          src="https://cdn.ko-fi.com/cdn/kofi5.png?v=3"
          width="118px"
          height="30px"
          alt="Buy me a coffee button"
        >
      </a>
    </div>
    <h2 class="flex flex-wrap text-xl/normal pt-10 px-6 tracking-wide uppercase">
      <span class="title__text">
        {{ $t("cv-settings") }}
      </span>
    </h2>
    <form
      class="form mb-10"
      autocomplete="on"
    >
      <div class="form__section px-6 py-3">
        <button
          class="form__btn form__btn--ghost"
          type="button"
          @click="resetForm"
        >
          {{ $t("reset-settings") }}
        </button>
        <button
          class="form__btn form__btn--ghost"
          type="button"
          @click="clearForm"
        >
          {{ $t("clear-settings") }}
        </button>
      </div>

      <!-- LANGUAGE -->
      <fieldset class="form__section px-6 py-3">
        <legend class="form__legend">
          {{ $t("cv-language") }}
        </legend>
        <div class="flex flex-wrap gap-2 justify-start w-full">
          <nuxt-link
            v-for="locale in availableLocales"
            :key="locale"
            class="form__btn form__btn--ghost"
            :to="switchLocalePath(locale)"
            :exact="true"
          >
            {{ $t(`${locale}-name`) }}
          </nuxt-link>
        </div>
      </fieldset>
      <!-- LANGUAGE -->

      <!-- LAYOUT -->
      <fieldset class="form__section px-6 py-3">
        <legend class="form__legend">
          {{ $t("layout-theme") }}
        </legend>
        <div class="flex flex-wrap gap-2 justify-start">
          <label
            v-for="layout in config.layouts"
            :key="layout"
            tabindex="0"
            class="form__btn form__btn--ghost capitalize"
            :class="[
              {
                'form__btn--active':
                  layout === formSettings.layout,
              },
            ]"
          >
            {{ $t(layout) }}
            <input
              v-model="formSettings.layout"
              :value="layout"
              type="radio"
              class="sr-only"
            >
          </label>
        </div>
      </fieldset>
      <!-- LAYOUT -->

      <!-- COLOR THEME -->
      <fieldset class="form__section px-6 py-3">
        <legend class="form__legend">
          {{ $t("color-theme") }}
        </legend>
        <div class="flex flex-wrap gap-2 justify-start">
          <label
            v-for="color in config.colors"
            :key="color.color"
            tabindex="0"
            class="form__btn form__btn--color-theme capitalize"
            :class="[
              `form__btn--${color.name}`,
              {
                'form__btn--color-selected':
                  color.color === formSettings.activeColor,
              },
            ]"
            @keydown.enter="changeColor(color.color, color.darker)"
          >
            {{ $t(color.name) }}
            <input
              v-model="formSettings.activeColor"
              type="radio"
              class="sr-only"
              :value="color.color"
              @change="changeColor(color.color, color.darker)"
            >
          </label>
        </div>
      </fieldset>
      <!-- COLOR THEME -->

      <!-- DYNAMIC REORDERABLE SECTIONS -->
      <div
        v-for="(section, index) in orderedSections"
        :key="section"
        draggable="true"
        class="transition-all duration-200"
        :class="{
          'opacity-40': draggedSection === section,
          'ring-2 ring-violet-500 bg-violet-50/50 rounded': dragOverSection === section,
        }"
        @dragstart="onDragStart(section, $event)"
        @dragover="onDragOver(section, $event)"
        @dragleave="onDragLeave(section)"
        @drop="onDrop(section, $event)"
        @dragend="onDragEnd"
      >
        <!-- PERSONAL DETAILS (about) -->
        <fieldset
          v-if="section === 'about'"
          class="form__section"
        >
          <expansion-panel :panel-name="$t('personal-details')">
            <template #title>
              <legend class="form__legend flex items-center justify-between w-full pr-2">
                <span class="flex items-center gap-1.5 cursor-grab active:cursor-grabbing" title="Drag to reorder section">
                  <span class="text-slate-400 hover:text-slate-700 text-sm">⋮⋮</span>
                  <span>{{ $t("personal-details") }}</span>
                </span>
                <span class="flex items-center gap-1" @click.stop>
                  <button
                    type="button"
                    class="hover:bg-slate-200 p-0.5 rounded text-[10px] text-slate-500 disabled:opacity-20 transition-colors"
                    :disabled="index === 0"
                    title="Move section up"
                    @click.stop="moveSection({ section: 'about', direction: 'up' })"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    class="hover:bg-slate-200 p-0.5 rounded text-[10px] text-slate-500 disabled:opacity-20 transition-colors"
                    :disabled="index === orderedSections.length - 1"
                    title="Move section down"
                    @click.stop="moveSection({ section: 'about', direction: 'down' })"
                  >
                    ▼
                  </button>
                </span>
              </legend>
            </template>
            <template #content>
              <div class="grid grid-cols-2 gap-x-3 gap-y-10">
                <div class="form__group col-span-full">
                  <span class="form__label">📷 {{ $t("profile-image") }} </span>
                  <CvProfileImageUploader
                    v-model="formSettings.profileImageDataUri"
                  />
                </div>
                <div class="form__group col-span-full">
                  <label
                    class="form__label"
                    for="job-pos"
                  >💼 {{ $t("job-title") }}</label>
                  <input
                    id="job-pos"
                    v-model="formSettings.jobTitle"
                    class="form__control"
                    type="text"
                  >
                </div>
                <div class="form__group">
                  <label
                    class="form__label"
                    for="first-name"
                  >👤 {{ $t("first-name") }}</label>
                  <input
                    id="first-name"
                    v-model="formSettings.name"
                    class="form__control"
                    type="text"
                  >
                </div>
                <div class="form__group">
                  <label
                    class="form__label"
                    for="last-name"
                  >👤 {{ $t("last-name") }}</label>
                  <input
                    id="last-name"
                    v-model="formSettings.lastName"
                    class="form__control"
                    type="text"
                  >
                </div>
                <div class="form__group col-span-full">
                  <label
                    class="form__label"
                    for="email"
                  >✉️ {{ $t("email") }}</label>
                  <input
                    id="email"
                    v-model="formSettings.email"
                    class="form__control"
                    type="email"
                  >
                </div>
                <div class="form__group">
                  <label
                    class="form__label"
                    for="location"
                  >📍 {{ $t("location") }}</label>
                  <input
                    id="location"
                    v-model="formSettings.location"
                    class="form__control"
                    type="text"
                  >
                </div>
                <div class="form__group">
                  <label
                    class="form__label"
                    for="phone"
                  >📱 {{ $t("phone-number") }}</label>
                  <input
                    id="phone"
                    v-model="formSettings.phoneNumber"
                    class="form__control"
                    type="tel"
                  >
                </div>
                <div class="form__group col-span-full">
                  <label
                    class="form__label"
                    for="aboutme"
                  >🌟 {{ $t("about-me") }}</label>
                  <CvDisplayCheckbox
                    class="mb-2"
                    :display-section="Boolean(formSettings.displayAbout)"
                    section-name="about"
                  />
                  <CvTextEditor
                    id="aboutme"
                    v-model="formSettings.aboutme"
                    class="mt-2"
                  />
                </div>
              </div>
            </template>
          </expansion-panel>
        </fieldset>

        <!-- SKILLS (skills) -->
        <fieldset
          v-else-if="section === 'skills'"
          class="form__section grid gap-3"
        >
          <expansion-panel :panel-name="$t('skills')">
            <template #title>
              <legend class="form__legend flex items-center justify-between w-full pr-2">
                <span class="flex items-center gap-1.5 cursor-grab active:cursor-grabbing" title="Drag to reorder section">
                  <span class="text-slate-400 hover:text-slate-700 text-sm">⋮⋮</span>
                  <span>{{ $t("skills") }}</span>
                </span>
                <span class="flex items-center gap-1" @click.stop>
                  <button
                    type="button"
                    class="hover:bg-slate-200 p-0.5 rounded text-[10px] text-slate-500 disabled:opacity-20 transition-colors"
                    :disabled="index === 0"
                    title="Move section up"
                    @click.stop="moveSection({ section: 'skills', direction: 'up' })"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    class="hover:bg-slate-200 p-0.5 rounded text-[10px] text-slate-500 disabled:opacity-20 transition-colors"
                    :disabled="index === orderedSections.length - 1"
                    title="Move section down"
                    @click.stop="moveSection({ section: 'skills', direction: 'down' })"
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
                  :display-section="Boolean(formSettings.displaySkills)"
                  section-name="skills"
                />
                <CvInputTags
                  v-model="formSettings.jobSkills"
                  tag-list-name="jobSkills"
                  :tag-list-label="`🛠 ${$t('technical-skills')}`"
                  :display="Boolean(formSettings.displayJobSkills)"
                />
                <CvInputTags
                  v-model="formSettings.softSkills"
                  tag-list-name="softSkills"
                  :tag-list-label="`🧸 ${$t('soft-skills')}`"
                  :display="Boolean(formSettings.displaySoftSkills)"
                />
                <CvInputTags
                  v-model="formSettings.languages"
                  tag-list-name="languages"
                  :tag-list-label="`🌎 ${$t('languages')}`"
                  :display="Boolean(formSettings.displayLanguages)"
                />
                <CvInputTags
                  v-model="formSettings.interests"
                  tag-list-name="interests"
                  :tag-list-label="`🧸 ${$t('interests')}`"
                  :display="Boolean(formSettings.displayInterests)"
                />
              </div>
            </template>
          </expansion-panel>
        </fieldset>

        <!-- SOCIAL (social) -->
        <fieldset
          v-else-if="section === 'social'"
          class="form__section grid gap-3"
        >
          <expansion-panel :panel-name="$t('social')">
            <template #title>
              <legend class="form__legend flex items-center justify-between w-full pr-2">
                <span class="flex items-center gap-1.5 cursor-grab active:cursor-grabbing" title="Drag to reorder section">
                  <span class="text-slate-400 hover:text-slate-700 text-sm">⋮⋮</span>
                  <span>{{ $t("social") }}</span>
                </span>
                <span class="flex items-center gap-1" @click.stop>
                  <button
                    type="button"
                    class="hover:bg-slate-200 p-0.5 rounded text-[10px] text-slate-500 disabled:opacity-20 transition-colors"
                    :disabled="index === 0"
                    title="Move section up"
                    @click.stop="moveSection({ section: 'social', direction: 'up' })"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    class="hover:bg-slate-200 p-0.5 rounded text-[10px] text-slate-500 disabled:opacity-20 transition-colors"
                    :disabled="index === orderedSections.length - 1"
                    title="Move section down"
                    @click.stop="moveSection({ section: 'social', direction: 'down' })"
                  >
                    ▼
                  </button>
                </span>
              </legend>
            </template>
            <template #content>
              <div>
                <CvDisplayCheckbox
                  class="form__display-checkbox mb-10"
                  :display-section="formSettings.displaySocial"
                  section-name="social"
                />
                <div class="grid grid-cols-2 gap-x-3 gap-y-10">
                  <div class="form__group col-span-full">
                    <label
                      class="form__label flex"
                      for="linkedin"
                    >
                      <svg class="form__icon rounded mr-1">
                        <use href="@/assets/sprite.svg#linkedin" />
                      </svg>
                      Linkedin
                    </label>
                    <input
                      id="linkedin"
                      v-model="formSettings.linkedin"
                      class="form__control"
                      type="text"
                    >
                  </div>
                  <div class="form__group col-span-full">
                    <label
                      class="form__label flex"
                      for="twitter"
                    >
                      <svg class="form__icon rounded mr-1">
                        <use href="@/assets/sprite.svg#twitter" />
                      </svg>
                      Twitter
                    </label>
                    <input
                      id="twitter"
                      v-model="formSettings.twitter"
                      class="form__control"
                      type="text"
                    >
                  </div>
                  <div class="form__group col-span-full">
                    <label
                      class="form__label flex"
                      for="github"
                    >
                      <svg class="form__icon mr-1">
                        <use href="@/assets/sprite.svg#github" />
                      </svg>
                      GitHub
                    </label>
                    <input
                      id="github"
                      v-model="formSettings.github"
                      class="form__control"
                      type="text"
                    >
                  </div>
                  <div class="form__group col-span-full">
                    <label
                      class="form__label flex"
                      for="website"
                    >
                      <svg class="form__icon mr-1">
                        <use href="@/assets/sprite.svg#website" />
                      </svg>
                      Website
                    </label>
                    <input
                      id="website"
                      v-model="formSettings.website"
                      class="form__control"
                      type="text"
                    >
                  </div>
                </div>
              </div>
            </template>
          </expansion-panel>
        </fieldset>

        <!-- EXPERIENCE (work) -->
        <CvSettingsHistorySection
          v-else-if="section === 'work'"
          section="work"
          :name="SectionNameList.work"
          :index="index"
          :total-sections="orderedSections.length"
        />

        <!-- EDUCATION (education) -->
        <CvSettingsHistorySection
          v-else-if="section === 'education'"
          section="education"
          :name="SectionNameList.education"
          :index="index"
          :total-sections="orderedSections.length"
        />

        <!-- PROJECTS (projects) -->
        <CvSettingsHistorySection
          v-else-if="section === 'projects'"
          section="projects"
          :name="SectionNameList.projects"
          :index="index"
          :total-sections="orderedSections.length"
        />
      </div>
      <!-- DYNAMIC REORDERABLE SECTIONS -->

      <!-- GOOGLE DRIVE SYNC -->
      <CvGoogleDriveSync />
      <!-- GOOGLE DRIVE SYNC -->

      <!-- GITHUB STORAGE SYNC -->
      <CvGitHubSync />
      <!-- GITHUB STORAGE SYNC -->

      <!-- CTA -->
      <div class="form__section flex flex-col p-6 gap-3">
        <button
          type="button"
          class="form__btn flex flex-col justify-center"
          @click="downloadPdf"
        >
          <span>{{ $t("download-cv-pdf") }}</span>
        </button>
        <label
          tabindex="0"
          class="form__btn flex justify-center"
        >
          {{ $t("upload-cv") }} (JSON)
          <input
            type="file"
            accept=".json"
            name="uploadCV"
            class="hidden"
            @change="uploadCV"
          >
        </label>
        <a
          :href="formSettingsHref"
          rel="noopener"
          :download="`CV_${formSettings.name}_${formSettings.lastName}_${$i18n.locale}.json`"
          class="form__btn flex justify-center"
        >{{ $t("download-cv-settings") }}
          (JSON)</a>
      </div>
      <!-- CTA -->
    </form>
  </div>
</template>

<style lang="postcss" scoped>
.settings {
  @apply bg-slate-50 bg-opacity-100 shadow-lg font-bold z-10;

  @media screen and (min-width: 1024px) {
    & {
      @apply overflow-y-auto;
    }
  }

  @media print {
    display: none;
    box-shadow: none;
    z-index: 0;
  }
}

.buy-me-a-coffee {
  flex-shrink: 1;

  &__image {
    width: 118px;
    height: 30px;
    font-size: 0.5rem;
  }
}
</style>

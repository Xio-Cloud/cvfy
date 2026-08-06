import { reactive, toRefs } from 'vue'
import {
  cvSettingTemplate,
  cvSettingsEmptyTemplate,
} from './example-cv-settings'
import {
  CV_PARTS,
  type Cv,
  type CvEvent,
  type CvPart,
  type DefaultSkill,
  type LanguagesSkill,
  type SectionName,
  SectionNameList,
} from '~/types/cvxio'
import { htmlSummaryToMarkdown } from '~/utils/markdown'

type StorageResetCallback = () => void
const storageResetHandlers = new Set<StorageResetCallback>()

export function registerStorageResetHandler(handler: StorageResetCallback) {
  storageResetHandlers.add(handler)
}

export function resetAllStorageActiveFiles(exceptHandler?: StorageResetCallback) {
  for (const handler of storageResetHandlers) {
    if (handler !== exceptHandler) {
      handler()
    }
  }
}

const state = reactive({
  formSettings: { ...cvSettingsEmptyTemplate } as Cv,
  isLoading: false,
  isProfilePhotoLoading: false,
})

export function useCvState() {
  function setUpCvSettings(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') {
      state.formSettings = { ...cvSettingTemplate }
      normalizeFormSettings(state.formSettings)
      state.isLoading = false
      return
    }

    const i18n = useI18n()
    const locale = `cvSettings-${i18n.locale.value}`
    const cvSettings = localStorage.getItem(locale)

    if (cvSettings == null) {
      state.formSettings = {
        ...cvSettingTemplate,
      }
      normalizeFormSettings(state.formSettings)
    }
    else {
      const cvSettingsObj = JSON.parse(cvSettings)
      state.formSettings = { ...cvSettingsEmptyTemplate, ...cvSettingsObj }
      normalizeFormSettings(state.formSettings)
    }
    localStorage.setItem(locale, JSON.stringify(state.formSettings))
    state.isLoading = false
  }

  function addSkill<T extends LanguagesSkill | DefaultSkill>(e: T): void {
    if (e.skillType === 'languages') {
      if (e.skill.lang.trim() === '')
        return
      const newLang = e.skill
      const newLangIdx = state.formSettings.languages.findIndex(
        lang => lang.lang === newLang.lang,
      )
      if (newLangIdx < 0) {
        state.formSettings.languages = [
          ...new Set([
            ...state.formSettings.languages,
            { lang: e.skill.lang, level: e.skill.level },
          ]),
        ]
      }
    }
    else {
      if (e.skill.trim() === '')
        return
      state.formSettings[e.skillType] = [
        ...new Set([...state.formSettings[e.skillType], e.skill]),
      ]
    }
  }

  function removeSkill<T extends LanguagesSkill | DefaultSkill>(e: T): void {
    if (e.skillType === 'languages') {
      state.formSettings[e.skillType] = [
        ...state.formSettings[e.skillType].filter(
          skill => skill.lang !== e.skill.lang,
        ),
      ]
    }
    else {
      state.formSettings[e.skillType] = [
        ...state.formSettings[e.skillType].filter(
          skill => skill !== e.skill,
        ),
      ]
    }
  }

  function addEntry(e: { sectionName: SectionName }) {
    state.formSettings[e.sectionName].push({
      id: crypto.randomUUID(),
      title: '',
      location: '',
      from: new Date(),
      to: new Date(),
      current: false,
      summary: '',
      displayDate: e.sectionName !== 'education',
    })
  }

  function removeEntry(e: { sectionName: SectionName, entry: CvEvent }) {
    state.formSettings[e.sectionName] = state.formSettings[
      e.sectionName
    ].filter(entry => entry.id !== e.entry.id)
  }

  function uploadCVData(data: any, isFromRemote = false): void {
    if (!data)
      return

    if (!isFromRemote) {
      resetAllStorageActiveFiles()
    }

    const formSettingsData = data.formSettings || data
    state.formSettings = {
      ...cvSettingsEmptyTemplate,
      ...formSettingsData,
    }
    normalizeFormSettings(state.formSettings)
  }

  function uploadCV(e: any): void {
    const fr = new FileReader()
    fr.onload = (e: any) => {
      const data = JSON.parse(e.target.result)
      uploadCVData(data, false)
    }
    fr.readAsText(e.target.files[0])
  }

  function resetForm(): void {
    const i18n = useI18n()
    resetAllStorageActiveFiles()
    state.formSettings = {
      ...cvSettingTemplate,
    }
    normalizeFormSettings(state.formSettings)
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        `cvSettings-${i18n.locale.value}`,
        JSON.stringify(state.formSettings),
      )
    }
  }

  function clearForm(): void {
    const i18n = useI18n()
    resetAllStorageActiveFiles()
    state.formSettings = { ...cvSettingsEmptyTemplate }
    normalizeFormSettings(state.formSettings)
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`cvSettings-${i18n.locale.value}`)
    }
  }

  function changeDisplaySection(e: { sectionName: string, status: boolean }): void {
    const displayPropMap: Record<string, keyof Cv> = {
      about: 'displayAbout',
      skills: 'displaySkills',
      social: 'displaySocial',
      work: 'displayWork',
      education: 'displayEducation',
      projects: 'displayProjects',
      jobSkills: 'displayJobSkills',
      softSkills: 'displaySoftSkills',
      languages: 'displayLanguages',
      interests: 'displayInterests',
    }

    const propName = displayPropMap[e.sectionName]
    if (propName) {
      ;(state.formSettings as Record<string, boolean | undefined>)[propName] = e.status
    }
  }

  function moveSection(e: { section: CvPart, direction: 'up' | 'down' }): void {
    const currentOrder = state.formSettings.sectionOrder ?? [...CV_PARTS]
    const sectionIndex = currentOrder.findIndex(section => section === e.section)
    const newIndex = e.direction === 'up' ? sectionIndex - 1 : sectionIndex + 1
    if (sectionIndex < 0 || newIndex < 0 || newIndex >= currentOrder.length)
      return

    const updatedOrder = [...currentOrder]
    const [section] = updatedOrder.splice(sectionIndex, 1)
    updatedOrder.splice(newIndex, 0, section)
    state.formSettings.sectionOrder = updatedOrder
  }

  function patchId(formSettings: Cv) {
    // Make sure that older cvs have id in each entry of a section
    for (const key in SectionNameList) {
      const section = key as SectionName
      for (const e of formSettings[section]) {
        if (!e.id) {
          e.id = crypto.randomUUID()
        }
      }
    }
  }

  function patchDisplayDate(formSettings: Cv) {
    // Make sure that older cvs have the correct default displayDate
    for (const key in SectionNameList) {
      const section = key as SectionName
      for (const e of formSettings[section]) {
        if (e.displayDate == null) {
          e.displayDate = section !== 'education'
        }
      }
    }
  }

  function patchLegacySummaryFormat(formSettings: Cv) {
    for (const key in SectionNameList) {
      const section = key as SectionName
      for (const e of formSettings[section]) {
        e.summary = htmlSummaryToMarkdown(e.summary ?? '')
      }
    }
  }

  function patchDisplaySettings(formSettings: Cv) {
    formSettings.displayAbout ??= true
    formSettings.displaySkills ??= true
    formSettings.displayWork ??= true
    formSettings.displaySocial ??= true
    formSettings.displayEducation ??= true
    formSettings.displayProjects ??= true
    formSettings.displayJobSkills ??= true
    formSettings.displaySoftSkills ??= true
    formSettings.displayLanguages ??= true
    formSettings.displayInterests ??= true
  }

  function patchSectionOrder(formSettings: Cv) {
    const savedOrder = formSettings.sectionOrder ?? []
    const filteredSections: CvPart[] = []
    for (const section of savedOrder) {
      const normalizedSection = section as CvPart
      if (CV_PARTS.includes(normalizedSection) && !filteredSections.includes(normalizedSection)) {
        filteredSections.push(normalizedSection)
      }
    }
    formSettings.sectionOrder = [
      ...filteredSections,
      ...CV_PARTS.filter(section => !filteredSections.includes(section)),
    ]
  }

  function patchDates(formSettings: Cv) {
    for (const key in SectionNameList) {
      const section = key as SectionName
      for (const e of formSettings[section]) {
        if (e.from && !(e.from instanceof Date)) {
          e.from = new Date(e.from)
        }
        if (e.to && !(e.to instanceof Date)) {
          e.to = new Date(e.to)
        }
      }
    }
  }

  function normalizeFormSettings(formSettings: Cv) {
    patchId(formSettings)
    patchDates(formSettings)
    patchDisplayDate(formSettings)
    patchLegacySummaryFormat(formSettings)
    patchDisplaySettings(formSettings)
    patchSectionOrder(formSettings)
  }

  return {
    ...toRefs(state),
    setUpCvSettings,
    addSkill,
    removeSkill,
    addEntry,
    removeEntry,
    uploadCV,
    uploadCVData,
    resetForm,
    clearForm,
    changeDisplaySection,
    moveSection,
  }
}

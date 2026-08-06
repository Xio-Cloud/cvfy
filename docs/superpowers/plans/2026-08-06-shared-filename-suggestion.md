# Shared Filename Suggestion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement cross-storage shared filename suggestions so that when a user uploads or selects a CV JSON file from any source (Local Upload, Google Drive, GitHub), that filename is suggested across all save and export options (Local Download, Google Drive Save As, GitHub Commit & Push).

**Architecture:** Add central `activeFileName` state and a computed `suggestedFileName` in `useCvState.ts`. Connect `uploadCV`, `clearForm`, and `resetForm` in `useCvState.ts`, as well as `useGoogleDrive.ts` and `useGitHubStorage.ts`, to update `activeFileName`. Update consumer components (`CvSettings.vue`, `CvGoogleDriveSync.vue`, `CvGitHubSync.vue`) to default their save filename inputs and download links to `suggestedFileName`.

**Tech Stack:** Vue 3, Nuxt 3, TypeScript.

## Global Constraints

- Preserve `.json` file extensions across all suggestion calculations.
- Clean directory paths from imported file paths (e.g. `path/to/file.json` -> `file.json`).
- Revert `activeFileName` to `null` on form reset or clear, falling back to dynamic `CV_${name}_${lastName}_${locale}.json`.

---

### Task 1: Add Central Filename Management to `useCvState.ts`

**Files:**
- Modify: `data/useCvState.ts`

**Interfaces:**
- Consumes: `cvSettingsEmptyTemplate`, `cvSettingTemplate`, `useI18n`
- Produces: `activeFileName: Ref<string | null>`, `setActiveFileName(fileName: string | null): void`, `suggestedFileName: ComputedRef<string>`

- [ ] **Step 1: Update `state` and add actions in `useCvState.ts`**

In `data/useCvState.ts`, update `state` definition:
```ts
const state = reactive({
  formSettings: { ...cvSettingsEmptyTemplate } as Cv,
  activeFileName: null as string | null,
  isLoading: false,
  isProfilePhotoLoading: false,
})
```

Add helper function `setActiveFileName`:
```ts
function setActiveFileName(fileName: string | null): void {
  if (!fileName || !fileName.trim()) {
    state.activeFileName = null
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('cv_active_file_name')
    }
    return
  }
  const cleanName = fileName.trim().split('/').pop() || fileName.trim()
  state.activeFileName = cleanName
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('cv_active_file_name', cleanName)
  }
}
```

Add `suggestedFileName` computed property:
```ts
const suggestedFileName = computed(() => {
  if (state.activeFileName && state.activeFileName.trim() !== '') {
    const baseName = state.activeFileName.trim()
    return baseName.endsWith('.json') ? baseName : `${baseName}.json`
  }
  const i18n = useI18n()
  const name = state.formSettings.name?.trim() || 'Untitled'
  const lastName = state.formSettings.lastName?.trim() || 'CV'
  const locale = i18n?.locale?.value || 'en'
  return `CV_${name}_${lastName}_${locale}.json`
})
```

Update `uploadCV`:
```ts
function uploadCV(e: any): void {
  const file = e.target.files?.[0]
  if (!file) return
  setActiveFileName(file.name)
  const fr = new FileReader()
  fr.onload = (e: any) => {
    const data = JSON.parse(e.target.result)
    uploadCVData(data, false)
  }
  fr.readAsText(file)
}
```

Update `resetForm` and `clearForm`:
```ts
function resetForm(): void {
  const i18n = useI18n()
  resetAllStorageActiveFiles()
  setActiveFileName(null)
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
  setActiveFileName(null)
  state.formSettings = { ...cvSettingsEmptyTemplate }
  normalizeFormSettings(state.formSettings)
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(`cvSettings-${i18n.locale.value}`)
  }
}
```

Update `setUpCvSettings`:
```ts
if (typeof localStorage !== 'undefined') {
  const savedActiveName = localStorage.getItem('cv_active_file_name')
  if (savedActiveName) {
    state.activeFileName = savedActiveName
  }
}
```

Return `activeFileName`, `setActiveFileName`, and `suggestedFileName` from `useCvState()`.

- [ ] **Step 2: Verify `useCvState.ts` compiles and runs linter**

Run: `npx eslint data/useCvState.ts`
Expected: No linting errors.

- [ ] **Step 3: Commit Task 1 changes**

```bash
git add data/useCvState.ts
git commit -m "feat(state): add activeFileName and suggestedFileName to useCvState"
```

---

### Task 2: Connect Local Download Link in `CvSettings.vue`

**Files:**
- Modify: `components/CvSettings.vue:104-109, 655-662`

**Interfaces:**
- Consumes: `suggestedFileName` from `useCvState()`
- Produces: Dynamic `:download` attribute on local JSON download button.

- [ ] **Step 1: Import `suggestedFileName` in `CvSettings.vue`**

In `components/CvSettings.vue`:
```ts
const {
  formSettings,
  uploadCV,
  clearForm,
  resetForm,
  moveSection,
  suggestedFileName,
} = useCvState()
```

- [ ] **Step 2: Update `:download` binding in `<template>`**

Replace:
```html
<a
  :href="formSettingsHref"
  rel="noopener"
  :download="`CV_${formSettings.name}_${formSettings.lastName}_${$i18n.locale}.json`"
  class="form__btn flex justify-center"
>{{ $t("download-cv-settings") }}
  (JSON)</a>
```

With:
```html
<a
  :href="formSettingsHref"
  rel="noopener"
  :download="suggestedFileName"
  class="form__btn flex justify-center"
>{{ $t("download-cv-settings") }}
  (JSON)</a>
```

- [ ] **Step 3: Verify `CvSettings.vue` passes linter**

Run: `npx eslint components/CvSettings.vue`
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit Task 2 changes**

```bash
git add components/CvSettings.vue
git commit -m "feat(settings): use suggestedFileName for local JSON download link"
```

---

### Task 3: Integrate Filename Suggestion into Google Drive Sync

**Files:**
- Modify: `composables/useGoogleDrive.ts:358-399, 419-512, 579-592`
- Modify: `components/CvGoogleDriveSync.vue:44-57, 18-20`

**Interfaces:**
- Consumes: `setActiveFileName`, `suggestedFileName` from `useCvState()`
- Produces: Updated Google Drive active filename state and Save As modal default.

- [ ] **Step 1: Update `useGoogleDrive.ts` to sync with central `activeFileName`**

In `composables/useGoogleDrive.ts`:
Import `setActiveFileName` from `useCvState`:
```ts
const { formSettings, uploadCVData, setActiveFileName } = useCvState()
```

In `loadFileFromDrive(fileId: string, fileName?: string)`:
```ts
const effectiveName = fileName || `CV_${formSettings.value.name}_${formSettings.value.lastName}.json`
setActiveFileName(effectiveName)
driveState.activeFileId = fileId
driveState.activeFileName = effectiveName
```

In `saveToDrive(asNewFile = false, customFileName?: string)`:
```ts
let fileName = customFileName?.trim()
if (!fileName) {
  fileName = driveState.activeFileName || `CV_${formSettings.value.name || 'Untitled'}_${formSettings.value.lastName || 'CV'}.json`
}
if (!fileName.endsWith('.json')) {
  fileName += '.json'
}
setActiveFileName(fileName)
```

In `resetActiveDriveFile()`:
```ts
export function resetActiveDriveFile() {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
    autoSaveTimer = null
  }
  driveState.activeFileId = ''
  driveState.activeFileName = ''
  driveState.savedSnapshot = null
  driveState.isDirty = false
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('gdrive_active_file_id')
    localStorage.removeItem('gdrive_active_file_name')
  }
}
```

- [ ] **Step 2: Update `CvGoogleDriveSync.vue` to use `suggestedFileName`**

In `components/CvGoogleDriveSync.vue`:
```ts
const { formSettings, suggestedFileName } = useCvState()
```

Update `handleSaveDrive`:
```ts
function handleSaveDrive(asNewFile = false) {
  if (asNewFile || !driveState.activeFileId) {
    saveAsFileName.value = driveState.activeFileName || suggestedFileName.value
    showSaveAsModal.value = true
  }
  else {
    saveToDrive(false)
  }
}
```

- [ ] **Step 3: Verify files compile and pass linter**

Run: `npx eslint composables/useGoogleDrive.ts components/CvGoogleDriveSync.vue`
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit Task 3 changes**

```bash
git add composables/useGoogleDrive.ts components/CvGoogleDriveSync.vue
git commit -m "feat(gdrive): sync active file name with central suggestedFileName"
```

---

### Task 4: Integrate Filename Suggestion into GitHub Storage Sync

**Files:**
- Modify: `composables/useGitHubStorage.ts:611-640, 641-713`
- Modify: `components/CvGitHubSync.vue:121-128, 22`

**Interfaces:**
- Consumes: `setActiveFileName`, `suggestedFileName` from `useCvState()`
- Produces: Updated GitHub storage file path and commit modal target suggestion.

- [ ] **Step 1: Update `useGitHubStorage.ts` to sync with central `activeFileName`**

In `composables/useGitHubStorage.ts`:
Import `setActiveFileName` from `useCvState`:
```ts
const { formSettings, uploadCVData, setActiveFileName } = useCvState()
```

In `loadFileFromGitHub(filePath: string)`:
```ts
const fileName = filePath.split('/').pop() || filePath
setActiveFileName(fileName)
```

In `commitToGitHub(commitMessage: string, customPath?: string)`:
```ts
let targetPath = customPath?.trim() || githubState.activeFilePath
if (!targetPath) {
  const name = formSettings.value.name || 'Untitled'
  const lastName = formSettings.value.lastName || 'CV'
  targetPath = `CV_${name}_${lastName}.json`
}
if (!targetPath.endsWith('.json')) {
  targetPath += '.json'
}

const cleanFileName = targetPath.split('/').pop() || targetPath
setActiveFileName(cleanFileName)
```

- [ ] **Step 2: Update `CvGitHubSync.vue` to use `suggestedFileName`**

In `components/CvGitHubSync.vue`:
```ts
const { formSettings, suggestedFileName } = useCvState()
```

Update `handleOpenCommitModal()`:
```ts
function handleOpenCommitModal() {
  const defaultPath = githubState.activeFilePath || suggestedFileName.value
  commitFilePath.value = defaultPath
  commitMessage.value = githubState.activeFilePath
    ? `feat(cv): update ${githubState.activeFilePath}`
    : `feat(cv): add ${defaultPath}`
  showCommitModal.value = true
}
```

- [ ] **Step 3: Verify files compile and pass linter**

Run: `npx eslint composables/useGitHubStorage.ts components/CvGitHubSync.vue`
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit Task 4 changes**

```bash
git add composables/useGitHubStorage.ts components/CvGitHubSync.vue
git commit -m "feat(github): sync active file path with central suggestedFileName"
```

---

### Task 5: Verification & End-to-End Build

- [ ] **Step 1: Run project linter**

Run: `npm run lint`
Expected: 0 errors.

- [ ] **Step 2: Run production build check**

Run: `npm run build`
Expected: Nuxt production build completes successfully.

- [ ] **Step 3: Final Commit**

```bash
git add .
git commit -m "chore: complete shared filename suggestion feature"
```

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useCvState } from '~/data/useCvState'
import { useGoogleDrive } from '~/composables/useGoogleDrive'

const { driveState, openPicker, saveToDrive, checkDriveUrlParams, signOutDrive, authorizeDrive } = useGoogleDrive()
const { formSettings } = useCvState()
const route = useRoute()

const showSaveAsModal = ref(false)
const saveAsFileName = ref('')

onMounted(() => {
  if (route.query.fileId || route.query.state) {
    checkDriveUrlParams(route.query)
  }
})

function handleAuthorize() {
  authorizeDrive()
}

function handleOpenDrive() {
  openPicker()
}

function handleSaveDrive(asNewFile = false) {
  if (asNewFile) {
    const defaultName = driveState.activeFileName || `CV_${formSettings.value.name || 'Untitled'}_${formSettings.value.lastName || 'CV'}.json`
    saveAsFileName.value = defaultName
    showSaveAsModal.value = true
  }
  else {
    saveToDrive(false)
  }
}

function confirmSaveAs() {
  saveToDrive(true, saveAsFileName.value)
  showSaveAsModal.value = false
}
</script>

<template>
  <fieldset class="form__section px-6 py-3">
    <legend class="form__legend flex items-center justify-between w-full">
      <span class="flex items-center gap-2">
        <svg
          class="w-4 h-4 fill-current text-blue-600"
          viewBox="0 0 24 24"
        >
          <path d="M12.01 1.485c-.41 0-.82.12-1.18.35L2.33 6.94c-.73.47-.73 1.54 0 2.01l8.5 5.1c.73.44 1.63.44 2.36 0l8.5-5.1c.73-.47.73-1.54 0-2.01l-8.5-5.1c-.36-.23-.77-.35-1.18-.35zm-9.35 9.77l-1.32.79c-.73.44-.73 1.54 0 2.01l8.5 5.1c.73.44 1.63.44 2.36 0l8.5-5.1c.73-.47.73-1.54 0-2.01l-1.32-.79-7.18 4.31c-.73.44-1.63.44-2.36 0l-7.18-4.31z" />
        </svg>
        {{ $t("google-drive") }}
      </span>
    </legend>

    <div class="flex flex-col gap-2 w-full">
      <!-- Connect Banner when not authenticated -->
      <div
        v-if="!driveState.accessToken && !driveState.activeFileName"
        class="text-xs p-2 rounded bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-between"
      >
        <span class="text-[11px] font-medium text-blue-800">Sign in to sync with your Google Drive</span>
        <button
          type="button"
          class="text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 rounded transition-colors shrink-0"
          @click="handleAuthorize"
        >
          Sign in
        </button>
      </div>

      <!-- Active File Status Banner -->
      <div
        v-if="driveState.activeFileName"
        class="text-xs p-2 rounded flex items-center justify-between transition-colors gap-2"
        :class="driveState.isDirty ? 'bg-amber-50 border border-amber-200 text-amber-900' : 'bg-emerald-50 border border-emerald-200 text-emerald-900'"
      >
        <span class="truncate font-medium">📄 {{ driveState.activeFileName }}</span>
        <div class="flex items-center gap-1.5 shrink-0">
          <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded" :class="driveState.isDirty ? 'bg-amber-200 text-amber-900' : 'bg-emerald-200 text-emerald-900'">
            {{ driveState.isDirty ? 'Unsaved' : 'Saved' }}
          </span>
          <button
            type="button"
            title="Disconnect / Close file"
            class="text-slate-400 hover:text-slate-700 font-bold px-1"
            @click="signOutDrive"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="grid grid-cols-3 gap-1.5">
        <button
          type="button"
          class="form__btn form__btn--ghost flex items-center justify-center gap-1 py-1.5 text-xs"
          :disabled="driveState.isLoadingFile"
          @click="handleOpenDrive"
        >
          <span>📁</span>
          <span>Open</span>
        </button>

        <button
          type="button"
          class="form__btn flex items-center justify-center gap-1 py-1.5 text-xs"
          :disabled="driveState.isSaving"
          @click="handleSaveDrive(false)"
        >
          <span>💾</span>
          <span>{{ driveState.isSaving ? '...' : 'Save' }}</span>
        </button>

        <button
          type="button"
          class="form__btn form__btn--ghost flex items-center justify-center gap-1 py-1.5 text-xs"
          :disabled="driveState.isSaving"
          @click="handleSaveDrive(true)"
        >
          <span>☁️</span>
          <span>Save As</span>
        </button>
      </div>

      <!-- Error Message -->
      <p
        v-if="driveState.error"
        class="text-xs text-red-600 font-normal"
      >
        {{ driveState.error }}
      </p>
    </div>

    <!-- Save As File Name Prompt Modal -->
    <div
      v-if="showSaveAsModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div class="bg-white rounded-lg p-6 max-w-md w-full shadow-xl text-slate-800 font-normal">
        <h3 class="font-bold text-base mb-2">
          Save As to Google Drive
        </h3>
        <p class="text-xs text-slate-600 mb-4">
          Enter a custom file name to save a copy in your Google Drive's <span class="font-bold text-blue-600">CvXio</span> folder:
        </p>

        <div class="mb-4">
          <label class="block text-xs font-bold mb-1">File Name</label>
          <input
            v-model="saveAsFileName"
            type="text"
            class="form__control text-xs w-full"
            placeholder="CV_John_Doe.json"
            @keyup.enter="confirmSaveAs"
          >
        </div>

        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="form__btn form__btn--ghost text-xs px-3 py-1"
            @click="showSaveAsModal = false"
          >
            Cancel
          </button>
          <button
            type="button"
            class="form__btn text-xs px-3 py-1"
            :disabled="!saveAsFileName.trim() || driveState.isSaving"
            @click="confirmSaveAs"
          >
            {{ driveState.isSaving ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
  </fieldset>
</template>

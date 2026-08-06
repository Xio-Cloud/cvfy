<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useCvState } from '~/data/useCvState'
import { useGoogleDrive } from '~/composables/useGoogleDrive'

const {
  driveState,
  openPicker,
  saveToDrive,
  undoChanges,
  setAutoSave,
  checkDriveUrlParams,
  signOutDrive,
  authorizeDrive,
} = useGoogleDrive()

const { formSettings, suggestedFileName } = useCvState()
const route = useRoute()

const showSaveAsModal = ref(false)
const saveAsFileName = ref('')

const formattedLastSaved = computed(() => {
  if (!driveState.lastSavedAt)
    return ''
  return driveState.lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
})

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
  if (asNewFile || !driveState.activeFileId) {
    saveAsFileName.value = driveState.activeFileName || suggestedFileName.value
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

function toggleAutoSave(e: Event) {
  const target = e.target as HTMLInputElement
  setAutoSave(target.checked)
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

      <!-- Auto-Save Toggle -->
      <label
        v-if="driveState.accessToken"
        class="flex items-center gap-1.5 text-[11px] text-slate-500 font-normal cursor-pointer select-none"
        title="Automatically save changes to Google Drive 3 seconds after editing"
      >
        <input
          type="checkbox"
          :checked="driveState.autoSaveEnabled"
          class="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
          @change="toggleAutoSave"
        >
        <span>Auto-save</span>
      </label>
    </legend>

    <div class="flex flex-col gap-2 w-full">
      <!-- Connect Banner when not authenticated -->
      <div
        v-if="!driveState.isSignedIn && !driveState.accessToken"
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

      <!-- Connected Badge when authenticated but no active file yet -->
      <div
        v-else-if="!driveState.activeFileName"
        class="text-xs p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between"
      >
        <span class="text-[11px] font-medium text-emerald-800">☁️ Google Drive Connected</span>
        <button
          type="button"
          title="Sign out / Disconnect"
          class="text-slate-400 hover:text-slate-700 font-bold px-1 text-xs"
          @click="signOutDrive"
        >
          ✕
        </button>
      </div>

      <!-- Active File Status Banner -->
      <div
        v-if="driveState.activeFileName"
        class="text-xs p-2 rounded flex items-center justify-between transition-colors gap-2"
        :class="driveState.isSaving
          ? 'bg-blue-50 border border-blue-200 text-blue-900'
          : driveState.isDirty
            ? 'bg-amber-50 border border-amber-200 text-amber-900'
            : 'bg-emerald-50 border border-emerald-200 text-emerald-900'"
      >
        <span class="truncate font-medium">📄 {{ driveState.activeFileName }}</span>

        <div class="flex items-center gap-1.5 shrink-0">
          <!-- Status Badge -->
          <span
            class="text-[10px] font-semibold px-1.5 py-0.5 rounded"
            :class="driveState.isSaving
              ? 'bg-blue-200 text-blue-900'
              : driveState.isDirty
                ? 'bg-amber-200 text-amber-900'
                : 'bg-emerald-200 text-emerald-900'"
          >
            {{ driveState.isSaving
              ? 'Saving...'
              : driveState.isDirty
                ? 'Unsaved'
                : formattedLastSaved ? `Saved ${formattedLastSaved}` : 'Saved' }}
          </span>

          <!-- Undo / Revert Button -->
          <button
            v-if="driveState.isDirty && driveState.savedSnapshot"
            type="button"
            title="Undo / Revert changes to last saved state on Google Drive"
            class="text-amber-700 hover:text-amber-900 bg-amber-200/60 hover:bg-amber-200 text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors"
            @click="undoChanges"
          >
            ↩️ Undo
          </button>

          <!-- Disconnect / Close -->
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
          :disabled="driveState.isSaving || (driveState.activeFileId ? !driveState.isDirty : false)"
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
    <Teleport to="body">
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
    </Teleport>
  </fieldset>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useGoogleDrive } from '~/composables/useGoogleDrive'

const { driveState, openPicker, saveToDrive, setCredentials, checkDriveUrlParams, signOutDrive } = useGoogleDrive()
const route = useRoute()

const showConfigModal = ref(false)
const inputClientId = ref(driveState.clientId)
const inputApiKey = ref(driveState.apiKey)

onMounted(() => {
  if (route.query.fileId || route.query.state) {
    checkDriveUrlParams(route.query)
  }
})

function saveConfig() {
  setCredentials(inputClientId.value, inputApiKey.value)
  showConfigModal.value = false
}

function handleOpenDrive() {
  if (!driveState.clientId) {
    showConfigModal.value = true
    return
  }
  openPicker()
}

function handleSaveDrive(asNewFile = false) {
  if (!driveState.clientId) {
    showConfigModal.value = true
    return
  }
  saveToDrive(asNewFile)
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
      <button
        type="button"
        class="text-xs text-slate-500 hover:text-slate-800 underline"
        @click="showConfigModal = !showConfigModal"
      >
        {{ $t("drive-config") }}
      </button>
    </legend>

    <div class="flex flex-col gap-2 w-full">
      <!-- draw.io style Status Banner -->
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

    <!-- Credentials Config Modal -->
    <div
      v-if="showConfigModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div class="bg-white rounded-lg p-6 max-w-md w-full shadow-xl text-slate-800 font-normal">
        <h3 class="font-bold text-base mb-2">
          {{ $t("drive-config") }}
        </h3>
        <p class="text-xs text-slate-600 mb-4">
          Enter your Google Cloud OAuth2 Client ID to enable direct Google Drive sync.
        </p>

        <div class="mb-3">
          <label class="block text-xs font-bold mb-1">Google Client ID</label>
          <input
            v-model="inputClientId"
            type="text"
            class="form__control text-xs w-full"
            placeholder="xxx.apps.googleusercontent.com"
          >
        </div>

        <div class="mb-4">
          <label class="block text-xs font-bold mb-1">API Key (Optional)</label>
          <input
            v-model="inputApiKey"
            type="text"
            class="form__control text-xs w-full"
            placeholder="API Key for Picker"
          >
        </div>

        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="form__btn form__btn--ghost text-xs px-3 py-1"
            @click="showConfigModal = false"
          >
            Cancel
          </button>
          <button
            type="button"
            class="form__btn text-xs px-3 py-1"
            @click="saveConfig"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </fieldset>
</template>

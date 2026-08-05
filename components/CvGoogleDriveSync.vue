<script setup lang="ts">
import { ref } from 'vue'
import { useGoogleDrive } from '~/composables/useGoogleDrive'

const { driveState, openPicker, saveToDrive, setCredentials } = useGoogleDrive()

const showConfigModal = ref(false)
const inputClientId = ref(driveState.clientId)
const inputApiKey = ref(driveState.apiKey)

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

function handleSaveDrive() {
  if (!driveState.clientId) {
    showConfigModal.value = true
    return
  }
  saveToDrive()
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
      <!-- Status Banner -->
      <div
        v-if="driveState.activeFileName"
        class="text-xs p-2 bg-blue-50 border border-blue-200 rounded text-blue-800 flex items-center justify-between"
      >
        <span class="truncate">📄 {{ driveState.activeFileName }}</span>
        <span
          v-if="driveState.lastSavedAt"
          class="text-[10px] text-blue-600 shrink-0"
        >
          {{ $t("drive-saved") }}
        </span>
      </div>

      <!-- Action Buttons -->
      <div class="grid grid-cols-2 gap-2">
        <button
          type="button"
          class="form__btn form__btn--ghost flex items-center justify-center gap-1 py-2 text-xs"
          :disabled="driveState.isLoadingFile"
          @click="handleOpenDrive"
        >
          <span>📁</span>
          <span>{{ driveState.isLoadingFile ? '...' : $t("open-from-drive") }}</span>
        </button>

        <button
          type="button"
          class="form__btn flex items-center justify-center gap-1 py-2 text-xs"
          :disabled="driveState.isSaving"
          @click="handleSaveDrive"
        >
          <span>☁️</span>
          <span>{{ driveState.isSaving ? '...' : $t("save-to-drive") }}</span>
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

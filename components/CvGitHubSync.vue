<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useCvState } from '~/data/useCvState'
import { useGitHubStorage } from '~/composables/useGitHubStorage'

const {
  githubState,
  authenticate,
  loginWithGitHub,
  checkGitHubUrlParams,
  createRepo,
  fetchBranches,
  createBranch,
  loadFileFromGitHub,
  commitToGitHub,
  disconnectGitHub,
} = useGitHubStorage()

const { formSettings } = useCvState()
const route = useRoute()

// Token Auth Input
const inputToken = ref('')
const isAuthLoading = ref(false)
const showPatInput = ref(false)

// Modals
const showCreateRepoModal = ref(false)
const newRepoName = ref('')
const newRepoPrivate = ref(false)

const showCreateBranchModal = ref(false)
const newBranchName = ref('')
const baseBranchName = ref('')

const showCommitModal = ref(false)
const commitMessage = ref('')
const commitFilePath = ref('')

const showFilePickerModal = ref(false)

const formattedLastCommitted = computed(() => {
  if (!githubState.lastCommittedAt)
    return ''
  return githubState.lastCommittedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
})

onMounted(() => {
  if (route.query.code || route.query.github_token) {
    checkGitHubUrlParams(route.query)
  }
})

watch(
  () => githubState.selectedRepo,
  async (newRepo) => {
    if (newRepo) {
      await fetchBranches()
    }
  },
)

watch(
  () => githubState.selectedBranch,
  async (newBranch) => {
    if (newBranch && githubState.selectedRepo) {
      await fetchBranches()
    }
  },
)

function handleOAuthLogin() {
  loginWithGitHub()
}

async function handleConnectPAT() {
  if (!inputToken.value.trim())
    return
  isAuthLoading.value = true
  const success = await authenticate(inputToken.value)
  isAuthLoading.value = false
  if (success) {
    inputToken.value = ''
  }
}

async function handleConfirmCreateRepo() {
  if (!newRepoName.value.trim())
    return
  const success = await createRepo(newRepoName.value, newRepoPrivate.value)
  if (success) {
    showCreateRepoModal.value = false
    newRepoName.value = ''
  }
}

function handleOpenCreateBranchModal() {
  baseBranchName.value = githubState.selectedBranch || 'main'
  newBranchName.value = ''
  showCreateBranchModal.value = true
}

async function handleConfirmCreateBranch() {
  if (!newBranchName.value.trim())
    return
  const success = await createBranch(newBranchName.value, baseBranchName.value)
  if (success) {
    showCreateBranchModal.value = false
    newBranchName.value = ''
  }
}

function handleOpenCommitModal() {
  const defaultPath = githubState.activeFilePath || `CV_${formSettings.value.name || 'Untitled'}_${formSettings.value.lastName || 'CV'}.json`
  commitFilePath.value = defaultPath
  commitMessage.value = githubState.activeFilePath
    ? `feat(cv): update ${githubState.activeFilePath}`
    : `feat(cv): add ${defaultPath}`
  showCommitModal.value = true
}

async function handleConfirmCommit() {
  if (!commitMessage.value.trim())
    return
  const success = await commitToGitHub(commitMessage.value, commitFilePath.value)
  if (success) {
    showCommitModal.value = false
  }
}

async function handleSelectFile(path: string) {
  await loadFileFromGitHub(path)
  showFilePickerModal.value = false
}
</script>

<template>
  <fieldset class="form__section px-6 py-3">
    <legend class="form__legend flex items-center justify-between w-full">
      <span class="flex items-center gap-2">
        <svg
          class="w-4 h-4 fill-current text-slate-800"
          viewBox="0 0 24 24"
        >
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
        GitHub Storage
      </span>
      <span
        v-if="githubState.user"
        class="text-[11px] text-slate-500 font-medium"
      >
        @{{ githubState.user.login }}
      </span>
    </legend>

    <div class="flex flex-col gap-2.5 w-full text-xs">
      <!-- Auth Section when not connected -->
      <div
        v-if="!githubState.user"
        class="flex flex-col gap-2 bg-slate-100 p-3 rounded border border-slate-200"
      >
        <button
          type="button"
          class="w-full bg-slate-900 hover:bg-black text-white font-bold py-2 px-3 rounded flex items-center justify-center gap-2 transition-colors shadow-sm text-xs"
          :disabled="githubState.isLoading"
          @click="handleOAuthLogin"
        >
          <svg
            class="w-4 h-4 fill-current text-white"
            viewBox="0 0 24 24"
          >
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          <span>{{ githubState.isLoading ? 'Connecting...' : 'Sign in with GitHub' }}</span>
        </button>

        <div class="text-center my-0.5">
          <button
            type="button"
            class="text-[10px] text-slate-500 hover:text-slate-800 underline"
            @click="showPatInput = !showPatInput"
          >
            {{ showPatInput ? 'Hide Personal Access Token option' : 'Or connect using Personal Access Token (PAT)' }}
          </button>
        </div>

        <div
          v-if="showPatInput"
          class="flex flex-col gap-2 pt-1 border-t border-slate-200"
        >
          <div class="flex gap-2">
            <input
              v-model="inputToken"
              type="password"
              class="form__control text-xs flex-1"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              @keyup.enter="handleConnectPAT"
            >
            <button
              type="button"
              class="form__btn text-xs px-3 py-1.5 shrink-0"
              :disabled="isAuthLoading || !inputToken.trim()"
              @click="handleConnectPAT"
            >
              Connect
            </button>
          </div>
          <a
            href="https://github.com/settings/tokens/new?scopes=repo&description=CvXio+Resume+Storage"
            target="_blank"
            rel="noopener"
            class="text-[10px] text-blue-600 hover:underline"
          >
            🔑 Create Personal Access Token on GitHub &rarr;
          </a>
        </div>
      </div>

      <!-- Connected Storage Controls -->
      <template v-else>
        <!-- User Info & Disconnect -->
        <div class="flex items-center justify-between bg-slate-100 px-2.5 py-1.5 rounded text-[11px]">
          <div class="flex items-center gap-2">
            <img
              :src="githubState.user.avatar_url"
              class="w-5 h-5 rounded-full"
              alt="Avatar"
            >
            <span class="font-bold text-slate-800">{{ githubState.user.name }}</span>
          </div>
          <button
            type="button"
            class="text-slate-400 hover:text-slate-700 font-bold px-1"
            title="Disconnect GitHub"
            @click="disconnectGitHub"
          >
            ✕
          </button>
        </div>

        <!-- Repository Selector & Create Repo -->
        <div class="flex flex-col gap-1">
          <div class="flex items-center justify-between text-[11px] font-bold text-slate-600">
            <span>Repository</span>
            <button
              type="button"
              class="text-blue-600 hover:underline text-[10px]"
              @click="showCreateRepoModal = true"
            >
              + New Repo
            </button>
          </div>
          <select
            v-model="githubState.selectedRepo"
            class="form__control text-xs w-full py-1.5"
          >
            <option
              v-for="repo in githubState.repos"
              :key="repo.full_name"
              :value="repo.full_name"
            >
              {{ repo.full_name }} {{ repo.private ? '🔒' : '' }}
            </option>
          </select>
        </div>

        <!-- Branch Selector & Create Branch -->
        <div class="flex flex-col gap-1">
          <div class="flex items-center justify-between text-[11px] font-bold text-slate-600">
            <span>Branch</span>
            <button
              type="button"
              class="text-blue-600 hover:underline text-[10px]"
              @click="handleOpenCreateBranchModal"
            >
              + New Branch
            </button>
          </div>
          <select
            v-model="githubState.selectedBranch"
            class="form__control text-xs w-full py-1.5"
          >
            <option
              v-for="branch in githubState.branches"
              :key="branch.name"
              :value="branch.name"
            >
              🌿 {{ branch.name }}
            </option>
          </select>
        </div>

        <!-- Active File Status Banner -->
        <div
          v-if="githubState.activeFilePath"
          class="text-xs p-2 rounded flex items-center justify-between transition-colors gap-2"
          :class="githubState.isCommitting
            ? 'bg-blue-50 border border-blue-200 text-blue-900'
            : githubState.isDirty
              ? 'bg-amber-50 border border-amber-200 text-amber-900'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-900'"
        >
          <span class="truncate font-medium">📄 {{ githubState.activeFilePath }}</span>
          <span
            class="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0"
            :class="githubState.isCommitting
              ? 'bg-blue-200 text-blue-900'
              : githubState.isDirty
                ? 'bg-amber-200 text-amber-900'
                : 'bg-emerald-200 text-emerald-900'"
          >
            {{ githubState.isCommitting
              ? 'Committing...'
              : githubState.isDirty
                ? 'Modified'
                : formattedLastCommitted ? `Committed ${formattedLastCommitted}` : 'Pushed' }}
          </span>
        </div>

        <!-- Action Buttons: Open & Commit & Push -->
        <div class="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            class="form__btn form__btn--ghost flex items-center justify-center gap-1 py-1.5 text-xs"
            :disabled="githubState.isLoading"
            @click="showFilePickerModal = true"
          >
            <span>📁</span>
            <span>Browse Files</span>
          </button>

          <button
            type="button"
            class="form__btn flex items-center justify-center gap-1 py-1.5 text-xs"
            :disabled="githubState.isCommitting"
            @click="handleOpenCommitModal"
          >
            <span>🚀</span>
            <span>Commit & Push</span>
          </button>
        </div>
      </template>

      <!-- Error Message -->
      <p
        v-if="githubState.error"
        class="text-xs text-red-600 font-normal"
      >
        {{ githubState.error }}
      </p>
    </div>

    <!-- Create Repo Modal -->
    <div
      v-if="showCreateRepoModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div class="bg-white rounded-lg p-6 max-w-md w-full shadow-xl text-slate-800 font-normal">
        <h3 class="font-bold text-base mb-2">
          Create New Repository
        </h3>
        <p class="text-xs text-slate-600 mb-4">
          Create a dedicated GitHub repository to store and version control your CVs.
        </p>

        <div class="mb-3">
          <label class="block text-xs font-bold mb-1">Repository Name</label>
          <input
            v-model="newRepoName"
            type="text"
            class="form__control text-xs w-full"
            placeholder="my-resumes"
            @keyup.enter="handleConfirmCreateRepo"
          >
        </div>

        <div class="mb-4 flex items-center gap-2">
          <input
            id="private-repo"
            v-model="newRepoPrivate"
            type="checkbox"
            class="rounded text-blue-600"
          >
          <label
            for="private-repo"
            class="text-xs font-medium cursor-pointer"
          >
            Private Repository 🔒
          </label>
        </div>

        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="form__btn form__btn--ghost text-xs px-3 py-1"
            @click="showCreateRepoModal = false"
          >
            Cancel
          </button>
          <button
            type="button"
            class="form__btn text-xs px-3 py-1"
            :disabled="!newRepoName.trim() || githubState.isLoading"
            @click="handleConfirmCreateRepo"
          >
            {{ githubState.isLoading ? 'Creating...' : 'Create' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Create Branch Modal -->
    <div
      v-if="showCreateBranchModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div class="bg-white rounded-lg p-6 max-w-md w-full shadow-xl text-slate-800 font-normal">
        <h3 class="font-bold text-base mb-2">
          Create New Branch
        </h3>
        <p class="text-xs text-slate-600 mb-3">
          Create a new branch off a base branch in <span class="font-bold text-blue-600">{{ githubState.selectedRepo }}</span>:
        </p>

        <div class="mb-3">
          <label class="block text-xs font-bold mb-1">Branch Off From (Base Branch)</label>
          <select
            v-model="baseBranchName"
            class="form__control text-xs w-full py-1.5"
          >
            <option
              v-for="b in githubState.branches"
              :key="b.name"
              :value="b.name"
            >
              🌿 {{ b.name }}
            </option>
          </select>
        </div>

        <div class="mb-4">
          <label class="block text-xs font-bold mb-1">New Branch Name</label>
          <input
            v-model="newBranchName"
            type="text"
            class="form__control text-xs w-full"
            placeholder="cv-2026"
            @keyup.enter="handleConfirmCreateBranch"
          >
        </div>

        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="form__btn form__btn--ghost text-xs px-3 py-1"
            @click="showCreateBranchModal = false"
          >
            Cancel
          </button>
          <button
            type="button"
            class="form__btn text-xs px-3 py-1"
            :disabled="!newBranchName.trim() || githubState.isLoading"
            @click="handleConfirmCreateBranch"
          >
            {{ githubState.isLoading ? 'Creating...' : 'Create Branch' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Commit & Push Modal -->
    <div
      v-if="showCommitModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div class="bg-white rounded-lg p-6 max-w-md w-full shadow-xl text-slate-800 font-normal">
        <h3 class="font-bold text-base mb-2">
          Commit & Push to GitHub
        </h3>
        <p class="text-xs text-slate-600 mb-4">
          Target: <span class="font-bold text-blue-600">{{ githubState.selectedRepo }} (🌿 {{ githubState.selectedBranch }})</span>
        </p>

        <div class="mb-3">
          <label class="block text-xs font-bold mb-1">File Path</label>
          <input
            v-model="commitFilePath"
            type="text"
            class="form__control text-xs w-full"
            placeholder="CV_Jane_Doe.json"
          >
        </div>

        <div class="mb-4">
          <label class="block text-xs font-bold mb-1">Commit Message</label>
          <input
            v-model="commitMessage"
            type="text"
            class="form__control text-xs w-full"
            placeholder="feat(cv): update experience and skills"
            @keyup.enter="handleConfirmCommit"
          >
        </div>

        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="form__btn form__btn--ghost text-xs px-3 py-1"
            @click="showCommitModal = false"
          >
            Cancel
          </button>
          <button
            type="button"
            class="form__btn text-xs px-3 py-1"
            :disabled="!commitMessage.trim() || !commitFilePath.trim() || githubState.isCommitting"
            @click="handleConfirmCommit"
          >
            {{ githubState.isCommitting ? 'Committing...' : 'Commit & Push' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Browse Files Modal -->
    <div
      v-if="showFilePickerModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div class="bg-white rounded-lg p-6 max-w-md w-full shadow-xl text-slate-800 font-normal">
        <h3 class="font-bold text-base mb-2">
          Select JSON File from GitHub
        </h3>
        <p class="text-xs text-slate-600 mb-4">
          Repo: <span class="font-bold text-blue-600">{{ githubState.selectedRepo }} (🌿 {{ githubState.selectedBranch }})</span>
        </p>

        <div
          v-if="githubState.files.length === 0"
          class="text-xs text-slate-500 py-4 text-center border border-dashed rounded mb-4"
        >
          No .json files found in this branch.
        </div>
        <div
          v-else
          class="flex flex-col gap-1.5 max-h-60 overflow-y-auto mb-4 border rounded p-2"
        >
          <button
            v-for="file in githubState.files"
            :key="file.path"
            type="button"
            class="text-left text-xs p-2 rounded hover:bg-slate-100 flex items-center justify-between transition-colors"
            @click="handleSelectFile(file.path)"
          >
            <span class="font-medium truncate">📄 {{ file.path }}</span>
            <span class="text-[10px] text-slate-400 shrink-0">{{ file.size }} bytes</span>
          </button>
        </div>

        <div class="flex justify-end">
          <button
            type="button"
            class="form__btn form__btn--ghost text-xs px-3 py-1"
            @click="showFilePickerModal = false"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </fieldset>
</template>

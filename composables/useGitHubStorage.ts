import { reactive, watch } from 'vue'
import { useCvState } from '~/data/useCvState'

export interface GitHubRepo {
  name: string
  full_name: string
  default_branch: string
  private: boolean
}

export interface GitHubBranch {
  name: string
  commit: {
    sha: string
  }
}

export interface GitHubFileItem {
  name: string
  path: string
  sha: string
  size: number
  type: 'file' | 'dir'
}

const githubState = reactive({
  token: '' as string,
  user: null as { login: string, name?: string, avatar_url: string } | null,
  repos: [] as GitHubRepo[],
  selectedRepo: '' as string, // "owner/repo"
  branches: [] as GitHubBranch[],
  selectedBranch: 'main' as string,
  files: [] as GitHubFileItem[],
  activeFilePath: '' as string,
  activeFileSha: '' as string,
  isLoading: false,
  isCommitting: false,
  isDirty: false,
  error: '' as string,
  lastCommittedAt: null as Date | null,
  savedSnapshot: null as any,
})

export function useGitHubStorage() {
  const { formSettings, uploadCVData } = useCvState()

  // Track unsaved changes relative to last loaded/committed GitHub snapshot
  watch(
    formSettings,
    () => {
      if (githubState.activeFilePath && githubState.token) {
        if (githubState.savedSnapshot) {
          githubState.isDirty = JSON.stringify(formSettings.value) !== JSON.stringify(githubState.savedSnapshot)
        }
        else {
          githubState.isDirty = true
        }
      }
    },
    { deep: true },
  )

  function toBase64(str: string): string {
    return btoa(unescape(encodeURIComponent(str)))
  }

  function fromBase64(str: string): string {
    return decodeURIComponent(escape(atob(str.replace(/\s/g, ''))))
  }

  function loadSavedState() {
    if (typeof localStorage === 'undefined')
      return
    githubState.token = localStorage.getItem('gh_token') || ''
    githubState.selectedRepo = localStorage.getItem('gh_selected_repo') || ''
    githubState.selectedBranch = localStorage.getItem('gh_selected_branch') || 'main'
    githubState.activeFilePath = localStorage.getItem('gh_active_file_path') || ''
    githubState.activeFileSha = localStorage.getItem('gh_active_file_sha') || ''

    const savedUser = localStorage.getItem('gh_user')
    if (savedUser) {
      try {
        githubState.user = JSON.parse(savedUser)
      }
      catch {}
    }
  }

  function loginWithGitHub() {
    githubState.error = ''
    const config = useRuntimeConfig()
    const clientId = (config.public?.githubClientId as string) || ''
    if (!clientId) {
      githubState.error = 'GitHub Client ID not configured. Please set NUXT_PUBLIC_GITHUB_CLIENT_ID or use Personal Access Token below.'
      return
    }
    const origin = window.location.origin
    const pathname = window.location.pathname.includes('/create')
      ? window.location.pathname
      : `${window.location.pathname.replace(/\/$/, '')}/create`
    const redirectUri = origin + pathname
    const scope = 'repo user'
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(redirectUri)}`
    window.location.href = authUrl
  }

  async function checkGitHubUrlParams(routeQuery: any): Promise<boolean> {
    if (routeQuery.github_token) {
      await authenticate(routeQuery.github_token)
      return true
    }

    if (routeQuery.code) {
      githubState.isLoading = true
      githubState.error = ''
      try {
        const config = useRuntimeConfig()
        const clientId = (config.public?.githubClientId as string) || ''

        let res: any = null

        // Try serverless endpoint first, fallback to client-side CORS proxy
        try {
          res = await $fetch('/api/github/oauth', {
            method: 'POST',
            body: { code: routeQuery.code },
          })
        }
        catch {
          // Direct Client-side exchange via CORS proxy without server backend
          res = await $fetch('https://corsproxy.io/?https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            body: {
              client_id: clientId,
              code: routeQuery.code,
            },
          })
        }

        if (res?.error) {
          throw new Error(res.error_description || res.error)
        }

        if (res?.access_token) {
          await authenticate(res.access_token)
          return true
        }
      }
      catch (err: any) {
        githubState.error = err?.data?.message || err?.message || 'Failed to exchange GitHub authorization code'
      }
      finally {
        githubState.isLoading = false
      }
    }
    return false
  }

  async function fetchGitHub(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!githubState.token) {
      throw new Error('GitHub token is missing')
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${githubState.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    }

    const response = await fetch(`https://api.github.com${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      throw new Error(errData.message || `GitHub API error (HTTP ${response.status})`)
    }

    return await response.json()
  }

  async function authenticate(token: string): Promise<boolean> {
    githubState.isLoading = true
    githubState.error = ''
    try {
      githubState.token = token.trim()
      const userData = await fetchGitHub('/user')
      githubState.user = {
        login: userData.login,
        name: userData.name || userData.login,
        avatar_url: userData.avatar_url,
      }

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('gh_token', githubState.token)
        localStorage.setItem('gh_user', JSON.stringify(githubState.user))
      }

      await fetchRepos()
      return true
    }
    catch (err: any) {
      githubState.user = null
      githubState.token = ''
      githubState.error = err?.message || 'Failed to authenticate with GitHub'
      return false
    }
    finally {
      githubState.isLoading = false
    }
  }

  async function fetchRepos(): Promise<void> {
    if (!githubState.token)
      return
    try {
      const data = await fetchGitHub('/user/repos?per_page=100&sort=updated')
      githubState.repos = data.map((r: any) => ({
        name: r.name,
        full_name: r.full_name,
        default_branch: r.default_branch || 'main',
        private: r.private,
      }))

      if (githubState.selectedRepo && !githubState.repos.some(r => r.full_name === githubState.selectedRepo)) {
        githubState.selectedRepo = githubState.repos[0]?.full_name || ''
      }
      else if (!githubState.selectedRepo && githubState.repos.length > 0) {
        githubState.selectedRepo = githubState.repos[0].full_name
      }

      if (githubState.selectedRepo) {
        await fetchBranches()
      }
    }
    catch (err: any) {
      githubState.error = err?.message || 'Failed to fetch repositories'
    }
  }

  async function createRepo(repoName: string, isPrivate = false): Promise<boolean> {
    githubState.isLoading = true
    githubState.error = ''
    try {
      const data = await fetchGitHub('/user/repos', {
        method: 'POST',
        body: JSON.stringify({
          name: repoName.trim(),
          private: isPrivate,
          auto_init: true,
          description: 'CV and Resume repository created with CvXio',
        }),
      })

      githubState.selectedRepo = data.full_name
      githubState.selectedBranch = data.default_branch || 'main'
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('gh_selected_repo', data.full_name)
        localStorage.setItem('gh_selected_branch', githubState.selectedBranch)
      }

      await fetchRepos()
      return true
    }
    catch (err: any) {
      githubState.error = err?.message || 'Failed to create repository'
      return false
    }
    finally {
      githubState.isLoading = false
    }
  }

  async function fetchBranches(): Promise<void> {
    if (!githubState.token || !githubState.selectedRepo)
      return
    try {
      const data = await fetchGitHub(`/repos/${githubState.selectedRepo}/branches?per_page=100`)
      githubState.branches = data.map((b: any) => ({
        name: b.name,
        commit: { sha: b.commit?.sha || '' },
      }))

      if (!githubState.branches.some(b => b.name === githubState.selectedBranch)) {
        const repoObj = githubState.repos.find(r => r.full_name === githubState.selectedRepo)
        githubState.selectedBranch = repoObj?.default_branch || githubState.branches[0]?.name || 'main'
      }

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('gh_selected_repo', githubState.selectedRepo)
        localStorage.setItem('gh_selected_branch', githubState.selectedBranch)
      }

      await fetchFiles()
    }
    catch (err: any) {
      githubState.error = err?.message || 'Failed to fetch branches'
    }
  }

  async function createBranch(newBranchName: string, baseBranchName?: string): Promise<boolean> {
    if (!githubState.selectedRepo)
      return false
    githubState.isLoading = true
    githubState.error = ''
    try {
      const sourceBranch = baseBranchName || githubState.selectedBranch || 'main'
      const baseBranchObj = githubState.branches.find(b => b.name === sourceBranch)
      let parentSha = baseBranchObj?.commit.sha
      if (!parentSha) {
        const repoData = await fetchGitHub(`/repos/${githubState.selectedRepo}/git/ref/heads/${sourceBranch}`)
        parentSha = repoData.object.sha
      }

      await fetchGitHub(`/repos/${githubState.selectedRepo}/git/refs`, {
        method: 'POST',
        body: JSON.stringify({
          ref: `refs/heads/${newBranchName.trim()}`,
          sha: parentSha,
        }),
      })

      githubState.selectedBranch = newBranchName.trim()
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('gh_selected_branch', githubState.selectedBranch)
      }

      await fetchBranches()
      return true
    }
    catch (err: any) {
      githubState.error = err?.message || 'Failed to create new branch'
      return false
    }
    finally {
      githubState.isLoading = false
    }
  }

  async function fetchFiles(path = ''): Promise<void> {
    if (!githubState.token || !githubState.selectedRepo || !githubState.selectedBranch)
      return
    try {
      const data = await fetchGitHub(`/repos/${githubState.selectedRepo}/contents/${path}?ref=${githubState.selectedBranch}`)
      if (Array.isArray(data)) {
        githubState.files = data
          .filter((item: any) => item.type === 'dir' || item.name.endsWith('.json'))
          .map((item: any) => ({
            name: item.name,
            path: item.path,
            sha: item.sha,
            size: item.size,
            type: item.type,
          }))
      }
    }
    catch {
      githubState.files = []
    }
  }

  async function loadFileFromGitHub(filePath: string): Promise<void> {
    githubState.isLoading = true
    githubState.error = ''
    try {
      const data = await fetchGitHub(`/repos/${githubState.selectedRepo}/contents/${filePath}?ref=${githubState.selectedBranch}`)
      const decodedContent = fromBase64(data.content)
      const jsonData = JSON.parse(decodedContent)

      if (jsonData && uploadCVData) {
        uploadCVData(jsonData)
        githubState.activeFilePath = filePath
        githubState.activeFileSha = data.sha
        githubState.savedSnapshot = JSON.parse(JSON.stringify(formSettings.value))
        githubState.isDirty = false

        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('gh_active_file_path', filePath)
          localStorage.setItem('gh_active_file_sha', data.sha)
        }
      }
    }
    catch (err: any) {
      githubState.error = err?.message || 'Failed to load file from GitHub'
    }
    finally {
      githubState.isLoading = false
    }
  }

  async function commitToGitHub(commitMessage: string, customPath?: string): Promise<boolean> {
    githubState.isCommitting = true
    githubState.error = ''
    try {
      let targetPath = customPath?.trim() || githubState.activeFilePath
      if (!targetPath) {
        const name = formSettings.value.name || 'Untitled'
        const lastName = formSettings.value.lastName || 'CV'
        targetPath = `CV_${name}_${lastName}.json`
      }
      if (!targetPath.endsWith('.json')) {
        targetPath += '.json'
      }

      const jsonString = JSON.stringify({ formSettings: formSettings.value }, null, 2)
      const base64Content = toBase64(jsonString)

      const bodyData: Record<string, any> = {
        message: commitMessage.trim() || `feat(cv): update ${targetPath}`,
        content: base64Content,
        branch: githubState.selectedBranch,
      }

      // Include sha if updating an existing file on this path
      if (githubState.activeFilePath === targetPath && githubState.activeFileSha) {
        bodyData.sha = githubState.activeFileSha
      }
      else {
        // Check if file already exists at targetPath to get its sha
        try {
          const existing = await fetchGitHub(`/repos/${githubState.selectedRepo}/contents/${targetPath}?ref=${githubState.selectedBranch}`)
          if (existing?.sha) {
            bodyData.sha = existing.sha
          }
        }
        catch {}
      }

      const resData = await fetchGitHub(`/repos/${githubState.selectedRepo}/contents/${targetPath}`, {
        method: 'PUT',
        body: JSON.stringify(bodyData),
      })

      githubState.activeFilePath = targetPath
      githubState.activeFileSha = resData.content?.sha || ''
      githubState.savedSnapshot = JSON.parse(JSON.stringify(formSettings.value))
      githubState.lastCommittedAt = new Date()
      githubState.isDirty = false

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('gh_active_file_path', targetPath)
        localStorage.setItem('gh_active_file_sha', githubState.activeFileSha)
      }

      await fetchFiles()
      return true
    }
    catch (err: any) {
      githubState.error = err?.message || 'Failed to commit to GitHub'
      return false
    }
    finally {
      githubState.isCommitting = false
    }
  }

  function disconnectGitHub() {
    githubState.token = ''
    githubState.user = null
    githubState.repos = []
    githubState.branches = []
    githubState.files = []
    githubState.activeFilePath = ''
    githubState.activeFileSha = ''
    githubState.savedSnapshot = null
    githubState.isDirty = false
    githubState.error = ''

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('gh_token')
      localStorage.removeItem('gh_user')
      localStorage.removeItem('gh_selected_repo')
      localStorage.removeItem('gh_selected_branch')
      localStorage.removeItem('gh_active_file_path')
      localStorage.removeItem('gh_active_file_sha')
    }
  }

  // Restore on composable initialization
  loadSavedState()
  if (githubState.token && !githubState.repos.length) {
    fetchRepos()
  }

  return {
    githubState,
    authenticate,
    loginWithGitHub,
    checkGitHubUrlParams,
    fetchRepos,
    createRepo,
    fetchBranches,
    createBranch,
    fetchFiles,
    loadFileFromGitHub,
    commitToGitHub,
    disconnectGitHub,
  }
}

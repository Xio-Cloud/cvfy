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

const SKILL_MARKDOWN = `---
name: cvxio-json-builder
description: Instructions and schema specifications for AI agents to convert Markdown CVs or raw resume text into valid CvXio JSON format suitable for direct import. Use when asked to convert resumes into CvXio JSON or build CvXio-compatible JSON files.
---

# CvXio JSON Builder Skill

This skill guides AI agents on how to parse Markdown CVs, resumes, or unformatted candidate profiles into a fully valid \`CvXio\` JSON structure that can be imported directly into the application at \`/create\` via **Upload CV settings (JSON)**.

---

## 1. Top-Level JSON Wrapper

All CV data MUST be wrapped inside a top-level \`"formSettings"\` key:

\`\`\`json
{
  "formSettings": {
    "name": "Jane"
  }
}
\`\`\`

---

## 2. Complete Schema Specification

### 2.1 Profile & Contact Fields
| Key | Type | Default / Required | Description |
| :--- | :--- | :--- | :--- |
| \`name\` | \`string\` | Required | First name of the candidate |
| \`lastName\` | \`string\` | Required | Last / Family name of the candidate |
| \`jobTitle\` | \`string\` | Required | Target position or current title |
| \`email\` | \`string\` | Required | Candidate's email address |
| \`location\` | \`string\` | Required | City, State/Country |
| \`phoneNumber\` | \`string\` | Required | Phone number |
| \`aboutme\` | \`string\` | Required | Summary/Objective paragraph (Markdown supported) |
| \`profileImageDataUri\` | \`string \\| null\` | \`null\` | Base64 Data URI or image path |

### 2.2 Social Links
| Key | Type | Default | Example |
| :--- | :--- | :--- | :--- |
| \`linkedin\` | \`string\` | \`""\` | \`truongthanhquan\` |
| \`github\` | \`string\` | \`""\` | \`Xio-Cloud\` |
| \`twitter\` | \`string\` | \`""\` | \`username\` |
| \`website\` | \`string\` | \`""\` | \`cv.xio.vn\` |

### 2.3 Skills, Languages & Interests
| Key | Type | Details |
| :--- | :--- | :--- |
| \`jobSkills\` | \`string[]\` | Technical/Hard skills (e.g. \`["PHP", "Vue 3", "TypeScript"]\`) |
| \`softSkills\` | \`string[]\` | Personal/Leadership skills (e.g. \`["Leadership", "Mentoring"]\`) |
| \`languages\` | \`Array<{lang: string, level: Level}>\` | \`level\` MUST be one of: \`elementary\`, \`limited-working\`, \`professional-working\`, \`full-professional\`, \`native-bilingual\` |
| \`interests\` | \`string[]\` | Hobbies or areas of interest |

### 2.4 Event Entries (\`work\`, \`education\`, \`projects\`)
Arrays containing experience, education, or project objects with the following schema:

\`\`\`typescript
interface CvEvent {
  id: string // Unique ID (e.g., "work-1", "edu-1")
  title: string // Role title, degree name, or project title
  location: string // Company name, university name, or project link
  from: string // ISO Date string ("YYYY-MM-DDTHH:mm:ss.sssZ")
  to: string // ISO Date string ("YYYY-MM-DDTHH:mm:ss.sssZ")
  current: boolean // true if currently active/ongoing
  displayDate: boolean // true to show dates on CV (default: true)
  summary: string // Markdown formatted description and bullet points
}
\`\`\`

### 2.5 Display Controls & Layout Defaults
Always include these standard display toggles in \`formSettings\`:

\`\`\`json
{
  "layout": "two-column",
  "activeColor": "#5B21B6",
  "displayAbout": true,
  "displaySkills": true,
  "displayJobSkills": true,
  "displaySoftSkills": true,
  "displayLanguages": true,
  "displayInterests": true,
  "displaySocial": true,
  "displayWork": true,
  "displayEducation": true,
  "displayProjects": true,
  "sectionOrder": ["about", "skills", "work", "education", "projects", "social"]
}
\`\`\`

---

## 3. Conversion Instructions for AI Agents

When converting input text or Markdown to CvXio JSON:

1. **Date Parsing**:
   - Convert all dates to UTC ISO strings: \`new Date("2020-01-01").toISOString()\` -> \`"2020-01-01T00:00:00.000Z"\`.
   - If a position is ongoing ("Present" or "Current"), set \`current: true\` and set \`to\` to the current UTC ISO date.

2. **Bullet Points & Markdown**:
   - Format \`summary\` strings using Markdown lists (\`- Bullet point\`) and bold text (\`**Header**\`).
   - Use \`\\n\` line breaks to separate paragraphs and bullet lists inside JSON strings.

3. **Language Levels Mapping**:
   - Native / Bilingual -> \`"native-bilingual"\`
   - Fluent / Full Professional -> \`"full-professional"\`
   - Advanced / Professional Working -> \`"professional-working"\`
   - Intermediate / Limited Working -> \`"limited-working"\`
   - Beginner / Elementary -> \`"elementary"\`

4. **Clean IDs**:
   - Assign unique string IDs to each item in \`work\`, \`education\`, and \`projects\` (e.g. \`"work-1"\`, \`"work-2"\`, \`"edu-1"\`).

---

## 4. Verification Check

Before outputting JSON, ensure:
- Root object has key \`"formSettings"\`.
- All \`from\` and \`to\` properties are valid ISO date strings.
- All language levels match one of the 5 allowed enum values.
- Array fields (\`jobSkills\`, \`softSkills\`, \`work\`, \`education\`, \`projects\`) are non-null arrays.
`

function generateReadmeContent(repoName: string, hasSkill: boolean): string {
  return `# ${repoName} 📄

This repository stores and version-controls resume files created with **[CvXio](https://cv.xio.vn)**.

---

## 🚀 How to Use with CvXio

1. Open the **[CvXio Editor](https://cv.xio.vn/create)**.
2. Sign in with GitHub under **GitHub Storage**.
3. Select this repository (\`${repoName}\`) and target branch.
4. Load, edit, or commit your resumes with custom commit messages directly to GitHub.

---

## 🤖 AI Agent Integration

${hasSkill ? `This repository includes an AI Agent Skill at \`.agents/skills/cvxio-json-builder/SKILL.md\`.` : `To add AI Agent skills to this repository, click **➕ Add AI Agent Skill** in the CvXio GitHub panel.`}

When using AI coding assistants (such as **Antigravity**, **Cursor**, **GitHub Copilot Workspace**, **Claude Code**, or **Windsurf**):

1. Open this repository in your AI coding assistant.
2. Ask your AI agent:
   > *"Read my resume text or LinkedIn profile and generate a new CvXio JSON resume file \`CV_Jane_Doe.json\` in this repository."*
3. The AI agent will automatically detect \`.agents/skills/cvxio-json-builder/SKILL.md\` and output a fully valid CvXio JSON file ready to load directly into **[cv.xio.vn](https://cv.xio.vn)**.
`
}

export function useGitHubStorage() {
  const { formSettings, uploadCVData } = useCvState()

  function hasGitHubFormChanged(): boolean {
    if (!githubState.activeFilePath || !githubState.token) {
      return false
    }
    if (!githubState.savedSnapshot) {
      githubState.savedSnapshot = JSON.parse(JSON.stringify(formSettings.value))
      return false
    }
    return JSON.stringify(formSettings.value) !== JSON.stringify(githubState.savedSnapshot)
  }

  // Track unsaved changes relative to last loaded/committed GitHub snapshot
  watch(
    formSettings,
    () => {
      if (!githubState.token) {
        githubState.isDirty = false
        return
      }

      if (githubState.activeFilePath) {
        githubState.isDirty = hasGitHubFormChanged()
      }
      else {
        githubState.isDirty = true
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

    if (githubState.token) {
      githubState.savedSnapshot = null
      githubState.isDirty = !githubState.activeFilePath
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
        const res: any = await $fetch('/api/github/oauth', {
          method: 'POST',
          body: { code: routeQuery.code },
        })

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

  async function addAiSkillToRepo(targetRepo?: string, targetBranch?: string): Promise<boolean> {
    const repo = targetRepo || githubState.selectedRepo
    const branch = targetBranch || githubState.selectedBranch || 'main'
    if (!repo)
      return false

    githubState.isLoading = true
    githubState.error = ''
    try {
      const skillPath = '.agents/skills/cvxio-json-builder/SKILL.md'
      const base64Skill = toBase64(SKILL_MARKDOWN)

      const bodyData: Record<string, any> = {
        message: 'feat(ai): add cvxio-json-builder AI Agent skill',
        content: base64Skill,
        branch,
      }

      try {
        const existing = await fetchGitHub(`/repos/${repo}/contents/${skillPath}?ref=${branch}`)
        if (existing?.sha) {
          bodyData.sha = existing.sha
        }
      }
      catch {}

      await fetchGitHub(`/repos/${repo}/contents/${skillPath}`, {
        method: 'PUT',
        body: JSON.stringify(bodyData),
      })

      // Update README.md
      const repoNameOnly = repo.split('/')[1] || repo
      const readmePath = 'README.md'
      const base64Readme = toBase64(generateReadmeContent(repoNameOnly, true))
      const readmeBody: Record<string, any> = {
        message: 'docs: update README with CvXio AI Agent instructions',
        content: base64Readme,
        branch,
      }
      try {
        const existingReadme = await fetchGitHub(`/repos/${repo}/contents/${readmePath}?ref=${branch}`)
        if (existingReadme?.sha) {
          readmeBody.sha = existingReadme.sha
        }
      }
      catch {}

      await fetchGitHub(`/repos/${repo}/contents/${readmePath}`, {
        method: 'PUT',
        body: JSON.stringify(readmeBody),
      })

      await fetchFiles()
      return true
    }
    catch (err: any) {
      githubState.error = err?.message || 'Failed to add AI Agent skill to repository'
      return false
    }
    finally {
      githubState.isLoading = false
    }
  }

  async function createRepo(repoName: string, isPrivate = false, includeSkill = true): Promise<boolean> {
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

      if (includeSkill) {
        await addAiSkillToRepo(data.full_name, data.default_branch || 'main')
      }
      else {
        // Create clean README without skill text
        const readmePath = 'README.md'
        const base64Readme = toBase64(generateReadmeContent(repoName.trim(), false))
        const readmeBody: Record<string, any> = {
          message: 'docs: add README with CvXio instructions',
          content: base64Readme,
          branch: data.default_branch || 'main',
        }
        try {
          const existingReadme = await fetchGitHub(`/repos/${data.full_name}/contents/${readmePath}?ref=${data.default_branch || 'main'}`)
          if (existingReadme?.sha) {
            readmeBody.sha = existingReadme.sha
          }
        }
        catch {}
        await fetchGitHub(`/repos/${data.full_name}/contents/${readmePath}`, {
          method: 'PUT',
          body: JSON.stringify(readmeBody),
        })
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
        uploadCVData(jsonData, true)
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
    if (!githubState.token || !githubState.selectedRepo) {
      githubState.error = 'Please select a repository to commit'
      return false
    }

    let targetPath = customPath?.trim() || githubState.activeFilePath
    if (!targetPath) {
      const name = formSettings.value.name || 'Untitled'
      const lastName = formSettings.value.lastName || 'CV'
      targetPath = `CV_${name}_${lastName}.json`
    }
    if (!targetPath.endsWith('.json')) {
      targetPath += '.json'
    }

    // Only return early if modifying an active file with no unsaved changes
    if (githubState.activeFilePath && targetPath === githubState.activeFilePath && !githubState.isDirty) {
      return false
    }

    githubState.isCommitting = true
    githubState.error = ''
    try {
      const jsonString = JSON.stringify({ formSettings: formSettings.value }, null, 2)
      const base64Content = toBase64(jsonString)

      const bodyData: Record<string, any> = {
        message: commitMessage.trim() || `feat(cv): update ${targetPath}`,
        content: base64Content,
        branch: githubState.selectedBranch || 'main',
      }

      if (githubState.activeFilePath === targetPath && githubState.activeFileSha) {
        bodyData.sha = githubState.activeFileSha
      }
      else {
        try {
          const existing = await fetchGitHub(`/repos/${githubState.selectedRepo}/contents/${targetPath}?ref=${githubState.selectedBranch || 'main'}`)
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

  function undoGitHubChanges() {
    if (githubState.savedSnapshot && uploadCVData) {
      uploadCVData({ formSettings: githubState.savedSnapshot })
      githubState.isDirty = false
      githubState.error = ''
    }
  }

  export function resetActiveGitHubFile() {
    githubState.activeFilePath = ''
    githubState.activeFileSha = ''
    githubState.savedSnapshot = null
    githubState.isDirty = false
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('gh_active_file_path')
      localStorage.removeItem('gh_active_file_sha')
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
    addAiSkillToRepo,
    fetchBranches,
    createBranch,
    fetchFiles,
    loadFileFromGitHub,
    commitToGitHub,
    undoGitHubChanges,
    resetActiveGitHubFile,
    disconnectGitHub,
  }
}

import { reactive, watch } from 'vue'
import { useCvState } from '~/data/useCvState'

const SCOPES = 'https://www.googleapis.com/auth/drive.file'
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
const FOLDER_NAME = 'CvXio'

const driveState = reactive({
  isSignedIn: false,
  accessToken: '' as string,
  userEmail: '' as string,
  activeFileId: '' as string,
  activeFileName: '' as string,
  activeFolderId: '' as string,
  isInitializing: false,
  isAuthorizing: false,
  isSaving: false,
  isLoadingFile: false,
  isDirty: false,
  autoSaveEnabled: true,
  lastSavedAt: null as Date | null,
  savedSnapshot: null as any,
  clientId: '' as string,
  apiKey: '' as string,
  error: '' as string,
})

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null
let lastAutoSaveTime = 0

export function useGoogleDrive() {
  const { formSettings, uploadCVData } = useCvState()
  let tokenClient: any = null

  // Restore credentials & access token synchronously upon composable initialization
  loadSavedCredentials()

  function hasFormChanged(): boolean {
    if (!driveState.savedSnapshot)
      return true
    return JSON.stringify(formSettings.value) !== JSON.stringify(driveState.savedSnapshot)
  }

  // Watch formSettings changes: only set dirty and auto-save if actual data changed
  watch(
    formSettings,
    () => {
      if (driveState.activeFileId && (driveState.accessToken || driveState.isSignedIn)) {
        if (hasFormChanged()) {
          driveState.isDirty = true
          if (driveState.autoSaveEnabled) {
            if (autoSaveTimer)
              clearTimeout(autoSaveTimer)

            // Debounce 5 seconds after user stops typing
            autoSaveTimer = setTimeout(() => {
              const now = Date.now()
              if (driveState.isDirty && !driveState.isSaving && driveState.activeFileId) {
                // Minimum 15 seconds gap between consecutive auto-saves to respect Google API limits
                if (now - lastAutoSaveTime >= 15000) {
                  lastAutoSaveTime = now
                  saveToDrive(false)
                }
                else {
                  const remainingWait = 15000 - (now - lastAutoSaveTime)
                  autoSaveTimer = setTimeout(() => {
                    if (driveState.isDirty && !driveState.isSaving && driveState.activeFileId) {
                      lastAutoSaveTime = Date.now()
                      saveToDrive(false)
                    }
                  }, remainingWait)
                }
              }
            }, 5000)
          }
        }
        else {
          driveState.isDirty = false
        }
      }
    },
    { deep: true },
  )

  function loadSavedCredentials() {
    const config = useRuntimeConfig()
    const defaultClientId = (config.public?.googleClientId as string) || ''
    const defaultApiKey = (config.public?.googleApiKey as string) || ''

    if (typeof localStorage !== 'undefined') {
      driveState.clientId = localStorage.getItem('gdrive_client_id') || defaultClientId
      driveState.apiKey = localStorage.getItem('gdrive_api_key') || defaultApiKey
      driveState.activeFileId = localStorage.getItem('gdrive_active_file_id') || ''
      driveState.activeFileName = localStorage.getItem('gdrive_active_file_name') || ''
      const savedAutoSave = localStorage.getItem('gdrive_auto_save')
      if (savedAutoSave !== null) {
        driveState.autoSaveEnabled = savedAutoSave === 'true'
      }

      const isSignedInFlag = localStorage.getItem('gdrive_is_signed_in') === 'true'
      driveState.isSignedIn = isSignedInFlag

      const token = localStorage.getItem('gdrive_access_token') || ''
      const expiresAt = Number.parseInt(localStorage.getItem('gdrive_token_expires_at') || '0', 10)
      if (token && Date.now() < expiresAt) {
        driveState.accessToken = token
        driveState.isSignedIn = true
      }
      else {
        localStorage.removeItem('gdrive_access_token')
        localStorage.removeItem('gdrive_token_expires_at')
      }
    }
    else {
      driveState.clientId = defaultClientId
      driveState.apiKey = defaultApiKey
    }
  }

  function setAutoSave(enabled: boolean) {
    driveState.autoSaveEnabled = enabled
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('gdrive_auto_save', String(enabled))
    }
  }

  function setCredentials(clientId: string, apiKey: string) {
    driveState.clientId = clientId.trim()
    driveState.apiKey = apiKey.trim()
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('gdrive_client_id', driveState.clientId)
      localStorage.setItem('gdrive_api_key', driveState.apiKey)
    }
  }

  function loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve()
        return
      }
      const script = document.createElement('script')
      script.src = src
      script.async = true
      script.defer = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error(`Failed to load script ${src}`))
      document.head.appendChild(script)
    })
  }

  async function initGoogleDrive(): Promise<boolean> {
    loadSavedCredentials()
    if (driveState.isInitializing)
      return true
    driveState.isInitializing = true
    driveState.error = ''

    try {
      await Promise.all([
        loadScript('https://accounts.google.com/gsi/client'),
        loadScript('https://apis.google.com/js/api.js'),
      ])

      await new Promise<void>((resolve) => {
        const windowGapi = (window as any).gapi
        if (windowGapi) {
          windowGapi.load('client:picker', async () => {
            if (driveState.apiKey) {
              await windowGapi.client.init({
                apiKey: driveState.apiKey,
                discoveryDocs: [DISCOVERY_DOC],
              })
            }
            resolve()
          })
        }
        else {
          resolve()
        }
      })

      driveState.isInitializing = false
      return true
    }
    catch (err: any) {
      driveState.isInitializing = false
      driveState.error = err?.message || 'Failed to initialize Google Drive scripts'
      return false
    }
  }

  function requestAccessToken(): Promise<string> {
    return new Promise((resolve, reject) => {
      const windowGoogle = (window as any).google
      if (!windowGoogle?.accounts?.oauth2) {
        reject(new Error('Google Identity Services client script not loaded'))
        return
      }

      if (!driveState.clientId) {
        reject(new Error('Google Client ID is missing'))
        return
      }

      tokenClient = windowGoogle.accounts.oauth2.initTokenClient({
        client_id: driveState.clientId,
        scope: SCOPES,
        callback: (response: any) => {
          if (response.error) {
            reject(new Error(response.error))
            return
          }
          const expiresInSeconds = response.expires_in || 3600
          const expiresAt = Date.now() + expiresInSeconds * 1000 - 60000 // 1 minute safety margin
          driveState.accessToken = response.access_token
          driveState.isSignedIn = true

          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('gdrive_access_token', response.access_token)
            localStorage.setItem('gdrive_token_expires_at', expiresAt.toString())
            localStorage.setItem('gdrive_is_signed_in', 'true')
          }

          resolve(response.access_token)
        },
      })

      tokenClient.requestAccessToken({ prompt: '' })
    })
  }

  async function authorizeDrive(forcePrompt = false): Promise<string> {
    loadSavedCredentials()
    if (!forcePrompt && driveState.accessToken) {
      return driveState.accessToken
    }
    await initGoogleDrive()
    return await requestAccessToken()
  }

  async function ensureAccessToken(): Promise<string> {
    if (driveState.accessToken) {
      return driveState.accessToken
    }
    return await authorizeDrive()
  }

  async function getOrCreateAppFolder(token: string): Promise<string | null> {
    try {
      // 1. Search for existing folder named "CvXio"
      const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name = '${FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false&fields=files(id, name)`
      const searchRes = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (searchRes.ok) {
        const searchData = await searchRes.json()
        if (searchData.files && searchData.files.length > 0) {
          driveState.activeFolderId = searchData.files[0].id
          return searchData.files[0].id
        }
      }

      // 2. Folder does not exist, create it
      const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: FOLDER_NAME,
          mimeType: 'application/vnd.google-apps.folder',
        }),
      })

      if (createRes.ok) {
        const folderData = await createRes.json()
        driveState.activeFolderId = folderData.id
        return folderData.id
      }
    }
    catch {}
    return null
  }

  async function openPicker(): Promise<void> {
    try {
      driveState.error = ''
      await initGoogleDrive()
      const token = await ensureAccessToken()

      const windowGoogle = (window as any).google
      if (!windowGoogle?.picker) {
        throw new Error('Google Picker API not loaded')
      }

      const pickerBuilder = new windowGoogle.picker.PickerBuilder()

      // 1. App Folder View (if CvXio folder exists)
      const folderId = await getOrCreateAppFolder(token)
      if (folderId) {
        const appFolderView = new windowGoogle.picker.DocsView()
        appFolderView.setParent(folderId)
        appFolderView.setIncludeFolders(true)
        pickerBuilder.addView(appFolderView)
      }

      // 2. All Files View with full folder structure navigation
      const docsView = new windowGoogle.picker.DocsView(windowGoogle.picker.ViewId.DOCS)
      docsView.setIncludeFolders(true)
      docsView.setMimeTypes('application/json,text/plain,application/octet-stream,text/json')
      pickerBuilder.addView(docsView)

      // 3. Folders View
      const foldersView = new windowGoogle.picker.DocsView(windowGoogle.picker.ViewId.FOLDERS)
      foldersView.setIncludeFolders(true)
      foldersView.setSelectFolderEnabled(true)
      pickerBuilder.addView(foldersView)

      pickerBuilder
        .setOAuthToken(token)
        .setCallback(async (data: any) => {
          if (data.action === windowGoogle.picker.Action.PICKED) {
            const fileDoc = data.docs[0]
            const fileId = fileDoc.id
            const fileName = fileDoc.name
            await loadFileFromDrive(fileId, fileName)
          }
        })

      if (driveState.apiKey) {
        pickerBuilder.setDeveloperKey(driveState.apiKey)
      }

      const picker = pickerBuilder.build()
      picker.setVisible(true)
    }
    catch (err: any) {
      driveState.error = err?.message || 'Error opening Google Drive Picker'
    }
  }

  async function loadFileFromDrive(fileId: string, fileName?: string): Promise<void> {
    driveState.isLoadingFile = true
    driveState.error = ''
    try {
      const token = await ensureAccessToken()
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to download file from Drive`)
      }

      const data = await response.json()
      if (data && uploadCVData) {
        uploadCVData(data)
        driveState.activeFileId = fileId
        driveState.activeFileName = fileName || `CV_${formSettings.value.name}_${formSettings.value.lastName}.json`
        driveState.savedSnapshot = JSON.parse(JSON.stringify(formSettings.value))
        driveState.isDirty = false
        driveState.isSignedIn = true

        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('gdrive_active_file_id', driveState.activeFileId)
          localStorage.setItem('gdrive_active_file_name', driveState.activeFileName)
          localStorage.setItem('gdrive_is_signed_in', 'true')
        }
      }
    }
    catch (err: any) {
      driveState.error = err?.message || 'Error loading file from Google Drive'
    }
    finally {
      driveState.isLoadingFile = false
    }
  }

  async function saveToDrive(asNewFile = false, customFileName?: string): Promise<void> {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
      autoSaveTimer = null
    }

    driveState.isSaving = true
    driveState.error = ''
    try {
      await initGoogleDrive()
      const token = await ensureAccessToken()

      let folderId: string | null = null
      if (!driveState.activeFileId || asNewFile) {
        folderId = await getOrCreateAppFolder(token)
      }

      let fileName = customFileName?.trim()
      if (!fileName) {
        fileName = `CV_${formSettings.value.name || 'Untitled'}_${formSettings.value.lastName || 'CV'}.json`
      }
      if (!fileName.endsWith('.json')) {
        fileName += '.json'
      }

      const jsonContent = JSON.stringify({ formSettings: formSettings.value }, null, 2)
      const blob = new Blob([jsonContent], { type: 'application/json' })

      const metadata: Record<string, any> = {
        name: fileName,
        mimeType: 'application/json',
      }

      if (folderId && (!driveState.activeFileId || asNewFile)) {
        metadata.parents = [folderId]
      }

      const form = new FormData()
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
      form.append('file', blob)

      let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart'
      let method = 'POST'

      if (driveState.activeFileId && !asNewFile) {
        url = `https://www.googleapis.com/upload/drive/v3/files/${driveState.activeFileId}?uploadType=multipart`
        method = 'PATCH'
      }

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to save file to Google Drive`)
      }

      const result = await response.json()
      driveState.activeFileId = result.id
      driveState.activeFileName = fileName
      driveState.savedSnapshot = JSON.parse(JSON.stringify(formSettings.value))
      driveState.lastSavedAt = new Date()
      driveState.isDirty = false
      driveState.isSignedIn = true

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('gdrive_active_file_id', result.id)
        localStorage.setItem('gdrive_active_file_name', fileName)
        localStorage.setItem('gdrive_is_signed_in', 'true')
      }
    }
    catch (err: any) {
      driveState.error = err?.message || 'Error saving file to Google Drive'
    }
    finally {
      driveState.isSaving = false
    }
  }

  function undoChanges() {
    if (driveState.savedSnapshot && uploadCVData) {
      uploadCVData({ formSettings: driveState.savedSnapshot })
      driveState.isDirty = false
      driveState.error = ''
    }
  }

  // Handle Google Drive "Open with..." URL parameters (draw.io style ?state=... or ?fileId=...)
  async function checkDriveUrlParams(routeQuery: any) {
    if (routeQuery.fileId) {
      await loadFileFromDrive(routeQuery.fileId)
      return
    }

    if (routeQuery.state) {
      try {
        const stateObj = JSON.parse(routeQuery.state)
        if (stateObj.action === 'open' && Array.isArray(stateObj.ids) && stateObj.ids.length > 0) {
          await loadFileFromDrive(stateObj.ids[0])
        }
      }
      catch {}
    }
  }

  function signOutDrive() {
    if (driveState.accessToken) {
      const windowGoogle = (window as any).google
      if (windowGoogle?.accounts?.oauth2?.revoke) {
        windowGoogle.accounts.oauth2.revoke(driveState.accessToken, () => {})
      }
    }
    driveState.isSignedIn = false
    driveState.accessToken = ''
    driveState.activeFileId = ''
    driveState.activeFileName = ''
    driveState.savedSnapshot = null
    driveState.isDirty = false
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('gdrive_is_signed_in')
      localStorage.removeItem('gdrive_access_token')
      localStorage.removeItem('gdrive_token_expires_at')
      localStorage.removeItem('gdrive_active_file_id')
      localStorage.removeItem('gdrive_active_file_name')
    }
  }

  return {
    driveState,
    initGoogleDrive,
    setCredentials,
    loadSavedCredentials,
    openPicker,
    loadFileFromDrive,
    saveToDrive,
    undoChanges,
    setAutoSave,
    authorizeDrive,
    checkDriveUrlParams,
    signOutDrive,
  }
}

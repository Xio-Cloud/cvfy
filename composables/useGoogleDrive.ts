import { reactive } from 'vue'
import { useCvState } from '~/data/useCvState'

const SCOPES = 'https://www.googleapis.com/auth/drive.file'
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'

const driveState = reactive({
  accessToken: '' as string,
  userEmail: '' as string,
  activeFileId: '' as string,
  activeFileName: '' as string,
  isInitializing: false,
  isAuthorizing: false,
  isSaving: false,
  isLoadingFile: false,
  lastSavedAt: null as Date | null,
  clientId: '' as string,
  apiKey: '' as string,
  error: '' as string,
})

export function useGoogleDrive() {
  const { formSettings, uploadCVData } = useCvState()
  let tokenClient: any = null

  function loadSavedCredentials() {
    if (typeof localStorage !== 'undefined') {
      driveState.clientId = localStorage.getItem('gdrive_client_id') || ''
      driveState.apiKey = localStorage.getItem('gdrive_api_key') || ''
      driveState.activeFileId = localStorage.getItem('gdrive_active_file_id') || ''
      driveState.activeFileName = localStorage.getItem('gdrive_active_file_name') || ''
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
          driveState.accessToken = response.access_token
          resolve(response.access_token)
        },
      })

      tokenClient.requestAccessToken({ prompt: 'consent' })
    })
  }

  async function ensureAccessToken(): Promise<string> {
    if (driveState.accessToken) {
      return driveState.accessToken
    }
    return await requestAccessToken()
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

      const view = new windowGoogle.picker.View(windowGoogle.picker.ViewId.DOCS)
      view.setMimeTypes('application/json')

      const pickerBuilder = new windowGoogle.picker.PickerBuilder()
        .addView(view)
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
        driveState.activeFileName = fileName || fileDocName(fileId)
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('gdrive_active_file_id', driveState.activeFileId)
          localStorage.setItem('gdrive_active_file_name', driveState.activeFileName)
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

  function fileDocName(_fileId: string): string {
    return `CV_${formSettings.value.name}_${formSettings.value.lastName}.json`
  }

  async function saveToDrive(): Promise<void> {
    driveState.isSaving = true
    driveState.error = ''
    try {
      await initGoogleDrive()
      const token = await ensureAccessToken()

      const fileName = `CV_${formSettings.value.name || 'Untitled'}_${formSettings.value.lastName || 'CV'}.json`
      const jsonContent = JSON.stringify({ formSettings: formSettings.value }, null, 2)
      const blob = new Blob([jsonContent], { type: 'application/json' })

      const metadata = {
        name: fileName,
        mimeType: 'application/json',
      }

      const form = new FormData()
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
      form.append('file', blob)

      let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart'
      let method = 'POST'

      if (driveState.activeFileId) {
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
      driveState.lastSavedAt = new Date()

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('gdrive_active_file_id', result.id)
        localStorage.setItem('gdrive_active_file_name', fileName)
      }
    }
    catch (err: any) {
      driveState.error = err?.message || 'Error saving file to Google Drive'
    }
    finally {
      driveState.isSaving = false
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
  }
}

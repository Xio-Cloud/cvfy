# Step-by-Step Guide: Creating Google OAuth Client ID & API Key for CvXio

Follow this guide to create a Google OAuth 2.0 Client ID and API Key in the **Google Cloud Console** for your CvXio deployment (`http://cv.xio.vn` or local development).

---

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project selector dropdown at the top navigation bar.
3. Click **New Project**.
4. Enter a project name (e.g., `CvXio-Drive-Sync`) and click **Create**.

---

## Step 2: Enable Google Drive & Picker APIs

1. In the left sidebar, navigate to **APIs & Services** > **Library**.
2. Search for **Google Drive API**, select it, and click **Enable**.
3. Return to the Library, search for **Google Picker API**, select it, and click **Enable**.

---

## Step 3: Configure the OAuth Consent Screen

1. In the left sidebar, go to **APIs & Services** > **OAuth consent screen**.
2. Choose **User Type**: `External` and click **Create**.
3. Fill in the required fields:
   - **App name**: `CvXio`
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
4. Click **Save and Continue**.
5. Under **Scopes**, click **Add or Remove Scopes**:
   - Filter or search for `https://www.googleapis.com/auth/drive.file` and check the box.
   - Click **Update** and then **Save and Continue**.
6. Under **Test Users** (if app status is Testing), add your Google email address so you can sign in during development.

---

## Step 4: Create OAuth 2.0 Client ID

1. In the left sidebar, go to **APIs & Services** > **Credentials**.
2. Click **+ Create Credentials** at the top and select **OAuth client ID**.
3. Set **Application type** to **Web application**.
4. Name: `CvXio Web Client`.
5. Under **Authorized JavaScript origins**, click **+ Add URI** and add:
   - `http://cv.xio.vn`
   - `http://localhost:3000` (for local development)
6. Under **Authorized redirect URIs**, click **+ Add URI** and add:
   - `http://cv.xio.vn`
   - `http://localhost:3000`
7. Click **Create**.
8. Copy your generated **Client ID** (format: `123456789-xxxxxxxx.apps.googleusercontent.com`).

---

## Step 5: Create API Key (Optional, for Google Picker)

1. On the **Credentials** page, click **+ Create Credentials** > **API key**.
2. Copy the generated **API Key**.
3. Click **Edit API key**:
   - Under **API restrictions**, select **Restrict key**.
   - Check **Google Drive API** and **Google Picker API**.
   - Click **Save**.

---

## Step 6: Configure Environment Variables

### Option A: Cloudflare Pages / Deployment Environment
In your Cloudflare Pages dashboard (under **Settings** > **Environment Variables**), add:

```env
NUXT_PUBLIC_GOOGLE_CLIENT_ID = 123456789-xxxxxxxx.apps.googleusercontent.com
NUXT_PUBLIC_GOOGLE_API_KEY    = AIzaSyX...
```

### Option B: Local Development (`.env`)
Create a `.env` file in the root of your project directory:

```env
NUXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-xxxxxxxx.apps.googleusercontent.com
NUXT_PUBLIC_GOOGLE_API_KEY=AIzaSyX...
```

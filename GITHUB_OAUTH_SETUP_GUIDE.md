# Step-by-Step Guide: Creating GitHub OAuth App Credentials for CvXio

Follow this guide to create a **GitHub OAuth App** and configure your **GitHub Client ID** and **GitHub Client Secret** securely.

---

## 1. How to Create a GitHub OAuth App

1. Go to your GitHub account **Settings**:
   👉 [https://github.com/settings/developers](https://github.com/settings/developers)
2. In the left sidebar, click **OAuth Apps**.
3. Click **Register a new application** (or **New OAuth App**).
4. Fill in the application details:
   - **Application name**: `CvXio`
   - **Homepage URL**: `http://cv.xio.vn` (or `http://localhost:3000` for local dev)
   - **Authorization callback URL**: `http://cv.xio.vn/create` (or `http://localhost:3000/create` for local dev)
5. Click **Register application**.

---

## 2. Generate Client ID & Client Secret

1. After registration, copy your **Client ID** (e.g. `Iv1.xxxxxxxxxxxxxxxx`).
2. Click **Generate a new client secret**.
3. Copy the generated **Client Secret** immediately (e.g. `6789abcdef0123456789...`).
   > ⚠️ **Warning**: GitHub will only show the Client Secret once. Store it securely!

---

## 3. Environment Variable Security Guidelines

### 🔒 Critical Security Principle
- **Client IDs** (`NUXT_PUBLIC_GITHUB_CLIENT_ID`, `NUXT_PUBLIC_GOOGLE_CLIENT_ID`) are public and sent to user browsers to launch OAuth authorization windows.
- **Client Secrets** (`NUXT_GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_SECRET`) are **confidential credentials**. They must **NEVER** be:
  - Included in client-side JavaScript bundles (`runtimeConfig.public`).
  - Committed to public Git repositories (`.env` is gitignored).
  - Exposed in public HTML/JS code.

---

## 4. Setting Environment Variables

### Local Development (`.env` file)
Add the keys to your local `.env` file (which is gitignored):

```env
# Public Credentials (Sent to browser)
NUXT_PUBLIC_GITHUB_CLIENT_ID=your-github-client-id
NUXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Server-Only Secret Credentials (NEVER sent to browser)
NUXT_GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Production Deployment (Cloudflare Pages / GitHub Actions)
1. Go to your repository **Settings** > **Secrets and variables** > **Actions**.
2. Add these repository secrets:
   - `NUXT_PUBLIC_GITHUB_CLIENT_ID`
   - `NUXT_GITHUB_CLIENT_SECRET`
3. In **Cloudflare Pages Dashboard**:
   - Navigate to **Settings** > **Environment variables**.
   - Add `NUXT_GITHUB_CLIENT_SECRET` as an encrypted Secret.

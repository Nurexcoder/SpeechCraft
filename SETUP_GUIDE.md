# Google Cloud Service Account Setup Guide

This guide will walk you through creating a Google Cloud service account for the Text-to-Speech API.

## Step-by-Step Instructions

### Step 1: Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account

### Step 2: Create or Select a Project

1. Click on the project dropdown at the top of the page
2. Either:
   - **Select an existing project**, OR
   - **Click "New Project"** to create a new one
     - Enter a project name (e.g., "tts-app")
     - Click "Create"
     - Wait for the project to be created

### Step 3: Enable the Text-to-Speech API

1. In the left sidebar, go to **APIs & Services** > **Library**
2. Search for "Cloud Text-to-Speech API"
3. Click on **Cloud Text-to-Speech API**
4. Click the **Enable** button
5. Wait for the API to be enabled (this may take a minute)

### Step 4: Enable the Gemini API (for preprocessing)

1. Still in **APIs & Services** > **Library**
2. Search for "Generative Language API" or "Gemini API"
3. Click on it and click **Enable**

### Step 5: Create a Service Account

1. In the left sidebar, go to **IAM & Admin** > **Service Accounts**
2. Click the **+ CREATE SERVICE ACCOUNT** button at the top
3. Fill in the details:
   - **Service account name**: `tts-service` (or any name you prefer)
   - **Service account ID**: Will auto-fill (you can change it if needed)
   - **Description**: "Service account for Text-to-Speech API" (optional)
4. Click **CREATE AND CONTINUE**

### Step 6: Grant Permissions

1. In the **Grant this service account access to project** section:
   - Click **Select a role** dropdown
   - Search for and select: **Cloud Text-to-Speech API User**
   - (This role gives permission to use the TTS API)
2. Click **CONTINUE**
3. Click **DONE** (you can skip the optional step)

### Step 7: Create and Download the Key

1. You should now see your service account in the list
2. Click on the service account email/name to open it
3. Go to the **KEYS** tab
4. Click **ADD KEY** > **Create new key**
5. Select **JSON** as the key type
6. Click **CREATE**
7. A JSON file will automatically download to your computer
   - **Important**: Keep this file secure! It contains sensitive credentials.

### Step 8: Get Your Project ID

1. In Google Cloud Console, click on the project dropdown at the top
2. Your **Project ID** is shown next to the project name
   - It looks like: `my-project-123456`
   - Copy this value

### Step 9: Create API Key for Gemini (Optional but Recommended)

1. Go to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **API key**
3. Copy the generated API key
4. (Optional) Click **Restrict key** to limit which APIs it can access
   - Under "API restrictions", select "Restrict key"
   - Check "Generative Language API"
   - Click "Save"

### Step 10: Set Up Your .env.local File

1. In your project root directory, create a file named `.env.local`
2. Place the downloaded JSON key file in your project root (e.g., `google-credentials.json`)
   - **Important**: Add `google-credentials.json` to your `.gitignore` file!
3. Add the following to `.env.local`:

```env
# Service Account Credentials (for Text-to-Speech)
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
GOOGLE_PROJECT_ID=your-project-id-here

# API Key (for Gemini preprocessing)
GOOGLE_API_KEY=your-api-key-here
```

**Replace:**
- `your-project-id-here` with your actual Project ID from Step 8
- `your-api-key-here` with your API key from Step 9
- `./google-credentials.json` with the actual path to your downloaded JSON file

### Example .env.local File

```env
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
GOOGLE_PROJECT_ID=my-tts-project-123456
GOOGLE_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567
```

## Alternative: Using Environment Variable Instead of File

If you prefer not to store the JSON file in your project:

1. Open the downloaded JSON file
2. Copy its entire contents
3. In `.env.local`, add:

```env
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key":"..."}
GOOGLE_PROJECT_ID=your-project-id-here
GOOGLE_API_KEY=your-api-key-here
```

**Note**: Make sure the entire JSON is on one line when pasting into the .env file.

## Security Best Practices

1. ✅ **Never commit** `.env.local` or `google-credentials.json` to Git
2. ✅ Add both to your `.gitignore` file
3. ✅ Keep your service account keys secure
4. ✅ Restrict API keys to only the APIs you need
5. ✅ Rotate keys periodically if compromised

## Verify Your Setup

After setting up, run:

```bash
npm install
npm run dev
```

Try converting some text to speech. If you see authentication errors, double-check:
- The JSON file path is correct
- The Project ID matches your Google Cloud project
- The Text-to-Speech API is enabled
- The service account has the correct role

## Troubleshooting

### Error: "Could not load the default credentials"
- Check that `GOOGLE_APPLICATION_CREDENTIALS` points to the correct file path
- Verify the JSON file is valid JSON

### Error: "Permission denied"
- Ensure the service account has the "Cloud Text-to-Speech API User" role
- Verify the Text-to-Speech API is enabled in your project

### Error: "API keys are not supported"
- This means you're trying to use an API key for TTS (which doesn't work)
- Make sure you've set up the service account credentials correctly

## Need Help?

- [Google Cloud Text-to-Speech Documentation](https://cloud.google.com/text-to-speech/docs)
- [Service Account Best Practices](https://cloud.google.com/iam/docs/best-practices-service-accounts)


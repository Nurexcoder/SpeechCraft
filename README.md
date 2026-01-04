# Text to Speech App

A Next.js application that converts text to speech using Google Cloud Text-to-Speech API. Users can input text, convert it to audio, and download the generated MP3 file.

## Features

- ✨ Clean and modern UI
- 🎤 Text to speech conversion using Google TTS
- 🎙️ Voice selection with 30+ female voices across multiple languages
- 🔒 Password protection for secure access
- 📥 Download audio files as MP3
- 🎨 Responsive design with Tailwind CSS
- ⚡ Fast and efficient API routes
- 🌊 Streaming audio playback

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   
   Create a `.env.local` file in the root directory and add:
   ```
   GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key":"..."}
   GOOGLE_PROJECT_ID=your-project-id
   GOOGLE_API_KEY=your_google_api_key_here
   APP_PASSWORD=password
   ```
   
   **Note:** 
   - `APP_PASSWORD` is the password required to access the application. Change it to your preferred password.
   - `GOOGLE_SERVICE_ACCOUNT_KEY` should contain the entire JSON content from your service account key file (see setup guide below).

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Getting Google Cloud Credentials

Google Cloud Text-to-Speech API requires service account authentication for server-side usage. API keys alone won't work.

### Setup Steps (No JSON File Required)

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Cloud Text-to-Speech API**
4. Go to **IAM & Admin** > **Service Accounts**
5. Click **Create Service Account**
6. Give it a name (e.g., "tts-service") and click **Create and Continue**
7. Grant the role **Cloud Text-to-Speech API User**
8. Click **Done**
9. Click on the created service account
10. Go to the **Keys** tab
11. Click **Add Key** > **Create new key**
12. Choose **JSON** format and download the key file
13. **Open the downloaded JSON file** and copy its entire contents
14. Add to `.env.local` as a single line (remove all line breaks):
    ```
    GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
    GOOGLE_PROJECT_ID=your-project-id
    GOOGLE_API_KEY=your-api-key-for-gemini
    APP_PASSWORD=hellfire@asdf
    ```

**Important Notes:**
- Copy the entire JSON content from the downloaded file
- Remove all line breaks and format it as a single line in `.env.local`
- Keep the JSON file secure and do NOT commit it to Git
- The `GOOGLE_API_KEY` is needed for Gemini preprocessing
- The service account credentials are required for Text-to-Speech

**Alternative:** If you prefer using a file, you can use `GOOGLE_APPLICATION_CREDENTIALS=./path/to/file.json` instead, but the environment variable approach is recommended as it doesn't require managing files.

## Usage

1. **Login:** Enter the password (default: `hellfire@asdf`) to access the application
2. **Select Voice:** Choose from 30+ female voices in various languages (Wavenet and Standard)
3. **Enter Text:** Type or paste your text in the textarea
4. **Convert:** Click "Convert to Speech" to generate audio
5. **Play/Download:** Use the built-in player to listen or download the MP3 file

## Security

- Password protection is required for both frontend access and API calls
- Session tokens expire after 24 hours
- Passwords are stored securely in environment variables
- Backend API routes verify authentication tokens on every request

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Google Cloud Text-to-Speech API** - TTS service

## License

MIT


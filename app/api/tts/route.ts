import { NextRequest } from 'next/server';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { verifyToken } from '../lib/token';

// Helper function to preprocess text with Gemini
async function preprocessWithGemini(text: string, apiKey: string): Promise<string> {
  try {
    const response = await fetch(
      `https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-flash-lite:streamGenerateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Please enhance and prepare this text for text-to-speech conversion, making it more natural and clear while preserving the original meaning: ${text}`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      console.warn('Gemini preprocessing failed, using original text');
      return text;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      return text;
    }

    let processedText = '';
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        // Handle both SSE format (data: {...}) and direct JSON
        let jsonStr = trimmedLine;
        if (trimmedLine.startsWith('data: ')) {
          jsonStr = trimmedLine.slice(6);
        }

        try {
          const data = JSON.parse(jsonStr);
          const textPart =
            data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (textPart) {
            processedText += textPart;
          }
        } catch (e) {
          // Skip invalid JSON, might be partial chunk
        }
      }
    }

    // Process remaining buffer
    if (buffer.trim()) {
      try {
        let jsonStr = buffer.trim();
        if (jsonStr.startsWith('data: ')) {
          jsonStr = jsonStr.slice(6);
        }
        const data = JSON.parse(jsonStr);
        const textPart = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (textPart) {
          processedText += textPart;
        }
      } catch (e) {
        // Ignore parsing errors for remaining buffer
      }
    }

    return processedText.trim() || text;
  } catch (error) {
    console.error('Gemini preprocessing error:', error);
    return text; // Fallback to original text
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || null;

    if (!verifyToken(token)) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized. Please login first.' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { text, languageCode = 'en-US', voiceName = 'en-US-Wavenet-F' } =
      await request.json();

    if (!text || text.trim().length === 0) {
      return new Response('Text is required', { status: 400 });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return new Response('Google API key is not configured', { status: 500 });
    }

    // Preprocess text with Gemini
    const processedText = await preprocessWithGemini(text, apiKey);

    try {
      // Initialize the Text-to-Speech client
      // Google Cloud TTS requires service account authentication for server-side usage
      const clientOptions: any = {};
      
      // Option 1: Use service account key file
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        clientOptions.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      }
      
      // Option 2: Use service account JSON from environment variable
      if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        try {
          clientOptions.credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        } catch (e) {
          console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY');
        }
      }
      
      // Option 3: Use project ID (client will try to use default credentials)
      if (process.env.GOOGLE_PROJECT_ID) {
        clientOptions.projectId = process.env.GOOGLE_PROJECT_ID;
      }
      
      const client = new TextToSpeechClient(clientOptions);

      // Construct the request
      const request = {
        input: { text: processedText },
        voice: {
          languageCode,
          name: voiceName,
        },
        audioConfig: {
          audioEncoding: 'MP3' as const,
        },
      };

      // Perform the text-to-speech request
      const [response] = await client.synthesizeSpeech(request);
      const audioContent = response.audioContent;

      if (!audioContent) {
        return new Response(
          JSON.stringify({ error: 'No audio content received' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Convert base64 to binary (audioContent is already a Buffer or Uint8Array)
      const audioBuffer = Buffer.isBuffer(audioContent) 
        ? audioContent 
        : Buffer.from(audioContent);

      // Create a streaming response
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(audioBuffer);
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Disposition': 'attachment; filename="speech.mp3"',
          'Cache-Control': 'no-cache',
        },
      });
    } catch (error) {
      console.error('TTS Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      
      // Provide helpful error message if it's an authentication error
      if (errorMessage.includes('authentication') || errorMessage.includes('credentials')) {
        return new Response(
          JSON.stringify({ 
            error: 'Authentication failed. Please set up a Google Cloud service account. See README for instructions.',
            details: errorMessage 
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('TTS Error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}


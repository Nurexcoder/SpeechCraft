'use client';

import { useState, useRef, useEffect } from 'react';

// All available female voices from Google TTS
const femaleVoices = [
  // English (US) - Wavenet
  { value: 'en-US-Wavenet-F', label: 'English (US) - Female (Wavenet)' },
  { value: 'en-US-Wavenet-G', label: 'English (US) - Female 2 (Wavenet)' },
  { value: 'en-US-Wavenet-H', label: 'English (US) - Female 3 (Wavenet)' },
  { value: 'en-US-Wavenet-J', label: 'English (US) - Female 4 (Wavenet)' },
  // English (US) - Standard
  { value: 'en-US-Standard-C', label: 'English (US) - Female (Standard)' },
  { value: 'en-US-Standard-E', label: 'English (US) - Female 2 (Standard)' },
  { value: 'en-US-Standard-F', label: 'English (US) - Female 3 (Standard)' },
  // English (UK) - Wavenet
  { value: 'en-GB-Wavenet-A', label: 'English (UK) - Female (Wavenet)' },
  { value: 'en-GB-Wavenet-F', label: 'English (UK) - Female 2 (Wavenet)' },
  // English (UK) - Standard
  { value: 'en-GB-Standard-A', label: 'English (UK) - Female (Standard)' },
  { value: 'en-GB-Standard-F', label: 'English (UK) - Female 2 (Standard)' },
  // English (Australia) - Wavenet
  { value: 'en-AU-Wavenet-A', label: 'English (Australia) - Female (Wavenet)' },
  { value: 'en-AU-Wavenet-C', label: 'English (Australia) - Female 2 (Wavenet)' },
  // Spanish - Wavenet & Standard
  { value: 'es-ES-Wavenet-C', label: 'Spanish (Spain) - Female (Wavenet)' },
  { value: 'es-ES-Standard-A', label: 'Spanish (Spain) - Female (Standard)' },
  { value: 'es-US-Wavenet-C', label: 'Spanish (US) - Female (Wavenet)' },
  { value: 'es-US-Standard-A', label: 'Spanish (US) - Female (Standard)' },
  // French - Wavenet & Standard
  { value: 'fr-FR-Wavenet-C', label: 'French - Female (Wavenet)' },
  { value: 'fr-FR-Standard-A', label: 'French - Female (Standard)' },
  // German - Wavenet & Standard
  { value: 'de-DE-Wavenet-A', label: 'German - Female (Wavenet)' },
  { value: 'de-DE-Standard-A', label: 'German - Female (Standard)' },
  // Italian - Wavenet & Standard
  { value: 'it-IT-Wavenet-A', label: 'Italian - Female (Wavenet)' },
  { value: 'it-IT-Standard-A', label: 'Italian - Female (Standard)' },
  // Portuguese - Wavenet & Standard
  { value: 'pt-BR-Wavenet-A', label: 'Portuguese (Brazil) - Female (Wavenet)' },
  { value: 'pt-BR-Standard-A', label: 'Portuguese (Brazil) - Female (Standard)' },
  // Japanese - Wavenet & Standard
  { value: 'ja-JP-Wavenet-B', label: 'Japanese - Female (Wavenet)' },
  { value: 'ja-JP-Standard-B', label: 'Japanese - Female (Standard)' },
  // Korean - Wavenet & Standard
  { value: 'ko-KR-Wavenet-A', label: 'Korean - Female (Wavenet)' },
  { value: 'ko-KR-Standard-A', label: 'Korean - Female (Standard)' },
  // Chinese - Wavenet & Standard
  { value: 'zh-CN-Wavenet-A', label: 'Chinese (Mandarin) - Female (Wavenet)' },
  { value: 'zh-CN-Standard-A', label: 'Chinese (Mandarin) - Female (Standard)' },
];

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('en-US-Wavenet-F');
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);
  const audioChunksRef = useRef<Uint8Array[]>([]);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('tts_auth_token');
    if (token) {
      setAuthToken(token);
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (mediaSourceRef.current && mediaSourceRef.current.readyState === 'open') {
        try {
          mediaSourceRef.current.endOfStream();
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
    };
  }, [audioUrl]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid password');
      }

      // Store token in localStorage
      localStorage.setItem('tts_auth_token', data.token);
      setAuthToken(data.token);
      setIsAuthenticated(true);
      setPassword('');
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tts_auth_token');
    setAuthToken(null);
    setIsAuthenticated(false);
    setText('');
    setAudioUrl(null);
    setError(null);
  };

  const handleConvert = async () => {
    if (!text.trim()) {
      setError('Please enter some text');
      return;
    }

    if (!authToken) {
      setError('Please login first');
      return;
    }

    setLoading(true);
    setStreaming(true);
    setError(null);
    setAudioUrl(null);
    audioChunksRef.current = [];

    // Clean up previous MediaSource if exists
    if (mediaSourceRef.current) {
      try {
        if (mediaSourceRef.current.readyState === 'open') {
          mediaSourceRef.current.endOfStream();
        }
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ text, voiceName: selectedVoice }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to convert text to speech';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          }
        } catch (e) {
          // If parsing fails, use default message
        }
        
        // If unauthorized, logout user
        if (response.status === 401) {
          handleLogout();
          throw new Error('Session expired. Please login again.');
        }
        
        throw new Error(errorMessage);
      }

      // Check if MediaSource is supported
      if ('MediaSource' in window && MediaSource.isTypeSupported('audio/mpeg')) {
        // Use MediaSource for streaming playback
        const mediaSource = new MediaSource();
        mediaSourceRef.current = mediaSource;
        const url = URL.createObjectURL(mediaSource);
        setAudioUrl(url);

        mediaSource.addEventListener('sourceopen', () => {
          try {
            const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
            sourceBufferRef.current = sourceBuffer;

            const reader = response.body?.getReader();
            if (!reader) {
              throw new Error('No response body');
            }

            const pump = async () => {
              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) {
                    if (sourceBuffer.updating) {
                      await new Promise((resolve) => {
                        sourceBuffer.addEventListener('updateend', resolve, { once: true });
                      });
                    }
                    mediaSource.endOfStream();
                    setStreaming(false);
                    setLoading(false);
                    break;
                  }

                  // Wait for sourceBuffer to be ready
                  if (sourceBuffer.updating) {
                    await new Promise((resolve) => {
                      sourceBuffer.addEventListener('updateend', resolve, { once: true });
                    });
                  }

                  // Append chunk to sourceBuffer
                  sourceBuffer.appendBuffer(value);
                  audioChunksRef.current.push(value);

                  // Start playing once we have some data
                  if (audioRef.current && audioRef.current.paused && audioChunksRef.current.length === 1) {
                    audioRef.current.play().catch((e) => {
                      console.error('Play error:', e);
                    });
                  }
                }
              } catch (err) {
                console.error('Streaming error:', err);
                setError(err instanceof Error ? err.message : 'Streaming error occurred');
                setStreaming(false);
                setLoading(false);
              }
            };

            pump();
          } catch (err) {
            console.error('MediaSource error:', err);
            // Fallback to blob approach
            handleBlobResponse(response);
          }
        });
      } else {
        // Fallback to blob approach for browsers without MediaSource support
        handleBlobResponse(response);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
      setStreaming(false);
    }
  };

  const handleBlobResponse = async (response: Response) => {
    try {
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setStreaming(false);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process audio');
      setLoading(false);
      setStreaming(false);
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;

    // If we have accumulated chunks, create blob from them
    if (audioChunksRef.current.length > 0) {
      const totalLength = audioChunksRef.current.reduce((acc, chunk) => acc + chunk.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of audioChunksRef.current) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      const blob = new Blob([combined], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'speech.mp3';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // Fallback: download from audio URL
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = 'speech.mp3';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-2 text-center">
              Text to Speech Converter
            </h1>
            <p className="text-gray-600 text-center mb-8">
              Please enter your password to continue
            </p>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <input
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                  autoFocus
                />
              </div>

              {loginError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading || !password.trim()}
                className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loginLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Logging in...
                  </span>
                ) : (
                  'Login'
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  // Main TTS interface
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Text to Speech Converter
              </h1>
              <p className="text-gray-600">
                Convert your text into natural-sounding speech using Gemini AI preprocessing and Google TTS
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Logout
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label
                htmlFor="voice-select"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Select Voice
              </label>
              <select
                id="voice-select"
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                {femaleVoices.map((voice) => (
                  <option key={voice.value} value={voice.value}>
                    {voice.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="text-input"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Enter your text
              </label>
              <textarea
                id="text-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type or paste your text here..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                rows={8}
              />
              <p className="mt-2 text-sm text-gray-500">
                {text.length} characters
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              onClick={handleConvert}
              disabled={loading || !text.trim()}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Converting...
                </span>
              ) : (
                'Convert to Speech'
              )}
            </button>

            {audioUrl && (
              <div className="mt-6 p-6 bg-gray-50 rounded-lg">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Your Audio
                  {streaming && (
                    <span className="ml-2 text-sm font-normal text-indigo-600">
                      (Streaming...)
                    </span>
                  )}
                </h2>
                <audio
                  ref={audioRef}
                  controls
                  src={audioUrl}
                  className="w-full mb-4"
                >
                  Your browser does not support the audio element.
                </audio>
                <button
                  onClick={handleDownload}
                  disabled={streaming}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  {streaming ? 'Streaming...' : 'Download Audio'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';

export function useVoiceInput(onTranscript) {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsRecording(true);
      };

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (onTranscript) {
          onTranscript(transcript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        setIsRecording(false);
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          // Show notification would be handled by parent component
        }
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onTranscript]);

  const startRecording = useCallback(() => {
    if (!recognitionRef.current) {
      return false;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      return false;
    }
    try {
      recognitionRef.current.start();
      return true;
    } catch (error) {
      return false;
    }
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }
  }, [isRecording]);

  const isSupported = recognitionRef.current !== null;

  return {
    isRecording,
    startRecording,
    stopRecording,
    isSupported
  };
}



import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useImageUpload } from '../../hooks/useImageUpload';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { ImagePreview } from './ImagePreview';
import styles from './InputArea.module.css';

export const InputArea = React.memo(function InputArea({ 
  onSend, 
  disabled = false,
  onImageDrop 
}) {
  const [inputValue, setInputValue] = useState('');
  const { uploadedImages, addImages, removeImage, clearImages } = useImageUpload();
  const { isRecording, startRecording, isSupported: voiceSupported } = useVoiceInput((transcript) => {
    setInputValue(transcript);
  });

  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);
  const isFocusedRef = useRef(false);
  const cursorPositionRef = useRef(null);

  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim();
    const hasImages = uploadedImages.length > 0;
    
    if (!trimmed && !hasImages) return;
    if (disabled) return;

    onSend({
      text: trimmed,
      images: [...uploadedImages]
    });

    setInputValue('');
    clearImages();
  }, [inputValue, uploadedImages, disabled, onSend, clearImages]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !disabled) {
      handleSend();
    }
  }, [disabled, handleSend]);

  const handleChange = useCallback((e) => {
    const value = e.target.value;
    setInputValue(value);
    cursorPositionRef.current = e.target.selectionStart;
  }, []);

  const handleFocus = useCallback(() => {
    isFocusedRef.current = true;
  }, []);

  const handleBlur = useCallback(() => {
    isFocusedRef.current = false;
  }, []);

  // Restore cursor position after re-render if input is focused
  useEffect(() => {
    if (inputRef.current && isFocusedRef.current && cursorPositionRef.current !== null) {
      const cursorPos = cursorPositionRef.current;
      inputRef.current.setSelectionRange(cursorPos, cursorPos);
    }
  });

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      addImages(files);
    }
    // Reset input so same file can be uploaded again
    e.target.value = '';
  };

  const handleVoiceClick = () => {
    if (voiceSupported) {
      startRecording();
    }
  };

  // Setup drag and drop
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const preventDefaults = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      wrapper.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      wrapper.addEventListener(eventName, () => {
        wrapper.classList.add(styles.dragOver);
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      wrapper.addEventListener(eventName, () => {
        wrapper.classList.remove(styles.dragOver);
      }, false);
    });

    wrapper.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files && files.length > 0) {
        addImages(files);
      }
    }, false);

    return () => {
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        wrapper.removeEventListener(eventName, preventDefaults, false);
      });
    };
  }, [addImages]);

  return (
    <div className={styles.inputArea}>
      <div ref={wrapperRef} className={styles.inputWrapper}>
        <input
          ref={fileInputRef}
          type="file"
          id="image-upload"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          style={{ display: 'none' }}
          aria-label="Upload images"
        />
        <button
          className={styles.attachBtn}
          onClick={() => fileInputRef.current?.click()}
          title="Attach images"
        >
          <i className="fas fa-plus"></i>
        </button>
        <ImagePreview images={uploadedImages} onRemove={removeImage} />
        <div className={styles.inputContainer}>
          <input
            ref={inputRef}
            type="text"
            id="user-input"
            className={styles.userInput}
            placeholder="Ask anything"
            value={inputValue}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            autoComplete="off"
          />
          <div className={styles.inputActions}>
            {voiceSupported && (
              <button
                className={`${styles.voiceInputBtn} ${isRecording ? styles.recording : ''}`}
                onClick={handleVoiceClick}
                title="Voice input"
              >
                <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'}`}></i>
              </button>
            )}
            <button
              className={styles.sendBtn}
              onClick={handleSend}
              disabled={disabled}
              aria-label="Send"
            >
              <i className="fas fa-arrow-up"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

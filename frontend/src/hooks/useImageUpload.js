import { useState, useCallback } from 'react';

export function useImageUpload() {
  const [uploadedImages, setUploadedImages] = useState([]);

  const processImageFile = useCallback((file) => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith("image/")) {
        reject(new Error("File is not an image"));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  const addImage = useCallback(async (file) => {
    try {
      const imageData = await processImageFile(file);
      setUploadedImages(prev => [...prev, imageData]);
      return true;
    } catch (error) {
      return false;
    }
  }, [processImageFile]);

  const addImages = useCallback(async (files) => {
    const results = await Promise.all(
      Array.from(files).map(file => processImageFile(file))
    );
    setUploadedImages(prev => [...prev, ...results]);
  }, [processImageFile]);

  const removeImage = useCallback((index) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearImages = useCallback(() => {
    setUploadedImages([]);
  }, []);

  return {
    uploadedImages,
    addImage,
    addImages,
    removeImage,
    clearImages
  };
}



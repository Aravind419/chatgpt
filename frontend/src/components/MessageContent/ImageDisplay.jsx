import React from 'react';
import styles from './MessageContent.module.css';

async function downloadImage(imageSrc, filename) {
  try {
    // If it's a base64 data URL, convert to blob
    if (imageSrc.startsWith('data:')) {
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } else {
      // For external URLs, use fetch
      try {
        const response = await fetch(imageSrc);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        try {
          const urlObj = new URL(imageSrc);
          const pathname = urlObj.pathname;
          const extension = pathname.substring(pathname.lastIndexOf('.')) || '.png';
          a.download = filename || `image-${Date.now()}${extension}`;
        } catch {
          a.download = filename || `image-${Date.now()}.png`;
        }
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (err) {
        // Fallback: open in new tab
        window.open(imageSrc, '_blank');
      }
    }
  } catch (error) {
    // Error downloading image
  }
}

export function ImageDisplay({ imageSrc }) {
  const handleDownload = (e) => {
    e.stopPropagation();
    const filename = `image-${Date.now()}.png`;
    downloadImage(imageSrc, filename);
  };

  return (
    <div className={styles.messageImageWrapper}>
      <img
        src={imageSrc}
        alt="Uploaded"
        className={styles.messageImage}
        onClick={() => window.open(imageSrc, '_blank')}
        loading="lazy"
      />
      <button
        className={styles.imageDownloadBtn}
        onClick={handleDownload}
        title="Download image"
      >
        <i className="fas fa-download"></i>
      </button>
    </div>
  );
}



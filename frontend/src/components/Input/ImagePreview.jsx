import React from 'react';
import styles from './InputArea.module.css';

export function ImagePreview({ images, onRemove }) {
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className={styles.imagePreviewContainer}>
      {images.map((imgSrc, index) => (
        <div key={index} className={styles.imagePreviewItem}>
          <img src={imgSrc} alt={`Preview ${index + 1}`} />
          <button
            className={styles.imagePreviewRemove}
            onClick={() => onRemove(index)}
            title="Remove image"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      ))}
    </div>
  );
}



import React from 'react';
import { MODEL_OPTIONS } from '../../utils/constants.js';
import styles from './Header.module.css';

export function ModelSelector({ value, onChange }) {
  return (
    <select 
      className={styles.modelSelector} 
      id="model-selector" 
      title="Select AI Model"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {MODEL_OPTIONS.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}



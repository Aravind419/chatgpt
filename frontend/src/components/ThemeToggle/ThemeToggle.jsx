import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import styles from './ThemeToggle.module.css';

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button className={styles.themeToggle} onClick={toggleTheme}>
      <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'} ${styles.icon}`}></i>
      <span className={styles.text}>{isDark ? 'Light' : 'Dark'}</span>
    </button>
  );
}



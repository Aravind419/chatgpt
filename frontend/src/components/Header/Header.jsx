import React from 'react';
import { ModelSelector } from './ModelSelector';
import styles from './Header.module.css';

export function Header({ 
  model, 
  onModelChange, 
  onToggleSidebar
}) {
  return (
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        <button 
          className={`${styles.toggleSidebarBtn} ${styles.mobileOnly}`} 
          onClick={onToggleSidebar}
          title="Toggle Sidebar"
        >
          <i className="fas fa-bars"></i>
        </button>
        <h1>
          <a href="https://www.linkedin.com/in/aravind-aravind">
            Aravind's GPT-5
          </a>
        </h1>
      </div>
      <div className={styles.headerButtons}>
        <ModelSelector value={model} onChange={onModelChange} />
      </div>
    </div>
  );
}



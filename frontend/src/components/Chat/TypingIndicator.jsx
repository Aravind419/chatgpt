import React from 'react';
import styles from './Chat.module.css';

export function TypingIndicator() {
  return (
    <div className={`${styles.message} ${styles.bot} ${styles.typing}`}>
      <span className={styles.dots}>
        <span>.</span><span>.</span><span>.</span>
      </span>
    </div>
  );
}



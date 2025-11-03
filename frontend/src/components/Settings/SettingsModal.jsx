import React, { useEffect } from 'react';
import styles from './SettingsModal.module.css';

export function SettingsModal({ isOpen, onClose, onOptionClick }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const options = [
    {
      id: 'theme',
      icon: 'fa-palette',
      title: 'Theme Settings',
      description: 'Customize appearance and theme'
    },
    {
      id: 'memory',
      icon: 'fa-brain',
      title: 'Memory Settings',
      description: 'Manage AI memory preferences'
    },
    {
      id: 'account',
      icon: 'fa-user-cog',
      title: 'Account Settings',
      description: 'Manage your account preferences'
    }
  ];

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className={`${styles.modalBackdrop} ${isOpen ? styles.open : ''}`}
      onClick={handleBackdropClick}
    >
      <div className={`${styles.modalContent} ${isOpen ? styles.visible : ''}`}>
        <div className={styles.modalHeader}>
          <h2>Settings</h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            title="Close"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className={styles.optionsList}>
          {options.map((option, index) => (
            <div
              key={option.id}
              className={styles.optionItem}
              onClick={() => {
                onOptionClick(option.id);
                onClose();
              }}
              style={{
                animationDelay: `${index * 0.1}s`
              }}
            >
              <div className={styles.optionIcon}>
                <i className={`fas ${option.icon}`}></i>
              </div>
              <div className={styles.optionContent}>
                <h3>{option.title}</h3>
                <p>{option.description}</p>
              </div>
              <div className={styles.optionArrow}>
                <i className="fas fa-chevron-right"></i>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


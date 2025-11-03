import React, { useEffect, useState } from 'react';
import { ConversationList } from './ConversationList';
import { ThemeToggle } from '../ThemeToggle/ThemeToggle';
import styles from './Sidebar.module.css';

export function Sidebar({ 
  conversations, 
  currentConversationId, 
  onNewChat, 
  onSelectConversation,
  onDeleteConversation,
  onUpdateTitle,
  isHidden = false,
  onToggle,
  onLogout,
  onOpenMemories,
  onOpenSettings
}) {
  const [isHoverOpen, setIsHoverOpen] = useState(false);

  // Close sidebar on mobile after interactions
  const closeOnMobile = () => {
    if (window.innerWidth <= 768 && !isHidden) {
      onToggle?.();
    }
  };

  // Setup click outside handler for mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only on mobile devices
      if (window.innerWidth > 768) return;
      
      // Check if sidebar is open
      if (isHidden) return;
      
      // Check if click is outside sidebar
      const sidebar = document.querySelector(`.${styles.sidebar}`);
      // Check for toggle buttons - both in Sidebar and Header (different CSS modules)
      const toggleBtnInSidebar = event.target.closest(`.${styles.toggleSidebarBtn}`);
      // Check if clicked element is inside a button with hamburger icon (Header toggle button)
      const clickedButton = event.target.closest('button');
      const isHeaderToggleBtn = clickedButton && (
        clickedButton.querySelector('.fa-bars') || 
        clickedButton.querySelector('i.fa-bars') ||
        event.target.classList.contains('fa-bars')
      );
      const isToggleButton = toggleBtnInSidebar || isHeaderToggleBtn;
      
      if (sidebar && !sidebar.contains(event.target) && !isToggleButton) {
        onToggle?.();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isHidden, onToggle]);

  // Setup hover handler for desktop
  useEffect(() => {
    if (window.innerWidth <= 768) return;

    let hoverTimeout;
    const hoverZoneWidth = 20; // pixels from left edge to trigger
    
    const handleMouseMove = (event) => {
      // Only on desktop devices
      if (window.innerWidth <= 768) return;
      
      // Check if mouse is near left edge
      if (event.clientX <= hoverZoneWidth) {
        clearTimeout(hoverTimeout);
        
        if (isHidden) {
          setIsHoverOpen(true);
          onToggle?.();
        }
      } else if (!event.target.closest(`.${styles.sidebar}`)) {
        if (isHoverOpen && isHidden) {
          clearTimeout(hoverTimeout);
          hoverTimeout = setTimeout(() => {
            setIsHoverOpen(false);
            if (!isHidden) {
              onToggle?.();
            }
          }, 300);
        }
      }
    };

    const handleMouseEnter = () => {
      clearTimeout(hoverTimeout);
    };

    const handleMouseLeave = () => {
      if (window.innerWidth <= 768) return;
      
      if (isHoverOpen && isHidden) {
        hoverTimeout = setTimeout(() => {
          setIsHoverOpen(false);
          if (!isHidden) {
            onToggle?.();
          }
        }, 300);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    const sidebar = document.querySelector(`.${styles.sidebar}`);
    if (sidebar) {
      sidebar.addEventListener('mouseenter', handleMouseEnter);
      sidebar.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (sidebar) {
        sidebar.removeEventListener('mouseenter', handleMouseEnter);
        sidebar.removeEventListener('mouseleave', handleMouseLeave);
      }
      clearTimeout(hoverTimeout);
    };
  }, [isHidden, isHoverOpen, onToggle]);

  return (
    <div className={`${styles.sidebar} ${isHidden ? styles.hidden : ''} ${isHoverOpen ? styles.hoverOpen : ''}`}>
      <div className={styles.sidebarHeader}>
        <button 
          className={styles.newChatBtn} 
          onClick={() => {
            onNewChat();
            closeOnMobile();
          }}
          title="New Chat"
        >
          <i className="fas fa-plus"></i> New Chat
        </button>
        <button 
          className={styles.toggleSidebarBtn} 
          onClick={onToggle}
          title="Close Sidebar"
        >
          <i className="fas fa-bars"></i>
        </button>
      </div>
      
      <ConversationList
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={(id) => {
          onSelectConversation(id);
          closeOnMobile();
        }}
        onDeleteConversation={onDeleteConversation}
        onUpdateTitle={onUpdateTitle}
      />
      
      <div className={styles.sidebarFooter}>
        <button 
          className={styles.memoriesButton} 
          onClick={() => {
            if (onOpenMemories) {
              onOpenMemories();
              closeOnMobile();
            }
          }}
          title="Memories"
        >
          <i className="fas fa-brain"></i> Memories
        </button>
        <button 
          className={styles.settingsButton} 
          onClick={() => {
            if (onOpenSettings) {
              onOpenSettings();
              closeOnMobile();
            }
          }}
          title="Settings"
        >
          <i className="fas fa-cog"></i> Settings
        </button>
      </div>
      <div className={styles.sidebarFooterBottom}>
        <ThemeToggle />
        {onLogout && (
          <button 
            className={styles.logoutButton} 
            onClick={() => {
              onLogout();
              closeOnMobile();
            }}
            title="Logout"
          >
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        )}
      </div>
    </div>
  );
}



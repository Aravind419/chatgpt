import React, { useState } from 'react';
import styles from './Sidebar.module.css';

export function ConversationItem({ 
  conversation, 
  isActive, 
  onSelect, 
  onDelete, 
  onUpdateTitle 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(conversation.title);

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editValue.trim() && editValue.trim() !== conversation.title) {
      onUpdateTitle(conversation.id, editValue.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(conversation.title);
      setIsEditing(false);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this conversation?")) {
      onDelete(conversation.id);
    }
  };

  return (
    <div 
      className={`${styles.conversationItem} ${isActive ? styles.active : ''}`}
      onClick={() => onSelect(conversation.id)}
    >
      {isEditing ? (
        <input
          type="text"
          className={styles.conversationTitleEdit}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      ) : (
        <>
          <div 
            className={styles.conversationTitle}
            onDoubleClick={handleDoubleClick}
          >
            {conversation.title}
          </div>
          <div className={styles.conversationButtons}>
            <button 
              className={styles.conversationEdit}
              onClick={handleEditClick}
              title="Edit title"
            >
              <i className="fas fa-edit"></i>
            </button>
            <button 
              className={styles.conversationDelete}
              onClick={handleDelete}
              title="Delete conversation"
            >
              <i className="fas fa-trash"></i>
            </button>
          </div>
        </>
      )}
    </div>
  );
}



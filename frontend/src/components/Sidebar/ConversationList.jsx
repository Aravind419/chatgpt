import React from 'react';
import { ConversationItem } from './ConversationItem';
import styles from './Sidebar.module.css';

export function ConversationList({ 
  conversations, 
  currentConversationId, 
  onSelectConversation,
  onDeleteConversation,
  onUpdateTitle
}) {
  const sortedConversations = Object.values(conversations).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <div className={styles.conversationsList}>
      {sortedConversations.map(conv => (
        <ConversationItem
          key={conv.id}
          conversation={conv}
          isActive={conv.id === currentConversationId}
          onSelect={onSelectConversation}
          onDelete={onDeleteConversation}
          onUpdateTitle={onUpdateTitle}
        />
      ))}
    </div>
  );
}



import React from 'react';
import { MessageList } from './MessageList';
import { TypingIndicator } from './TypingIndicator';
import { useScrollToBottom } from '../../hooks/useScrollToBottom';
import styles from './Chat.module.css';

export function ChatContainer({ messages, isTyping }) {
  const { containerRef } = useScrollToBottom([messages.length, isTyping]);

  return (
    <div ref={containerRef} className={styles.chatContainer}>
      <MessageList messages={messages} />
      {isTyping && <TypingIndicator />}
    </div>
  );
}


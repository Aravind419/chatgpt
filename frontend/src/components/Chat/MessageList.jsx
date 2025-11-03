import React from 'react';
import { Message } from './Message';
import styles from './Chat.module.css';

export function MessageList({ messages }) {
  return (
    <div className={styles.messageList}>
      {messages.map((message, index) => (
        <Message key={index} message={message} />
      ))}
    </div>
  );
}



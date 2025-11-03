import React from 'react';
import { MarkdownRenderer } from '../MessageContent/MarkdownRenderer';
import { ImageDisplay } from '../MessageContent/ImageDisplay';
import styles from './Chat.module.css';

export function Message({ message }) {
  const isBot = message.sender === 'bot';
  const isUser = message.sender === 'user';

  return (
    <div className={`${styles.message} ${isBot ? styles.bot : styles.user}`}>
      {isBot && message.content && (
        <MarkdownRenderer content={message.content} />
      )}
      {isUser && message.content && (
        <div>{message.content}</div>
      )}
      {message.images && message.images.length > 0 && (
        <div className={styles.messageImagesContainer}>
          {message.images.map((imgSrc, index) => (
            <ImageDisplay key={index} imageSrc={imgSrc} />
          ))}
        </div>
      )}
    </div>
  );
}



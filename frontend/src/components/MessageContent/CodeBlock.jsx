import React, { useEffect, useRef } from 'react';
import hljs from 'highlight.js';
import styles from './MessageContent.module.css';

export function CodeBlock({ code, language }) {
  const codeRef = useRef(null);
  const copyButtonRef = useRef(null);

  useEffect(() => {
    if (codeRef.current && !codeRef.current.classList.contains('highlighted')) {
      codeRef.current.classList.add('highlighted');
      try {
        hljs.highlightElement(codeRef.current);
      } catch (err) {
        // Syntax highlighting error
      }
    }
  }, [code, language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);

      // Show success feedback
      const originalText = copyButtonRef.current.innerHTML;
      copyButtonRef.current.innerHTML = "✅";
      copyButtonRef.current.style.background = "#28a745";

      // Reset button after 2 seconds
      setTimeout(() => {
        copyButtonRef.current.innerHTML = originalText;
        copyButtonRef.current.style.background = "";
      }, 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);

      // Show success feedback
      const originalText = copyButtonRef.current.innerHTML;
      copyButtonRef.current.innerHTML = "✅";
      copyButtonRef.current.style.background = "#28a745";

      setTimeout(() => {
        copyButtonRef.current.innerHTML = originalText;
        copyButtonRef.current.style.background = "";
      }, 2000);
    }
  };

  return (
    <pre className={styles.codeBlock}>
      <code ref={codeRef} className={language ? `language-${language}` : ''}>
        {code}
      </code>
      <button
        ref={copyButtonRef}
        className={styles.copyButton}
        onClick={handleCopy}
        title="Copy code"
      >
        📋
      </button>
    </pre>
  );
}



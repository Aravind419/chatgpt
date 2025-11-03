import React, { useEffect, useRef } from 'react';
import { convertTableToText } from '../../utils/markdown.js';
import styles from './MessageContent.module.css';

export function TableWrapper({ children }) {
  const wrapperRef = useRef(null);
  const tableRef = useRef(null);
  const copyButtonRef = useRef(null);

  useEffect(() => {
    // Wrap table if not already wrapped
    if (tableRef.current && wrapperRef.current && !tableRef.current.parentElement.classList.contains(styles.tableWrapper)) {
      const table = tableRef.current;
      const wrapper = document.createElement('div');
      wrapper.className = styles.tableWrapper;
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
      wrapperRef.current = wrapper;
    }
  }, [children]);

  const handleCopy = async () => {
    if (!tableRef.current) return;
    
    try {
      const tableText = convertTableToText(tableRef.current);
      await navigator.clipboard.writeText(tableText);

      // Show success feedback
      const originalText = copyButtonRef.current.innerHTML;
      copyButtonRef.current.innerHTML = '<i class="fas fa-check"></i>';
      copyButtonRef.current.style.background = "#28a745";

      // Reset button after 2 seconds
      setTimeout(() => {
        copyButtonRef.current.innerHTML = originalText;
        copyButtonRef.current.style.background = "";
      }, 2000);
    } catch (err) {
      // Fallback for older browsers
      const tableText = convertTableToText(tableRef.current);
      const textArea = document.createElement("textarea");
      textArea.value = tableText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);

      // Show success feedback
      const originalText = copyButtonRef.current.innerHTML;
      copyButtonRef.current.innerHTML = '<i class="fas fa-check"></i>';
      copyButtonRef.current.style.background = "#28a745";

      setTimeout(() => {
        copyButtonRef.current.innerHTML = originalText;
        copyButtonRef.current.style.background = "";
      }, 2000);
    }
  };

  return (
    <div ref={wrapperRef} className={styles.tableWrapperContainer}>
      <div ref={tableRef} className={styles.tableContent}>
        {children}
      </div>
      <button
        ref={copyButtonRef}
        className={styles.tableCopyButton}
        onClick={handleCopy}
        title="Copy table"
      >
        <i className="fas fa-copy"></i>
      </button>
    </div>
  );
}



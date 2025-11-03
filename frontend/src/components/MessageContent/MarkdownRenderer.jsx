import React, { useEffect, useRef } from 'react';
import { parseMarkdown, highlightCodeBlocks, wrapTablesInScrollable } from '../../utils/markdown.js';
import { sanitizeHTML } from '../../utils/sanitize.js';
import { convertTableToText } from '../../utils/markdown.js';
import styles from './MessageContent.module.css';

export function MarkdownRenderer({ content }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !content) {
      return;
    }
    
    try {
      // Parse markdown
      const parsed = parseMarkdown(content);
      const sanitized = sanitizeHTML(parsed);
      
      // Create a temporary container to set innerHTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = sanitized;
      
      // Clear existing content
      containerRef.current.innerHTML = '';
      
      // Move all children from tempDiv to containerRef
      while (tempDiv.firstChild) {
        containerRef.current.appendChild(tempDiv.firstChild);
      }

      // Highlight code blocks
      highlightCodeBlocks(containerRef.current);

      // Wrap tables
      wrapTablesInScrollable(containerRef.current);

      // Add copy buttons and language labels to code blocks
      const codeBlocks = containerRef.current.querySelectorAll("pre code");
      codeBlocks.forEach((codeBlock) => {
        if (!codeBlock || !codeBlock.parentElement) {
          return;
        }
        
        const pre = codeBlock.parentElement;
        if (!pre) {
          return;
        }
        
        // Skip if already has copy button
        if (pre.querySelector(`.${styles.copyButton}`)) {
          return;
        }

        // Get language from class (e.g., "language-javascript" -> "javascript")
        // Also check for hljs language classes (hljs adds language-* classes)
        let language = '';
        if (codeBlock.className) {
          const classList = codeBlock.className.split(' ').filter(cls => cls);
          for (const cls of classList) {
            if (cls && cls.startsWith('language-')) {
              language = cls.replace('language-', '');
              break;
            }
          }
        }
        
        // Keep language name in lowercase for label (e.g., "python", "javascript")
        // Create language label if language is detected
        if (language) {
          const langLabel = document.createElement("div");
          langLabel.className = styles.languageLabel || '';
          langLabel.textContent = language.toLowerCase();
          pre.style.position = "relative";
          pre.appendChild(langLabel);
        }

        const code = codeBlock.textContent || '';
        if (!code.trim()) {
          return; // Skip empty code blocks
        }
        
        const copyButton = document.createElement("button");
        copyButton.className = styles.copyButton || '';
        const copyIconClass = styles.copyIcon || '';
        const copyTextClass = styles.copyText || '';
        copyButton.innerHTML = `<span class="${copyIconClass}">📋</span><span class="${copyTextClass}">Copy code</span>`;
        copyButton.title = "Copy code";
        copyButton.setAttribute("aria-label", "Copy code to clipboard");
        
        // Make code easily selectable
        codeBlock.style.userSelect = "text";
        codeBlock.style.webkitUserSelect = "text";
        pre.style.position = "relative";
        
        copyButton.addEventListener("click", async (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          try {
            await navigator.clipboard.writeText(code);
            const copyIcon = copyButton.querySelector(`.${copyIconClass}`);
            const copyText = copyButton.querySelector(`.${copyTextClass}`);
            if (copyIcon) copyIcon.textContent = "✅";
            if (copyText) copyText.textContent = "Copied!";
            if (styles.copied) {
              copyButton.classList.add(styles.copied);
            }
            
            setTimeout(() => {
              if (copyIcon) copyIcon.textContent = "📋";
              if (copyText) copyText.textContent = "Copy code";
              if (styles.copied) {
                copyButton.classList.remove(styles.copied);
              }
            }, 2000);
          } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement("textarea");
            textArea.value = code;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            document.body.appendChild(textArea);
            textArea.select();
            try {
              document.execCommand("copy");
              const copyIcon = copyButton.querySelector(`.${copyIconClass}`);
              const copyText = copyButton.querySelector(`.${copyTextClass}`);
              if (copyIcon) copyIcon.textContent = "✅";
              if (copyText) copyText.textContent = "Copied!";
              if (styles.copied) {
                copyButton.classList.add(styles.copied);
              }
              
              setTimeout(() => {
                if (copyIcon) copyIcon.textContent = "📋";
                if (copyText) copyText.textContent = "Copy code";
                if (styles.copied) {
                  copyButton.classList.remove(styles.copied);
                }
              }, 2000);
            } catch (fallbackErr) {
              // Error copying code
            }
            if (document.body.contains(textArea)) {
              document.body.removeChild(textArea);
            }
          }
        });

        pre.appendChild(copyButton);
      });

      // Add copy buttons to tables
      const tables = containerRef.current.querySelectorAll("table");
      tables.forEach((table) => {
        if (!table) {
          return;
        }
        
        // Skip if already has copy button
        if (table.querySelector(`.${styles.tableCopyButton}`)) {
          return;
        }

        const copyButton = document.createElement("button");
        copyButton.className = styles.tableCopyButton;
        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
        copyButton.title = "Copy table";
        
        copyButton.addEventListener("click", async () => {
          try {
            const tableText = convertTableToText(table);
            await navigator.clipboard.writeText(tableText);
            
            const originalText = copyButton.innerHTML;
            copyButton.innerHTML = '<i class="fas fa-check"></i>';
            copyButton.style.background = "#28a745";
            setTimeout(() => {
              copyButton.innerHTML = originalText;
              copyButton.style.background = "";
            }, 2000);
          } catch (err) {
            // Error copying table
          }
        });

        table.style.position = "relative";
        table.appendChild(copyButton);
      });
    } catch (error) {
      // Fallback: display content as plain text if rendering fails
      if (containerRef.current) {
        containerRef.current.textContent = content;
      }
    }
  }, [content]);

  return <div ref={containerRef} className={styles.markdownContent} />;
}

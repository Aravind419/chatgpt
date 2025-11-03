import { useEffect, useRef, useCallback } from 'react';

export function useScrollToBottom(dependencies = []) {
  const containerRef = useRef(null);

  const scrollToBottom = useCallback((smooth = false) => {
    if (!containerRef.current) return;
    
    setTimeout(() => {
      if (containerRef.current) {
        if (smooth) {
          containerRef.current.scrollTo({
            top: containerRef.current.scrollHeight,
            behavior: "smooth",
          });
        } else {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      }
    }, 10);
  }, []);

  useEffect(() => {
    scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollToBottom].concat(dependencies));

  return { containerRef, scrollToBottom };
}


import React, { useState, useEffect } from 'react';
import * as memoryService from '../../services/memoryService';
import styles from './MemoriesPanel.module.css';

export function MemoriesPanel({ isOpen, onClose, currentConversationId }) {
  const [memories, setMemories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newMemoryContent, setNewMemoryContent] = useState('');
  const [newMemoryType, setNewMemoryType] = useState('fact');

  useEffect(() => {
    if (isOpen) {
      loadMemories();
    }
  }, [isOpen, currentConversationId]);

  const loadMemories = async () => {
    try {
      setIsLoading(true);
      // Load ALL memories (both global and conversation-specific) for the user
      // Pass null to get all user memories, not just current conversation
      const allMemories = await memoryService.getMemories(null);
      
      // If we have a currentConversationId, also load conversation-specific memories
      // But always show all user memories
      const conversationMemories = currentConversationId 
        ? await memoryService.getMemories(currentConversationId) 
        : [];
      
      // Combine and deduplicate memories
      const memoryMap = new Map();
      [...allMemories, ...conversationMemories].forEach(m => {
        if (m && m.id) {
          memoryMap.set(m.id, m);
        }
      });
      
      const uniqueMemories = Array.from(memoryMap.values());
      setMemories(uniqueMemories);
    } catch (error) {
      alert('Failed to load memories. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateMemory = async (e) => {
    e.preventDefault();
    if (!newMemoryContent.trim()) return;

    try {
      setIsCreating(true);
      const memoryData = {
        content: newMemoryContent.trim(),
        type: newMemoryType,
        conversationId: currentConversationId || null
      };
      
      const createdMemory = await memoryService.createMemory(memoryData);
      
      if (!createdMemory || !createdMemory.id) {
        throw new Error('Memory was created but no ID returned');
      }
      
      // Reload ALL memories from server to ensure persistence
      await loadMemories();
      
      // Also add to local state immediately for better UX
      setMemories(prev => {
        // Check if memory already exists to avoid duplicates
        const exists = prev.some(m => m.id === createdMemory.id);
        if (!exists) {
          return [createdMemory, ...prev];
        }
        return prev;
      });
      
      setNewMemoryContent('');
      setNewMemoryType('fact');
    } catch (error) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to create memory. Please try again.';
      alert(errorMsg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteMemory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this memory?')) return;

    try {
      await memoryService.deleteMemory(id);
      setMemories(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      alert('Failed to delete memory. Please try again.');
    }
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h3>
          <i className="fas fa-brain"></i> Memories
        </h3>
        <button 
          className={styles.closeButton}
          onClick={onClose}
          title="Close"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>

      <div className={styles.panelContent}>
        <form onSubmit={handleCreateMemory} className={styles.createForm}>
          <div className={styles.formRow}>
            <select
              value={newMemoryType}
              onChange={(e) => setNewMemoryType(e.target.value)}
              className={styles.typeSelect}
            >
              <option value="fact">Fact</option>
              <option value="user_preference">Preference</option>
              <option value="conversation_context">Context</option>
              <option value="instruction">Instruction</option>
            </select>
            <input
              type="text"
              value={newMemoryContent}
              onChange={(e) => setNewMemoryContent(e.target.value)}
              placeholder="Add a memory..."
              className={styles.memoryInput}
              disabled={isCreating}
            />
            <button
              type="submit"
              className={styles.addButton}
              disabled={!newMemoryContent.trim() || isCreating}
            >
              <i className="fas fa-plus"></i>
            </button>
          </div>
        </form>

        {isLoading ? (
          <div className={styles.loading}>Loading memories...</div>
        ) : memories.length === 0 ? (
          <div className={styles.emptyState}>
            <i className="fas fa-brain"></i>
            <p>No memories yet. Create one to help the AI remember information about you.</p>
          </div>
        ) : (
          <div className={styles.memoriesList}>
            {memories.map(memory => (
              <div key={memory.id} className={styles.memoryItem}>
                <div className={styles.memoryContent}>
                  <span className={styles.memoryType}>{memory.type}</span>
                  <p>{memory.content}</p>
                  {memory.conversationTitle && (
                    <span className={styles.conversationTag}>
                      <i className="fas fa-comment"></i> {memory.conversationTitle}
                    </span>
                  )}
                </div>
                <button
                  className={styles.deleteButton}
                  onClick={() => handleDeleteMemory(memory.id)}
                  title="Delete memory"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
}


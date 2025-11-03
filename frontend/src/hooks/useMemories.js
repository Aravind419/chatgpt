import { useState, useEffect, useCallback, useRef } from 'react';
import * as memoryService from '../services/memoryService';
import { useAuth } from '../context/AuthContext';
import { extractMemoryFromMessage, extractAllMemoriesFromMessage } from '../utils/memoryExtraction';

export function useMemories(conversationId = null) {
  const [memories, setMemories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const lastRefreshRef = useRef(Date.now());
  const refreshIntervalRef = useRef(null);

  const loadMemories = useCallback(async () => {
    if (!user) {
      setMemories([]);
      return;
    }

    try {
      setIsLoading(true);
      // Load ALL memories for the user (pass null to get all, not filtered by conversation)
      const loadedMemories = await memoryService.getMemories(null);
      
      if (loadedMemories && Array.isArray(loadedMemories)) {
        setMemories(loadedMemories);
      } else {
        setMemories([]);
      }
    } catch (error) {
      setMemories([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadMemories();
      
      // Auto-refresh memories every 10 seconds for real-time sync across devices
      refreshIntervalRef.current = setInterval(() => {
        const now = Date.now();
        // Only refresh if last refresh was more than 10 seconds ago
        if (now - lastRefreshRef.current >= 10000) {
          loadMemories();
          lastRefreshRef.current = now;
        }
      }, 10000);
    } else {
      setMemories([]);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [user, conversationId, loadMemories]);

  const createMemory = useCallback(async (memory) => {
    try {
      const newMemory = await memoryService.createMemory(memory);
      setMemories(prev => [newMemory, ...prev]);
      lastRefreshRef.current = Date.now(); // Update last refresh time
      return newMemory;
    } catch (error) {
      throw error;
    }
  }, []);

  // Extract and create memory from message text
  const extractAndCreateMemory = useCallback(async (messageText, conversationIdForMemory = null) => {
    if (!messageText || typeof messageText !== 'string') {
      return null;
    }

    try {
      // Try to extract memory from message
      const extractedMemory = extractMemoryFromMessage(messageText);
      
      if (extractedMemory) {
        // Create memory with conversation context
        const memory = {
          ...extractedMemory,
          conversationId: conversationIdForMemory || conversationId || null
        };
        
        return await createMemory(memory);
      }

      // Try to extract multiple memories from longer messages
      const allMemories = extractAllMemoriesFromMessage(messageText);
      if (allMemories.length > 0) {
        const createdMemories = [];
        for (const mem of allMemories) {
          const memory = {
            ...mem,
            conversationId: conversationIdForMemory || conversationId || null
          };
          const created = await createMemory(memory);
          createdMemories.push(created);
        }
        return createdMemories;
      }

      return null;
    } catch (error) {
      return null;
    }
  }, [conversationId, createMemory]);

  const deleteMemory = useCallback(async (id) => {
    try {
      await memoryService.deleteMemory(id);
      setMemories(prev => prev.filter(m => m.id !== id));
      lastRefreshRef.current = Date.now(); // Update last refresh time
      return true;
    } catch (error) {
      throw error;
    }
  }, []);

  const updateMemory = useCallback(async (id, updates) => {
    try {
      const updatedMemory = await memoryService.updateMemory(id, updates);
      setMemories(prev => prev.map(m => m.id === id ? updatedMemory : m));
      lastRefreshRef.current = Date.now(); // Update last refresh time
      return updatedMemory;
    } catch (error) {
      throw error;
    }
  }, []);

  // Get memories formatted for AI context
  const getMemoryContext = useCallback(() => {
    if (memories.length === 0) return '';
    
    // Include ALL memories - user-level facts, preferences, instructions, and important conversation context
    // Prioritize user-level memories (no conversationId), but also include conversation-specific memories
    // that contain important facts about the user (like name, preferences, etc.)
    const userMemories = memories
      .filter(m => {
        // Always include if no conversation ID (user-level memory)
        if (!m.conversationId) return true;
        
        // Include conversation-specific memories if they are important user facts
        // (preferences, instructions, facts about the user like name, job, etc.)
        const type = (m.type || '').toLowerCase();
        return type === 'user_preference' || 
               type === 'instruction' || 
               type === 'fact' ||
               type === 'conversation_context'; // Include conversation context as it may contain user info
      })
      .sort((a, b) => {
        // Sort by: 1) user-level first (no conversationId), 2) importance, 3) recency
        const aIsGlobal = !a.conversationId ? 1 : 0;
        const bIsGlobal = !b.conversationId ? 1 : 0;
        if (aIsGlobal !== bIsGlobal) return bIsGlobal - aIsGlobal;
        
        const aImportance = a.importance || 3;
        const bImportance = b.importance || 3;
        if (aImportance !== bImportance) return bImportance - aImportance;
        
        // Most recent first
        return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
      })
      .slice(0, 20) // Increase limit to include more memories
      .map(m => `- ${m.content}`)
      .join('\n');
    
    if (userMemories.length === 0) return '';
    
    return `\n\nImportant user information and preferences (remember these across all conversations):\n${userMemories}\n\nPlease use this information to answer questions about the user. If the user asks about something mentioned in the memories above, refer to it directly.`;
  }, [memories]);

  // Force refresh memories (useful for manual refresh or after external updates)
  const refreshMemories = useCallback(() => {
    loadMemories();
    lastRefreshRef.current = Date.now();
  }, [loadMemories]);

  return {
    memories,
    isLoading,
    loadMemories,
    refreshMemories,
    createMemory,
    extractAndCreateMemory,
    updateMemory,
    deleteMemory,
    getMemoryContext
  };
}


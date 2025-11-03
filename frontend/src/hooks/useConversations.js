import { useState, useEffect, useCallback, useRef } from 'react';
import * as conversationService from '../services/conversationService';
import { DEFAULT_MODEL } from '../utils/constants.js';
import { useAuth } from '../context/AuthContext';

export function useConversations() {
  const [conversations, setConversations] = useState({});
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  // Track which conversations we've attempted to load messages for
  const messagesLoadingRef = useRef(new Set());
  const lastRefreshRef = useRef(Date.now());
  const refreshIntervalRef = useRef(null);

  // Create new conversation function - defined early to avoid circular dependency
  const createNewConversation = useCallback(async (model = DEFAULT_MODEL) => {
    try {
      const newConversation = await conversationService.createConversation(model);
      const id = newConversation.id;
      
      setConversations(prev => ({ ...prev, [id]: newConversation }));
      setCurrentConversationId(id);
      return id;
    } catch (error) {
      throw error;
    }
  }, []);

  // Load conversations function - can be called manually or automatically
  const loadConversations = useCallback(async () => {
    if (!user) {
      // Clear conversations if no user
      setConversations({});
      setCurrentConversationId(null);
      setIsLoading(false);
      messagesLoadingRef.current.clear();
      return;
    }

    try {
      setIsLoading(true);
      const loadedConversations = await conversationService.getConversations();
      lastRefreshRef.current = Date.now(); // Update last refresh time
      
      if (loadedConversations && Object.keys(loadedConversations).length > 0) {
        setConversations(loadedConversations);
        // Set first conversation as current
        const firstId = Object.keys(loadedConversations)[0];
        setCurrentConversationId(firstId);
        
        // Load messages for the first conversation if not already loaded
        const firstConv = loadedConversations[firstId];
        if (firstConv && (!firstConv.messages || firstConv.messages.length === 0)) {
          try {
            const fullConversation = await conversationService.getConversation(firstId);
            if (fullConversation && fullConversation.messages !== undefined) {
              // Update even if messages is empty - sync with database state
              setConversations(prev => ({
                ...prev,
                [firstId]: fullConversation
              }));
            }
          } catch (error) {
            // Failed to load first conversation messages
          }
        }
      } else {
        // Create first conversation if none exist
        await createNewConversation();
      }
    } catch (error) {
      // Create first conversation on error
      try {
        await createNewConversation();
      } catch (createError) {
        // Failed to create initial conversation
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, createNewConversation]);

  // Reload conversations when user changes (cross-device sync)
  useEffect(() => {
    if (user) {
      loadConversations();
      
      // Auto-refresh conversations every 15 seconds for real-time sync across devices
      // Skip refresh if user is actively typing (input is focused)
      refreshIntervalRef.current = setInterval(() => {
        const now = Date.now();
        // Only refresh if last refresh was more than 15 seconds ago
        // And user is not typing (input is not focused)
        const isTyping = document.activeElement?.id === 'user-input' || 
                        document.activeElement?.tagName === 'INPUT' ||
                        document.activeElement?.tagName === 'TEXTAREA';
        
        if (now - lastRefreshRef.current >= 15000 && !isTyping) {
          loadConversations();
          lastRefreshRef.current = now;
        }
      }, 15000);
    } else {
      // Clear conversations on logout
      setConversations({});
      setCurrentConversationId(null);
      setIsLoading(false);
      messagesLoadingRef.current.clear();
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [user?.id, loadConversations]);

  // Load full conversation with messages when currentConversationId changes
  useEffect(() => {
    if (currentConversationId && conversations[currentConversationId]) {
      // Only fetch if messages are missing or empty and we haven't tried loading yet
      const currentConv = conversations[currentConversationId];
      if ((!currentConv.messages || currentConv.messages.length === 0) && 
          !messagesLoadingRef.current.has(currentConversationId)) {
        messagesLoadingRef.current.add(currentConversationId);
        
        // Fetch full conversation with messages
        conversationService.getConversation(currentConversationId)
          .then(fullConversation => {
            if (fullConversation && fullConversation.messages !== undefined) {
              // Update even if messages is empty - we just want to sync with database
              setConversations(prev => ({
                ...prev,
                [currentConversationId]: fullConversation
              }));
            }
          })
          .catch(error => {
            messagesLoadingRef.current.delete(currentConversationId);
          });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentConversationId]);

  const switchToConversation = useCallback(async (conversationId) => {
    if (conversations[conversationId]) {
      setCurrentConversationId(conversationId);
      
      // Load full conversation with messages if not already loaded
      const conv = conversations[conversationId];
      if ((!conv.messages || conv.messages.length === 0) && 
          !messagesLoadingRef.current.has(conversationId)) {
        messagesLoadingRef.current.add(conversationId);
        try {
          const fullConversation = await conversationService.getConversation(conversationId);
          if (fullConversation && fullConversation.messages !== undefined) {
            setConversations(prev => ({
              ...prev,
              [conversationId]: fullConversation
            }));
          }
        } catch (error) {
          messagesLoadingRef.current.delete(conversationId);
        }
      }
    }
  }, [conversations]);

  const deleteConversation = useCallback(async (conversationId) => {
    try {
      await conversationService.deleteConversation(conversationId);
      
      setConversations(prev => {
        const updated = { ...prev };
        delete updated[conversationId];
        return updated;
      });
      
      // If we deleted the current conversation, switch to another or create new
      if (currentConversationId === conversationId) {
        const remainingIds = Object.keys(conversations).filter(id => id !== conversationId);
        if (remainingIds.length > 0) {
          setCurrentConversationId(remainingIds[0]);
        } else {
          createNewConversation();
        }
      }
    } catch (error) {
      throw error;
    }
  }, [currentConversationId, conversations, createNewConversation]);

  const updateConversationTitle = useCallback(async (conversationId, newTitle) => {
    try {
      await conversationService.updateConversation(conversationId, { title: newTitle });
      
      setConversations(prev => ({
        ...prev,
        [conversationId]: {
          ...prev[conversationId],
          title: newTitle
        }
      }));
    } catch (error) {
      throw error;
    }
  }, []);

  const addMessage = useCallback(async (conversationId, message) => {
    try {
      // Optimistically update UI
      setConversations(prev => ({
        ...prev,
        [conversationId]: {
          ...prev[conversationId],
          messages: [...(prev[conversationId]?.messages || []), message]
        }
      }));

      // Save to server
      await conversationService.addMessage(conversationId, message);
      
      // Reload conversation to get full data from server
      const updated = await conversationService.getConversation(conversationId);
      setConversations(prev => ({
        ...prev,
        [conversationId]: updated
      }));
    } catch (error) {
      // Revert optimistic update on error
      await loadConversations();
      throw error;
    }
  }, [loadConversations]);

  const clearMessages = useCallback(async (conversationId) => {
    try {
      await conversationService.clearMessages(conversationId);
      
      setConversations(prev => ({
        ...prev,
        [conversationId]: {
          ...prev[conversationId],
          messages: []
        }
      }));
    } catch (error) {
      throw error;
    }
  }, []);

  const updateConversationModel = useCallback(async (conversationId, model) => {
    try {
      await conversationService.updateConversation(conversationId, { model });
      
      setConversations(prev => ({
        ...prev,
        [conversationId]: {
          ...prev[conversationId],
          model: model
        }
      }));
    } catch (error) {
      throw error;
    }
  }, []);

  const getCurrentConversation = useCallback(() => {
    if (!currentConversationId || !conversations[currentConversationId]) {
      return null;
    }
    return conversations[currentConversationId];
  }, [currentConversationId, conversations]);

  return {
    conversations,
    currentConversationId,
    isLoading,
    createNewConversation,
    switchToConversation,
    deleteConversation,
    updateConversationTitle,
    addMessage,
    clearMessages,
    updateConversationModel,
    getCurrentConversation,
    loadConversations, // Export for manual refresh
  };
}

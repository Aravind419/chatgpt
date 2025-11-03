import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './Sidebar/Sidebar';
import { Header } from './Header/Header';
import { ChatContainer } from './Chat/ChatContainer';
import { InputArea } from './Input/InputArea';
import { SettingsModal } from './Settings/SettingsModal';
import { MemoriesPanel } from './Memories/MemoriesPanel';
import { useConversations } from '../hooks/useConversations';
import { useMemories } from '../hooks/useMemories';
import { extractUpdateCommand, extractDeleteCommand, findMatchingMemory } from '../utils/memoryCommands';
import { sendChatMessage } from '../services/aiService';
import { saveSelectedModel, loadSelectedModel } from '../utils/storage';
import { DEFAULT_MODEL } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import styles from '../App.module.css';

export function ChatApp() {
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [selectedModel, setSelectedModel] = useState(() => loadSelectedModel() || DEFAULT_MODEL);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMemoriesOpen, setIsMemoriesOpen] = useState(false);
  const { logout } = useAuth();

  const {
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
  } = useConversations();

  const { getMemoryContext, extractAndCreateMemory, memories, updateMemory, deleteMemory } = useMemories(currentConversationId);

  // Load selected model on mount
  useEffect(() => {
    const savedModel = loadSelectedModel();
    if (savedModel) {
      setSelectedModel(savedModel);
    }
  }, []);

  // Save model when it changes
  useEffect(() => {
    saveSelectedModel(selectedModel);
    if (currentConversationId) {
      updateConversationModel(currentConversationId, selectedModel);
    }
  }, [selectedModel, currentConversationId, updateConversationModel]);

  // Handle sending messages
  const handleSend = useCallback(async ({ text, images }) => {
    const conversation = getCurrentConversation();
    if (!conversation) return;

    // Prevent sending while typing
    if (isTyping) return;

    // Create user message
    const userMessage = {
      sender: "user",
      content: text || "(Image)",
      images: images || [],
      timestamp: new Date().toISOString(),
    };

    // Process memory commands (update/delete) before extracting new memories
    if (text && text.trim()) {
      try {
        // Check for update command
        const updateCmd = extractUpdateCommand(text.trim());
        if (updateCmd && memories && memories.length > 0) {
          const matchingMemory = findMatchingMemory(memories, updateCmd);
          if (matchingMemory) {
            await updateMemory(matchingMemory.id, { content: updateCmd.newValue });
            // Continue with chat - bot will acknowledge the update in response
          }
        }

        // Check for delete command
        const deleteCmd = extractDeleteCommand(text.trim());
        if (deleteCmd && memories && memories.length > 0) {
          const matchingMemory = findMatchingMemory(memories, deleteCmd);
          if (matchingMemory) {
            await deleteMemory(matchingMemory.id);
            // Continue with chat - bot will acknowledge the deletion in response
          }
        }

        // Extract and save new memory if user said something like "remember this"
        // Only do this if it's not an update/delete command
        if (!updateCmd && !deleteCmd) {
          await extractAndCreateMemory(text.trim(), currentConversationId);
        }
      } catch (error) {
        // Don't block message sending if memory operations fail
      }
    }

    // Update conversation title if it's the first message
    if (conversation.messages.length === 0) {
      updateConversationTitle(
        currentConversationId,
        text || "Image analysis"
      );
    }

    // Add user message (optimistic update)
    addMessage(currentConversationId, userMessage);

    // Start typing indicator
    setIsTyping(true);
    setStreamingContent('');

    try {
      // Get conversation history for context
      const conversationHistory = conversation.messages || [];
      
      // Get memory context (this will include ALL relevant memories including conversation context)
      const memoryContext = getMemoryContext();

      // Send message to AI
      const response = await sendChatMessage(
        text || "What do you see in this image?",
        images || [],
        selectedModel,
        conversationHistory,
        memoryContext
      );

      let fullReply = "";

      // Stream response
      for await (const part of response) {
        if (part?.text) {
          fullReply += part.text;
          setStreamingContent(fullReply);
        }
      }

      // Add bot message only if we have content
      if (fullReply.trim()) {
        const botMessage = {
          sender: "bot",
          content: fullReply,
          timestamp: new Date().toISOString(),
        };
        addMessage(currentConversationId, botMessage);
      }

      // Auto-rename conversation if it's still "New Chat"
      if (conversation.title === "New Chat" && fullReply.length > 0) {
        // Extract a meaningful title from GPT's response
        let title = fullReply.split(/[.!?]/)[0].trim();
        title = title.replace(/[#*_`\[\]]/g, '').trim();
        if (title.length > 50) {
          title = title.substring(0, 50) + "...";
        }
        if (title.length > 0) {
          updateConversationTitle(currentConversationId, title);
        }
      }

      setStreamingContent('');
    } catch (err) {
      // Add error message
      const errorText = err?.message || err?.toString() || 'An unknown error occurred';
      const errorMessage = {
        sender: "bot",
        content: `<b>Error:</b> ${errorText}`,
        timestamp: new Date().toISOString(),
      };
      addMessage(currentConversationId, errorMessage);
      setStreamingContent('');
    } finally {
      setIsTyping(false);
    }
  }, [
    currentConversationId,
    getCurrentConversation,
    addMessage,
    updateConversationTitle,
    selectedModel,
    isTyping,
    getMemoryContext,
    extractAndCreateMemory,
    memories,
    updateMemory,
    deleteMemory,
  ]);

  // Handle clear chat
  const handleClearChat = useCallback(async () => {
    if (
      window.confirm(
        "Are you sure you want to clear this conversation? This action cannot be undone."
      )
    ) {
      if (currentConversationId) {
        clearMessages(currentConversationId);
      }
    }
  }, [currentConversationId, clearMessages]);

  // Get messages to display (include streaming content if typing)
  const getDisplayMessages = useCallback(() => {
    const conversation = getCurrentConversation();
    if (!conversation) return [];

    const messages = [...conversation.messages];

    // If typing, add temporary streaming message
    if (isTyping && streamingContent) {
      messages.push({
        sender: "bot",
        content: streamingContent,
        timestamp: new Date().toISOString(),
      });
    }

    return messages;
  }, [getCurrentConversation, isTyping, streamingContent]);

  // Close sidebar on mobile after interactions
  const closeSidebarOnMobile = useCallback(() => {
    if (window.innerWidth <= 768) {
      setSidebarHidden(true);
    }
  }, []);

  if (isLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  const messages = getDisplayMessages();

  return (
    <div className={styles.app}>
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onNewChat={() => {
          createNewConversation(selectedModel);
          closeSidebarOnMobile();
        }}
        onSelectConversation={(id) => {
          switchToConversation(id);
          closeSidebarOnMobile();
        }}
        onDeleteConversation={deleteConversation}
        onUpdateTitle={updateConversationTitle}
        isHidden={sidebarHidden}
        onToggle={() => setSidebarHidden(!sidebarHidden)}
        onLogout={logout}
        onOpenMemories={() => setIsMemoriesOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOptionClick={(optionId) => {
          // Handle settings options
          if (optionId === 'theme') {
            // Theme settings can be handled by existing ThemeToggle
          } else if (optionId === 'memory') {
            setIsMemoriesOpen(true);
          } else if (optionId === 'account') {
            // Account settings can be added later
          }
        }}
      />

      <MemoriesPanel
        isOpen={isMemoriesOpen}
        onClose={() => setIsMemoriesOpen(false)}
        currentConversationId={currentConversationId}
      />

      <div className={styles.mainContent}>
        <Header
          model={selectedModel}
          onModelChange={setSelectedModel}
          onToggleSidebar={() => setSidebarHidden(!sidebarHidden)}
        />

        <ChatContainer messages={messages} isTyping={isTyping && !streamingContent} />

        <InputArea
          onSend={handleSend}
          disabled={isTyping}
        />
      </div>
    </div>
  );
}


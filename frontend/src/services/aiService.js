import { shouldFormatAsTable } from '../utils/markdown.js';

// AI Service for Puter.ai integration
// This assumes puter is loaded globally from CDN

export async function sendChatMessage(message, images, model, conversationHistory = [], memoryContext = '') {
  // Check if puter is available
  if (typeof window === 'undefined') {
    throw new Error('Window object is not available. This code must run in a browser environment.');
  }
  
  // Wait for puter to be available (with timeout)
  let retries = 0;
  const maxRetries = 20; // Increased timeout for Puter.ai to load
  while (!window.puter || !window.puter.ai) {
    if (retries >= maxRetries) {
      throw new Error('Network error or not reachable');
    }
    await new Promise(resolve => setTimeout(resolve, 100));
    retries++;
  }
  
  // Check if Puter.ai needs initialization (some versions require this)
  if (window.puter.init && typeof window.puter.init === 'function') {
    try {
      // Try to initialize if needed (this may require API keys or authentication)
      // Note: Check Puter.ai documentation for required initialization parameters
      if (!window.puter._initialized) {
        // Only initialize if not already done
        // You may need to provide API keys or other credentials here
        // window.puter.init({ /* your config */ });
      }
    } catch (initError) {
      // Continue anyway, as initialization might not be required
    }
  }
  
  // Validate model
  if (!model) {
    throw new Error('Model is required for chat messages.');
  }

  // Build conversation context from chat history (limit to last 10 messages)
  let conversationContext = "";
  if (conversationHistory.length > 0) {
    const recentMessages = conversationHistory.slice(-10);
    conversationContext = recentMessages
      .map((msg) => {
        if (msg.sender === "user") {
          return `User: ${msg.content}`;
        } else {
          return `Assistant: ${msg.content}`;
        }
      })
      .join("\n\n");
    conversationContext += "\n\n";
  }

  // Add memory context if provided
  if (memoryContext) {
    conversationContext = memoryContext + conversationContext;
  }

  // Add instruction to help bot understand memory management
  if (memoryContext) {
    conversationContext += "\n\nYou can help the user manage their memories. If they ask to update or change information, acknowledge that you'll update their stored memory. If they ask to delete or forget something, acknowledge that you'll remove it from memory.";
  }

  // Modify input based on context
  let modifiedInput = message;

  // Check if user is asking for table data
  if (shouldFormatAsTable(message)) {
    modifiedInput = `${message}\n\nPlease format your response as a markdown table when appropriate.`;
  }

  // Add directive to include reference links
  modifiedInput = `${modifiedInput}\n\nPlease include relevant reference links and sources when providing information, especially for factual data, statistics, research findings, or technical information. Format references as markdown links at the end of your response.`;

  let response;
  
  // Helper function to extract error message from Puter.ai error objects
  const extractErrorMessage = (error) => {
    if (!error) return 'Unknown error';
    
    // If error is a string, return it
    if (typeof error === 'string') return error;
    
    // If error has success: false, extract from error field
    if (error.success === false && error.error) {
      const errObj = error.error;
      if (typeof errObj === 'string') {
        // Check for common Puter.ai permission errors
        if (errObj.includes('Permission denied') || errObj.includes('usage-limited')) {
          return `${errObj}. This may require Puter.ai authentication or the usage limit has been reached. Please check your Puter.ai account settings or try again later.`;
        }
        return errObj;
      }
      
      // Extract message from error object
      let errorMessage = errObj.message || errObj.error || errObj.msg || errObj.text;
      
      // Check for permission/authentication errors
      if (!errorMessage) {
        // Try to extract from nested structure
        if (errObj.error && typeof errObj.error === 'string') {
          errorMessage = errObj.error;
        } else if (errObj.error && errObj.error.message) {
          errorMessage = errObj.error.message;
        }
      }
      
      // Check if it's a permission/authentication error
      if (errorMessage && (errorMessage.includes('Permission denied') || 
                           errorMessage.includes('usage-limited') ||
                           errorMessage.includes('authentication') ||
                           errorMessage.includes('Unauthorized'))) {
        return `${errorMessage}. This may require Puter.ai authentication. Please ensure you're authenticated with Puter.ai or check your API configuration.`;
      }
      
      if (errorMessage) return errorMessage;
      
      // Try status/code formatting
      if (errObj.code) {
        return `Error ${errObj.code}: ${errObj.message || errorMessage || 'Unknown error'}`;
      }
      if (errObj.status) {
        return `Status ${errObj.status}: ${errObj.message || errorMessage || 'Unknown error'}`;
      }
      
      // Try to stringify if it's an object
      try {
        const errorStr = JSON.stringify(errObj);
        if (errorStr !== '{}' && errorStr !== '[object Object]') {
          // Try to make it more readable
          try {
            const parsed = JSON.parse(errorStr);
            if (parsed.message) return parsed.message;
            if (parsed.error) return typeof parsed.error === 'string' ? parsed.error : parsed.error.message;
          } catch {}
          return errorStr;
        }
      } catch {}
    }
    
    // Standard Error object
    if (error instanceof Error) return error.message || error.toString();
    
    // Error object with message property
    if (error.message) return error.message;
    
    // Error object with error property
    if (error.error) {
      if (typeof error.error === 'string') return error.error;
      if (error.error.message) return error.error.message;
    }
    
    // Try to stringify the error
    try {
      const errorStr = JSON.stringify(error);
      if (errorStr !== '{}' && errorStr !== '[object Object]') return errorStr;
    } catch {}
    
    // Last resort
    return error.toString && error.toString() !== '[object Object]' 
      ? error.toString() 
      : 'An unknown error occurred';
  };

  // If there are images, use image analysis
  if (images && images.length > 0) {
    try {
      // For multiple images, send them all
      if (images.length === 1) {
        response = await window.puter.ai.chat(
          modifiedInput || "What do you see in this image?",
          images[0],
          { model: model, stream: true }
        );
      } else {
        // For multiple images, describe them in the prompt
        const imagePrompt = `${modifiedInput || "What do you see in these images?"}\n\nI'm providing ${images.length} images for analysis.`;
        response = await window.puter.ai.chat(
          imagePrompt,
          images[0], // Puter AI typically analyzes the first image
          { model: model, stream: true }
        );
      }
      
      // Check if response is an error object (Puter.ai may return errors instead of throwing)
      if (response && typeof response === 'object') {
        // Check for Puter.ai error format: {success: false, error: {...}}
        if (response.success === false) {
          const errorMsg = extractErrorMessage(response);
          
          // Provide more helpful error messages for common issues
          if (errorMsg.includes('Permission denied') || errorMsg.includes('usage-limited')) {
            throw new Error(`Puter.ai Permission Error: ${errorMsg}. Please check your Puter.ai authentication or account status. You may need to sign in to Puter.ai or verify your API access.`);
          }
          
          throw new Error(`Failed to analyze image: ${errorMsg}`);
        }
        // Check for other error indicators
        if (response.error && !response.text && !response.content && !response[Symbol.asyncIterator]) {
          const errorMsg = extractErrorMessage(response.error);
          if (errorMsg.includes('Permission denied') || errorMsg.includes('usage-limited')) {
            throw new Error(`Puter.ai Permission Error: ${errorMsg}. Please check your Puter.ai authentication or account status.`);
          }
          throw new Error(`Failed to analyze image: ${errorMsg}`);
        }
      }
    } catch (error) {
      const errorMsg = extractErrorMessage(error);
      
      // Enhance error messages for permission issues
      if (errorMsg.includes('Permission denied') || 
          errorMsg.includes('usage-limited') ||
          errorMsg.includes('Error 400') && errorMsg.includes('delegate')) {
        throw new Error(`Puter.ai Access Error: ${errorMsg}. This typically means:\n1. Puter.ai authentication is required\n2. Usage limits have been reached\n3. The API endpoint requires configuration\n\nPlease check your Puter.ai account settings or documentation for authentication requirements.`);
      }
      
      throw new Error(`Failed to analyze image: ${errorMsg}`);
    }
  } else {
    // Text-only message
    const fullPrompt = conversationContext + "User: " + modifiedInput + "\n\nAssistant:";
    try {
      response = await window.puter.ai.chat(fullPrompt, { model: model, stream: true });
      
      // Check if response is an error object (Puter.ai may return errors instead of throwing)
      if (response && typeof response === 'object') {
        // Check for Puter.ai error format: {success: false, error: {...}}
        if (response.success === false) {
          const errorMsg = extractErrorMessage(response);
          
          // Provide more helpful error messages for common issues
          if (errorMsg.includes('Permission denied') || errorMsg.includes('usage-limited')) {
            throw new Error(`Puter.ai Permission Error: ${errorMsg}. Please check your Puter.ai authentication or account status. You may need to sign in to Puter.ai or verify your API access.`);
          }
          
          throw new Error(`Failed to send message: ${errorMsg}`);
        }
        // Check for other error indicators
        if (response.error && !response.text && !response.content && !response[Symbol.asyncIterator]) {
          const errorMsg = extractErrorMessage(response.error);
          if (errorMsg.includes('Permission denied') || errorMsg.includes('usage-limited')) {
            throw new Error(`Puter.ai Permission Error: ${errorMsg}. Please check your Puter.ai authentication or account status.`);
          }
          throw new Error(`Failed to send message: ${errorMsg}`);
        }
      }
    } catch (error) {
      const errorMsg = extractErrorMessage(error);
      
      // Enhance error messages for permission issues
      if (errorMsg.includes('Permission denied') || 
          errorMsg.includes('usage-limited') ||
          errorMsg.includes('Error 400') && errorMsg.includes('delegate')) {
        throw new Error(`Puter.ai Access Error: ${errorMsg}. This typically means:\n1. Puter.ai authentication is required\n2. Usage limits have been reached\n3. The API endpoint requires configuration\n\nPlease check your Puter.ai account settings or documentation for authentication requirements.`);
      }
      
      throw new Error(`Failed to send message: ${errorMsg}`);
    }
  }

  // Validate response
  if (!response) {
    throw new Error('No response received from Puter.ai');
  }

  return response;
}


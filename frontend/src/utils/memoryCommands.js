// Utility to detect memory update/delete commands in chat messages

const UPDATE_PATTERNS = [
  /update\s+(?:my\s+)?(?:name|info|information|details?)\s+(?:to|as|is)\s+(.+?)(?:\.|$)/i,
  /change\s+(?:my\s+)?(?:name|info|information|details?)\s+(?:to|as|is)\s+(.+?)(?:\.|$)/i,
  /(?:my\s+)?name\s+(?:is\s+now|changed\s+to|is)\s+(.+?)(?:\.|$)/i,
  /update\s+(.+?)\s+(?:to|as)\s+(.+?)(?:\.|$)/i,
  /change\s+(.+?)\s+(?:to|as)\s+(.+?)(?:\.|$)/i,
  /correct\s+(?:my\s+)?(.+?)\s+(?:to|as)\s+(.+?)(?:\.|$)/i,
  /fix\s+(?:my\s+)?(.+?)\s+(?:to|as)\s+(.+?)(?:\.|$)/i,
];

const DELETE_PATTERNS = [
  /delete\s+(?:the\s+)?memory\s+(?:about|regarding|for)\s+(.+?)(?:\.|$)/i,
  /remove\s+(?:the\s+)?memory\s+(?:about|regarding|for)\s+(.+?)(?:\.|$)/i,
  /forget\s+(?:about\s+)?(.+?)(?:\.|$)/i,
  /delete\s+(?:my\s+)?(?:info|information|details?)\s+(?:about|regarding)\s+(.+?)(?:\.|$)/i,
  /remove\s+(?:my\s+)?(?:info|information|details?)\s+(?:about|regarding)\s+(.+?)(?:\.|$)/i,
];

// Extract update command from message
export function extractUpdateCommand(messageText) {
  if (!messageText || typeof messageText !== 'string') {
    return null;
  }

  const text = messageText.trim().toLowerCase();

  for (const pattern of UPDATE_PATTERNS) {
    const match = messageText.match(pattern);
    if (match) {
      // Pattern 1: "update my name to Aravind" -> group 1 = "Aravind"
      if (match[1] && !match[2]) {
        return {
          type: 'update',
          newValue: match[1].trim(),
          field: extractFieldFromMessage(messageText),
          originalText: messageText
        };
      }
      // Pattern 2: "update my location to New York" -> group 1 = "location", group 2 = "New York"
      if (match[1] && match[2]) {
        return {
          type: 'update',
          field: match[1].trim(),
          newValue: match[2].trim(),
          originalText: messageText
        };
      }
    }
  }

  return null;
}

// Extract delete command from message
export function extractDeleteCommand(messageText) {
  if (!messageText || typeof messageText !== 'string') {
    return null;
  }

  const text = messageText.trim().toLowerCase();

  for (const pattern of DELETE_PATTERNS) {
    const match = messageText.match(pattern);
    if (match && match[1]) {
      return {
        type: 'delete',
        searchTerm: match[1].trim(),
        originalText: messageText
      };
    }
  }

  return null;
}

// Extract field name from message (e.g., "name", "location", "favorite color")
function extractFieldFromMessage(messageText) {
  const text = messageText.toLowerCase();
  
  if (text.includes('name')) return 'name';
  if (text.includes('location') || text.includes('live') || text.includes('address')) return 'location';
  if (text.includes('favorite') || text.includes('favourite') || text.includes('prefer')) return 'preference';
  if (text.includes('work') || text.includes('job') || text.includes('company')) return 'work';
  if (text.includes('email')) return 'email';
  if (text.includes('phone')) return 'phone';
  
  return 'info'; // Default fallback
}

// Find matching memory based on search criteria
export function findMatchingMemory(memories, command) {
  if (!memories || memories.length === 0) return null;

  const searchTerm = (command.searchTerm || command.field || command.newValue || '').toLowerCase();

  // For delete commands, search by content
  if (command.type === 'delete') {
    return memories.find(m => {
      const content = (m.content || '').toLowerCase();
      return content.includes(searchTerm) || searchTerm.includes(content.split(' ')[0]);
    });
  }

  // For update commands, search by field or content
  if (command.type === 'update') {
    // If field is specified (e.g., "name"), find memory containing that field
    if (command.field && command.field !== 'info') {
      const fieldLower = command.field.toLowerCase();
      return memories.find(m => {
        const content = (m.content || '').toLowerCase();
        return content.includes(fieldLower) || 
               (fieldLower === 'name' && (content.includes('name') || content.includes('is'))) ||
               (fieldLower === 'location' && (content.includes('live') || content.includes('location') || content.includes('address')));
      });
    }

    // Otherwise, try to find memory with similar content
    return memories.find(m => {
      const content = (m.content || '').toLowerCase();
      // Check if content contains key words from search
      const contentWords = content.split(/\s+/);
      const searchWords = searchTerm.split(/\s+/);
      return searchWords.some(word => contentWords.includes(word)) ||
             content.includes(searchTerm);
    });
  }

  return null;
}


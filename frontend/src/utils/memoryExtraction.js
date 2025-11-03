// Utility to extract memory instructions from chat messages

const MEMORY_PATTERNS = [
  // Direct "remember" patterns
  /remember\s+(?:that\s+)?(?:i\s+)?(.+?)(?:\.|$)/i,
  /remember\s+(?:this|that)\s*[:;]?\s*(.+?)(?:\.|$)/i,
  /remember\s+(.+?)(?:\.|$)/i,
  
  // Instruction patterns
  /(?:always|never)\s+(?:remember|keep in mind)\s+(?:that\s+)?(?:i\s+)?(.+?)(?:\.|$)/i,
  /keep in mind\s+(?:that\s+)?(?:i\s+)?(.+?)(?:\.|$)/i,
  /don't forget\s+(?:that\s+)?(?:i\s+)?(.+?)(?:\.|$)/i,
  
  // Preference patterns
  /(?:i\s+)?(?:like|prefer|love|hate|dislike)\s+(.+?)(?:\.|$)/i,
  /(?:i'm|i am)\s+(.+?)(?:\.|$)/i,
  /(?:my|i)\s+(?:favorite|fav)\s+(?:is\s+)?(.+?)(?:\.|$)/i,
  
  // Fact patterns
  /(?:i\s+)?(?:work|live|study)\s+(?:at|in)\s+(.+?)(?:\.|$)/i,
  /(?:i'm|i am)\s+(?:a|an)\s+(.+?)(?:\.|$)/i,
];

const CONTEXT_PATTERNS = [
  /(?:in|for|during)\s+(?:the\s+)?(?:future|next time|later)/i,
];

// Extract memory from message text
export function extractMemoryFromMessage(messageText) {
  if (!messageText || typeof messageText !== 'string') {
    return null;
  }

  const text = messageText.trim();
  if (text.length < 5) return null; // Too short

  // Try each pattern
  for (const pattern of MEMORY_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const extracted = match[1].trim();
      
      // Clean up the extracted text
      let cleaned = extracted
        .replace(/^(?:that|this|i|me|my)\s+/i, '') // Remove leading pronouns
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      // Check if it's meaningful (at least 5 characters after cleanup)
      if (cleaned.length >= 5) {
        // Determine memory type based on pattern
        let type = 'fact';
        if (pattern.toString().includes('like|prefer|love|hate|dislike|favorite')) {
          type = 'user_preference';
        } else if (pattern.toString().includes('remember|keep in mind|don\'t forget')) {
          type = 'instruction';
        } else if (pattern.toString().includes('work|live|study|am|a|an')) {
          type = 'fact';
        }

        return {
          content: cleaned,
          type: type,
          importance: type === 'instruction' ? 5 : type === 'user_preference' ? 4 : 3
        };
      }
    }
  }

  // Check for context-based instructions
  for (const pattern of CONTEXT_PATTERNS) {
    if (pattern.test(text)) {
      // Extract the main part (before the context phrase)
      const mainPart = text.split(pattern)[0].trim();
      if (mainPart.length >= 5) {
        return {
          content: mainPart,
          type: 'instruction',
          importance: 4
        };
      }
    }
  }

  return null;
}

// Check if a message contains a memory instruction
export function containsMemoryInstruction(messageText) {
  if (!messageText || typeof messageText !== 'string') {
    return false;
  }

  const text = messageText.toLowerCase();
  
  const memoryKeywords = [
    'remember',
    'keep in mind',
    "don't forget",
    'never forget',
    'always remember',
    'recall that',
    'note that',
    'take note',
    'remember this',
    'remember that',
  ];

  return memoryKeywords.some(keyword => text.includes(keyword));
}

// Extract multiple memories from a longer message
export function extractAllMemoriesFromMessage(messageText) {
  const memories = [];
  const sentences = messageText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  for (const sentence of sentences) {
    const memory = extractMemoryFromMessage(sentence);
    if (memory) {
      memories.push(memory);
    }
  }
  
  return memories;
}


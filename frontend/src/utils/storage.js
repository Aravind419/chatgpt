import { THEME_KEY, MODEL_KEY } from './constants.js';

// Note: Conversation storage moved to MongoDB backend
// Only client-side preferences (theme, model) remain in localStorage

// Save selected model (client preference only, not per conversation)
export function saveSelectedModel(model) {
  try {
    localStorage.setItem(MODEL_KEY, model);
  } catch (error) {
    // Failed to save model
  }
}

// Load selected model
export function loadSelectedModel() {
  try {
    return localStorage.getItem(MODEL_KEY);
  } catch (error) {
    // Failed to load model
  }
  return null;
}

// Theme is handled by useTheme hook, but keeping for reference
export const THEME_KEY_EXPORT = THEME_KEY;

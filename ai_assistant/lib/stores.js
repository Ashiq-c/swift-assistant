import { writable, derived } from 'svelte/store';
import { defaultChatbotConfig } from './types.js';

// Chatbot configuration store
export const chatbotConfig = writable(defaultChatbotConfig);

// Loading state
export const isLoading = writable(false);

// Errors store
export const errors = writable({});

// Dirty state (has unsaved changes)
export const isDirty = writable(false);

// Active section in the builder
export const activeSection = writable('overview');

// Build method (ai or manual)
export const buildMethod = writable('manual');

// Derived store for validation
export const isValid = derived(
  [chatbotConfig, errors],
  ([$config, $errors]) => {
    return Object.keys($errors).length === 0 && $config.name.trim() !== '';
  }
);

// Helper functions
export function updateConfig(updates) {
  chatbotConfig.update(config => ({ ...config, ...updates }));
  isDirty.set(true);
}

export function setError(field, message) {
  errors.update(errs => ({ ...errs, [field]: message }));
}

export function clearError(field) {
  errors.update(errs => {
    const newErrors = { ...errs };
    delete newErrors[field];
    return newErrors;
  });
}

export function clearAllErrors() {
  errors.set({});
}

export function resetConfig() {
  chatbotConfig.set(defaultChatbotConfig);
  clearAllErrors();
  isDirty.set(false);
}

export async function saveConfig() {
  isLoading.set(true);
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Here you would typically save to your backend
    console.log('Saving config:', chatbotConfig);
    
    isDirty.set(false);
    return true;
  } catch (error) {
    setError('general', 'Failed to save configuration');
    return false;
  } finally {
    isLoading.set(false);
  }
}

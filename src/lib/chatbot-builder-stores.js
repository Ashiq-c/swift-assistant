import { writable, derived } from 'svelte/store';
import { defaultChatbotConfig } from './chatbot-builder-types.js';

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
  clearAllErrors(); // Clear previous errors

  try {
    // Import the API function dynamically to avoid SSR issues
    const { createChatbot, transformConfigToApiFormat } = await import('./api/chatbots.js');

    // Get current config
    let currentConfig;
    chatbotConfig.subscribe(config => {
      currentConfig = config;
    })();

    console.log('Saving config:', currentConfig);

    // Transform config to API format
    const apiData = transformConfigToApiFormat(currentConfig);
    console.log('Transformed API data:', apiData);

    // Create chatbot via API
    const result = await createChatbot(apiData);
    console.log('Chatbot created successfully:', result);

    // Persist returned id (and keep other fields) so preview/chat uses the saved bot
    try {
      const newId = result?.id ?? result?.data?.id ?? null;
      if (newId) {
        chatbotConfig.update(cfg => ({ ...cfg, id: String(newId) }));
      }
    } catch {}

    isDirty.set(false);
    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to save configuration:', error);

    // Parse API error response to set field-specific errors
    parseAndSetErrors(error.message);

    return { success: false, error: error.message };
  } finally {
    isLoading.set(false);
  }
}

// Helper function to parse API errors and set field-specific errors
function parseAndSetErrors(errorMessage) {
  try {
    // Try to parse JSON error response
    const errorData = JSON.parse(errorMessage);

    if (errorData.errors) {
      // Handle field-specific errors
      Object.entries(errorData.errors).forEach(([field, messages]) => {
        const message = Array.isArray(messages) ? messages[0] : messages;

        // Map API field names to internal field names
        const fieldMapping = {
          'duration_minutes': 'duration',
          'secondary_language_ids': 'secondaryLanguages',
          'primary_language_id': 'primaryLanguage',
          'grade_level': 'gradeLevel',
          'bot_role': 'botRole',
          'greeting_message': 'greetingMessage',
          'conversation_starters': 'conversationStarters',
          'curriculum_info': 'curriculumInfo',
          'analysis_scales': 'gradingRubric',
          'chatbot_files': 'knowledgeFiles', // Map to the field used by existing UI
          'grading_rubric': 'gradingRubric'
        };

        const mappedField = fieldMapping[field] || field;
        setError(mappedField, message);
      });
    } else if (errorData.message) {
      // General error message
      setError('general', errorData.message);
    } else {
      // Fallback error
      setError('general', 'Failed to save configuration');
    }
  } catch (parseError) {
    // If we can't parse the error, show a general error
    setError('general', errorMessage || 'Failed to save configuration');
  }
}

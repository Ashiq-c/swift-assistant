import { browser } from '$app/environment';
import { showSuccessPopup, showErrorPopup } from '$lib/stores/popup.js';

/**
 * Show notification message using popup
 * @param {string} message - The message to show
 * @param {string} type - The type of notification ('success' or 'error')
 */
function showNotification(message, type = 'info') {
  if (type === 'success') {
    showSuccessPopup(message);
  } else if (type === 'error') {
    showErrorPopup(message);
  } else {
    showErrorPopup(message); // Default to error for other types
  }
}

// Get API base URL
const getApiBaseUrl = () => {
  if (browser) {
    // In browser, use the proxy configured in vite.config.ts
    return '/custom-api';
  }
  // Server-side fallback
  return 'http://127.0.0.1:8000';
};

/**
 * Create a new chatbot
 * @param {Object} chatbotData - The chatbot configuration data
 * @param {Object} options - Optional configuration for notifications
 * @param {boolean} options.showAlerts - Whether to show alert boxes (default: true)
 * @returns {Promise<Object>} Created chatbot response
 */
export async function createChatbot(chatbotData, options = { showAlerts: true }) {
  try {
    const apiBaseUrl = getApiBaseUrl();
    const url = `${apiBaseUrl}/v1/chatbots/chatbot-create/`;
    
    console.log('Creating chatbot at:', url);
    console.log('Chatbot data:', chatbotData);
    
    // Create FormData for multipart/form-data submission
    const formData = new FormData();
    
    // Add text fields
    formData.append('name', chatbotData.name || '');
    formData.append('description', chatbotData.description || '');
    formData.append('curriculum_info', chatbotData.curriculum_info || '');
    formData.append('select_from_curriculum', chatbotData.select_from_curriculum || '1');
    formData.append('grade_level', chatbotData.grade_level || '');
    formData.append('bot_role', chatbotData.bot_role || '');
    formData.append('instructions', chatbotData.instructions || '');
    formData.append('greeting_message', chatbotData.greeting_message || '');
    formData.append('primary_language_id', chatbotData.primary_language_id || '');
    formData.append('grading_rubric', chatbotData.grading_rubric || '');

    // Add boolean fields as "1" or "0" strings
    formData.append('real_time_web_search', chatbotData.real_time_web_search ? '1' : '0');
    formData.append('file_upload_analysis', chatbotData.file_upload_analysis ? '1' : '0');
    formData.append('image_upload_gpt_vision', chatbotData.image_upload_gpt_vision ? '1' : '0');
    formData.append('create_images', chatbotData.create_images ? '1' : '0');
    formData.append('drawing_tools', chatbotData.drawing_tools ? '1' : '0');
    formData.append('canvas_edit_modify', chatbotData.canvas_edit_modify ? '1' : '0');
    formData.append('pause_session', chatbotData.pause_session ? '1' : '0');
    
    // Add secondary language IDs as individual form fields
    if (chatbotData.secondary_language_ids && chatbotData.secondary_language_ids.length > 0) {
      chatbotData.secondary_language_ids.forEach((id, index) => {
        formData.append(`secondary_language_ids[${index}]`, id);
      });
    }

    // Add conversation starters as individual form fields with 'text' property
    if (chatbotData.conversation_starters && chatbotData.conversation_starters.length > 0) {
      chatbotData.conversation_starters.forEach((starter, index) => {
        formData.append(`conversation_starters[${index}]text`, starter.text || starter);
      });
    }

    // Add analysis scales as individual form fields
    if (chatbotData.analysis_scales && chatbotData.analysis_scales.length > 0) {
      chatbotData.analysis_scales.forEach((scale, index) => {
        formData.append(`analysis_scales[${index}].level_name`, scale.level_name || '');
        formData.append(`analysis_scales[${index}].description`, scale.description || '');
        formData.append(`analysis_scales[${index}].color`, scale.color || '');
      });
    }

    // Add analysis scales as individual form fields
    if (chatbotData.analysis_scales && chatbotData.analysis_scales.length > 0) {
      chatbotData.analysis_scales.forEach((scale, index) => {
        formData.append(`analysis_scales[${index}]level_name`, scale.level_name || '');
        formData.append(`analysis_scales[${index}]description`, scale.description || '');
        formData.append(`analysis_scales[${index}]color`, scale.color || '');
      });
    }

    // Add chatbot files as individual form fields with 'file' property
    console.log('chatbot_files data:', chatbotData.chatbot_files);
    if (chatbotData.chatbot_files && chatbotData.chatbot_files.length > 0) {
      console.log('Adding chatbot files to form data:', chatbotData.chatbot_files.length, 'files');
      chatbotData.chatbot_files.forEach((file, index) => {
        console.log(`Processing file ${index}:`, file);
        if (file instanceof File) {
          console.log(`Adding file ${index} as File:`, file.name, file.size, 'bytes');
          formData.append(`chatbot_files[${index}]file`, file);
        } else if (typeof file === 'string') {
          console.log(`Adding file ${index} as string:`, file);
          // Handle base64 or file path
          formData.append(`chatbot_files[${index}]file`, file);
        } else {
          console.log(`Unknown file type for ${index}:`, typeof file, file);
        }
      });
    } else {
      console.log('No chatbot_files found or empty array - creating dummy file');
      // Backend requires at least one file, so create a dummy file if none provided
      const dummyFile = new File([''], 'empty.txt', { type: 'text/plain' });
      formData.append('chatbot_files[0]file', dummyFile);
    }
    
    // Add picture file if provided
    if (chatbotData.picture) {
      if (chatbotData.picture instanceof File) {
        formData.append('picture', chatbotData.picture);
      } else if (typeof chatbotData.picture === 'string' && chatbotData.picture.startsWith('data:')) {
        // Convert base64 to blob if needed
        const blob = dataURLtoBlob(chatbotData.picture);
        formData.append('picture', blob, 'chatbot-image.jpg');
      }
    }
    
    // Log FormData contents for debugging
    console.log('FormData contents:');
    for (let [key, value] of formData.entries()) {
      if (key.includes('chatbot_files')) {
        console.log(`🔥 FILE FIELD: ${key}`, value instanceof File ? `File: ${value.name} (${value.size} bytes)` : value);
      } else {
        console.log(key, value);
      }
    }
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - let browser set it for multipart/form-data
    });
    
    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);

      // Show error alert if enabled
      if (options.showAlerts) {
        showNotification(`Error creating chatbot: ${response.status} - ${errorText}`, 'error');
      }
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    console.log('Chatbot created successfully:', result);

    // Check if the response indicates success and show appropriate alert
    if (options.showAlerts) {
      if (result.success === true) {
        showNotification(result.message || 'Chatbot created successfully', 'success');
      } else {
        showNotification(result.message || 'Failed to create chatbot', 'error');
      }
    }

    return result;

  } catch (error) {
    console.error('Error creating chatbot:', error);

    // Show error alert for network or other errors if enabled
    if (options.showAlerts && !error.message.includes('HTTP error!')) {
      showNotification(`Error creating chatbot: ${error.message}`, 'error');
    }

    throw error;
  }
}

/**
 * Convert data URL to Blob
 * @param {string} dataURL - Base64 data URL
 * @returns {Blob} Blob object
 */
function dataURLtoBlob(dataURL) {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Transform chatbot config to API format
 * @param {Object} config - Internal chatbot configuration
 * @returns {Object} API-formatted chatbot data
 */
export function transformConfigToApiFormat(config) {
  // Helper function to safely parse integer
  const safeParseInt = (value) => {
    if (!value) return null;
    const parsed = parseInt(value);
    return isNaN(parsed) ? null : parsed;
  };

  // Helper function to safely parse array of integers
  const safeParseIntArray = (array) => {
    if (!Array.isArray(array)) return [];
    return array.map(safeParseInt).filter(val => val !== null);
  };

  return {
    name: config.name || '',
    description: config.description || '',
    curriculum_info: config.curriculumInfo || '',
    select_from_curriculum: '1', // Default value
    grade_level: config.gradeLevel || '',
    bot_role: config.botRole || '',
    instructions: config.instructions || '',
    greeting_message: config.greetingMessage || '',
    primary_language_id: safeParseInt(config.primaryLanguage),
    grading_rubric: config.gradingRubric?.description || '',
    secondary_language_ids: safeParseIntArray(config.secondaryLanguages),
    picture: config.image || null,

    // Capability fields as booleans
    real_time_web_search: Boolean(config.capabilities?.webSearch),
    file_upload_analysis: Boolean(config.capabilities?.fileUpload),
    image_upload_gpt_vision: Boolean(config.capabilities?.imageUpload),
    create_images: Boolean(config.capabilities?.createImages),
    drawing_tools: Boolean(config.capabilities?.drawingTools),
    canvas_edit_modify: Boolean(config.capabilities?.canvasEdit),
    pause_session: Boolean(config.sessionControl?.pause),

    // Array fields
    conversation_starters: Array.isArray(config.conversationStarters) ?
      config.conversationStarters.map(text => ({
        text: typeof text === 'string' ? text : String(text)
      })) : [],
    analysis_scales: [
      {
        level_name: "Beginning",
        description: config.gradingRubric?.beginning || "Basic understanding",
        color: "red"
      },
      {
        level_name: "Proficient",
        description: config.gradingRubric?.emerging || "Good understanding",
        color: "yellow"
      },
      {
        level_name: "Advanced",
        description: "Excellent mastery",
        color: "green"
      }
    ],
    chatbot_files: (() => {
      console.log('transformConfigToApiFormat - knowledgeBase:', config.knowledgeBase);
      const files = Array.isArray(config.knowledgeBase) ? config.knowledgeBase : [];
      console.log('transformConfigToApiFormat - chatbot_files result:', files);
      return files;
    })()
  };
}

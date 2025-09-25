import { browser } from '$app/environment';
import { PUBLIC_CUSTOM_API_BASE_URL } from '$env/static/public';
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
  // Server-side fallback: use PUBLIC_CUSTOM_API_BASE_URL if set, otherwise local default
  const base = (PUBLIC_CUSTOM_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
  return base;
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

    // Check if we have actual files to upload
    const hasFiles = chatbotData.chatbot_files && chatbotData.chatbot_files.length > 0 &&
                    chatbotData.chatbot_files.some(file => file instanceof File && file.size > 0);

    if (hasFiles) {
      // Use FormData for file uploads with JSON data
      const formData = new FormData();

      // Add all non-file data as individual form fields (Django REST Framework format)
      formData.append('name', chatbotData.name || '');
      formData.append('description', chatbotData.description || '');
      formData.append('curriculum_info', chatbotData.curriculum_info || '');
      formData.append('select_from_curriculum', chatbotData.select_from_curriculum ? '1' : '0');
      formData.append('grade_level', chatbotData.grade_level || '');
      formData.append('bot_role', chatbotData.bot_role || '');
      formData.append('instructions', chatbotData.instructions || '');
      formData.append('greeting_message', chatbotData.greeting_message || '');
      formData.append('primary_language_id', chatbotData.primary_language_id || '');
      formData.append('grading_rubric', chatbotData.grading_rubric || '');
      formData.append('real_time_web_search', chatbotData.real_time_web_search ? '1' : '0');
      formData.append('file_upload_analysis', chatbotData.file_upload_analysis ? '1' : '0');
      formData.append('image_upload_gpt_vision', chatbotData.image_upload_gpt_vision ? '1' : '0');
      formData.append('create_images', chatbotData.create_images ? '1' : '0');
      formData.append('drawing_tools', chatbotData.drawing_tools ? '1' : '0');
      formData.append('canvas_edit_modify', chatbotData.canvas_edit_modify ? '1' : '0');
      formData.append('pause_session', chatbotData.pause_session ? '1' : '0');

      // Add secondary language IDs
      if (chatbotData.secondary_language_ids && chatbotData.secondary_language_ids.length > 0) {
        chatbotData.secondary_language_ids.forEach((langId, index) => {
          formData.append(`secondary_language_ids[${index}]`, langId);
        });
      }

      // Add conversation starters
      if (chatbotData.conversation_starters && chatbotData.conversation_starters.length > 0) {
        chatbotData.conversation_starters.forEach((starter, index) => {
          formData.append(`conversation_starters[${index}].text`, starter.text || starter);
        });
      }

      // Add analysis scales
      if (chatbotData.analysis_scales && chatbotData.analysis_scales.length > 0) {
        chatbotData.analysis_scales.forEach((scale, index) => {
          formData.append(`analysis_scales[${index}].level_name`, scale.level_name || '');
          formData.append(`analysis_scales[${index}].description`, scale.description || '');
          formData.append(`analysis_scales[${index}].color`, scale.color || '');
        });
      }

      // Add files
      chatbotData.chatbot_files.forEach((file, index) => {
        if (file instanceof File && file.size > 0) {
          formData.append(`chatbot_files[${index}].file`, file);
        }
      });

      // Add picture if provided
      if (chatbotData.picture instanceof File) {
        formData.append('picture', chatbotData.picture);
      }

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      console.log('Response:', result);

      if (!response.ok) {
        const errPayload = {
          message: result?.message || 'HTTP error',
          status: response.status,
          errors: result?.errors || result
        };
        throw new Error(JSON.stringify(errPayload));
      }

      // Show success notification
      if (options.showAlerts) {
        showNotification('Chatbot created successfully!', 'success');
      }

      // Refresh the sidebar chatbots list
      if (typeof window !== 'undefined' && window.refreshSidebarChatbots) {
        try {
          await window.refreshSidebarChatbots();
        } catch (error) {
          console.warn('Failed to refresh sidebar chatbots:', error);
        }
      }

      return result;
    } else {
      // No files - send as JSON
      const jsonPayload = {
        name: chatbotData.name || '',
        description: chatbotData.description || '',
        curriculum_info: chatbotData.curriculum_info || '',
        select_from_curriculum: Boolean(chatbotData.select_from_curriculum),
        grade_level: chatbotData.grade_level || '',
        bot_role: chatbotData.bot_role || '',
        instructions: chatbotData.instructions || '',
        greeting_message: chatbotData.greeting_message || '',
        primary_language_id: chatbotData.primary_language_id,
        grading_rubric: chatbotData.grading_rubric || '',
        real_time_web_search: Boolean(chatbotData.real_time_web_search),
        file_upload_analysis: Boolean(chatbotData.file_upload_analysis),
        image_upload_gpt_vision: Boolean(chatbotData.image_upload_gpt_vision),
        create_images: Boolean(chatbotData.create_images),
        drawing_tools: Boolean(chatbotData.drawing_tools),
        canvas_edit_modify: Boolean(chatbotData.canvas_edit_modify),
        pause_session: Boolean(chatbotData.pause_session),
        secondary_language_ids: chatbotData.secondary_language_ids || [],
        conversation_starters: chatbotData.conversation_starters || [],
        analysis_scales: chatbotData.analysis_scales || [],
        chatbot_files: []
      };

      console.log('JSON payload:', jsonPayload);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonPayload),
      });

      const result = await response.json();
      console.log('Response:', result);

      if (!response.ok) {
        const errPayload = {
          message: result?.message || 'HTTP error',
          status: response.status,
          errors: result?.errors || result
        };
        throw new Error(JSON.stringify(errPayload));
      }

      // Show success notification
      if (options.showAlerts) {
        showNotification('Chatbot created successfully!', 'success');
      }

      // Refresh the sidebar chatbots list
      if (typeof window !== 'undefined' && window.refreshSidebarChatbots) {
        try {
          await window.refreshSidebarChatbots();
        } catch (error) {
          console.warn('Failed to refresh sidebar chatbots:', error);
        }
      }

      return result;
    }

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

  // Transform grading rubric to analysis scales
  const createAnalysisScales = (gradingRubric) => {
    const scales = [];

    if (gradingRubric?.beginning) {
      scales.push({
        level_name: "Beginning",
        description: gradingRubric.beginning,
        color: "red"
      });
    }

    if (gradingRubric?.emerging) {
      scales.push({
        level_name: "Emerging",
        description: gradingRubric.emerging,
        color: "yellow"
      });
    }

    // If no custom scales, provide defaults
    if (scales.length === 0) {
      scales.push(
        {
          level_name: "Beginning",
          description: "Basic understanding of concepts",
          color: "red"
        },
        {
          level_name: "Proficient",
          description: "Good understanding and application",
          color: "yellow"
        },
        {
          level_name: "Advanced",
          description: "Excellent mastery and problem-solving",
          color: "green"
        }
      );
    }

    return scales;
  };

  return {
    // Required fields
    name: config.name || '',
    primary_language_id: safeParseInt(config.primaryLanguage),

    // Optional basic information
    description: config.description || '',
    curriculum_info: config.curriculumInfo || '',

    // Optional behavior & knowledge
    select_from_curriculum: config.curriculumSelected ? '1' : '0',
    grade_level: config.gradeLevel || '',
    bot_role: config.botRole || '',
    instructions: config.instructions || '',
    greeting_message: config.greetingMessage || '',

    // Optional grading
    grading_rubric: typeof config.gradingRubric === 'string' ? config.gradingRubric :
                   (config.gradingRubric?.description || ''),

    // Optional language control
    secondary_language_ids: safeParseIntArray(config.secondaryLanguages),

    // Optional bot capabilities - map existing UI fields to API fields
    real_time_web_search: Boolean(config.capabilities?.webSearch),
    file_upload_analysis: Boolean(config.capabilities?.fileUpload),
    image_upload_gpt_vision: Boolean(config.capabilities?.imageUpload),
    create_images: Boolean(config.capabilities?.imageCreation || config.capabilities?.createImages),
    drawing_tools: Boolean(config.capabilities?.drawingTools),
    canvas_edit_modify: Boolean(config.capabilities?.canvasEdit),

    // Optional session control - map existing UI fields
    pause_session: Boolean(config.sessionControl?.pauseResume || config.sessionControl?.pause),

    // Optional picture
    picture: config.image || null,

    // Required arrays (can be empty)
    conversation_starters: Array.isArray(config.conversationStarters) ?
      config.conversationStarters.map(text => ({
        text: typeof text === 'string' ? text : String(text)
      })) : [],

    analysis_scales: createAnalysisScales(config.gradingRubric),

    chatbot_files: (() => {
      // Check both knowledgeBase and knowledgeFiles for compatibility with existing UI
      const files = Array.isArray(config.knowledgeBase) ? config.knowledgeBase :
                   Array.isArray(config.knowledgeFiles) ? config.knowledgeFiles : [];
      console.log('transformConfigToApiFormat - chatbot_files from:', config.knowledgeBase ? 'knowledgeBase' : 'knowledgeFiles');
      console.log('transformConfigToApiFormat - chatbot_files result:', files);
      return files;
    })()
  };
}

/**
 * Get list of chatbots with pagination
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.page_size - Number of items per page (default: 10)
 * @param {number} params.user_id - Filter by user ID (optional)
 * @returns {Promise<Object>} Paginated chatbot list response
 */
export async function getChatbots(params = {}) {
  try {
    const apiBaseUrl = getApiBaseUrl();
    const queryParams = new URLSearchParams();

    // Add pagination parameters
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.page_size) queryParams.append('page_size', params.page_size.toString());
    if (params.user_id) queryParams.append('user_id', params.user_id.toString());

    const url = `${apiBaseUrl}/v1/chatbots/?${queryParams.toString()}`;

    console.log('Fetching chatbots from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Chatbots fetched successfully:', data);

    return data;
  } catch (error) {
    console.error('Error fetching chatbots:', error);
    throw error;
  }
}

/**
 * Get a specific chatbot by ID
 * @param {string|number} id - Chatbot ID
 * @returns {Promise<Object>} Chatbot data
 */
export async function getChatbot(id) {
  try {
    const apiBaseUrl = getApiBaseUrl();
    const url = `${apiBaseUrl}/v1/chatbots/${encodeURIComponent(id)}/`;

    console.log('Fetching chatbot from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    let data = null;
    try {
      data = await response.json();
    } catch (_) {
      data = null;
    }

    // If HTTP failed or backend indicates failure, try a fallback: search in list by id/uid
    const failed = !response.ok || (data && (data.result === 'failure' || data.success === false));
    if (failed) {
      console.warn('Primary chatbot fetch failed; attempting fallback list search', { status: response.status, data });
      try {
        const list = await getChatbots({ page_size: 50 }).catch(() => null);
        const items = Array.isArray(list?.results)
          ? list.results
          : Array.isArray(list?.records)
          ? list.records
          : Array.isArray(list?.data?.results)
          ? list.data.results
          : Array.isArray(list?.data?.records)
          ? list.data.records
          : Array.isArray(list)
          ? list
          : [];
        const found = items.find((it) => String(it?.id) === String(id) || String(it?.uid) === String(id));
        if (found) {
          console.log('Fallback found chatbot in list:', found);
          return found;
        }
      } catch (e) {
        console.warn('Fallback list search failed', e);
      }
      const msg = data?.message || 'Failed to fetch chatbot';
      throw new Error(msg);
    }

    console.log('Chatbot fetched successfully:', data);
    return data;
  } catch (error) {
    console.error('Error fetching chatbot:', error);
    throw error;
  }
}

/**
 * Delete a chatbot by ID
 * @param {string|number} id - Chatbot ID
 * @returns {Promise<Object>} Delete response
 */
export async function deleteChatbot(id) {
  try {
    const apiBaseUrl = getApiBaseUrl();
    const url = `${apiBaseUrl}/v1/chatbots/${id}/`;

    console.log('Deleting chatbot at:', url);

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    // DELETE requests might return empty response
    const data = response.status === 204 ? { success: true } : await response.json();
    console.log('Chatbot deleted successfully:', data);

    return data;
  } catch (error) {
    console.error('Error deleting chatbot:', error);
    throw error;
  }
}

import { browser } from '$app/environment';

// Get API base URL from environment or use default
const getApiBaseUrl = () => {
  if (browser) {
    // In browser, use the proxy configured in vite.config.ts
    const baseUrl = '/custom-api';
    console.log('Using API base URL (browser):', baseUrl);
    return baseUrl;
  }
  // Server-side fallback
  const baseUrl = 'http://192.168.2.82:8000/';
  console.log('Using API base URL (server):', baseUrl);
  return baseUrl;
};

/**
 * Fetch languages from the API
 * @returns {Promise<Array>} Array of language objects with id and name
 */
export async function fetchLanguages() {
  try {
    const apiBaseUrl = getApiBaseUrl();
    const url = `${apiBaseUrl}/v1/languages/`;
    console.log('Fetching languages from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      mode: 'cors'
    });
    console.log('Response status:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const languages = await response.json();
    console.log('Raw API response:', languages);

    // Validate response format
    if (!Array.isArray(languages)) {
      throw new Error('Invalid response format: expected array');
    }

    // Validate each language object
    const validLanguages = languages.filter(lang =>
      lang &&
      typeof lang.id !== 'undefined' &&
      typeof lang.name === 'string' &&
      lang.name.trim() !== ''
    );

    if (validLanguages.length === 0) {
      throw new Error('No valid languages found in response');
    }

    // Transform to expected format (code/name structure)
    const transformedLanguages = validLanguages.map(lang => ({
      code: lang.id.toString(), // Convert id to string for code
      name: lang.name.trim(),
      id: lang.id // Keep original id for reference
    }));

    console.log('Transformed languages:', transformedLanguages);
    return transformedLanguages;

  } catch (error) {
    console.error('Error fetching languages:', error);

    // Return fallback languages if API fails
    console.log('Using fallback languages');
    return getFallbackLanguages();
  }
}

/**
 * Fallback languages in case API is unavailable
 * @returns {Array} Default language options
 */
function getFallbackLanguages() {
  return [
    { code: '1', name: 'English', id: 1 },
    { code: '2', name: 'Spanish', id: 2 },
    { code: '3', name: 'French', id: 3 },
    { code: '4', name: 'German', id: 4 },
    { code: '5', name: 'Italian', id: 5 },
    { code: '6', name: 'Portuguese', id: 6 },
    { code: '7', name: 'Russian', id: 7 },
    { code: '8', name: 'Japanese', id: 8 },
    { code: '9', name: 'Korean', id: 9 },
    { code: '10', name: 'Chinese', id: 10 }
  ];
}

/**
 * Get language name by code
 * @param {string} code - Language code
 * @param {Array} languages - Array of language objects
 * @returns {string} Language name or code if not found
 */
export function getLanguageName(code, languages) {
  const lang = languages.find(l => l.code === code);
  return lang ? lang.name : code;
}

/**
 * Check if API is available
 * @returns {Promise<boolean>} True if API is reachable
 */
export async function checkLanguagesApiHealth() {
  try {
    const apiBaseUrl = getApiBaseUrl();
    const response = await fetch(`${apiBaseUrl}/api/v1/languages/`, {
      method: 'HEAD',
      timeout: 5000
    });
    return response.ok;
  } catch (error) {
    console.warn('Languages API health check failed:', error);
    return false;
  }
}

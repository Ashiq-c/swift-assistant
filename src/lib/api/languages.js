import { browser } from '$app/environment';
import { PUBLIC_CUSTOM_API_BASE_URL } from '$env/static/public';

// Get API base URL from environment or use default
const getApiBaseUrl = () => {
  if (browser) {
    // In browser, use the proxy configured in vite.config.ts
    return '/custom-api';
  }
  // Server-side fallback: use PUBLIC_CUSTOM_API_BASE_URL if set, otherwise local default
  const base = (PUBLIC_CUSTOM_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/?$/, '/');
  return base;
};

/**
 * Fetch languages from the API
 * @returns {Promise<Array>} Array of language objects with id and name
 */
// Cache for languages to avoid repeated API calls
let languagesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function fetchLanguages() {
  // Check cache first
  if (languagesCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    return languagesCache;
  }

  try {
    const apiBaseUrl = getApiBaseUrl();
    const url = `${apiBaseUrl}/v1/languages/`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const languages = await response.json();

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

    // Cache the successful result
    languagesCache = transformedLanguages;
    cacheTimestamp = Date.now();

    return transformedLanguages;

  } catch (error) {
    console.error('Error fetching languages:', error);

    // If we have cached data, use it even if expired
    if (languagesCache) {
      return languagesCache;
    }

    // Return fallback languages if API fails and no cache
    const fallbackLanguages = getFallbackLanguages();

    // Cache fallback languages too
    languagesCache = fallbackLanguages;
    cacheTimestamp = Date.now();

    return fallbackLanguages;
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
 * Clear the languages cache (useful for testing or when API is updated)
 */
export function clearLanguagesCache() {
  languagesCache = null;
  cacheTimestamp = null;
}

/**
 * Check if API is available
 * @returns {Promise<boolean>} True if API is reachable
 */
export async function checkLanguagesApiHealth() {
  try {
    const apiBaseUrl = getApiBaseUrl();
    const response = await fetch(`${apiBaseUrl}/v1/languages/`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    return response.ok;
  } catch (error) {
    console.warn('Languages API health check failed:', error);
    return false;
  }
}

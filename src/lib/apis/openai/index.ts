import { OPENAI_API_BASE_URL, WEBUI_API_BASE_URL, WEBUI_BASE_URL } from '$lib/constants';

export const getOpenAIConfig = async (token: string = '') => {
	let error = null;

	const res = await fetch(`${OPENAI_API_BASE_URL}/config`, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			console.error(err);
			if ('detail' in err) {
				error = err.detail;
			} else {
				error = 'Server connection failed';
			}
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

type OpenAIConfig = {
	ENABLE_OPENAI_API: boolean;
	OPENAI_API_BASE_URLS: string[];
	OPENAI_API_KEYS: string[];
	OPENAI_API_CONFIGS: object;
};

export const updateOpenAIConfig = async (token: string = '', config: OpenAIConfig) => {
	let error = null;

	const res = await fetch(`${OPENAI_API_BASE_URL}/config/update`, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		},
		body: JSON.stringify({
			...config
		})
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			console.error(err);
			if ('detail' in err) {
				error = err.detail;
			} else {
				error = 'Server connection failed';
			}
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const getOpenAIUrls = async (token: string = '') => {
	let error = null;

	const res = await fetch(`${OPENAI_API_BASE_URL}/urls`, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			console.error(err);
			if ('detail' in err) {
				error = err.detail;
			} else {
				error = 'Server connection failed';
			}
			return null;
		});

	if (error) {
		throw error;
	}

	return res.OPENAI_API_BASE_URLS;
};

export const updateOpenAIUrls = async (token: string = '', urls: string[]) => {
	let error = null;

	const res = await fetch(`${OPENAI_API_BASE_URL}/urls/update`, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		},
		body: JSON.stringify({
			urls: urls
		})
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			console.error(err);
			if ('detail' in err) {
				error = err.detail;
			} else {
				error = 'Server connection failed';
			}
			return null;
		});

	if (error) {
		throw error;
	}

	return res.OPENAI_API_BASE_URLS;
};

export const getOpenAIKeys = async (token: string = '') => {
	let error = null;

	const res = await fetch(`${OPENAI_API_BASE_URL}/keys`, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			console.error(err);
			if ('detail' in err) {
				error = err.detail;
			} else {
				error = 'Server connection failed';
			}
			return null;
		});

	if (error) {
		throw error;
	}

	return res.OPENAI_API_KEYS;
};

export const updateOpenAIKeys = async (token: string = '', keys: string[]) => {
	let error = null;

	const res = await fetch(`${OPENAI_API_BASE_URL}/keys/update`, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		},
		body: JSON.stringify({
			keys: keys
		})
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			console.error(err);
			if ('detail' in err) {
				error = err.detail;
			} else {
				error = 'Server connection failed';
			}
			return null;
		});

	if (error) {
		throw error;
	}

	return res.OPENAI_API_KEYS;
};

export const getOpenAIModelsDirect = async (url: string, key: string) => {
	let error = null;

	const res = await fetch(`${url}/models`, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(key && { authorization: `Bearer ${key}` })
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			error = `OpenAI: ${err?.error?.message ?? 'Network Problem'}`;
			return [];
		});

	if (error) {
		throw error;
	}

	return res;
};

export const getOpenAIModels = async (token: string, urlIdx?: number) => {
	let error = null;

	const res = await fetch(
		`${OPENAI_API_BASE_URL}/models${typeof urlIdx === 'number' ? `/${urlIdx}` : ''}`,
		{
			method: 'GET',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				...(token && { authorization: `Bearer ${token}` })
			}
		}
	)
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			error = `OpenAI: ${err?.error?.message ?? 'Network Problem'}`;
			return [];
		});

	if (error) {
		throw error;
	}

	return res;
};

export const verifyOpenAIConnection = async (
	token: string = '',
	connection: dict = {},
	direct: boolean = false
) => {
	const { url, key, config } = connection;
	if (!url) {
		throw 'OpenAI: URL is required';
	}

	let error = null;
	let res = null;

	if (direct) {
		res = await fetch(`${url}/models`, {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				Authorization: `Bearer ${key}`,
				'Content-Type': 'application/json'
			}
		})
			.then(async (res) => {
				if (!res.ok) throw await res.json();
				return res.json();
			})
			.catch((err) => {
				error = `OpenAI: ${err?.error?.message ?? 'Network Problem'}`;
				return [];
			});

		if (error) {
			throw error;
		}
	} else {
		res = await fetch(`${OPENAI_API_BASE_URL}/verify`, {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				url,
				key,
				config
			})
		})
			.then(async (res) => {
				if (!res.ok) throw await res.json();
				return res.json();
			})
			.catch((err) => {
				error = `OpenAI: ${err?.error?.message ?? 'Network Problem'}`;
				return [];
			});

		if (error) {
			throw error;
		}
	}

	return res;
};

export const chatCompletion = async (
	token: string = '',
	body: object,
	url: string = `${WEBUI_BASE_URL}/api`
): Promise<[Response | null, AbortController]> => {
	const controller = new AbortController();
	let error = null;

	const res = await fetch(`${url}/chat/completions`, {
		signal: controller.signal,
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	}).catch((err) => {
		console.error(err);
		error = err;
		return null;
	});

	if (error) {
		throw error;
	}

	return [res, controller];
};

export const generateOpenAIChatCompletion = async (
	token: string = '',
	body: object,
	url: string = `${WEBUI_BASE_URL}/api`
) => {
	// Intercept chat requests and redirect to custom API
	try {
		console.log('🔄 Intercepting chat request for custom API');
		console.log('📤 Original request body:', body);

		// Extract the latest user message
		const messages = (body as any).messages || [];
		const userMessages = messages.filter((msg: any) => msg.role === 'user');
		const latestUserMessage = userMessages[userMessages.length - 1];
		const prompt = latestUserMessage?.content || '';

		if (prompt) {
			console.log('🚀 Redirecting to custom API');
			console.log('📝 Latest prompt:', prompt);

			// Call your custom API with exact curl format
			const customResponse = await fetch('http://127.0.0.1:8000/api/chat/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					prompt: prompt,
					conversation_id: 1,
					use_history: true
				})
			});

			console.log('📡 Custom API response status:', customResponse.status);

			if (!customResponse.ok) {
				const errorText = await customResponse.text();
				console.error('❌ Custom API error:', errorText);
				throw new Error(`Custom API request failed: ${customResponse.status} - ${errorText}`);
			}

			const responseData = await customResponse.json();
			console.log('📥 Custom API response:', responseData);

			// Handle your API response format
			let assistantMessage = '';

			// Check if response has the expected format from your API
			if (responseData.response) {
				// Your API format: { "response": "...", "conversation_id": 1, ... }
				assistantMessage = responseData.response;
				console.log('📝 Using response field:', assistantMessage);
			} else if (responseData.choices && responseData.choices[0] && responseData.choices[0].message) {
				// OpenAI format: { "choices": [{ "message": { "content": "..." } }] }
				assistantMessage = responseData.choices[0].message.content;
				console.log('📝 Using OpenAI format:', assistantMessage);
			} else if (responseData.content) {
				// Simple format: { "content": "..." }
				assistantMessage = responseData.content;
				console.log('📝 Using content field:', assistantMessage);
			} else if (typeof responseData === 'string') {
				// Plain text response
				assistantMessage = responseData;
				console.log('📝 Using plain text response:', assistantMessage);
			} else {
				console.error('❌ Unknown response format from custom API:', responseData);
				throw new Error('Unknown response format from custom API');
			}

			// Validate we have a response
			if (!assistantMessage || assistantMessage.trim() === '') {
				console.error('❌ Empty response from custom API');
				throw new Error('Empty response from custom API');
			}

			// Convert to OpenAI format that the frontend expects
			const normalizedResponse = {
				id: responseData.id || `chatcmpl-${Date.now()}`,
				object: responseData.object || 'chat.completion',
				created: responseData.created || responseData.timestamp || Math.floor(Date.now() / 1000),
				model: responseData.model || 'custom-api',
				choices: [{
					index: 0,
					message: {
						role: 'assistant',
						content: assistantMessage.toString().trim()
					},
					finish_reason: 'stop'
				}],
				usage: responseData.usage || {
					prompt_tokens: 0,
					completion_tokens: 0,
					total_tokens: 0
				}
			};

			console.log('✅ Normalized response for UI:', normalizedResponse);

			// Return a task-like response that the frontend expects
			const taskResponse = {
				task_id: `task-${Date.now()}`,
				status: 'success',
				// Include the normalized response data
				_customResponse: normalizedResponse
			};

			console.log('✅ Returning task response:', taskResponse);

			// Store the normalized response globally so the chat component can access it
			if (typeof window !== 'undefined') {
				(window as any).__customAPIResponse = normalizedResponse;
				console.log('📦 Stored normalized response globally for chat component');
			}

			return taskResponse;
		}
	} catch (customError) {
		console.error('💥 Custom API failed, falling back to original API:', customError);
		// Fall back to original API if custom API fails
	}

	// Original API call as fallback
	let error = null;

	const res = await fetch(`${url}/chat/completions`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			error = `${err?.detail ?? err}`;
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const generateCustomChatCompletion = async (body: any) => {
	// Extract the user's message from the OpenAI format
	const messages = body.messages || [];
	const userMessage = messages.find((msg: any) => msg.role === 'user');
	const prompt = userMessage?.content || '';

	// Your custom API endpoint - exact same as your curl command
	const customAPIUrl = 'http://127.0.0.1:8000/api/chat/';

	// Transform the request to match your exact curl format
	const customBody = {
		prompt: prompt,
		conversation_id: 1,
		use_history: true
	};

	console.log('🚀 Calling custom API:', customAPIUrl);
	console.log('📤 Request body (matching your curl):', customBody);

	try {
		const response = await fetch(customAPIUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(customBody)
		});

		console.log('📡 Response status:', response.status, response.statusText);

		if (!response.ok) {
			const errorText = await response.text();
			console.error('❌ API Error Response:', errorText);
			throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
		}

		const responseData = await response.json();
		console.log('📥 Response data:', responseData);

		// Your API already returns in perfect OpenAI format, just return it directly
		console.log('✅ API response is already in OpenAI format');
		return responseData;

	} catch (err: any) {
		console.error('💥 Custom API Error:', err);

		// Check if it's a network error (CORS, connection refused, etc.)
		if (err.name === 'TypeError' && err.message.includes('fetch')) {
			const error = 'Network error: Unable to connect to API server. Please check if your server is running on http://127.0.0.1:8000 and CORS is properly configured.';
			throw new Error(error);
		} else {
			throw new Error(`Custom API Error: ${err.message || err}`);
		}
	}
};

export const synthesizeOpenAISpeech = async (
	token: string = '',
	speaker: string = 'alloy',
	text: string = '',
	model: string = 'tts-1'
) => {
	let error = null;

	const res = await fetch(`${OPENAI_API_BASE_URL}/audio/speech`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			model: model,
			input: text,
			voice: speaker
		})
	}).catch((err) => {
		console.error(err);
		error = err;
		return null;
	});

	if (error) {
		throw error;
	}

	return res;
};

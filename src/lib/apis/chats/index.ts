import { WEBUI_API_BASE_URL } from '$lib/constants';
import { getTimeRange, extractUserMessage } from '$lib/utils';

// Static mock data for chat management
const STATIC_CHATS_KEY = 'static_chats';
const STATIC_TAGS_KEY = 'static_tags';

// Helper function to get chats from localStorage
const getStoredChats = () => {
    if (typeof localStorage === 'undefined') return [];
    const stored = localStorage.getItem(STATIC_CHATS_KEY);
    return stored ? JSON.parse(stored) : [];
};

// Helper function to save chats to localStorage
const saveStoredChats = (chats: any[]) => {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STATIC_CHATS_KEY, JSON.stringify(chats));
};

// Helper function to get tags from localStorage
const getStoredTags = () => {
    if (typeof localStorage === 'undefined') return [];
    const stored = localStorage.getItem(STATIC_TAGS_KEY);
    return stored ? JSON.parse(stored) : [];
};

// Helper function to save tags to localStorage
const saveStoredTags = (tags: any[]) => {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STATIC_TAGS_KEY, JSON.stringify(tags));
};

export const createNewChat = async (token: string, chat: object, folderId: string | null) => {
    // Static implementation using localStorage
    const chatData = chat as any;
    const newChat = {
        id: chatData.id || `chat_${Date.now()}`,
        title: chatData.title || 'New Chat',
        models: chatData.models || ['static-model'],
        messages: chatData.messages || [],
        history: chatData.history || { messages: {}, currentId: null },
        params: chatData.params || {},
        files: chatData.files || [],
        created_at: Math.floor(Date.now() / 1000),
        updated_at: Math.floor(Date.now() / 1000),
        folder_id: folderId,
        pinned: false,
        tags: []
    };

    const chats = getStoredChats();
    chats.unshift(newChat);
    saveStoredChats(chats);

    console.log('📝 Created new static chat:', newChat);
    return newChat;
};

export const importChat = async (
    token: string,
    chat: object,
    meta: object | null,
    pinned?: boolean,
    folderId?: string | null,
    createdAt: number | null = null,
    updatedAt: number | null = null
) => {
    let error = null;

    const res = await fetch(`${WEBUI_API_BASE_URL}/chats/import`, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            chat: chat,
            meta: meta ?? {},
            pinned: pinned,
            folder_id: folderId,
            created_at: createdAt ?? null,
            updated_at: updatedAt ?? null
        })
    })
        .then(async (res) => {
            if (!res.ok) throw await res.json();
            return res.json();
        })
        .catch((err) => {
            error = err;
            console.error(err);
            return null;
        });

    if (error) {
        throw error;
    }

    return res;
};

export const getChatList = async (token: string = '', page: number | null = null) => {
    // Static implementation using localStorage
    const chats = getStoredChats();

    // Add time_range to each chat and clean titles
    const chatsWithTimeRange = chats.map((chat) => ({
        ...chat,
        title: extractUserMessage(chat.title),
        time_range: getTimeRange(chat.updated_at)
    }));

    console.log('📋 Retrieved static chat list:', chatsWithTimeRange);
    return chatsWithTimeRange;
};

export const getChatListByUserId = async (
    token: string = '',
    userId: string,
    page: number = 1,
    filter?: object
) => {
    let error = null;

    const searchParams = new URLSearchParams();

    searchParams.append('page', `${page}`);

    if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.append(key, value.toString());
            }
        });
    }

    const res = await fetch(
        `${WEBUI_API_BASE_URL}/chats/list/user/${userId}?${searchParams.toString()}`,
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
        .then((json) => {
            return json;
        })
        .catch((err) => {
            error = err;
            console.error(err);
            return null;
        });

    if (error) {
        throw error;
    }

    return res.map((chat) => ({
        ...chat,
        time_range: getTimeRange(chat.updated_at)
    }));
};

export const getArchivedChatList = async (
    token: string = '',
    page: number = 1,
    filter?: object
) => {
    let error = null;

    const searchParams = new URLSearchParams();
    searchParams.append('page', `${page}`);

    if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.append(key, value.toString());
            }
        });
    }

    const res = await fetch(`${WEBUI_API_BASE_URL}/chats/archived?${searchParams.toString()}`, {
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
        .then((json) => {
            return json;
        })
        .catch((err) => {
            error = err;
            console.error(err);
            return null;
        });

    if (error) {
        throw error;
    }

    return res.map((chat) => ({
        ...chat,
        time_range: getTimeRange(chat.updated_at)
    }));
};

export const getAllChats = async (token: string) => {
    let error = null;

    const res = await fetch(`${WEBUI_API_BASE_URL}/chats/all`, {
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
        .then((json) => {
            return json;
        })
        .catch((err) => {
            error = err;
            console.error(err);
            return null;
        });

    if (error) {
        throw error;
    }

    return res;
};

export const getChatListBySearchText = async (token: string, text: string, page: number = 1) => {
    let error = null;

    const searchParams = new URLSearchParams();
    searchParams.append('text', text);
    searchParams.append('page', `${page}`);

    const res = await fetch(`${WEBUI_API_BASE_URL}/chats/search?${searchParams.toString()}`, {
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
        .then((json) => {
            return json;
        })
        .catch((err) => {
            error = err;
            console.error(err);
            return null;
        });

    if (error) {
        throw error;
    }

    return res.map((chat) => ({
        ...chat,
        time_range: getTimeRange(chat.updated_at)
    }));
};

export const getChatsByFolderId = async (token: string, folderId: string) => {
    let error = null;

    const res = await fetch(`${WEBUI_API_BASE_URL}/chats/folder/${folderId}`, {
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
        .then((json) => {
            return json;
        })
        .catch((err) => {
            error = err;
            console.error(err);
            return null;
        });

    if (error) {
        throw error;
    }

    return res;
};

export const getAllArchivedChats = async (token: string) => {
    let error = null;

    const res = await fetch(`${WEBUI_API_BASE_URL}/chats/all/archived`, {
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
        .then((json) => {
            return json;
        })
        .catch((err) => {
            error = err;
            console.error(err);
            return null;
        });

    if (error) {
        throw error;
    }

    return res;
};

export const getAllUserChats = async (token: string) => {
    let error = null;

    const res = await fetch(`${WEBUI_API_BASE_URL}/chats/all/db`, {
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
        .then((json) => {
            return json;
        })
        .catch((err) => {
            error = err;
            console.error(err);
            return null;
        });

    if (error) {
        throw error;
    }

    return res;
};

export const getAllTags = async (token: string) => {
    // Static implementation using localStorage
    const tags = getStoredTags();
    console.log('🏷️ Retrieved static tags:', tags);
    return tags;
};

export const getPinnedChatList = async (token: string = '') => {
    // Static implementation using localStorage
    const chats = getStoredChats();
    const pinnedChats = chats.filter(chat => chat.pinned);

    // Add time_range to each chat and clean titles
    const pinnedChatsWithTimeRange = pinnedChats.map((chat) => ({
        ...chat,
        title: extractUserMessage(chat.title),
        time_range: getTimeRange(chat.updated_at)
    }));

    console.log('📌 Retrieved static pinned chats:', pinnedChatsWithTimeRange);
    return pinnedChatsWithTimeRange;
};

export const getChatListByTagName = async (token: string = '', tagName: string) => {
    let error = null;

    const res = await fetch(`${WEBUI_API_BASE_URL}/chats/tags`, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(token && { authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
            name: tagName
        })
    })
        .then(async (res) => {
            if (!res.ok) throw await res.json();
            return res.json();
        })
        .then((json) => {
            return json;
        })
        .catch((err) => {
            error = err;
            console.error(err);
            return null;
        });

    if (error) {
        throw error;
    }

    return res.map((chat) => ({
        ...chat,
        time_range: getTimeRange(chat.updated_at)
    }));
};

export const getChatById = async (token: string, id: string) => {
    // Static implementation using localStorage
    const chats = getStoredChats();
    const chat = chats.find(c => c.id === id);

    if (!chat) {
        throw new Error(`Chat with id ${id} not found`);
    }

    console.log('🔍 Retrieved static chat by ID:', chat);
    return chat;
};

export const getChatByShareId = async (token: string, share_id: string) => {
    let error = null;

    const res = await fetch(`${WEBUI_API_BASE_URL}/chats/share/${share_id}`, {
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
        .then((json) => {
            return json;
        })
        .catch((err) => {
            error = err;

            console.error(err);
            return null;
        });

    if (error) {
        throw error;
    }

    return res;
};

export const getChatPinnedStatusById = async (token: string, id: string) => {
    let error = null;

    const res = await fetch(`${WEBUI_API_BASE_URL}/chats/${id}/pinned`, {
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
        .then((json) => {
            return json;
        })
        .catch((err) => {
            error = err;

            if ('detail' in err) {
                error = err.detail;
            } else {
                error = err;
            }

            console.error(err);
            return null;
        });

    if (error) {
        throw error;
    }

    return res;
};

export const toggleChatPinnedStatusById = async (token: string, id: string) => {
    let error = null;

    const res = await fetch(`${WEBUI_API_BASE_URL}/chats/${id}/pin`, {
        method: 'POST',
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
        .then((json) => {
            return json;
        })
        .catch((err) => {
            error = err;

            if ('detail' in err) {
                error = err.detail;
            } else {
                error = err;
            }

            console.error(err);
            return null;
        });

    if (error) {
        throw error;
    }

    return res;
};

export const cloneChatById = async (token: string, id: string, title?: string) => {
    let error = null;

    const res = await fetch(`${WEBUI_API_BASE_URL}/chats/${id}/clone`, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(token && { authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
            ...(title && { title: title })
        })
    })
        .then(async (res) => {
            if (!res.ok) throw await res.json();
            return res.json();
        })
        .then((json) => {
            return json;
        })
        .catch((err) => {
            error = err;

            if ('detail' in err) {
                error = err.detail;
            } else {
                error = err;
            }

            console.error(err);
            return null;
        });

    if (error) {
        throw error;
    }

    return res;
};

export const cloneSharedChatById = async (token: string, id: string) => {
    let error = null;

    const res = await fetch(`${WEBUI_API_BASE_URL}/chats/${id}/clone/shared`, {
        method: 'POST',
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
        .then((json) => {
            return json;
        })
        .catch((err) => {
            error = err;

            if ('detail' in err) {
                error = err.detail;
            } else {
                error = err;
            }

            console.error(err);
            return null;
        });

    if (error) {
        throw error;
    }

    return res;
};

export const shareChatById = async (token: string, id: string) => {
    let error = null;

    const res = await fetch(`${WEBUI_API_BASE_URL}/chats/${id}/share`, {
        method: 'POST',
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
        .then((json) => {
            return json;
        })
        .catch((err) => {
            error = err;

            console.error(err);
            return null;
        });

    if (error) {
        throw error;
    }

    return res;
};

export const updateChatFolderIdById = async (token: string, id: string, folderId?: string) => {
    let error = null;

    const res = await fetch(`${WEBUI_API_BASE_URL}/chats/${id}/folder`, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(token && { authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
            folder_id: folderId
        })
    })
        .then(async (res) => {
            if (!res.ok) throw await res.json();
            return res.json();
        })
        .then((json) => {
            return json;
        })
        .catch((err) => {
            error = err;

            console.error(err);
            return null;
        });

    if (error) {
        throw error;
    }

    return res;
};

export const archiveChatById = async (token: string, id: string) => {
    let error = null;

    const res = await fetch(`${WEBUI_API_BASE_URL}/chats/${id}/archive`, {
        method: 'POST',
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
        .then((json) => {
            return json;
        })
        .catch((err) => {
            error = err;

            console.error(err);
            return null;
        });

    if (error) {
        throw error;
    }

    return res;
};

export const deleteSharedChatById = async (token: string, id: string) => {
    let error = null;

    const res = await fetch(`${WEBUI_API_BASE_URL}/chats/${id}/share`, {
        method: 'DELETE',
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
        .then((json) => {
            return json;
        })
        .catch((err) => {
            error = err;

            console.error(err);
            return null;
        });

    if (error) {
        throw error;
    }

    return res;
};

export const updateChatById = async (token: string, id: string, chat: object) => {
    // Static implementation using localStorage
    const chats = getStoredChats();
    const chatIndex = chats.findIndex(c => c.id === id);

    if (chatIndex === -1) {
        throw new Error(`Chat with id ${id} not found`);
    }

    // Update the chat with new data
    const updatedChat = {
        ...chats[chatIndex],
        ...chat,
        updated_at: Math.floor(Date.now() / 1000)
    };

    chats[chatIndex] = updatedChat;
    saveStoredChats(chats);

    console.log('💾 Updated static chat:', updatedChat);
    return updatedChat;
};

export const deleteChatById = async (token: string, id: string) => {
    let error = null;

    const res = await fetch(`${WEBUI_API_BASE_URL}/chats/${id}`, {
        method: 'DELETE',
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
        .then((json) => {
            return json;
        })
        .catch((err) => {
            error = err.detail;

            console.error(err);
            return null;
        });

    if (error) {
        throw error;
    }

    return res;
};

export const getTagsById = async (token: string, id: string) => {
    // Static implementation using localStorage
    const chats = getStoredChats();
    const chat = chats.find(c => c.id === id);

    if (!chat) {
        return [];
    }

    console.log('🏷️ Retrieved static tags for chat:', chat.tags || []);
    return chat.tags || [];
};

export const addTagById = async (token: string, id: string, tagName: string) => {
    let error = null;

    const res = await fetch(`${WEBUI_API_BASE_URL}/chats/${id}/tags`, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(token && { authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
            name: tagName
        })
    })
        .then(async (res) => {
            if (!res.ok) throw await res.json();
            return res.json();
        })
        .then((json) => {
            return json;
        })
        .catch((err) => {
            error = err.detail;
            console.error(err);
            return null;
        });

    if (error) {
        throw error;
    }

    return res;
};

export const deleteTagById = async (token: string, id: string, tagName: string) => {
    let error = null;

    const res = await fetch(`${WEBUI_API_BASE_URL}/chats/${id}/tags`, {
        method: 'DELETE',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(token && { authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
            name: tagName
        })
    })
        .then(async (res) => {
            if (!res.ok) throw await res.json();
            return res.json();
        })
        .then((json) => {
            return json;
        })
        .catch((err) => {
            error = err;

            console.error(err);
            return null;
        });

    if (error) {
        throw error;
    }

    return res;
};
export const deleteTagsById = async (token: string, id: string) => {
    let error = null;

    const res = await fetch(`${WEBUI_API_BASE_URL}/chats/${id}/tags/all`, {
        method: 'DELETE',
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
        .then((json) => {
            return json;
        })
        .catch((err) => {
            error = err;

            console.error(err);
            return null;
        });

    if (error) {
        throw error;
    }

    return res;
};

export const deleteAllChats = async (token: string) => {
    let error = null;

    const res = await fetch(`${WEBUI_API_BASE_URL}/chats/`, {
        method: 'DELETE',
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
        .then((json) => {
            return json;
        })
        .catch((err) => {
            error = err.detail;

            console.error(err);
            return null;
        });

    if (error) {
        throw error;
    }

    return res;
};

export const archiveAllChats = async (token: string) => {
    let error = null;

    const res = await fetch(`${WEBUI_API_BASE_URL}/chats/archive/all`, {
        method: 'POST',
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
        .then((json) => {
            return json;
        })
        .catch((err) => {
            error = err.detail;

            console.error(err);
            return null;
        });

    if (error) {
        throw error;
    }

    return res;
};

export const createChatViaAPI = async (token: string, chatbotIdentifier?: string) => {
    let error = null;

    try {
        const formdata = new FormData();
        if (chatbotIdentifier) {
            const isNumericPk = typeof chatbotIdentifier === 'string' && /^\d+$/.test(chatbotIdentifier);
            // Backend expects numeric pk in 'chatbot'. If we only have a UID, try 'chatbot_uid'.
            if (isNumericPk) {
                formdata.append('chatbot', chatbotIdentifier);
            } else {
                formdata.append('chatbot_uid', chatbotIdentifier);
            }
        }

        // Get token from localStorage if not provided
        const authToken = token || localStorage.getItem('token');

        const headers: HeadersInit = {};
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}api/v1/chat-create/`, {
            method: 'POST',
            headers,
            body: formdata,
            mode: 'cors',
            credentials: 'omit'
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`HTTP error! status: ${response.status} body: ${text}`);
        }

        const result = await response.json();
        return result;
    } catch (err) {
        error = err;
        console.error('Error creating chat:', err);
        return null;
    }
};

export const sendChatMessage = async (chatId: string, prompt: string) => {
    let error = null;

    try {
        console.log('🔄 sendChatMessage called with:', { chatId, prompt: prompt.substring(0, 50) + '...' });

        const formdata = new FormData();
        formdata.append("prompt", prompt);

        // Get token from localStorage
        const authToken = localStorage.getItem('token');
        console.log('🔑 Auth token exists:', !!authToken);

        const headers: HeadersInit = {};
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const requestOptions = {
            method: 'POST',
            headers,
            body: formdata,
            redirect: 'follow'
        };

        const apiUrl = `${import.meta.env.VITE_API_BASE_URL}api/v1/chat/${chatId}/`;
        console.log('🌐 Making request to:', apiUrl);
        console.log('📋 Request options:', {
            method: requestOptions.method,
            headers: Object.keys(headers),
            hasBody: !!requestOptions.body
        });

        const response = await fetch(apiUrl, requestOptions);

        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ HTTP error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        // Check if response is streaming (SSE format)
        const contentType = response.headers.get('content-type') || '';
        console.log('📋 Response content-type:', contentType);

        if (contentType.includes('text/event-stream')) {
            // Handle Server-Sent Events streaming response
            const responseText = await response.text();
            console.log('📡 Raw SSE response:', responseText.substring(0, 200) + '...');

            // Parse SSE format and collect all tokens
            const lines = responseText.split('\n');
            let fullResponse = '';
            let lastValidData = null;

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const jsonStr = line.substring(6); // Remove "data: " prefix
                        if (jsonStr.trim() && jsonStr !== '[DONE]') {
                            const data = JSON.parse(jsonStr);
                            if (data.token) {
                                fullResponse += data.token;
                            }
                            lastValidData = data;
                        }
                    } catch (parseError) {
                        console.warn('⚠️ Failed to parse SSE line:', line, parseError);
                    }
                }
            }

            console.log('✅ Parsed streaming response:', { fullResponse, lastValidData });

            // Return in the format expected by the frontend
            return {
                success: true,
                response: fullResponse,
                data: lastValidData
            };
        } else {
            // Handle regular JSON response
            const result = await response.json();
            console.log('✅ API response received:', result);
            return result;
        }
        
    } catch (err) {
        error = err;
        console.error('❌ Error sending chat message:', err);
        console.error('❌ Error details:', {
            message: err.message,
            stack: err.stack,
            chatId,
            apiBaseUrl: import.meta.env.VITE_API_BASE_URL
        });
        return null;
    }
};

// export const sendChatMessage = async (
//  chatId: string,
//  prompt: string,
//  onToken: (token: string) => void
// ) => {
//  let error = null;

//  try {
//      console.log('🔄 sendChatMessage called with:', { chatId, prompt: prompt.substring(0, 50) + '...' });

//      const formdata = new FormData();
//      formdata.append("prompt", prompt);

//      const authToken = localStorage.getItem('token');
//      const headers: HeadersInit = {};
//      if (authToken) {
//          headers['Authorization'] = `Bearer ${authToken}`;
//      }

//      const requestOptions = {
//          method: 'POST',
//          headers,
//          body: formdata
//      };

//      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}api/v1/chat/${chatId}/`;
//      const response = await fetch(apiUrl, requestOptions);

//      if (!response.ok || !response.body) {
//          const text = await response.text();
//          throw new Error(`HTTP error ${response.status}: ${text}`);
//      }

//      // ✅ Stream the response
//      const reader = response.body.getReader();
//      const decoder = new TextDecoder('utf-8');
//      let buffer = '';
//      let isFirstToken = true;
//      let lastChar = '';

//      while (true) {
//          const { done, value } = await reader.read();
//          if (done) break;

//          buffer += decoder.decode(value, { stream: true });
//          let lines = buffer.split('\n\n');
//          buffer = lines.pop() || '';

//          for (const line of lines) {
//              if (line.startsWith('data: ')) {
//                  let token = line.replace('data: ', '').trim();
//                  if (token) {
//                      // 🧠 Insert space if needed
//                      const needsSpace =
//                          lastChar &&
//                          ![' ', '\n'].includes(lastChar) &&
//                          !['.', ',', '?', '!', ':', ';'].includes(token[0]);

//                      if (isFirstToken) {
//                          token = token.trimStart(); // no space for first token
//                          isFirstToken = false;
//                      } else if (needsSpace) {
//                          token = ' ' + token;
//                      }

//                      lastChar = token[token.length - 1] || lastChar;

//                      // ✅ Send just the new token
//                      onToken(token);
//                  }
//              } else if (line.startsWith('event: error')) {
//                  console.error('🚨 Server sent error event:', line);
//              }
//          }
//      }

//      return { success: true };
//  } catch (err) {
//      error = err;
//      console.error('❌ Error sending chat message:', err);
//      console.error('❌ Error details:', {
//          message: err.message,
//          stack: err.stack,
//          chatId,
//          apiBaseUrl: import.meta.env.VITE_API_BASE_URL
//      });
//      return null;
//  }
// };




// Test function to diagnose API connectivity issues
export const testChatAPI = async () => {
    console.log('🧪 Testing Chat API connectivity...');

    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const token = localStorage.getItem('token');

    console.log('🔧 Base URL:', baseUrl);
    console.log('🔑 Token exists:', !!token);

    // Test 1: Basic connectivity
    try {
        const healthUrl = `${baseUrl}api/v1/health/`;
        console.log('🏥 Testing health endpoint:', healthUrl);
        const healthResponse = await fetch(healthUrl);
        console.log('🏥 Health response:', healthResponse.status, healthResponse.statusText);
    } catch (error) {
        console.error('❌ Health check failed:', error);
    }

    // Test 2: Chat endpoint with minimal data
    try {
        const testChatId = 'test-chat-id';
        const chatUrl = `${baseUrl}api/v1/chat/${testChatId}/`;
        console.log('💬 Testing chat endpoint:', chatUrl);

        const headers: HeadersInit = {
            'Content-Type': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const testResponse = await fetch(chatUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({ prompt: 'test' })
        });

        console.log('💬 Chat test response:', testResponse.status, testResponse.statusText);

        if (!testResponse.ok) {
            const errorText = await testResponse.text();
            console.error('💬 Chat test error body:', errorText);
        }
    } catch (error) {
        console.error('❌ Chat test failed:', error);
    }

    // Test 3: Available endpoints
    try {
        const endpointsUrl = `${baseUrl}api/v1/`;
        console.log('📋 Testing base API endpoint:', endpointsUrl);
        const endpointsResponse = await fetch(endpointsUrl);
        console.log('📋 Base API response:', endpointsResponse.status, endpointsResponse.statusText);

        if (endpointsResponse.ok) {
            const endpointsData = await endpointsResponse.text();
            console.log('📋 Available endpoints:', endpointsData.substring(0, 500));
        }
    } catch (error) {
        console.error('❌ Endpoints test failed:', error);
    }

    console.log('🧪 API connectivity test completed. Check logs above for details.');
};

export const sendChatMessageStreaming = async (
    chatId: string,
    prompt: string,
    onChunk: (chunk: string) => void,
    onComplete: (fullResponse: string) => void,
    onError: (error: Error) => void
) => {
    try {
        const formdata = new FormData();
        formdata.append("prompt", prompt);
        formdata.append("stream", "true"); // Enable streaming

        // Get token from localStorage
        const authToken = localStorage.getItem('token');

        const headers: HeadersInit = {};
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const requestOptions: RequestInit = {
            method: 'POST',
            headers,
            body: formdata
        };

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}api/v1/chat/${chatId}/stream/`, requestOptions);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!response.body) {
            throw new Error('Response body is null');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        try {
            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    break;
                }

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.trim() === '') continue;

                    // Handle Server-Sent Events format
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6); // Remove 'data: ' prefix

                        if (data === '[DONE]') {
                            onComplete(fullResponse);
                            return;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content || parsed.content || '';

                            if (content) {
                                fullResponse += content;
                                onChunk(content);
                            }
                        } catch (parseError) {
                            // If not JSON, treat as plain text
                            if (data.trim()) {
                                fullResponse += data;
                                onChunk(data);
                            }
                        }
                    }
                }
            }

            onComplete(fullResponse);
        } finally {
            reader.releaseLock();
        }
    } catch (err) {
        console.error('Error in streaming chat message:', err);
        onError(err as Error);
    }
};

export const sendChatMessageStreamingSSE = async (
    chatId: string,
    prompt: string,
    onChunk: (chunk: string) => void,
    onComplete: (fullResponse: string) => void,
    onError: (error: Error) => void
) => {
    try {
        // Get token from localStorage
        const authToken = localStorage.getItem('token');

        // Create URL with parameters
        const url = new URL(`${import.meta.env.VITE_API_BASE_URL}/api/v1/chat/${chatId}/stream/`);
        url.searchParams.append('prompt', prompt);
        url.searchParams.append('stream', 'true');

        // Create EventSource with authorization header (if supported)
        const eventSource = new EventSource(url.toString());
        let fullResponse = '';

        eventSource.onmessage = (event) => {
            const data = event.data;

            if (data === '[DONE]') {
                eventSource.close();
                onComplete(fullResponse);
                return;
            }

            try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || parsed.content || '';

                if (content) {
                    fullResponse += content;
                    onChunk(content);
                }
            } catch (parseError) {
                // If not JSON, treat as plain text
                if (data.trim()) {
                    fullResponse += data;
                    onChunk(data);
                }
            }
        };

        eventSource.onerror = (event) => {
            console.error('EventSource error:', event);
            eventSource.close();
            onError(new Error('Streaming connection error'));
        };

        // Return a function to close the connection
        return () => {
            eventSource.close();
        };
    } catch (err) {
        console.error('Error setting up streaming chat message:', err);
        onError(err as Error);
        return () => {}; // Return empty cleanup function
    }
};

// Enhanced streaming function with better error handling and format support
export const streamChatMessage = async (
    chatId: string,
    prompt: string,
    callbacks: {
        onStart?: () => void;
        onChunk: (chunk: string) => void;
        onComplete: (fullResponse: string) => void;
        onError: (error: Error) => void;
    }
) => {
    const { onStart, onChunk, onComplete, onError } = callbacks;

    try {
        onStart?.();

        const formdata = new FormData();
        formdata.append("prompt", prompt);
        formdata.append("stream", "true");

        // Get token from localStorage
        const authToken = localStorage.getItem('token');

        const headers: HeadersInit = {
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache'
        };

        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/chat/${chatId}/stream/`, {
            method: 'POST',
            headers,
            body: formdata
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!response.body) {
            throw new Error('Response body is null');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';
        let buffer = '';

        const processBuffer = (buffer: string) => {
            const lines = buffer.split('\n');
            const lastLine = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
                if (line.trim() === '') continue;

                if (line.startsWith('data: ')) {
                    const data = line.slice(6).trim();

                    if (data === '[DONE]') {
                        onComplete(fullResponse);
                        return true; // Signal completion
                    }

                    try {
                        const parsed = JSON.parse(data);
                        // Handle different response formats
                        const content = parsed.choices?.[0]?.delta?.content ||
                                        parsed.delta?.content ||
                                        parsed.content ||
                                        parsed.text || '';

                        if (content) {
                            fullResponse += content;
                            onChunk(content);
                        }
                    } catch (parseError) {
                        // Handle plain text responses
                        if (data.trim() && data !== '[DONE]') {
                            fullResponse += data;
                            onChunk(data);
                        }
                    }
                }
            }

            return lastLine; // Return remaining buffer
        };

        try {
            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    if (buffer.trim()) {
                        processBuffer(buffer + '\n');
                    }
                    onComplete(fullResponse);
                    break;
                }

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;

                // Process complete lines
                const remainingBuffer = processBuffer(buffer);
                if (remainingBuffer === true) {
                    // Completion signal received
                    break;
                }
                buffer = remainingBuffer;
            }
        } finally {
            reader.releaseLock();
        }

        return {
            fullResponse,
            success: true
        };
    } catch (err) {
        console.error('Error in streaming chat message:', err);
        onError(err as Error);
        return {
            fullResponse: '',
            success: false,
            error: err
        };
    }
};

/*
USAGE EXAMPLES:

1. Basic Streaming (Fetch API with ReadableStream):
```javascript
import { sendChatMessageStreaming } from '$lib/apis/chats';

await sendChatMessageStreaming(
    chatId,
    prompt,
    (chunk) => {
        // Handle each chunk of the response
        console.log('Received chunk:', chunk);
        // Update UI with streaming text
        responseText += chunk;
    },
    (fullResponse) => {
        // Handle completion
        console.log('Complete response:', fullResponse);
        // Mark message as complete
    },
    (error) => {
        // Handle errors
        console.error('Streaming error:', error);
        // Show error message to user
    }
);
```

2. Server-Sent Events (EventSource):
```javascript
import { sendChatMessageStreamingSSE } from '$lib/apis/chats';

const cleanup = await sendChatMessageStreamingSSE(
    chatId,
    prompt,
    (chunk) => {
        // Handle each chunk
        responseText += chunk;
        // Update UI in real-time
    },
    (fullResponse) => {
        // Handle completion
        console.log('Streaming complete');
    },
    (error) => {
        // Handle errors
        console.error('SSE error:', error);
    }
);

// Call cleanup() to close the connection if needed
// cleanup();
```

3. Enhanced Streaming with Callbacks:
```javascript
import { streamChatMessage } from '$lib/apis/chats';

const result = await streamChatMessage(chatId, prompt, {
    onStart: () => {
        // Show loading indicator
        console.log('Starting stream...');
    },
    onChunk: (chunk) => {
        // Update UI with each chunk
        responseText += chunk;
        // Auto-scroll to bottom
        scrollToBottom();
    },
    onComplete: (fullResponse) => {
        // Mark as complete and save
        console.log('Stream complete:', fullResponse);
        // Save to chat history
    },
    onError: (error) => {
        // Handle errors gracefully
        console.error('Stream error:', error);
        // Show error message
    }
});
```

4. Integration in Chat Component:
```javascript
// In your chat component
const sendStreamingMessage = async (prompt) => {
    let responseMessageId = uuidv4();
    let responseMessage = {
        id: responseMessageId,
        role: 'assistant',
        content: '',
        timestamp: Math.floor(Date.now() / 1000),
        done: false
    };

    // Add empty response message to history
    history.messages[responseMessageId] = responseMessage;
    history.currentId = responseMessageId;

    await streamChatMessage(chatId, prompt, {
        onStart: () => {
            // Show typing indicator
            responseMessage.streaming = true;
        },
        onChunk: (chunk) => {
            // Update message content in real-time
            responseMessage.content += chunk;
            history.messages[responseMessageId] = responseMessage;
            // Trigger reactivity
            history = history;
        },
        onComplete: (fullResponse) => {
            // Mark as complete
            responseMessage.done = true;
            responseMessage.streaming = false;
            history.messages[responseMessageId] = responseMessage;
            // Save to backend
            saveChatHandler(chatId, history);
        },
        onError: (error) => {
            // Handle error
            responseMessage.error = { content: error.message };
            responseMessage.done = true;
            responseMessage.streaming = false;
            history.messages[responseMessageId] = responseMessage;
        }
    });
};
```
*/

export const getRecentChats = async () => {
    let error = null;
    try {
        // Get token from localStorage
        const authToken = localStorage.getItem('token');
        console.log('🔑 getRecentChats - Token exists:', !!authToken);
        console.log('🔗 getRecentChats - API URL:', `${import.meta.env.VITE_API_BASE_URL}api/v1/recent-chats/`);

        const headers: HeadersInit = {};
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const requestOptions: RequestInit = {
            method: 'GET',
            headers,
            redirect: 'follow' as RequestRedirect
        };
        console.log('📤 getRecentChats - Request options:', requestOptions);

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}api/v1/recent-chats/`, requestOptions);
        console.log('📥 getRecentChats - Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ getRecentChats - Error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }
        const result = await response.json();
        console.log('✅ getRecentChats - Success result:', result);

        // Clean the chat titles by extracting user messages from system prompts
        if (result && result.success && Array.isArray(result.response)) {
            result.response = result.response.map(chat => {
                const originalTitle = chat.title;
                const cleanedTitle = extractUserMessage(chat.title);
                console.log('🧹 Cleaning chat title:', { originalTitle, cleanedTitle });
                return {
                    ...chat,
                    title: cleanedTitle
                };
            });
        }

        return result;
    } catch (err) {
        error = err;
        console.error('❌ getRecentChats - Error:', err);
        return null;
    }
};

export const getChatHistory = async (chatId) => {
    let error = null;
    try {
        // Get token from localStorage
        const authToken = localStorage.getItem('token');
        console.log('🔑 getChatHistory - Token exists:', !!authToken, 'for chatId:', chatId);
        console.log('🔗 getChatHistory - API URL:', `${import.meta.env.VITE_API_BASE_URL}api/v1/chat-history/${chatId}/`);

        const headers: HeadersInit = {};
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const requestOptions: RequestInit = {
            method: 'GET',
            headers,
            redirect: 'follow' as RequestRedirect
        };
        console.log('📤 getChatHistory - Request options:', requestOptions);

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}api/v1/chat-history/${chatId}/`, requestOptions);
        console.log('📥 getChatHistory - Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ getChatHistory - Error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }
        const result = await response.json();
        console.log('✅ getChatHistory - Success result:', result);
        return result;
    } catch (err) {
        error = err;
        console.error('❌ getChatHistory - Error:', err);
        return null;
    }
};


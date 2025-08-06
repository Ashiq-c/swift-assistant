// Debug script to test chat history API
// Run this in the browser console to test the API directly

async function testChatHistoryAPI(chatId) {
    console.log('🧪 Testing chat history API for chatId:', chatId);
    
    try {
        // Get token from localStorage
        const authToken = localStorage.getItem('token');
        console.log('🔑 Auth token exists:', !!authToken);

        const headers = {};
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const apiUrl = `${window.location.origin.replace('5174', '8000')}/api/v1/chat-history/${chatId}/`;
        console.log('🌐 API URL:', apiUrl);

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers,
            redirect: 'follow'
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error:', response.status, errorText);
            return null;
        }

        const result = await response.json();
        console.log('✅ API Response:', result);
        
        // Validate response format
        if (result && typeof result === 'object') {
            if (result.success !== undefined) {
                console.log('✅ Response has success field:', result.success);
            }
            if (Array.isArray(result.response)) {
                console.log('✅ Response has array field with', result.response.length, 'items');
                result.response.forEach((item, index) => {
                    console.log(`📋 Item ${index}:`, item);
                });
            } else {
                console.log('⚠️ Response.response is not an array:', typeof result.response);
            }
        }
        
        return result;
    } catch (error) {
        console.error('❌ Error testing API:', error);
        return null;
    }
}

// Function to test with a sample chat ID
async function testWithSampleChatId() {
    // Try to get a chat ID from recent chats or use a sample one
    const sampleChatId = 'your-chat-id-here'; // Replace with actual chat ID
    return await testChatHistoryAPI(sampleChatId);
}

// Function to get recent chats and test with the first one
async function testWithRecentChat() {
    try {
        console.log('🔄 Getting recent chats first...');
        
        const authToken = localStorage.getItem('token');
        const headers = {};
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const recentChatsUrl = `${window.location.origin.replace('5174', '8000')}/api/v1/recent-chats/`;
        console.log('🌐 Recent chats URL:', recentChatsUrl);

        const response = await fetch(recentChatsUrl, {
            method: 'GET',
            headers,
            redirect: 'follow'
        });

        if (!response.ok) {
            console.error('❌ Recent chats API error:', response.status);
            return null;
        }

        const recentChats = await response.json();
        console.log('📋 Recent chats:', recentChats);

        if (recentChats && recentChats.response && recentChats.response.length > 0) {
            const firstChatId = recentChats.response[0].id;
            console.log('🎯 Testing with first recent chat ID:', firstChatId);
            return await testChatHistoryAPI(firstChatId);
        } else {
            console.log('❌ No recent chats found');
            return null;
        }
    } catch (error) {
        console.error('❌ Error getting recent chats:', error);
        return null;
    }
}

// Export functions to global scope for console use
window.testChatHistoryAPI = testChatHistoryAPI;
window.testWithSampleChatId = testWithSampleChatId;
window.testWithRecentChat = testWithRecentChat;

console.log('🧪 Debug functions loaded!');
console.log('📋 Available functions:');
console.log('  - testChatHistoryAPI(chatId) - Test API with specific chat ID');
console.log('  - testWithRecentChat() - Get recent chats and test with first one');
console.log('  - testWithSampleChatId() - Test with hardcoded sample ID');

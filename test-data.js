// Test script to add sample chats with history to localStorage
// Run this in the browser console to create test data

const sampleChats = [
    {
        id: 'chat_1',
        title: 'Discussion about AI',
        models: ['static-model'],
        messages: [
            { role: 'user', content: 'What is artificial intelligence?' },
            { role: 'assistant', content: 'Artificial intelligence (AI) is a branch of computer science that aims to create machines capable of intelligent behavior.' }
        ],
        history: {
            messages: {
                'msg_1': {
                    id: 'msg_1',
                    parentId: null,
                    childrenIds: ['msg_2'],
                    role: 'user',
                    content: 'What is artificial intelligence?',
                    timestamp: Date.now() - 3600000,
                    models: ['static-model']
                },
                'msg_2': {
                    id: 'msg_2',
                    parentId: 'msg_1',
                    childrenIds: [],
                    role: 'assistant',
                    content: 'Artificial intelligence (AI) is a branch of computer science that aims to create machines capable of intelligent behavior.',
                    timestamp: Date.now() - 3500000,
                    models: ['static-model'],
                    done: true
                }
            },
            currentId: 'msg_2'
        },
        params: {},
        files: [],
        created_at: Math.floor((Date.now() - 3600000) / 1000),
        updated_at: Math.floor((Date.now() - 1800000) / 1000),
        folder_id: null,
        pinned: false,
        tags: []
    },
    {
        id: 'chat_2',
        title: 'Programming Help',
        models: ['static-model'],
        messages: [
            { role: 'user', content: 'How do I create a function in JavaScript?' },
            { role: 'assistant', content: 'You can create a function in JavaScript using the function keyword or arrow function syntax.' },
            { role: 'user', content: 'Can you show me an example?' },
            { role: 'assistant', content: 'Sure! Here\'s an example:\n\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\n// Or using arrow function:\nconst greet = (name) => `Hello, ${name}!`;' }
        ],
        history: {
            messages: {
                'msg_3': {
                    id: 'msg_3',
                    parentId: null,
                    childrenIds: ['msg_4'],
                    role: 'user',
                    content: 'How do I create a function in JavaScript?',
                    timestamp: Date.now() - 7200000,
                    models: ['static-model']
                },
                'msg_4': {
                    id: 'msg_4',
                    parentId: 'msg_3',
                    childrenIds: ['msg_5'],
                    role: 'assistant',
                    content: 'You can create a function in JavaScript using the function keyword or arrow function syntax.',
                    timestamp: Date.now() - 7100000,
                    models: ['static-model'],
                    done: true
                },
                'msg_5': {
                    id: 'msg_5',
                    parentId: 'msg_4',
                    childrenIds: ['msg_6'],
                    role: 'user',
                    content: 'Can you show me an example?',
                    timestamp: Date.now() - 7000000,
                    models: ['static-model']
                },
                'msg_6': {
                    id: 'msg_6',
                    parentId: 'msg_5',
                    childrenIds: [],
                    role: 'assistant',
                    content: 'Sure! Here\'s an example:\n\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\n// Or using arrow function:\nconst greet = (name) => `Hello, ${name}!`;',
                    timestamp: Date.now() - 6900000,
                    models: ['static-model'],
                    done: true
                }
            },
            currentId: 'msg_6'
        },
        params: {},
        files: [],
        created_at: Math.floor((Date.now() - 7200000) / 1000),
        updated_at: Math.floor((Date.now() - 900000) / 1000),
        folder_id: null,
        pinned: false,
        tags: []
    },
    {
        id: 'chat_3',
        title: 'Weather Question',
        models: ['static-model'],
        messages: [
            { role: 'user', content: 'What\'s the weather like today?' },
            { role: 'assistant', content: 'I don\'t have access to real-time weather data, but I can help you find weather information.' }
        ],
        history: {
            messages: {
                'msg_7': {
                    id: 'msg_7',
                    parentId: null,
                    childrenIds: ['msg_8'],
                    role: 'user',
                    content: 'What\'s the weather like today?',
                    timestamp: Date.now() - 10800000,
                    models: ['static-model']
                },
                'msg_8': {
                    id: 'msg_8',
                    parentId: 'msg_7',
                    childrenIds: [],
                    role: 'assistant',
                    content: 'I don\'t have access to real-time weather data, but I can help you find weather information.',
                    timestamp: Date.now() - 10700000,
                    models: ['static-model'],
                    done: true
                }
            },
            currentId: 'msg_8'
        },
        params: {},
        files: [],
        created_at: Math.floor((Date.now() - 10800000) / 1000),
        updated_at: Math.floor((Date.now() - 600000) / 1000),
        folder_id: null,
        pinned: false,
        tags: []
    }
];

// Add sample chat history data for getChatHistory function
const sampleChatHistory = {
    'chat_1': [
        {
            prompt: 'Tell me about machine learning',
            system: 'Machine learning is a subset of AI that enables computers to learn and improve from experience without being explicitly programmed.',
            created_at: new Date(Date.now() - 5400000).toISOString()
        },
        {
            prompt: 'What are the main types of machine learning?',
            system: 'The main types are supervised learning, unsupervised learning, and reinforcement learning.',
            created_at: new Date(Date.now() - 4800000).toISOString()
        }
    ],
    'chat_2': [
        {
            prompt: 'Explain variables in programming',
            system: 'Variables are containers that store data values. In most programming languages, you can assign different types of data to variables.',
            created_at: new Date(Date.now() - 8100000).toISOString()
        },
        {
            prompt: 'What are data types?',
            system: 'Data types specify what kind of data a variable can hold, such as numbers, strings, booleans, arrays, and objects.',
            created_at: new Date(Date.now() - 7800000).toISOString()
        }
    ],
    'chat_3': [
        {
            prompt: 'How do weather forecasts work?',
            system: 'Weather forecasts use complex mathematical models that analyze current atmospheric conditions and predict future weather patterns.',
            created_at: new Date(Date.now() - 11400000).toISOString()
        }
    ]
};

// Function to set up test data
function setupTestData() {
    // Store chats
    localStorage.setItem('static_chats', JSON.stringify(sampleChats));
    
    // Store chat history separately (this simulates the backend data)
    localStorage.setItem('test_chat_history', JSON.stringify(sampleChatHistory));
    
    console.log('✅ Test data has been set up!');
    console.log('📋 Created', sampleChats.length, 'sample chats');
    console.log('🔄 Refresh the page to see the recent chats in the sidebar');
}

// Run the setup
setupTestData();

<script>
  import { chatbotConfig } from '../../lib/stores.js';
  import { PERSONAS } from '../../lib/types.js';
  
  export let botName = "Your Chatbot";
  export let className = "";
  
  let activeTab = 'manual';
  let selectedPersona = null;
  let isActive = false;
  let message = '';
  let messages = [];
  
  function sendMessage() {
    if (!message.trim()) return;
    
    const newMessage = {
      id: Date.now().toString(),
      content: message,
      sender: 'user'
    };
    
    messages = [...messages, newMessage];
    message = '';
    
    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: (Date.now() + 1).toString(),
        content: "Thank you for your message! I'm here to help you with your learning journey.",
        sender: 'bot'
      };
      messages = [...messages, botResponse];
    }, 1000);
  }
  
  function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }
  
  function clearMessages() {
    messages = [];
  }
</script>

<div class="bg-white rounded-lg border border-gray-200 shadow-sm {className}">
  <!-- Preview Header -->
  <div class="border-b border-gray-200 p-4">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-lg font-semibold text-gray-900">Live Preview</h3>
      <div class="flex items-center space-x-2">
        <button
          on:click={() => isActive = !isActive}
          class="flex items-center px-3 py-1 rounded-full text-sm {isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}"
        >
          {#if isActive}
            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Active
          {:else}
            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Inactive
          {/if}
        </button>
        <button
          on:click={clearMessages}
          class="p-1 text-gray-400 hover:text-gray-600"
          title="Clear messages"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
    
    <!-- Tabs -->
    <div class="flex space-x-1 bg-gray-100 p-1 rounded-lg">
      <button
        on:click={() => activeTab = 'manual'}
        class="flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors {activeTab === 'manual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
      >
        Manual Test
      </button>
      <button
        on:click={() => activeTab = 'ai'}
        class="flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors {activeTab === 'ai' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
      >
        AI Test
      </button>
    </div>
  </div>

  <!-- Preview Content -->
  <div class="p-4">
    {#if activeTab === 'manual'}
      <!-- Manual Test Interface -->
      <div class="space-y-4">
        <!-- Chat Messages -->
        <div class="h-64 border border-gray-200 rounded-lg p-3 overflow-y-auto bg-gray-50">
          {#if messages.length === 0}
            <div class="flex items-center justify-center h-full text-gray-500 text-sm">
              Start a conversation to test your bot
            </div>
          {:else}
            <div class="space-y-3">
              {#each messages as msg}
                <div class="flex {msg.sender === 'user' ? 'justify-end' : 'justify-start'}">
                  <div class="max-w-xs px-3 py-2 rounded-lg {msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200'}">
                    <p class="text-sm">{msg.content}</p>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
        
        <!-- Message Input -->
        <div class="flex space-x-2">
          <input
            type="text"
            bind:value={message}
            on:keypress={handleKeyPress}
            placeholder="Type a message..."
            disabled={!isActive}
            class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
          />
          <button
            on:click={sendMessage}
            disabled={!isActive || !message.trim()}
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    {:else}
      <!-- AI Test Interface -->
      <div class="space-y-4">
        <!-- Persona Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Test Persona
          </label>
          <div class="grid grid-cols-2 gap-2">
            {#each Object.entries(PERSONAS) as [key, persona]}
              <button
                on:click={() => selectedPersona = selectedPersona === key ? null : key}
                class="p-3 text-left border rounded-lg transition-colors {selectedPersona === key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}"
              >
                <div class="text-sm font-medium text-gray-900">{persona.name}</div>
                <div class="text-xs text-gray-500">{persona.description}</div>
              </button>
            {/each}
          </div>
        </div>
        
        <!-- AI Test Results -->
        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div class="text-center text-gray-500">
            <svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p class="text-sm">AI testing will analyze your bot's responses</p>
            <p class="text-xs text-gray-400 mt-1">Select a persona and click "Run Test" to begin</p>
          </div>
        </div>
        
        <!-- Test Button -->
        <button
          disabled={!selectedPersona || !isActive}
          class="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Run AI Test
        </button>
      </div>
    {/if}
  </div>
</div>

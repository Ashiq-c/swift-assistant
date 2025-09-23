<script>
  // @ts-nocheck
  import { createEventDispatcher, onMount } from 'svelte';
  import { chatbotConfig } from '$lib/chatbot-builder-stores.js';

  export let botId = null;
  export let className = '';

  const dispatch = createEventDispatcher();

  let activeTestType = 'preview'; // preview, manual, persona
  let isLoading = false;
  let error = '';
  let testResults = null;

  // Live Preview State
  let previewMessage = '';
  let previewResponse = '';
  let previewLoading = false;

  // Manual Test State
  let testSessionId = null;
  let testConversation = [];
  let testMessage = '';
  let testLoading = false;

  // Persona Test State
  let personaTestResults = null;
  let personaTestLoading = false;

  $: currentBotId = botId || $chatbotConfig?.id;

  async function runLivePreview() {
    if (!previewMessage.trim() || !currentBotId) return;

    previewLoading = true;
    error = '';
    previewResponse = '';

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/';
      const response = await fetch(`${apiBaseUrl}api/v1/chatbots/${currentBotId}/preview/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          message: previewMessage,
          user_id: 1,
          cleanup: true
        })
      });

      const data = await response.json();

      if (data.success) {
        previewResponse = data.data.bot_response;
      } else {
        error = data.message || 'Preview failed';
      }
    } catch (e) {
      console.error('Preview error:', e);
      error = 'Failed to connect to preview service';
    } finally {
      previewLoading = false;
    }
  }

  async function runManualTest() {
    if (!testMessage.trim() || !currentBotId) return;

    testLoading = true;
    error = '';

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/';
      const response = await fetch(`${apiBaseUrl}api/v1/chatbots/${currentBotId}/test/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          message: testMessage,
          test_session_id: testSessionId,
          user_id: 1
        })
      });

      const data = await response.json();

      if (data.success) {
        testSessionId = data.data.test_session_id;
        testConversation = data.data.conversation;
        testMessage = '';
      } else {
        error = data.message || 'Test failed';
      }
    } catch (e) {
      console.error('Manual test error:', e);
      error = 'Failed to connect to test service';
    } finally {
      testLoading = false;
    }
  }

  async function runPersonaTest() {
    if (!currentBotId) return;

    personaTestLoading = true;
    error = '';
    personaTestResults = null;

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/';
      const response = await fetch(`${apiBaseUrl}api/v1/chatbots/${currentBotId}/validate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      const data = await response.json();

      if (data.success) {
        personaTestResults = data.data;
      } else {
        error = data.message || 'Persona test failed';
      }
    } catch (e) {
      console.error('Persona test error:', e);
      error = 'Failed to connect to validation service';
    } finally {
      personaTestLoading = false;
    }
  }

  function clearTestSession() {
    testSessionId = null;
    testConversation = [];
    testMessage = '';
  }

  function handleKeyPress(event, action) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (action === 'preview') {
        runLivePreview();
      } else if (action === 'test') {
        runManualTest();
      }
    }
  }
</script>

<div class="bg-white border border-gray-200 rounded-lg {className}">
  <!-- Header -->
  <div class="border-b border-gray-200 p-4">
    <h3 class="text-lg font-semibold text-gray-900 mb-3">Bot Testing & Validation</h3>
    
    <!-- Test Type Tabs -->
    <div class="flex space-x-1 bg-gray-100 p-1 rounded-lg">
      <button
        class="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors {activeTestType === 'preview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
        on:click={() => activeTestType = 'preview'}
      >
        Live Preview
      </button>
      <button
        class="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors {activeTestType === 'manual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
        on:click={() => activeTestType = 'manual'}
      >
        Manual Test
      </button>
      <button
        class="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors {activeTestType === 'persona' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
        on:click={() => activeTestType = 'persona'}
      >
        AI Persona Test
      </button>
    </div>
  </div>

  <!-- Content -->
  <div class="p-4">
    {#if !currentBotId}
      <div class="text-center py-8">
        <div class="text-gray-500 mb-2">
          <svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <p class="text-gray-600">Create and save a chatbot first to enable testing</p>
      </div>
    {:else}
      <!-- Error Display -->
      {#if error}
        <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-center">
            <svg class="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="text-sm text-red-700">{error}</span>
          </div>
        </div>
      {/if}

      <!-- Live Preview -->
      {#if activeTestType === 'preview'}
        <div class="space-y-4">
          <div>
            <label for="preview-message" class="block text-sm font-medium text-gray-700 mb-2">Test Message</label>
            <div class="flex space-x-2">
              <input
                id="preview-message"
                type="text"
                class="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Type a message to test your bot..."
                bind:value={previewMessage}
                on:keypress={(e) => handleKeyPress(e, 'preview')}
                disabled={previewLoading}
              />
              <button
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                on:click={runLivePreview}
                disabled={previewLoading || !previewMessage.trim()}
              >
                {previewLoading ? 'Testing...' : 'Test'}
              </button>
            </div>
          </div>

          {#if previewResponse}
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 class="text-sm font-medium text-gray-900 mb-2">Bot Response:</h4>
              <p class="text-sm text-gray-700 whitespace-pre-wrap">{previewResponse}</p>
            </div>
          {/if}
        </div>
      {/if}

      <!-- Manual Test -->
      {#if activeTestType === 'manual'}
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-medium text-gray-900">Test Session</h4>
            {#if testSessionId}
              <button
                class="text-sm text-red-600 hover:text-red-700"
                on:click={clearTestSession}
              >
                Clear Session
              </button>
            {/if}
          </div>

          <!-- Conversation History -->
          {#if testConversation.length > 0}
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
              {#each testConversation as message}
                <div class="mb-3 {message.type === 'user' ? 'text-right' : 'text-left'}">
                  <div class="inline-block max-w-xs lg:max-w-md px-3 py-2 rounded-lg text-sm {message.type === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200'}">
                    {message.content}
                  </div>
                  <div class="text-xs text-gray-500 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              {/each}
            </div>
          {/if}

          <!-- Message Input -->
          <div class="flex space-x-2">
            <input
              type="text"
              class="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Type a message..."
              bind:value={testMessage}
              on:keypress={(e) => handleKeyPress(e, 'test')}
              disabled={testLoading}
            />
            <button
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              on:click={runManualTest}
              disabled={testLoading || !testMessage.trim()}
            >
              {testLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      {/if}

      <!-- AI Persona Test -->
      {#if activeTestType === 'persona'}
        <div class="space-y-4">
          <div class="text-center">
            <p class="text-sm text-gray-600 mb-4">Run automated tests to validate your bot's persona and behavior</p>
            <button
              class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              on:click={runPersonaTest}
              disabled={personaTestLoading}
            >
              {personaTestLoading ? 'Running Tests...' : 'Run Persona Validation'}
            </button>
          </div>

          {#if personaTestResults}
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div class="flex items-center justify-between mb-4">
                <h4 class="text-lg font-medium text-gray-900">Test Results</h4>
                <div class="flex items-center">
                  <span class="text-2xl font-bold {personaTestResults.passed ? 'text-green-600' : 'text-red-600'}">
                    {personaTestResults.overall_score}%
                  </span>
                  <span class="ml-2 px-2 py-1 rounded-full text-xs font-medium {personaTestResults.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    {personaTestResults.passed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
              </div>

              <!-- Individual Test Results -->
              <div class="space-y-3 mb-4">
                {#each personaTestResults.test_results as test}
                  <div class="border border-gray-200 rounded-lg p-3">
                    <div class="flex items-center justify-between mb-2">
                      <h5 class="text-sm font-medium text-gray-900">{test.scenario}</h5>
                      <span class="text-sm font-medium {test.passed ? 'text-green-600' : 'text-red-600'}">
                        {test.score}%
                      </span>
                    </div>
                    <p class="text-xs text-gray-600 mb-2">{test.prompt}</p>
                    <p class="text-xs text-gray-700">{test.response}</p>
                  </div>
                {/each}
              </div>

              <!-- Recommendations -->
              {#if personaTestResults.recommendations.length > 0}
                <div>
                  <h5 class="text-sm font-medium text-gray-900 mb-2">Recommendations:</h5>
                  <ul class="text-sm text-gray-700 space-y-1">
                    {#each personaTestResults.recommendations as recommendation}
                      <li class="flex items-start">
                        <span class="text-blue-500 mr-2">•</span>
                        {recommendation}
                      </li>
                    {/each}
                  </ul>
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/if}
    {/if}
  </div>
</div>

<script>
  import { createChatbot, transformConfigToApiFormat } from '$lib/api/chatbots.js';
  import { showSuccessPopup, showErrorPopup, showWarningPopup, showInfoPopup } from '$lib/stores/popup.js';

  let loading = false;
  let result = null;
  let error = null;

  // Create mock files for testing
  function createMockFile(name, content, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const file = new File([blob], name, { type });
    return file;
  }

  // Sample chatbot configuration for testing alerts
  const sampleConfig = {
    name: "Alert Test Bot",
    description: "Testing alert functionality",
    curriculumInfo: "Test curriculum",
    gradeLevel: "1st grade",
    botRole: "Ai assistant",
    instructions: "Test instructions",
    greetingMessage: "Hello! This is a test bot.",
    primaryLanguage: "1",
    secondaryLanguages: ["2"],
    conversationStarters: [
      "Test starter 1",
      "Test starter 2"
    ],
    capabilities: {
      webSearch: true,
      fileUpload: true,
      imageUpload: true,
      createImages: true,
      drawingTools: true,
      canvasEdit: true
    },
    sessionControl: {
      pause: true
    },
    gradingRubric: {
      description: "Test grading rubric",
      beginning: "Basic understanding",
      emerging: "Good understanding"
    },
    knowledgeBase: [
      createMockFile('test-knowledge.txt', 'This is test knowledge base content for popup testing.'),
      createMockFile('sample-data.txt', 'Sample data for chatbot knowledge base.')
    ]
  };

  async function testWithAlerts() {
    try {
      loading = true;
      error = null;
      result = null;

      console.log('Testing chatbot creation with alerts...');
      
      // Transform config to API format
      const apiData = transformConfigToApiFormat(sampleConfig);
      
      // Create chatbot with alerts enabled (default)
      const response = await createChatbot(apiData);
      console.log('API response:', response);

      result = response;

    } catch (err) {
      console.error('Test failed:', err);
      error = err.message;
    } finally {
      loading = false;
    }
  }

  async function testWithoutAlerts() {
    try {
      loading = true;
      error = null;
      result = null;

      console.log('Testing chatbot creation without alerts...');
      
      // Transform config to API format
      const apiData = transformConfigToApiFormat(sampleConfig);
      
      // Create chatbot with alerts disabled
      const response = await createChatbot(apiData, { showAlerts: false });
      console.log('API response:', response);

      result = response;
      
      // Manually show result since alerts are disabled
      if (response.success === true) {
        alert(`Manual alert: ${response.message || 'Chatbot created successfully'}`);
      } else {
        alert(`Manual alert: ${response.message || 'Failed to create chatbot'}`);
      }

    } catch (err) {
      console.error('Test failed:', err);
      error = err.message;
      alert(`Manual error alert: ${err.message}`);
    } finally {
      loading = false;
    }
  }

  function resetTest() {
    result = null;
    error = null;
  }

  // Manual popup test functions
  function testSuccessPopup() {
    showSuccessPopup('This is a success popup message!', { title: 'Success Test' });
  }

  function testErrorPopup() {
    showErrorPopup('This is an error popup message!', { title: 'Error Test' });
  }

  function testWarningPopup() {
    showWarningPopup('This is a warning popup message!', { title: 'Warning Test' });
  }

  function testInfoPopup() {
    showInfoPopup('This is an info popup message!', { title: 'Info Test' });
  }
</script>

<div class="container mx-auto p-8 max-w-4xl">
  <h1 class="text-3xl font-bold mb-6">Chatbot API Popup Test</h1>

  <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
    <h2 class="text-lg font-semibold mb-2">Popup Functionality Test</h2>
    <p><strong>Purpose:</strong> Test success/error popup messages for chatbot creation</p>
    <p><strong>Expected Response:</strong> <code>{JSON.stringify({success: true, message: "Chatbot created successfully"})}</code></p>
  </div>

  <div class="space-y-4 mb-6">
    <button
      on:click={testWithAlerts}
      disabled={loading}
      class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
    >
      {loading ? 'Testing...' : 'Test with Popups (Default)'}
    </button>

    <button
      on:click={testWithoutAlerts}
      disabled={loading}
      class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 ml-4"
    >
      {loading ? 'Testing...' : 'Test without Auto-Popups'}
    </button>

    <button
      on:click={resetTest}
      class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded ml-4"
    >
      Reset
    </button>
  </div>

  <!-- Manual Popup Tests -->
  <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
    <h3 class="text-lg font-semibold mb-4">Manual Popup Tests</h3>
    <div class="space-y-2">
      <button
        on:click={testSuccessPopup}
        class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2"
      >
        Test Success Popup
      </button>
      <button
        on:click={testErrorPopup}
        class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mr-2"
      >
        Test Error Popup
      </button>
      <button
        on:click={testWarningPopup}
        class="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded mr-2"
      >
        Test Warning Popup
      </button>
      <button
        on:click={testInfoPopup}
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
      >
        Test Info Popup
      </button>
    </div>
  </div>

  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <strong>Error:</strong> {error}
    </div>
  {/if}

  {#if result}
    <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
      <h3 class="font-bold">API Response:</h3>
      <pre class="mt-2 text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
    </div>
  {/if}

  <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
    <h3 class="text-lg font-semibold mb-2">How it works:</h3>
    <ul class="list-disc list-inside space-y-1 text-sm">
      <li><strong>With Popups:</strong> Shows automatic popup messages based on API response</li>
      <li><strong>Without Popups:</strong> Disables automatic popups, shows manual alerts instead</li>
      <li><strong>Success Response:</strong> Shows green success popup with message from API</li>
      <li><strong>Error Response:</strong> Shows red error popup with message from API</li>
      <li><strong>Network Error:</strong> Shows error popup with network/connection error message</li>
      <li><strong>Knowledge Base:</strong> Now includes sample files in the chatbot creation request</li>
    </ul>
  </div>
</div>

<style>
  .container {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
</style>

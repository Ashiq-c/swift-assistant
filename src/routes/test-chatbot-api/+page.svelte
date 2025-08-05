<script>
  import { onMount } from 'svelte';
  import { createChatbot, transformConfigToApiFormat } from '$lib/api/chatbots.js';

  let loading = false;
  let result = null;
  let error = null;

  // Create mock files for testing
  function createMockFile(name, content, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const file = new File([blob], name, { type });
    return file;
  }

  // Sample chatbot configuration for testing
  const sampleConfig = {
    name: "Math Tutor Bot",
    description: "Advanced mathematics tutor",
    curriculumInfo: "High school mathematics curriculum",
    gradeLevel: "1st grade",
    botRole: "Ai assistant",
    instructions: "Help students step by step",
    greetingMessage: "Hello! Ready to learn math?",
    primaryLanguage: "1", // English ID from API
    secondaryLanguages: ["2", "3", "4"], // Spanish, French, and Arabic IDs
    conversationStarters: [
      "Help me with algebra",
      "Explain calculus concepts",
      "Solve this math problem"
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
      description: "Standard grading rubric",
      beginning: "Basic understanding",
      emerging: "Good understanding"
    },
    knowledgeBase: [
      createMockFile('sample-document.txt', 'This is a sample knowledge base document with important information.'),
      createMockFile('math-formulas.txt', 'Quadratic formula: x = (-b ± √(b²-4ac)) / 2a')
    ]
  };

  async function testCreateChatbot() {
    try {
      loading = true;
      error = null;
      result = null;

      console.log('Testing chatbot creation...');
      console.log('Sample config:', sampleConfig);

      // Transform config to API format
      const apiData = transformConfigToApiFormat(sampleConfig);
      console.log('Transformed API data:', apiData);

      // Create chatbot
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

  function resetTest() {
    result = null;
    error = null;
  }
</script>

<div class="container mx-auto p-8 max-w-4xl">
  <h1 class="text-3xl font-bold mb-6">Chatbot API Test</h1>
  
  <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
    <h2 class="text-lg font-semibold mb-2">API Endpoint</h2>
    <p><strong>Method:</strong> POST</p>
    <p><strong>URL:</strong> http://localhost:8000/api/v1/chatbots/chatbot-create/</p>
    <p><strong>Content-Type:</strong> multipart/form-data</p>
    <p><strong>Note:</strong> Now includes knowledge base files and shows popup messages instead of alerts</p>
  </div>

  <div class="flex gap-4 mb-6">
    <button 
      on:click={testCreateChatbot}
      disabled={loading}
      class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Creating Chatbot...' : 'Test Create Chatbot'}
    </button>
    
    <button 
      on:click={resetTest}
      class="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
    >
      Reset
    </button>
  </div>

  {#if loading}
    <div class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      <p class="mt-2">Creating chatbot...</p>
    </div>
  {/if}

  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
      <h3 class="font-semibold">Error</h3>
      <p>{error}</p>
    </div>
  {/if}

  {#if result}
    <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
      <h3 class="font-semibold">Success!</h3>
      <p>Chatbot created successfully</p>
    </div>
    
    <div class="bg-white border rounded-lg p-4 mb-6">
      <h3 class="text-lg font-semibold mb-2">API Response</h3>
      <pre class="bg-gray-100 p-4 rounded text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
    </div>
  {/if}

  <div class="bg-white border rounded-lg p-4 mb-6">
    <h3 class="text-lg font-semibold mb-2">Sample Configuration</h3>
    <pre class="bg-gray-100 p-4 rounded text-sm overflow-auto">{JSON.stringify(sampleConfig, null, 2)}</pre>
  </div>

  <div class="bg-white border rounded-lg p-4">
    <h3 class="text-lg font-semibold mb-2">Expected API Payload</h3>
    <pre class="bg-gray-100 p-4 rounded text-sm overflow-auto">{JSON.stringify(transformConfigToApiFormat(sampleConfig), null, 2)}</pre>
  </div>
</div>

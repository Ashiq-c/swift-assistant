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

  // Test scenarios with different configurations
  const testScenarios = {
    // Scenario 1: Comprehensive Math Tutor (All fields populated)
    mathTutor: {
      name: "Advanced Math Tutor Bot",
      description: "Comprehensive mathematics tutor for high school and college students",
      curriculumInfo: "Covers algebra, geometry, trigonometry, calculus, and statistics aligned with Common Core standards",
      curriculumSelected: true,
      gradeLevel: "High School",
      botRole: "Mathematics Teaching Assistant",
      instructions: "Provide step-by-step solutions, encourage critical thinking, and adapt explanations to student's level. Always show work and explain reasoning.",
      greetingMessage: "Hello! I'm your personal math tutor. What mathematical concept would you like to explore today?",
      primaryLanguage: "1", // English
      secondaryLanguages: ["2", "3"], // Spanish, French
      conversationStarters: [
        "Help me solve quadratic equations",
        "Explain derivatives and their applications",
        "Show me how to graph functions",
        "What are the properties of triangles?",
        "How do I calculate probability?"
      ],
      capabilities: {
        webSearch: true,
        fileUpload: true,
        imageUpload: true,
        imageCreation: true,
        drawingTools: true,
        canvasEdit: true
      },
      sessionControl: {
        duration: 90,
        deadline: null,
        pauseResume: true
      },
      gradingRubric: {
        beginning: "Student shows basic understanding but needs significant guidance. Can identify key concepts with help.",
        emerging: "Student demonstrates growing understanding and can solve simple problems with minimal assistance."
      },
      knowledgeFiles: [
        createMockFile('algebra-handbook.pdf', 'Comprehensive algebra reference with formulas and examples', 'application/pdf'),
        createMockFile('calculus-guide.docx', 'Step-by-step calculus tutorials and practice problems', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
        createMockFile('geometry-theorems.xlsx', 'Complete list of geometry theorems and proofs', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      ],
      image: null
    },

    // Scenario 2: Simple Language Tutor (Minimal configuration)
    languageTutor: {
      name: "Spanish Language Helper",
      description: "Basic Spanish conversation practice",
      primaryLanguage: "1", // English
      conversationStarters: [
        "Help me practice Spanish greetings",
        "Teach me basic vocabulary"
      ],
      capabilities: {
        webSearch: false,
        fileUpload: false,
        imageUpload: false,
        imageCreation: false,
        drawingTools: false,
        canvasEdit: false
      },
      sessionControl: {
        duration: 0,
        deadline: null,
        pauseResume: false
      },
      gradingRubric: {
        beginning: "Basic vocabulary recognition",
        emerging: "Can form simple sentences"
      },
      knowledgeFiles: [],
      image: null
    },

    // Scenario 3: Science Lab Assistant (File-heavy)
    scienceBot: {
      name: "Chemistry Lab Assistant",
      description: "Interactive chemistry tutor with lab safety and experiment guidance",
      curriculumInfo: "High school chemistry curriculum including organic, inorganic, and physical chemistry",
      curriculumSelected: true,
      gradeLevel: "High School",
      botRole: "Laboratory Teaching Assistant",
      instructions: "Prioritize safety in all lab procedures. Explain chemical reactions step-by-step and help students understand molecular interactions.",
      greetingMessage: "Welcome to the chemistry lab! I'm here to help you understand chemical concepts and ensure safe laboratory practices.",
      primaryLanguage: "1", // English
      secondaryLanguages: ["2"], // Spanish
      conversationStarters: [
        "Explain the periodic table trends",
        "How do I balance chemical equations?",
        "What safety precautions should I take?",
        "Help me understand molecular bonding",
        "Show me how to calculate molarity"
      ],
      capabilities: {
        webSearch: true,
        fileUpload: true,
        imageUpload: true,
        imageCreation: true,
        drawingTools: true,
        canvasEdit: false
      },
      sessionControl: {
        duration: 120,
        deadline: null,
        pauseResume: true
      },
      gradingRubric: {
        beginning: "Student can identify basic chemical elements and simple compounds with guidance",
        emerging: "Student demonstrates understanding of chemical reactions and can perform basic calculations"
      },
      knowledgeFiles: [
        createMockFile('periodic-table-data.xlsx', 'Complete periodic table with properties and electron configurations', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
        createMockFile('lab-safety-manual.pdf', 'Comprehensive laboratory safety procedures and emergency protocols', 'application/pdf'),
        createMockFile('chemical-reactions.docx', 'Common chemical reactions with balanced equations and mechanisms', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
        createMockFile('molecular-structures.pdf', 'Visual guide to molecular geometry and bonding patterns', 'application/pdf')
      ],
      image: null
    }
  };

  let currentScenario = 'mathTutor';
  let sampleConfig = testScenarios[currentScenario];

  function switchScenario(scenarioKey) {
    currentScenario = scenarioKey;
    sampleConfig = testScenarios[scenarioKey];
    resetTest();
  }

  async function testCreateChatbot() {
    try {
      loading = true;
      error = null;
      result = null;

      console.log(`Testing chatbot creation with scenario: ${currentScenario}`);
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
      error = err instanceof Error ? err.message : String(err);
    } finally {
      loading = false;
    }
  }

  function resetTest() {
    result = null;
    error = null;
  }

  // Helper function to get scenario display info
  function getScenarioInfo(key) {
    const info = {
      mathTutor: {
        title: "Math Tutor (Complete)",
        description: "Full-featured math tutor with all fields populated"
      },
      languageTutor: {
        title: "Language Helper (Minimal)",
        description: "Simple configuration with only required fields"
      },
      scienceBot: {
        title: "Science Lab Assistant (File-heavy)",
        description: "Chemistry tutor with multiple knowledge base files"
      }
    };
    return info[key] || { title: key, description: "Test scenario" };
  }
</script>

<div class="container mx-auto p-8 max-w-6xl">
  <h1 class="text-3xl font-bold mb-6">Chatbot API Integration Test</h1>

  <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
    <h2 class="text-lg font-semibold mb-2">API Endpoint</h2>
    <p><strong>Method:</strong> POST</p>
    <p><strong>URL:</strong> http://localhost:8000/api/v1/chatbots/chatbot-create/</p>
    <p><strong>Content-Type:</strong> multipart/form-data</p>
    <p><strong>Note:</strong> Tests the integration between existing UI data structure and API format</p>
  </div>

  <!-- Test Scenario Selection -->
  <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
    <h2 class="text-lg font-semibold mb-4">Test Scenarios</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      {#each Object.entries(testScenarios) as [key, scenario]}
        <button
          on:click={() => switchScenario(key)}
          class="p-4 text-left rounded-lg border-2 transition-colors {currentScenario === key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}"
        >
          <h3 class="font-semibold text-sm mb-1">{getScenarioInfo(key).title}</h3>
          <p class="text-xs text-gray-600">{getScenarioInfo(key).description}</p>
          <div class="mt-2 text-xs text-gray-500">
            <span class="inline-block bg-gray-200 rounded px-2 py-1 mr-1">
              {scenario.knowledgeFiles?.length || 0} files
            </span>
            <span class="inline-block bg-gray-200 rounded px-2 py-1">
              {scenario.conversationStarters?.length || 0} starters
            </span>
          </div>
        </button>
      {/each}
    </div>
  </div>

  <!-- Current Configuration Preview -->
  <div class="bg-white border border-gray-200 rounded-lg p-4 mb-6">
    <h2 class="text-lg font-semibold mb-4">Current Test Configuration: {getScenarioInfo(currentScenario).title}</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      <div>
        <p><strong>Name:</strong> {sampleConfig.name}</p>
        <p><strong>Description:</strong> {sampleConfig.description || 'Not set'}</p>
        <p><strong>Grade Level:</strong> {sampleConfig.gradeLevel || 'Not set'}</p>
        <p><strong>Bot Role:</strong> {sampleConfig.botRole || 'Not set'}</p>
        <p><strong>Primary Language:</strong> {sampleConfig.primaryLanguage}</p>
        <p><strong>Secondary Languages:</strong> {sampleConfig.secondaryLanguages?.length || 0} selected</p>
      </div>
      <div>
        <p><strong>Conversation Starters:</strong> {sampleConfig.conversationStarters?.length || 0}</p>
        <p><strong>Knowledge Files:</strong> {sampleConfig.knowledgeFiles?.length || 0}</p>
        <p><strong>Web Search:</strong> {sampleConfig.capabilities?.webSearch ? 'Enabled' : 'Disabled'}</p>
        <p><strong>File Upload:</strong> {sampleConfig.capabilities?.fileUpload ? 'Enabled' : 'Disabled'}</p>
        <p><strong>Session Control:</strong> {sampleConfig.sessionControl?.pauseResume ? 'Enabled' : 'Disabled'}</p>
        <p><strong>Grading Rubric:</strong> {sampleConfig.gradingRubric ? 'Configured' : 'Not set'}</p>
      </div>
    </div>
  </div>

  <div class="flex gap-4 mb-6">
    <button
      on:click={testCreateChatbot}
      disabled={loading}
      class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Creating Chatbot...' : `Test ${getScenarioInfo(currentScenario).title}`}
    </button>

    <button
      on:click={resetTest}
      class="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
    >
      Reset Results
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
      <h3 class="font-semibold">❌ API Error</h3>
      <p class="mb-2">{error}</p>
      <details class="text-xs">
        <summary class="cursor-pointer hover:underline">Show Error Details</summary>
        <pre class="mt-2 bg-white p-2 rounded overflow-auto text-red-800">{error}</pre>
      </details>
    </div>
  {/if}

  {#if result}
    <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
      <h3 class="font-semibold">✅ Success!</h3>
      <p class="mb-4">Chatbot created successfully with scenario: <strong>{getScenarioInfo(currentScenario).title}</strong></p>

      <!-- Success Summary -->
      <div class="bg-white rounded p-3 mb-4">
        <h4 class="font-semibold text-green-800 mb-2">API Response Summary:</h4>
        <div class="grid grid-cols-2 gap-4 text-sm text-green-800">
          <div>
            <p><strong>Chatbot ID:</strong> {result.id || 'Generated'}</p>
            <p><strong>Name:</strong> {result.name || sampleConfig.name}</p>
            <p><strong>Status:</strong> {result.status || 'Created'}</p>
          </div>
          <div>
            <p><strong>Files Processed:</strong> {sampleConfig.knowledgeFiles?.length || 0}</p>
            <p><strong>Conversation Starters:</strong> {sampleConfig.conversationStarters?.length || 0}</p>
            <p><strong>Capabilities:</strong> {Object.values(sampleConfig.capabilities || {}).filter(Boolean).length}</p>
          </div>
        </div>
      </div>

      <!-- Full Response Details -->
      <details class="text-xs">
        <summary class="cursor-pointer hover:underline font-semibold">Show Full API Response</summary>
        <pre class="mt-2 bg-white p-3 rounded overflow-auto text-green-800 max-h-96">{JSON.stringify(result, null, 2)}</pre>
      </details>
    </div>
  {/if}

  <!-- API Data Preview -->
  <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
    <h2 class="text-lg font-semibold mb-4">🔍 Data Transformation Preview</h2>
    <p class="text-sm text-gray-600 mb-4">Shows how UI data structure is transformed to API format:</p>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Original UI Data -->
      <div>
        <h3 class="font-semibold mb-2">Original UI Data Structure:</h3>
        <details class="text-xs">
          <summary class="cursor-pointer hover:underline">Show UI Configuration</summary>
          <pre class="mt-2 bg-white p-3 rounded overflow-auto text-gray-800 max-h-80">{JSON.stringify(sampleConfig, null, 2)}</pre>
        </details>
      </div>

      <!-- Transformed API Data -->
      <div>
        <h3 class="font-semibold mb-2">Transformed API Payload:</h3>
        <details class="text-xs">
          <summary class="cursor-pointer hover:underline">Show API Format</summary>
          <pre class="mt-2 bg-white p-3 rounded overflow-auto text-gray-800 max-h-80">{JSON.stringify(transformConfigToApiFormat(sampleConfig), null, 2)}</pre>
        </details>
      </div>
    </div>
  </div>

  <!-- Test Instructions -->
  <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
    <h2 class="text-lg font-semibold mb-2">📋 Test Instructions</h2>
    <ol class="list-decimal list-inside text-sm space-y-1">
      <li>Select a test scenario above to load different configurations</li>
      <li>Review the configuration preview to understand what data will be sent</li>
      <li>Click the test button to send the data to your API endpoint</li>
      <li>Check the browser console for detailed logs of the transformation process</li>
      <li>Verify that the API receives the data in the expected format</li>
      <li>Use the "Data Transformation Preview" section to debug any field mapping issues</li>
    </ol>

    <div class="mt-4 p-3 bg-yellow-100 rounded">
      <p class="text-sm"><strong>Note:</strong> Make sure your API server is running on <code>http://localhost:8000</code> before testing.</p>
    </div>
  </div>
</div>

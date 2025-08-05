<script>
  import { createChatbot, transformConfigToApiFormat } from '$lib/api/chatbots.js';

  let loading = false;
  let result = null;
  let error = null;

  // Create mock files for testing
  function createMockFile(name, content, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const file = new File([blob], name, { type });
    console.log('Created mock file:', file.name, file.size, 'bytes', file.type);
    return file;
  }

  // Minimal config focused on files
  const minimalConfig = {
    name: "File Test Bot",
    description: "Testing file upload",
    curriculumInfo: "Test curriculum",
    gradeLevel: "1st grade",
    botRole: "Ai assistant",
    instructions: "Test instructions",
    greetingMessage: "Hello!",
    primaryLanguage: "1",
    secondaryLanguages: [],
    conversationStarters: ["Test"],
    capabilities: {
      webSearch: false,
      fileUpload: false,
      imageUpload: false,
      createImages: false,
      drawingTools: false,
      canvasEdit: false
    },
    sessionControl: {
      pause: false
    },
    gradingRubric: {
      description: "Test rubric",
      beginning: "Basic",
      emerging: "Good"
    },
    knowledgeBase: [
      createMockFile('test1.txt', 'This is test file 1 content'),
      createMockFile('test2.txt', 'This is test file 2 content')
    ]
  };

  async function testFileUpload() {
    try {
      loading = true;
      error = null;
      result = null;

      console.log('=== FILE UPLOAD TEST ===');
      console.log('Original config knowledgeBase:', minimalConfig.knowledgeBase);
      
      // Transform config to API format
      const apiData = transformConfigToApiFormat(minimalConfig);
      console.log('Transformed API data chatbot_files:', apiData.chatbot_files);
      
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

  // Test just the file creation
  function testFileCreation() {
    console.log('=== FILE CREATION TEST ===');
    const testFile = createMockFile('creation-test.txt', 'Test content for file creation');
    console.log('File created:', testFile);
    console.log('File instanceof File:', testFile instanceof File);
    console.log('File properties:', {
      name: testFile.name,
      size: testFile.size,
      type: testFile.type,
      lastModified: testFile.lastModified
    });
  }

  // Test FormData creation without API call
  function testFormDataCreation() {
    console.log('=== FORM DATA CREATION TEST ===');

    // Transform config to API format
    const apiData = transformConfigToApiFormat(minimalConfig);
    console.log('API data chatbot_files:', apiData.chatbot_files);

    // Create FormData manually to test
    const testFormData = new FormData();

    // Add files the same way the API does
    if (apiData.chatbot_files && apiData.chatbot_files.length > 0) {
      apiData.chatbot_files.forEach((file, index) => {
        if (file instanceof File) {
          const fieldName = `chatbot_files[${index}]file`;
          console.log(`Adding to FormData: ${fieldName}`, file);
          testFormData.append(fieldName, file);
        }
      });
    }

    // Log FormData contents
    console.log('FormData entries:');
    for (let [key, value] of testFormData.entries()) {
      console.log(`${key}:`, value instanceof File ? `File: ${value.name} (${value.size} bytes)` : value);
    }
  }
</script>

<div class="container mx-auto p-8 max-w-4xl">
  <h1 class="text-3xl font-bold mb-6">Chatbot File Upload Test</h1>
  
  <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
    <h2 class="text-lg font-semibold mb-2">File Upload Debug Test</h2>
    <p><strong>Purpose:</strong> Test if knowledge base files are properly passed as chatbot_files[0]file</p>
    <p><strong>Files:</strong> 2 mock text files will be created and sent</p>
  </div>

  <div class="space-y-4 mb-6">
    <button
      on:click={testFileCreation}
      class="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
    >
      Test File Creation (Check Console)
    </button>

    <button
      on:click={testFormDataCreation}
      class="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded ml-4"
    >
      Test FormData Creation (Check Console)
    </button>

    <button
      on:click={testFileUpload}
      disabled={loading}
      class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 ml-4"
    >
      {loading ? 'Testing...' : 'Test File Upload to API'}
    </button>

    <button
      on:click={resetTest}
      class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded ml-4"
    >
      Reset
    </button>
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
    <h3 class="text-lg font-semibold mb-2">Debug Information:</h3>
    <ul class="list-disc list-inside space-y-1 text-sm">
      <li>Check browser console for detailed file processing logs</li>
      <li>Files should be logged as: "Adding file X as File: filename.txt Y bytes"</li>
      <li>Form data should include: chatbot_files[0]file, chatbot_files[1]file</li>
      <li>Backend should receive files in the expected format</li>
    </ul>
  </div>
</div>

<style>
  .container {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
</style>

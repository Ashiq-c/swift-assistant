<script>
  let result = '';

  async function testSimpleFormData() {
    console.log('=== SIMPLE FORM DATA TEST ===');
    
    // Create a simple file
    const fileContent = 'This is a test file content';
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const file = new File([blob], 'test.txt', { type: 'text/plain' });
    
    console.log('Created file:', file);
    console.log('File instanceof File:', file instanceof File);
    
    // Create FormData
    const formData = new FormData();
    
    // Add the file exactly as in your curl
    formData.append('chatbot_files[0]file', file);
    
    // Add other required fields
    formData.append('name', 'Test Bot');
    formData.append('description', 'Test Description');
    formData.append('curriculum_info', 'Test Curriculum');
    formData.append('select_from_curriculum', '1');
    formData.append('grade_level', '1st grade');
    formData.append('bot_role', 'Ai assistant');
    formData.append('instructions', 'Test instructions');
    formData.append('greeting_message', 'Hello');
    formData.append('primary_language_id', '1');
    formData.append('grading_rubric', 'Test rubric');
    formData.append('real_time_web_search', '1');
    formData.append('file_upload_analysis', '1');
    formData.append('image_upload_gpt_vision', '1');
    formData.append('create_images', '1');
    formData.append('drawing_tools', '1');
    formData.append('canvas_edit_modify', '1');
    formData.append('pause_session', '1');
    formData.append('secondary_language_ids[0]', '2');
    formData.append('conversation_starters[0]text', 'Hello');
    formData.append('analysis_scales[0]level_name', 'Beginning');
    formData.append('analysis_scales[0]description', 'Basic understanding');
    formData.append('analysis_scales[0]color', 'green');
    
    // Log FormData contents
    console.log('FormData entries:');
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
      } else {
        console.log(`${key}: ${value}`);
      }
    }
    
    // Make the API call
    try {
      const response = await fetch('/custom-api/v1/chatbots/chatbot-create/', {
        method: 'POST',
        body: formData
      });
      
      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      result = `Status: ${response.status}\nResponse: ${responseText}`;
      
    } catch (error) {
      console.error('Error:', error);
      result = `Error: ${error.message}`;
    }
  }
</script>

<div class="container mx-auto p-8 max-w-4xl">
  <h1 class="text-3xl font-bold mb-6">Simple File Upload Test</h1>
  
  <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
    <h2 class="text-lg font-semibold mb-2">Direct FormData Test</h2>
    <p><strong>Purpose:</strong> Test direct FormData creation with chatbot_files[0]file</p>
    <p><strong>Method:</strong> Bypass all transformations and create FormData directly</p>
  </div>

  <div class="space-y-4 mb-6">
    <button
      on:click={testSimpleFormData}
      class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
      Test Simple FormData Upload
    </button>
  </div>

  {#if result}
    <div class="bg-gray-100 border border-gray-300 rounded-lg p-4">
      <h3 class="font-bold mb-2">Result:</h3>
      <pre class="text-sm whitespace-pre-wrap">{result}</pre>
    </div>
  {/if}

  <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
    <h3 class="text-lg font-semibold mb-2">What this test does:</h3>
    <ul class="list-disc list-inside space-y-1 text-sm">
      <li>Creates a simple text file directly</li>
      <li>Creates FormData with exact field names from your curl</li>
      <li>Adds chatbot_files[0]file with the test file</li>
      <li>Makes direct API call without any transformations</li>
      <li>Shows exact response from backend</li>
    </ul>
  </div>
</div>

<style>
  .container {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
</style>

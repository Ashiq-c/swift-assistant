<script>
  import { onMount } from 'svelte';
  import { fetchLanguages } from '$lib/api/languages.js';

  let languages = [];
  let loading = true;
  let error = null;
  let rawResponse = null;

  onMount(async () => {
    console.log('Test page mounted, testing API...');
    await testApi();
  });

  async function testApi() {
    try {
      loading = true;
      error = null;
      rawResponse = null;

      // Test direct fetch first
      console.log('Testing direct fetch...');
      const directResponse = await fetch('http://127.0.0.1:8000/api/v1/languages/');
      console.log('Direct fetch response:', directResponse);
      
      if (directResponse.ok) {
        const directData = await directResponse.json();
        console.log('Direct fetch data:', directData);
        rawResponse = directData;
      }

      // Test our API function
      console.log('Testing fetchLanguages function...');
      const fetchedLanguages = await fetchLanguages();
      console.log('fetchLanguages result:', fetchedLanguages);
      
      languages = fetchedLanguages;
      
    } catch (err) {
      console.error('Test failed:', err);
      error = err.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="container mx-auto p-8">
  <h1 class="text-3xl font-bold mb-6">Languages API Test</h1>
  
  <button 
    on:click={testApi}
    class="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    disabled={loading}
  >
    {loading ? 'Testing...' : 'Test API'}
  </button>

  {#if loading}
    <div class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      <p class="mt-2">Testing API...</p>
    </div>
  {/if}

  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <strong>Error:</strong> {error}
    </div>
  {/if}

  {#if rawResponse}
    <div class="mb-6">
      <h2 class="text-xl font-semibold mb-2">Raw API Response</h2>
      <pre class="bg-gray-100 p-4 rounded text-sm overflow-auto">{JSON.stringify(rawResponse, null, 2)}</pre>
    </div>
  {/if}

  {#if languages.length > 0}
    <div class="mb-6">
      <h2 class="text-xl font-semibold mb-2">Processed Languages ({languages.length})</h2>
      <div class="grid grid-cols-2 gap-4">
        {#each languages as language}
          <div class="bg-white border rounded p-3">
            <div class="font-medium">{language.name}</div>
            <div class="text-sm text-gray-500">Code: {language.code}</div>
            <div class="text-sm text-gray-500">ID: {language.id}</div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <div class="mt-8">
    <h2 class="text-xl font-semibold mb-2">Debug Info</h2>
    <div class="bg-gray-100 p-4 rounded">
      <p><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'Server-side'}</p>
      <p><strong>API URL:</strong> http://127.0.0.1:8000/api/v1/languages/</p>
      <p><strong>Languages loaded:</strong> {languages.length}</p>
      <p><strong>Loading state:</strong> {loading}</p>
      <p><strong>Error state:</strong> {error || 'None'}</p>
    </div>
  </div>
</div>

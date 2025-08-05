<script>
  import { chatbotConfig, updateConfig } from '../../lib/stores.js';
  import { LANGUAGES } from '../../lib/types.js';
  
  export let data = {};
  
  let showPrimaryLanguages = false;
  let showSecondaryLanguages = false;
  
  function toggleSecondaryLanguage(langCode) {
    const current = data.secondaryLanguages || [];
    const updated = current.includes(langCode)
      ? current.filter(code => code !== langCode)
      : [...current, langCode];
    updateConfig({ secondaryLanguages: updated });
  }
  
  function getLanguageName(code) {
    const lang = LANGUAGES.find(l => l.code === code);
    return lang ? lang.name : code;
  }
</script>

<div class="space-y-6">
  <!-- Primary Language -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
      Primary Language *
    </label>
    <div class="relative">
      <button
        type="button"
        on:click={() => showPrimaryLanguages = !showPrimaryLanguages}
        class="w-full px-3 py-2 text-left border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between"
      >
        <span class={data.primaryLanguage ? 'text-gray-900' : 'text-gray-500'}>
          {data.primaryLanguage ? getLanguageName(data.primaryLanguage) : 'Select primary language'}
        </span>
        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {#if showPrimaryLanguages}
        <div class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {#each LANGUAGES as language}
            <button
              type="button"
              on:click={() => {
                updateConfig({ primaryLanguage: language.code });
                showPrimaryLanguages = false;
              }}
              class="w-full px-3 py-2 text-left hover:bg-gray-50 {data.primaryLanguage === language.code ? 'bg-blue-50 text-blue-600' : ''}"
            >
              {language.name}
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- Secondary Languages -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
      Secondary Languages
    </label>
    <p class="text-sm text-gray-600 mb-3">
      Select additional languages the bot can understand and respond in
    </p>
    
    <div class="relative">
      <button
        type="button"
        on:click={() => showSecondaryLanguages = !showSecondaryLanguages}
        class="w-full px-3 py-2 text-left border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between"
      >
        <span class="text-gray-700">
          {#if data.secondaryLanguages && data.secondaryLanguages.length > 0}
            {data.secondaryLanguages.length} language{data.secondaryLanguages.length > 1 ? 's' : ''} selected
          {:else}
            Select secondary languages
          {/if}
        </span>
        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {#if showSecondaryLanguages}
        <div class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {#each LANGUAGES as language}
            {#if language.code !== data.primaryLanguage}
              <label class="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.secondaryLanguages && data.secondaryLanguages.includes(language.code)}
                  on:change={() => toggleSecondaryLanguage(language.code)}
                  class="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>{language.name}</span>
              </label>
            {/if}
          {/each}
        </div>
      {/if}
    </div>
    
    <!-- Selected secondary languages -->
    {#if data.secondaryLanguages && data.secondaryLanguages.length > 0}
      <div class="mt-3 flex flex-wrap gap-2">
        {#each data.secondaryLanguages as langCode}
          <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
            {getLanguageName(langCode)}
            <button
              type="button"
              on:click={() => toggleSecondaryLanguage(langCode)}
              class="ml-2 text-blue-600 hover:text-blue-800"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Language Instructions -->
  <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
    <div class="flex items-start">
      <svg class="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <h4 class="text-sm font-medium text-blue-800 mb-1">Language Support</h4>
        <p class="text-sm text-blue-700">
          The bot will primarily communicate in the selected primary language. Secondary languages allow the bot to understand and respond to users in multiple languages when needed.
        </p>
      </div>
    </div>
  </div>
</div>

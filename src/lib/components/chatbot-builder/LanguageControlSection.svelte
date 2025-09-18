<script>
  import { onMount } from 'svelte';
  import { chatbotConfig, updateConfig, errors } from '$lib/chatbot-builder-stores.js';
  import { fetchLanguages, getLanguageName as getLanguageNameUtil } from '$lib/api/languages.js';

  export let data = {};
  export let onContinue = () => {};
  export let continueButtonText = 'Continue';

  let showPrimaryLanguages = false;
  let languages = [];
  let secondaryLanguages = [];
  let loading = true;
  let error = null;

  $: currentErrors = $errors;

  let loadingPromise = null;

  // Load languages from API on component mount
  onMount(async () => {
    // Prevent multiple simultaneous API calls
    if (loadingPromise) {
      return loadingPromise;
    }

    loadingPromise = loadLanguages();
    return loadingPromise;
  });

  async function loadLanguages() {
    try {
      loading = true;
      error = null;

      const fetchedLanguages = await fetchLanguages();

      // Force reactivity by creating new arrays
      languages = [...fetchedLanguages];
      secondaryLanguages = [...fetchedLanguages];

    } catch (err) {
      console.error('Failed to load languages:', err);
      error = 'Failed to load languages. Using fallback options.';
    } finally {
      loading = false;
      loadingPromise = null;
    }
  }

  function getLanguageName(code) {
    return getLanguageNameUtil(code, languages);
  }

  function toggleSecondaryLanguage(langCode) {
    const current = data.secondaryLanguages || [];
    const updated = current.includes(langCode)
      ? current.filter(code => code !== langCode)
      : [...current, langCode];
    updateConfig({ secondaryLanguages: updated });
  }
</script>

<div class="space-y-6">
  <!-- Primary Language -->
  <div>
    <div class="flex items-center mb-3">
      <label style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 400; font-size: 12px; color: #767676;" class="mr-2">
        Primary Language
      </label>
      <div class="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
        <span class="text-white text-xs">?</span>
      </div>
    </div>
    <div class="relative">
      <button
        type="button"
        on:click={() => showPrimaryLanguages = !showPrimaryLanguages}
        class="w-full px-3 py-2 text-left rounded-lg focus:ring-2 focus:border-transparent flex items-center justify-between"
        style="background: #F5F5F5; focus:ring-color: #6878B6; border: none; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 500; font-size: 12px;"
      >
        <span class={data.primaryLanguage ? 'text-gray-900' : 'text-gray-500'}>
          {#if loading}
            Loading...
          {:else if data.primaryLanguage}
            {getLanguageName(data.primaryLanguage)}
          {:else}
            Enter or select
          {/if}
        </span>
        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {#if showPrimaryLanguages}
        <div class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {#if loading}
            <div class="px-3 py-2 text-gray-500 text-center">
              Loading languages...
            </div>
          {:else if error}
            <div class="px-3 py-2 text-red-500 text-center text-sm">
              {error}
            </div>
          {:else if languages.length === 0}
            <div class="px-3 py-2 text-gray-500 text-center">
              No languages available
            </div>
          {:else}
            {#each languages as language}
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
          {/if}
        </div>
      {/if}
    </div>
  </div>

  <!-- Secondary Languages -->
  <div>
    <div class="flex items-center mb-4">
      <label style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 400; font-size: 12px; color: #767676;" class="mr-2">
        Secondary Language(s)
      </label>
      <div class="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
        <span class="text-white text-xs">?</span>
      </div>
    </div>

    <!-- Checkbox Grid -->
    <div class="grid grid-cols-2 gap-4">
      {#if loading}
        <div class="col-span-2 text-center py-4 text-gray-500">
          Loading languages...
        </div>
      {:else if error}
        <div class="col-span-2 text-center py-4 text-red-500 text-sm">
          {error}
        </div>
      {:else if secondaryLanguages.length === 0}
        <div class="col-span-2 text-center py-4 text-gray-500">
          No secondary languages available
        </div>
      {:else}
        {#each secondaryLanguages as language}
          {#if !data.primaryLanguage || language.code !== data.primaryLanguage}
            <label class="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={data.secondaryLanguages && data.secondaryLanguages.includes(language.code)}
                on:change={() => toggleSecondaryLanguage(language.code)}
                class="mr-3 w-4 h-4 rounded border-gray-300 focus:ring-2 focus:ring-offset-0"
                style="accent-color: #6878B6;"
              />
              <span style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 400; font-size: 12px; color: #374151;">
                {language.name}
              </span>
            </label>
          {/if}
        {/each}
      {/if}
    </div>

    <!-- Error Display for Secondary Languages -->
    {#if currentErrors.secondaryLanguages}
      <p class="text-red-500 text-sm mt-2" style="font-family: 'Plus Jakarta Sans', sans-serif;">
        {currentErrors.secondaryLanguages}
      </p>
    {/if}
  </div>

  <!-- Continue Button -->
  <div class="flex justify-end pt-6">
    <button
      type="button"
      on:click={onContinue}
      class="px-6 py-2 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
      style="background: #6878B6;"
    >
      {continueButtonText}
    </button>
  </div>
</div>

<style>
  /* Custom checkbox styling */
  input[type="checkbox"] {
    appearance: none;
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border: 2px solid #d1d5db;
    border-radius: 3px;
    background-color: white;
    cursor: pointer;
    position: relative;
  }

  input[type="checkbox"]:checked {
    background-color: #6878B6;
    border-color: #6878B6;
  }

  input[type="checkbox"]:checked::after {
    content: '';
    position: absolute;
    left: 2px;
    top: -1px;
    width: 6px;
    height: 10px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }

  input[type="checkbox"]:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(104, 120, 182, 0.2);
  }
</style>

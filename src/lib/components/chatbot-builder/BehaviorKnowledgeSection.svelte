<script>
  import { chatbotConfig, updateConfig } from '$lib/chatbot-builder-stores.js';
  import { GRADE_LEVELS } from '$lib/chatbot-builder-types.js';
  
  export let data = {};
  export let onContinue = () => {};
  export let continueButtonText = 'Continue';

  let showGradeLevels = false;
  let showBotRoles = false;
  let newStarter = '';
  let fileInput;
  let isDragOver = false;
  
  const botRoles = [
    'Teaching Assistant',
    'Subject Expert',
    'Tutor',
    'Mentor',
    'Study Buddy',
    'Research Assistant'
  ];
  
  function addConversationStarter() {
    if (newStarter.trim()) {
      const starters = [...(data.conversationStarters || []), newStarter.trim()];
      updateConfig({ conversationStarters: starters });
      newStarter = '';
    }
  }
  
  function removeConversationStarter(index) {
    const starters = data.conversationStarters.filter((_, i) => i !== index);
    updateConfig({ conversationStarters: starters });
  }
  
  function handleKeyPress(event) {
    if (event.key === 'Enter') {
      addConversationStarter();
    }
  }

  function handleFileSelect() {
    fileInput.click();
  }

  function handleFileChange(event) {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      const knowledgeFiles = [...(data.knowledgeFiles || []), ...files];
      updateConfig({ knowledgeFiles });
    }
  }

  function removeKnowledgeFile(index) {
    const knowledgeFiles = data.knowledgeFiles.filter((_, i) => i !== index);
    updateConfig({ knowledgeFiles });
  }

  function handleDragOver(event) {
    event.preventDefault();
    isDragOver = true;
  }

  function handleDragLeave(event) {
    event.preventDefault();
    isDragOver = false;
  }

  function handleDrop(event) {
    event.preventDefault();
    isDragOver = false;
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      const knowledgeFiles = [...(data.knowledgeFiles || []), ...files];
      updateConfig({ knowledgeFiles });
    }
  }
</script>

<div class="space-y-6">
  <!-- Grade Level -->
  <div>
    <label style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 400; font-size: 12px; color: #767676;" class="block mb-2">
      Grade Level
    </label>
    <div class="relative">
      <button
        type="button"
        on:click={() => showGradeLevels = !showGradeLevels}
        class="w-full px-3 py-2 text-left rounded-lg focus:ring-2 focus:border-transparent flex items-center justify-between"
        style="background: #F5F5F5; focus:ring-color: #6878B6; border: none; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 500; font-size: 12px;"
      >
        <span class={data.gradeLevel ? 'text-gray-900' : 'text-gray-500'}>
          {data.gradeLevel || 'Select grade level'}
        </span>
        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {#if showGradeLevels}
        <div class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {#each GRADE_LEVELS as level}
            <button
              type="button"
              on:click={() => {
                updateConfig({ gradeLevel: level });
                showGradeLevels = false;
              }}
              class="w-full px-3 py-2 text-left hover:bg-gray-50 {data.gradeLevel === level ? 'bg-blue-50 text-blue-600' : ''}"
            >
              {level}
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- Bot Role -->
  <div>
    <label style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 400; font-size: 12px; color: #767676;" class="block mb-2">
      Bot Role
    </label>
    <div class="relative">
      <button
        type="button"
        on:click={() => showBotRoles = !showBotRoles}
        class="w-full px-3 py-2 text-left rounded-lg focus:ring-2 focus:border-transparent flex items-center justify-between"
        style="background: #F5F5F5; focus:ring-color: #6878B6; border: none; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 500; font-size: 12px;"
      >
        <span class={data.botRole ? 'text-gray-900' : 'text-gray-500'}>
          {data.botRole || 'Select bot role'}
        </span>
        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {#if showBotRoles}
        <div class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          {#each botRoles as role}
            <button
              type="button"
              on:click={() => {
                updateConfig({ botRole: role });
                showBotRoles = false;
              }}
              class="w-full px-3 py-2 text-left hover:bg-gray-50 {data.botRole === role ? 'bg-blue-50 text-blue-600' : ''}"
            >
              {role}
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- Instructions -->
  <div>
    <label style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 400; font-size: 12px; color: #767676;" class="block mb-2">
      Instructions
    </label>
    <textarea
      bind:value={data.instructions}
      on:input={(e) => updateConfig({ instructions: e.target.value })}
      placeholder="Provide detailed instructions for the bot's behavior"
      rows="4"
      class="w-full px-3 py-2 rounded-lg focus:ring-2 focus:border-transparent resize-none"
      style="background: #F5F5F5; focus:ring-color: #6878B6; border: none; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 500; font-size: 12px;"
    ></textarea>
  </div>

  <!-- Greeting Message -->
  <div>
    <label style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 400; font-size: 12px; color: #767676;" class="block mb-2">
      Greeting Message
    </label>
    <textarea
      bind:value={data.greetingMessage}
      on:input={(e) => updateConfig({ greetingMessage: e.target.value })}
      placeholder="Enter the bot's greeting message"
      rows="2"
      class="w-full px-3 py-2 rounded-lg focus:ring-2 focus:border-transparent resize-none"
      style="background: #F5F5F5; focus:ring-color: #6878B6; border: none; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 500; font-size: 12px;"
    ></textarea>
  </div>

  <!-- Conversation Starters -->
  <div>
    <div class="flex items-center space-x-2 mb-3">
      <label style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 400; font-size: 12px; color: #767676;">
        Conversation Starters
      </label>
      <!-- Purple Question Mark Icon -->
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#8B5CF6"/>
        <path d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 17H12.01" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>

    <!-- Starter Input -->
    <div class="mb-3">
      <input
        type="text"
        bind:value={newStarter}
        on:keypress={handleKeyPress}
        placeholder="Example conversation starter"
        class="w-full px-3 py-3 rounded-lg focus:ring-2 focus:border-transparent"
        style="background: #F5F5F5; focus:ring-color: #6878B6; border: none; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 400; font-size: 12px; color: #9CA3AF;"
      />
    </div>

    <!-- Add Another Starter Link -->
    <div class="mb-4 flex justify-end">
      <button
        type="button"
        on:click={addConversationStarter}
        class="transition-colors underline"
        style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600; font-size: 14px; color: #6878B6; text-decoration-color: #6878B6;"
      >
        + Add Another Starter
      </button>
    </div>

    <!-- List of starters -->
    {#if data.conversationStarters && data.conversationStarters.length > 0}
      <div class="space-y-2">
        {#each data.conversationStarters as starter, index}
          <div class="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg">
            <span class="flex-1" style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 400; font-size: 12px; color: #374151;">{starter}</span>
            <button
              type="button"
              on:click={() => removeConversationStarter(index)}
              class="text-red-600 hover:text-red-700 p-1"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Knowledge Base -->
  <div>
    <label style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 400; font-size: 12px; color: #767676;" class="block mb-2">
      Knowledge base
    </label>

    <!-- File Upload Area -->
    <div
      class="border-2 border-dashed rounded-lg p-8 text-center transition-colors {isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50'}"
      on:dragover={handleDragOver}
      on:dragleave={handleDragLeave}
      on:drop={handleDrop}
      role="button"
      tabindex="0"
    >
      <!-- Upload Icon -->
      <div class="mb-4">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" class="mx-auto">
          <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="#8B5CF6"/>
          <path d="M14 2V8H20" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 11V17" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M9 14L12 11L15 14" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>

      <!-- Upload Text -->
      <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 500; font-size: 14px; color: #374151;" class="mb-2">
        Upload any knowledge the bot should have
      </p>
      <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 400; font-size: 12px; color: #6B7280;" class="mb-4">
        PDF, DOC, TXT files supported
      </p>

      <!-- Browse Button -->
      <button
        type="button"
        on:click={handleFileSelect}
        class="px-6 py-2 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
        style="background: #6878B6; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 500; font-size: 12px;"
      >
        Browse file
      </button>
    </div>

    <!-- Hidden File Input -->
    <input
      type="file"
      bind:this={fileInput}
      on:change={handleFileChange}
      multiple
      accept=".pdf,.doc,.docx,.txt"
      class="hidden"
    />

    <!-- Uploaded Files List -->
    {#if data.knowledgeFiles && data.knowledgeFiles.length > 0}
      <div class="mt-4 space-y-2">
        <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 500; font-size: 12px; color: #374151;" class="mb-2">
          Uploaded Files:
        </p>
        {#each data.knowledgeFiles as file, index}
          <div class="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
            <div class="flex items-center space-x-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="#6B7280"/>
                <path d="M14 2V8H20" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <div>
                <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 500; font-size: 12px; color: #374151;">
                  {file.name}
                </p>
                <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 400; font-size: 10px; color: #6B7280;">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              type="button"
              on:click={() => removeKnowledgeFile(index)}
              class="text-red-600 hover:text-red-700 p-1"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        {/each}
      </div>
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

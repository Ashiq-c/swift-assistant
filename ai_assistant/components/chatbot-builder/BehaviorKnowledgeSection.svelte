<script>
  import { chatbotConfig, updateConfig } from '../../lib/stores.js';
  import { GRADE_LEVELS } from '../../lib/types.js';
  
  export let data = {};
  
  let showGradeLevels = false;
  let showBotRoles = false;
  let newStarter = '';
  
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
</script>

<div class="space-y-6">
  <!-- Grade Level -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
      Grade Level
    </label>
    <div class="relative">
      <button
        type="button"
        on:click={() => showGradeLevels = !showGradeLevels}
        class="w-full px-3 py-2 text-left border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between"
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
    <label class="block text-sm font-medium text-gray-700 mb-2">
      Bot Role
    </label>
    <div class="relative">
      <button
        type="button"
        on:click={() => showBotRoles = !showBotRoles}
        class="w-full px-3 py-2 text-left border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between"
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
    <label class="block text-sm font-medium text-gray-700 mb-2">
      Instructions
    </label>
    <textarea
      bind:value={data.instructions}
      on:input={(e) => updateConfig({ instructions: e.target.value })}
      placeholder="Provide detailed instructions for the bot's behavior"
      rows="4"
      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
    ></textarea>
  </div>

  <!-- Greeting Message -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
      Greeting Message
    </label>
    <textarea
      bind:value={data.greetingMessage}
      on:input={(e) => updateConfig({ greetingMessage: e.target.value })}
      placeholder="Enter the bot's greeting message"
      rows="2"
      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
    ></textarea>
  </div>

  <!-- Conversation Starters -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
      Conversation Starters
    </label>
    
    <!-- Add new starter -->
    <div class="flex gap-2 mb-3">
      <input
        type="text"
        bind:value={newStarter}
        on:keypress={handleKeyPress}
        placeholder="Add a conversation starter"
        class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <button
        type="button"
        on:click={addConversationStarter}
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
    
    <!-- List of starters -->
    {#if data.conversationStarters && data.conversationStarters.length > 0}
      <div class="space-y-2">
        {#each data.conversationStarters as starter, index}
          <div class="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <span class="flex-1 text-sm">{starter}</span>
            <button
              type="button"
              on:click={() => removeConversationStarter(index)}
              class="text-red-600 hover:text-red-700"
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
</div>

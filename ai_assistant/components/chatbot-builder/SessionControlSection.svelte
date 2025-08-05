<script>
  import { chatbotConfig, updateConfig } from '../../lib/stores.js';
  
  export let data = {};
  
  function updateSessionControl(field, value) {
    const sessionControl = { ...data.sessionControl, [field]: value };
    updateConfig({ sessionControl });
  }
  
  function formatDuration(minutes) {
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    return `${hours}h ${remainingMinutes}m`;
  }
</script>

<div class="space-y-6">
  <!-- Session Control Introduction -->
  <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
    <div class="flex items-start">
      <svg class="w-5 h-5 text-purple-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <h4 class="text-sm font-medium text-purple-800 mb-1">Session Control</h4>
        <p class="text-sm text-purple-700">
          Configure time limits and session management features to help students stay focused and manage their learning time effectively.
        </p>
      </div>
    </div>
  </div>

  <!-- Session Duration -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
      Session Duration
    </label>
    <div class="space-y-3">
      <div class="flex items-center space-x-4">
        <input
          type="range"
          min="0"
          max="180"
          step="15"
          value={data.sessionControl?.duration || 0}
          on:input={(e) => updateSessionControl('duration', parseInt(e.target.value))}
          class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div class="text-sm font-medium text-gray-700 min-w-[80px]">
          {#if data.sessionControl?.duration > 0}
            {formatDuration(data.sessionControl.duration)}
          {:else}
            No limit
          {/if}
        </div>
      </div>
      
      <!-- Duration presets -->
      <div class="flex flex-wrap gap-2">
        {#each [0, 15, 30, 45, 60, 90, 120] as preset}
          <button
            type="button"
            on:click={() => updateSessionControl('duration', preset)}
            class="px-3 py-1 text-xs rounded-full border transition-colors {
              (data.sessionControl?.duration || 0) === preset 
                ? 'bg-blue-100 border-blue-300 text-blue-700' 
                : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
            }"
          >
            {preset === 0 ? 'No limit' : formatDuration(preset)}
          </button>
        {/each}
      </div>
    </div>
    <p class="text-xs text-gray-500 mt-2">
      Set a time limit for each chat session. Students will be notified when the time is up.
    </p>
  </div>

  <!-- Session Deadline -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
      Session Deadline (Optional)
    </label>
    <input
      type="datetime-local"
      value={data.sessionControl?.deadline ? new Date(data.sessionControl.deadline).toISOString().slice(0, 16) : ''}
      on:change={(e) => updateSessionControl('deadline', e.target.value ? new Date(e.target.value) : null)}
      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
    <p class="text-xs text-gray-500 mt-1">
      Set a specific deadline when the chatbot session should end
    </p>
  </div>

  <!-- Pause and Resume -->
  <div>
    <label class="flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={data.sessionControl?.pauseResume || false}
        on:change={(e) => updateSessionControl('pauseResume', e.target.checked)}
        class="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <div>
        <span class="text-sm font-medium text-gray-700">Allow Pause and Resume</span>
        <p class="text-xs text-gray-500">
          Students can pause their session and resume later without losing progress
        </p>
      </div>
    </label>
  </div>

  <!-- Session Settings Summary -->
  {#if data.sessionControl && (data.sessionControl.duration > 0 || data.sessionControl.deadline || data.sessionControl.pauseResume)}
    <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h4 class="text-sm font-medium text-gray-800 mb-2">Session Configuration</h4>
      <ul class="text-sm text-gray-600 space-y-1">
        {#if data.sessionControl.duration > 0}
          <li class="flex items-center">
            <svg class="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Duration limit: {formatDuration(data.sessionControl.duration)}
          </li>
        {/if}
        {#if data.sessionControl.deadline}
          <li class="flex items-center">
            <svg class="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Deadline: {new Date(data.sessionControl.deadline).toLocaleString()}
          </li>
        {/if}
        {#if data.sessionControl.pauseResume}
          <li class="flex items-center">
            <svg class="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Pause and resume enabled
          </li>
        {/if}
      </ul>
    </div>
  {/if}

  <!-- Session Tips -->
  <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
    <h4 class="text-sm font-medium text-yellow-800 mb-2">Session Management Tips</h4>
    <ul class="text-sm text-yellow-700 space-y-1">
      <li class="flex items-start">
        <span class="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
        Shorter sessions (15-30 minutes) work well for younger students
      </li>
      <li class="flex items-start">
        <span class="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
        Use deadlines for assignments or time-sensitive activities
      </li>
      <li class="flex items-start">
        <span class="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
        Pause/resume is helpful for longer research or writing tasks
      </li>
    </ul>
  </div>
</div>

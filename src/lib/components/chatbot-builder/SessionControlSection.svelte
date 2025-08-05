<script>
  import { chatbotConfig, updateConfig, errors } from '$lib/chatbot-builder-stores.js';

  export let data = {};
  export let onContinue = () => {};
  export let continueButtonText = 'Continue';

  $: currentErrors = $errors;

  function toggleSessionControl(field) {
    const sessionControl = {
      ...data.sessionControl,
      [field]: !data.sessionControl?.[field]
    };
    updateConfig({ sessionControl });
  }

  function updateSessionControl(field, value) {
    const sessionControl = {
      ...data.sessionControl,
      [field]: value
    };
    updateConfig({ sessionControl });
  }

  function formatDuration(minutes) {
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
      } else {
        return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
      }
    }
  }


</script>

<div class="space-y-4">
  <!-- Duration (minutes) -->
  <div class="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100">
    <div>
      <h4 style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 500; font-size: 14px; color: #374151;" class="mb-1">
        Duration (minutes)
      </h4>
      <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 400; font-size: 12px; color: #6B7280;">
        Set a time limit for sessions in minutes
      </p>

      <!-- Error Display -->
      {#if currentErrors.duration}
        <p class="text-red-500 text-sm mt-1" style="font-family: 'Plus Jakarta Sans', sans-serif;">
          {currentErrors.duration}
        </p>
      {/if}
    </div>

    <!-- Toggle Switch -->
    <div>
      <label class="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={data.sessionControl?.duration || false}
          on:change={() => toggleSessionControl('duration')}
          class="sr-only peer"
        />
        <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6878B6]"></div>
      </label>
    </div>
  </div>

  <!-- Deadline -->
  <div class="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100">
    <div>
      <h4 style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 500; font-size: 14px; color: #374151;" class="mb-1">
        Deadline
      </h4>
      <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 400; font-size: 12px; color: #6B7280;">
        Set a date when sessions will be automatically submitted
      </p>
    </div>

    <!-- Toggle Switch -->
    <div>
      <label class="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={data.sessionControl?.deadline || false}
          on:change={() => toggleSessionControl('deadline')}
          class="sr-only peer"
        />
        <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6878B6]"></div>
      </label>
    </div>
  </div>

  <!-- Pause/Resume Session -->
  <div class="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100">
    <div>
      <h4 style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 500; font-size: 14px; color: #374151;" class="mb-1">
        Pause/Resume Session
      </h4>
      <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 400; font-size: 12px; color: #6B7280;">
        Temporarily pause new sessions and responses (only active in assigned bots)
      </p>
    </div>

    <!-- Toggle Switch -->
    <div>
      <label class="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={data.sessionControl?.pauseResume || false}
          on:change={() => toggleSessionControl('pauseResume')}
          class="sr-only peer"
        />
        <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6878B6]"></div>
      </label>
    </div>
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

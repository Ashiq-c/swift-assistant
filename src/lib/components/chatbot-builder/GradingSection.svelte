<script>
  import { chatbotConfig, updateConfig } from '$lib/chatbot-builder-stores.js';

  export let data = {};
  export let onContinue = () => {};
  export let continueButtonText = 'Continue';

  let gradingLevels = [];

  // Available colors for new levels
  const availableColors = [
    { color: '#3B82F6', name: 'Blue' },     // Blue
    { color: '#EF4444', name: 'Red' },      // Red
    { color: '#10B981', name: 'Green' },    // Emerald
    { color: '#F59E0B', name: 'Orange' },   // Amber
    { color: '#8B5CF6', name: 'Purple' },   // Violet
    { color: '#06B6D4', name: 'Cyan' },     // Cyan
    { color: '#84CC16', name: 'Lime' },     // Lime
    { color: '#F97316', name: 'Orange' },   // Orange
    { color: '#EC4899', name: 'Pink' },     // Pink
    { color: '#6366F1', name: 'Indigo' },   // Indigo
  ];

  // Common grading level names
  const commonLevelNames = [
    'Proficient',
    'Advanced',
    'Mastery',
    'Developing',
    'Approaching',
    'Exceeding',
    'Expert',
    'Novice'
  ];

  function updateGradingRubric(level, value) {
    const rubric = { ...data.gradingRubric, [level]: value };
    updateConfig({ gradingRubric: rubric });
  }

  function addNewLevel() {
    // Validate that all existing levels have names (only if there are existing levels)
    if (gradingLevels.length > 0) {
      const hasEmptyNames = gradingLevels.some(level => !level.name || level.name.trim() === '');
      if (hasEmptyNames) {
        // Don't add new level if there are empty names
        return;
      }
    }

    // Generate a unique key for the new level
    const newLevelNumber = gradingLevels.length + 1;
    const newKey = `level_${newLevelNumber}`;

    // Get first available color as default
    const usedColors = gradingLevels.map(level => level.color);
    const defaultColor = availableColors.find(color => !usedColors.includes(color.color)) || availableColors[0];

    // Add new level with empty name (user will type it)
    const newLevel = {
      key: newKey,
      name: '',
      color: defaultColor.color,
      colorName: defaultColor.name,
      showColorDropdown: false
    };

    gradingLevels = [...gradingLevels, newLevel];

    // Initialize empty value in rubric
    updateGradingRubric(newKey, '');
  }

  function removeLevel(levelKey) {
    // Remove from levels array (no minimum restriction)
    gradingLevels = gradingLevels.filter(level => level.key !== levelKey);

    // Remove from rubric data
    const rubric = { ...data.gradingRubric };
    delete rubric[levelKey];
    updateConfig({ gradingRubric: rubric });
  }

  function updateLevelName(levelKey, newName) {
    gradingLevels = gradingLevels.map(level =>
      level.key === levelKey ? { ...level, name: newName } : level
    );
  }

  function toggleColorDropdown(levelKey) {
    gradingLevels = gradingLevels.map(level =>
      level.key === levelKey
        ? { ...level, showColorDropdown: !level.showColorDropdown }
        : { ...level, showColorDropdown: false } // Close other dropdowns
    );
  }

  function selectColor(levelKey, color, colorName) {
    gradingLevels = gradingLevels.map(level =>
      level.key === levelKey
        ? { ...level, color, colorName, showColorDropdown: false }
        : level
    );
  }

  // Close dropdowns when clicking outside
  function closeAllDropdowns() {
    gradingLevels = gradingLevels.map(level =>
      ({ ...level, showColorDropdown: false })
    );
  }
</script>

<div class="space-y-4" on:click={closeAllDropdowns}>
  <!-- Grading Rubric Section -->
  <div>
    <h4 style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600; font-size: 12px; color: #000000;" class="mb-2">Grading Rubric</h4>
    <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 400; font-size: 11px; color: #6B7280;" class="mb-4">
      Specify how the bot grades sessions and provides feedback
    </p>
  </div>

  <!-- AI Analysis Scale -->
  <div>
    <h4 style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600; font-size: 12px; color: #000000;" class="mb-3">AI Analysis Scale</h4>

    <!-- Grading Levels -->
    <div class="space-y-3">
      {#each gradingLevels as level, index}
        <div class="flex items-center space-x-4 group">
          <!-- Text Input (moved to left) -->
          <div class="flex-1">
            <input
              type="text"
              value={data.gradingRubric?.[level.key] || ''}
              on:input={(e) => updateGradingRubric(level.key, e.target.value)}
              placeholder="Type here"
              class="w-full px-3 py-2 rounded-lg focus:ring-2 focus:border-transparent"
              style="background: #F5F5F5; focus:ring-color: #6878B6; border: none; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 500; font-size: 12px;"
            />
          </div>

          <!-- Level Name (moved to right) -->
          <div class="w-24">
            <input
              type="text"
              value={level.name}
              on:input={(e) => updateLevelName(level.key, e.target.value)}
              class="w-full px-2 py-1 text-center rounded border-transparent hover:border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              style="background: #F5F5F5; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 400; font-size: 12px; color: #374151; border: none;"
              placeholder="Type here"
            />
          </div>

          <!-- Color Dropdown and Remove Button -->
          <div class="flex items-center space-x-1 relative">
            <!-- Color Dropdown Button -->
            <button
              type="button"
              on:click={(e) => { e.stopPropagation(); toggleColorDropdown(level.key); }}
              class="flex items-center space-x-1 px-2 py-1 rounded hover:bg-gray-50 transition-colors"
            >
              <div
                class="w-4 h-4 rounded"
                style="background-color: {level.color};"
              ></div>
              <span style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 400; font-size: 12px; color: #374151;">
                {level.colorName}
              </span>
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Color Dropdown Menu -->
            {#if level.showColorDropdown}
              <div class="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32" on:click={(e) => e.stopPropagation()}>
                {#each availableColors as colorOption}
                  <button
                    type="button"
                    on:click={(e) => { e.stopPropagation(); selectColor(level.key, colorOption.color, colorOption.name); }}
                    class="w-full flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div
                      class="w-4 h-4 rounded"
                      style="background-color: {colorOption.color};"
                    ></div>
                    <span style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 400; font-size: 12px; color: #374151;">
                      {colorOption.name}
                    </span>
                  </button>
                {/each}
              </div>
            {/if}

            <!-- Remove Button (show on hover) -->
            <button
              type="button"
              on:click={() => removeLevel(level.key)}
              class="w-5 h-5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              title="Remove level"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Add New Level Button -->
  <div class="flex justify-end">
    {#if gradingLevels.length > 0 && gradingLevels.some(level => !level.name || level.name.trim() === '')}
      <div class="flex items-center space-x-2">
        <span class="text-xs text-red-500" style="font-family: 'Plus Jakarta Sans', sans-serif;">
          Complete all level names first
        </span>
        <button
          type="button"
          disabled
          class="inline-flex items-center justify-center w-8 h-8 border-2 border-dashed border-gray-200 rounded cursor-not-allowed opacity-50"
          title="Complete all level names to add new level"
        >
          <svg class="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    {:else}
      <div class="flex items-center space-x-2">
        <span class="text-xs text-gray-500" style="font-family: 'Plus Jakarta Sans', sans-serif;">
          Add grading level
        </span>
        <button
          type="button"
          on:click={addNewLevel}
          class="inline-flex items-center justify-center w-8 h-8 border-2 border-dashed border-gray-300 rounded hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group"
          title="Add new grading level"
        >
          <svg class="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>
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

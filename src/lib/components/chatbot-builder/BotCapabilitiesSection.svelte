<script>
  import { chatbotConfig, updateConfig } from '$lib/chatbot-builder-stores.js';

  export let data = {};
  export let onContinue = () => {};
  export let continueButtonText = 'Continue';

  function toggleCapability(capability) {
    const capabilities = {
      ...data.capabilities,
      [capability]: !data.capabilities[capability]
    };
    updateConfig({ capabilities });
  }

  const capabilities = [
    {
      key: 'webSearch',
      title: 'Real-time web search',
      description: 'Allow AI web search',
      icon: 'realTimeSearch'
    },
    {
      key: 'fileUpload',
      title: 'File Upload & Analysis',
      description: 'Allow file upload in chat',
      icon: 'fileUpload'
    },
    {
      key: 'imageUpload',
      title: 'Image Upload (GPT Vision)',
      description: 'Allow image upload',
      icon: 'imageUpload'
    },
    {
      key: 'createImages',
      title: 'Create Images',
      description: 'Allow user to create / infographic with AI',
      icon: 'createImages'
    },
    {
      key: 'drawingTools',
      title: 'Drawing Tools',
      description: 'Allow a white board, enabling user to draw / sketch',
      icon: 'drawingTools'
    },
    {
      key: 'canvasEdit',
      title: 'Canvas (Edit & Modify Output)',
      description: 'Allow user to modify text output, opens in separate window',
      icon: 'canvasEdit'
    }
  ];

  function getIconSvg(iconName) {
    const icons = {
      realTimeSearch: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z" fill="#8B5CF6"/>
        <path d="M22 22L20 20" stroke="#8B5CF6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M11.5 7.5V15.5" stroke="white" stroke-width="2" stroke-linecap="round"/>
        <path d="M7.5 11.5H15.5" stroke="white" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
      fileUpload: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="#8B5CF6"/>
        <path d="M14 2V8H20" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 11V17" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9 14L12 11L15 14" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
      imageUpload: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="#8B5CF6"/>
        <circle cx="8.5" cy="8.5" r="1.5" fill="white"/>
        <path d="M21 15L16 10L5 21" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
      createImages: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M9 11H15" stroke="#8B5CF6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 8V14" stroke="#8B5CF6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" fill="#8B5CF6"/>
        <path d="M9 11H15" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 8V14" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
      drawingTools: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 19L7 14L3 18L7 22L12 19Z" fill="#8B5CF6"/>
        <path d="M7.5 14.5L16.5 5.5C17.3284 4.67157 18.6716 4.67157 19.5 5.5V5.5C20.3284 6.32843 20.3284 7.67157 19.5 8.5L10.5 17.5" stroke="#8B5CF6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M15 7L17 9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
      canvasEdit: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="16" rx="2" ry="2" fill="#8B5CF6"/>
        <path d="M7 8H17" stroke="white" stroke-width="2" stroke-linecap="round"/>
        <path d="M7 12H17" stroke="white" stroke-width="2" stroke-linecap="round"/>
        <path d="M7 16H13" stroke="white" stroke-width="2" stroke-linecap="round"/>
      </svg>`
    };
    return icons[iconName] || icons.realTimeSearch;
  }
</script>

<div class="space-y-4">
  <!-- Capabilities List -->
  <div class="space-y-3">
    {#each capabilities as capability}
      <div class="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100">
        <div class="flex items-center space-x-3">
          <!-- Icon -->
          <div class="flex-shrink-0">
            {@html getIconSvg(capability.icon)}
          </div>

          <!-- Content -->
          <div class="flex-1">
            <h4 style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 500; font-size: 14px; color: #374151;" class="mb-1">
              {capability.title}
            </h4>
            <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 400; font-size: 12px; color: #6B7280;">
              {capability.description}
            </p>
          </div>
        </div>

        <!-- Toggle Switch -->
        <div class="flex-shrink-0">
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={data.capabilities?.[capability.key] || false}
              on:change={() => toggleCapability(capability.key)}
              class="sr-only peer"
            />
            <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6878B6]"></div>
          </label>
        </div>
      </div>
    {/each}
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

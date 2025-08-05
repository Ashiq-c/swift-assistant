<script>
  import { chatbotConfig, updateConfig } from '../../lib/stores.js';
  
  export let data = {};
  
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
      icon: 'search',
      color: 'text-blue-600'
    },
    {
      key: 'fileUpload',
      title: 'File Upload & Analysis',
      description: 'Allow file upload in chat',
      icon: 'upload',
      color: 'text-green-600'
    },
    {
      key: 'imageUpload',
      title: 'Image Upload (GPT Vision)',
      description: 'Allow image upload',
      icon: 'image',
      color: 'text-purple-600'
    },
    {
      key: 'imageCreation',
      title: 'Image Creation',
      description: 'Generate images with AI',
      icon: 'palette',
      color: 'text-pink-600'
    },
    {
      key: 'drawingTools',
      title: 'Drawing Tools',
      description: 'Interactive drawing capabilities',
      icon: 'pen',
      color: 'text-orange-600'
    },
    {
      key: 'canvasEdit',
      title: 'Canvas Editing',
      description: 'Edit and manipulate canvas',
      icon: 'edit',
      color: 'text-indigo-600'
    }
  ];
  
  function getIcon(iconName) {
    const icons = {
      search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
      upload: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
      image: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
      palette: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5v12a2 2 0 002 2 2 2 0 002-2V3z',
      pen: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
      edit: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
    };
    return icons[iconName] || icons.search;
  }
</script>

<div class="space-y-6">
  <!-- Capabilities Introduction -->
  <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
    <div class="flex items-start">
      <svg class="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      <div>
        <h4 class="text-sm font-medium text-blue-800 mb-1">Bot Capabilities</h4>
        <p class="text-sm text-blue-700">
          Enable specific features and tools that your chatbot can use to enhance the learning experience.
        </p>
      </div>
    </div>
  </div>

  <!-- Capabilities Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    {#each capabilities as capability}
      <div class="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
        <label class="flex items-start cursor-pointer">
          <input
            type="checkbox"
            checked={data.capabilities?.[capability.key] || false}
            on:change={() => toggleCapability(capability.key)}
            class="mt-1 mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div class="flex-1">
            <div class="flex items-center mb-2">
              <svg class="w-5 h-5 mr-2 {capability.color}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getIcon(capability.icon)} />
              </svg>
              <h4 class="text-sm font-medium text-gray-900">{capability.title}</h4>
            </div>
            <p class="text-sm text-gray-600">{capability.description}</p>
          </div>
        </label>
      </div>
    {/each}
  </div>

  <!-- Selected Capabilities Summary -->
  {#if data.capabilities && Object.values(data.capabilities).some(Boolean)}
    <div class="bg-green-50 border border-green-200 rounded-lg p-4">
      <h4 class="text-sm font-medium text-green-800 mb-2">Enabled Capabilities</h4>
      <div class="flex flex-wrap gap-2">
        {#each capabilities as capability}
          {#if data.capabilities[capability.key]}
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
              <svg class="w-3 h-3 mr-1 {capability.color}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getIcon(capability.icon)} />
              </svg>
              {capability.title}
            </span>
          {/if}
        {/each}
      </div>
    </div>
  {/if}

  <!-- Capability Notes -->
  <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
    <h4 class="text-sm font-medium text-gray-800 mb-2">Important Notes</h4>
    <ul class="text-sm text-gray-600 space-y-1">
      <li class="flex items-start">
        <span class="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
        Some capabilities may require additional setup or API keys
      </li>
      <li class="flex items-start">
        <span class="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
        File upload capabilities depend on your storage configuration
      </li>
      <li class="flex items-start">
        <span class="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
        Image generation may incur additional costs
      </li>
    </ul>
  </div>
</div>

<script>
  import { chatbotConfig, updateConfig } from '../../lib/stores.js';
  
  export let data = {};
  
  let fileInput;
  let dragActive = false;
  
  function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        updateConfig({ image: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  }
  
  function handleDrop(event) {
    event.preventDefault();
    dragActive = false;
    
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        updateConfig({ image: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  }
  
  function handleDragOver(event) {
    event.preventDefault();
    dragActive = true;
  }
  
  function handleDragLeave() {
    dragActive = false;
  }
  
  function removeImage() {
    updateConfig({ image: null });
  }
</script>

<div class="space-y-6">
  <!-- Bot Name -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
      Bot Name *
    </label>
    <input
      type="text"
      bind:value={data.name}
      on:input={(e) => updateConfig({ name: e.target.value })}
      placeholder="Enter bot name"
      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  </div>

  <!-- Description -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
      Description
    </label>
    <textarea
      bind:value={data.description}
      on:input={(e) => updateConfig({ description: e.target.value })}
      placeholder="Describe what this bot does"
      rows="3"
      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
    ></textarea>
  </div>

  <!-- Bot Image -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
      Bot Image
    </label>
    <div
      class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors {dragActive ? 'border-blue-500 bg-blue-50' : ''}"
      on:drop={handleDrop}
      on:dragover={handleDragOver}
      on:dragleave={handleDragLeave}
    >
      {#if data.image}
        <div class="space-y-4">
          <img
            src={data.image}
            alt="Bot avatar"
            class="w-24 h-24 mx-auto rounded-lg object-cover"
          />
          <button
            on:click={removeImage}
            class="text-sm text-red-600 hover:text-red-700"
          >
            Remove image
          </button>
        </div>
      {:else}
        <div class="space-y-4">
          <div class="w-16 h-16 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p class="text-gray-600 mb-2">Add an image for the chatbot</p>
            <label class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer transition-colors hover:bg-blue-700">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Image
              <input
                type="file"
                accept="image/*"
                on:change={handleImageUpload}
                bind:this={fileInput}
                class="hidden"
              />
            </label>
            <p class="text-xs text-gray-500 mt-2">Or drag and drop an image here</p>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<script>
  import { chatbotConfig, updateConfig } from '$lib/chatbot-builder-stores.js';

  export let data = {};
  export let onContinue = () => {};
  export let continueButtonText = 'Continue';

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
  <!-- Curriculum Selection -->
  <div>
    <label style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 400; font-size: 12px; color: #767676;" class="block mb-2">
      Curriculum Selection
    </label>
    <textarea
      bind:value={data.curriculum}
      on:input={(e) => updateConfig({ curriculum: e.target.value })}
      placeholder="Enter Curriculum information manually"
      rows="4"
      class="w-full px-3 py-2 rounded-lg focus:ring-2 focus:border-transparent resize-none text-gray-600"
      style="background: #F5F5F5; focus:ring-color: #6878B6; border: none; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 500; font-size: 12px;"
    ></textarea>
  </div>

  <!-- Picture -->
  <div>
    <label style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 400; font-size: 12px; color: #767676;" class="block mb-2">
      Picture
    </label>
    <div
      class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-colors {dragActive ? 'border-blue-500 bg-blue-50' : ''}"
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
            <p class="text-gray-600 mb-3">Add an image for the chatbot</p>
            <button
              class="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors"
              style="background: #6878B6;"
              on:click={() => fileInput.click()}
            >
              Browse file
            </button>
            <input
              type="file"
              accept="image/*"
              on:change={handleImageUpload}
              bind:this={fileInput}
              class="hidden"
            />
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Name your Bot -->
  <div>
    <label style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 400; font-size: 12px; color: #767676;" class="block mb-2">
      Name your Bot
    </label>
    <input
      type="text"
      bind:value={data.name}
      on:input={(e) => updateConfig({ name: e.target.value })}
      placeholder="Enter name"
      class="w-full px-3 py-2 rounded-lg focus:ring-2 focus:border-transparent"
      style="background: #F5F5F5; focus:ring-color: #6878B6; border: none; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 500; font-size: 12px;"
    />
  </div>

  <!-- Description -->
  <div>
    <label style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 400; font-size: 12px; color: #767676;" class="block mb-2">
      Description
    </label>
    <textarea
      bind:value={data.description}
      on:input={(e) => updateConfig({ description: e.target.value })}
      placeholder="A short description"
      rows="4"
      class="w-full px-3 py-2 rounded-lg focus:ring-2 focus:border-transparent resize-none"
      style="background: #F5F5F5; focus:ring-color: #6878B6; border: none; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 500; font-size: 12px;"
    ></textarea>
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

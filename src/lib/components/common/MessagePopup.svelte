<script>
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let show = false;
  export let message = '';
  export let type = 'info'; // 'success', 'error', 'info', 'warning'
  export let title = '';
  export let autoClose = true;
  export let autoCloseDelay = 3000;
  
  let timeoutId;
  
  $: if (show && autoClose) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      close();
    }, autoCloseDelay);
  }
  
  function close() {
    show = false;
    dispatch('close');
  }
  
  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      close();
    }
  }
  
  // Get colors based on type
  $: colors = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: 'text-green-400',
      button: 'text-green-600 hover:text-green-800'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200', 
      text: 'text-red-800',
      icon: 'text-red-400',
      button: 'text-red-600 hover:text-red-800'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800', 
      icon: 'text-yellow-400',
      button: 'text-yellow-600 hover:text-yellow-800'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: 'text-blue-400', 
      button: 'text-blue-600 hover:text-blue-800'
    }
  }[type];
  
  // Get icon based on type
  $: iconPath = {
    success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
    warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z',
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
  }[type];
</script>

{#if show}
  <!-- Backdrop -->
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    on:click={handleBackdropClick}
    role="dialog"
    aria-modal="true"
  >
    <!-- Popup -->
    <div 
      class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all duration-200 ease-out"
      class:scale-100={show}
      class:scale-95={!show}
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200">
        <div class="flex items-center space-x-3">
          <!-- Icon -->
          <div class="flex-shrink-0">
            <svg class="w-6 h-6 {colors.icon}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={iconPath} />
            </svg>
          </div>
          
          <!-- Title -->
          <h3 class="text-lg font-medium text-gray-900">
            {title || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : 'Information')}
          </h3>
        </div>
        
        <!-- Close button -->
        <button
          on:click={close}
          class="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <!-- Content -->
      <div class="p-4">
        <div class="rounded-md p-4 {colors.bg} {colors.border} border">
          <p class="{colors.text} text-sm leading-5">
            {message}
          </p>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="flex justify-end p-4 border-t border-gray-200 space-x-3">
        <button
          on:click={close}
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          OK
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Animation styles */
  .fixed {
    animation: fadeIn 0.2s ease-out;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>

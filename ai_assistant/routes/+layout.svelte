<script>
  // Import any global styles or setup needed for ai_assistant
  import '../lib/stores.js'; // Initialize stores
</script>

<main class="ai-assistant-app">
  <slot />
</main>

<style>
  :global(.ai-assistant-app) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #333;
  }
  
  :global(.ai-assistant-app *) {
    box-sizing: border-box;
  }
</style>

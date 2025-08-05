<script>
  import { onMount } from 'svelte';
  import { chatbotConfig, activeSection, buildMethod, isLoading, errors, isDirty, updateConfig, saveConfig } from '../../lib/stores.js';

  import Sidebar from './Sidebar.svelte';
  import OverviewSection from './OverviewSection.svelte';
  import BehaviorKnowledgeSection from './BehaviorKnowledgeSection.svelte';
  import LanguageControlSection from './LanguageControlSection.svelte';
  import GradingSection from './GradingSection.svelte';
  import BotCapabilitiesSection from './BotCapabilitiesSection.svelte';
  import SessionControlSection from './SessionControlSection.svelte';
  import LiveBotPreview from './LiveBotPreview.svelte';
  
  let config = {};
  let currentSection = 'overview';
  let currentBuildMethod = 'manual';
  let loading = false;
  let errorMessages = {};
  let hasUnsavedChanges = false;
  
  // Subscribe to stores
  $: config = $chatbotConfig;
  $: currentSection = $activeSection;
  $: currentBuildMethod = $buildMethod;
  $: loading = $isLoading;
  $: errorMessages = $errors;
  $: hasUnsavedChanges = $isDirty;
  
  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'behavior', label: 'Behaviour & Knowledge' },
    { id: 'language', label: 'Language Control' },
    { id: 'grading', label: 'Grading' },
    { id: 'capabilities', label: 'Bot Capabilities' },
    { id: 'session', label: 'Session Control' }
  ];
  
  function setActiveSection(sectionId) {
    activeSection.set(sectionId);
  }
  
  function setBuildMethod(method) {
    buildMethod.set(method);
  }
  
  async function handleSave() {
    const success = await saveConfig();
    if (success) {
      // Show success message or redirect
      console.log('Configuration saved successfully!');
    }
  }
  
  function renderCurrentSection() {
    switch (currentSection) {
      case 'overview':
        return OverviewSection;
      case 'behavior':
        return BehaviorKnowledgeSection;
      case 'language':
        return LanguageControlSection;
      case 'grading':
        return GradingSection;
      case 'capabilities':
        return BotCapabilitiesSection;
      case 'session':
        return SessionControlSection;
      default:
        return OverviewSection;
    }
  }
</script>

<div class="flex h-screen bg-gray-50">
  <!-- Sidebar -->
  <Sidebar />
  
  <!-- Main Content -->
  <div class="flex-1 flex flex-col overflow-hidden">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Chatbot Builder</h1>
          <p class="text-sm text-gray-600">Create and configure your AI teaching assistant</p>
        </div>
        <div class="flex items-center space-x-3">
          {#if hasUnsavedChanges}
            <span class="text-sm text-orange-600">Unsaved changes</span>
          {/if}
          <button
            on:click={handleSave}
            disabled={loading}
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {#if loading}
              <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            {:else}
              Save Configuration
            {/if}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Content Area -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left Panel -->
      <div class="w-2/3 flex flex-col overflow-hidden">
        <!-- Build Method Tabs -->
        <div class="bg-white border-b border-gray-200 px-6 py-4">
          <h2 class="text-lg font-semibold text-gray-900 mb-3">Build Method</h2>
          <div class="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              on:click={() => setBuildMethod('ai')}
              class="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors {currentBuildMethod === 'ai' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
            >
              AI-Assisted
            </button>
            <button
              on:click={() => setBuildMethod('manual')}
              class="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors {currentBuildMethod === 'manual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
            >
              Manual
            </button>
          </div>
        </div>
        
        <!-- Section Content -->
        <div class="flex-1 overflow-y-auto">
          {#if currentBuildMethod === 'ai'}
            <!-- AI-Assisted Build Interface -->
            <div class="flex items-center justify-center h-full p-6">
              <div class="text-center max-w-md w-full p-12 rounded-2xl bg-gray-50">
                <div class="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
                  <div class="w-16 h-16 bg-white rounded-xl shadow-lg flex items-center justify-center">
                    <span class="text-3xl">📚</span>
                  </div>
                </div>
                <h3 class="text-2xl font-bold text-gray-900 mb-4">AI-Assisted Build</h3>
                <p class="text-gray-600 mb-8 leading-relaxed">
                  Answer a few questions and let AI create your chatbot with smart defaults
                </p>
                <button class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Start AI Setup
                </button>
              </div>
            </div>
          {:else}
            <!-- Manual Build Interface -->
            <div class="flex">
              <!-- Section Navigation -->
              <div class="w-64 bg-white border-r border-gray-200 p-4">
                <nav class="space-y-1">
                  {#each sections as section}
                    <button
                      on:click={() => setActiveSection(section.id)}
                      class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors {currentSection === section.id ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}"
                    >
                      {section.label}
                    </button>
                  {/each}
                </nav>
              </div>
              
              <!-- Section Content -->
              <div class="flex-1 p-6">
                <div class="max-w-2xl">
                  <h3 class="text-xl font-semibold text-gray-900 mb-6">
                    {sections.find(s => s.id === currentSection)?.label}
                  </h3>
                  
                  <!-- Dynamic Section Component -->
                  <svelte:component this={renderCurrentSection()} data={config} />
                </div>
              </div>
            </div>
          {/if}
        </div>
      </div>
      
      <!-- Right Panel - Live Preview -->
      <div class="w-1/3 bg-gray-50 border-l border-gray-200 p-6">
        <LiveBotPreview botName={config.name || 'Your Chatbot'} />
      </div>
    </div>
  </div>
</div>

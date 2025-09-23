<script>
  import { onMount } from 'svelte';
  import { chatbotConfig, activeSection, buildMethod, isLoading, errors, isDirty, updateConfig, saveConfig } from '$lib/chatbot-builder-stores.js';
  import { showSidebar, user } from '$lib/stores';
  import MenuLines from '../icons/MenuLines.svelte';
  import UserMenu from '../layout/Sidebar/UserMenu.svelte';

  import Sidebar from './Sidebar.svelte';
  import OverviewSection from './OverviewSection.svelte';
  import BehaviorKnowledgeSection from './BehaviorKnowledgeSection.svelte';
  import LanguageControlSection from './LanguageControlSection.svelte';
  import GradingSection from './GradingSection.svelte';
  import BotCapabilitiesSection from './BotCapabilitiesSection.svelte';
  import SessionControlSection from './SessionControlSection.svelte';
  import LiveBotPreview from './LiveBotPreview.svelte';
  import ConversationalAiBuilder from './ConversationalAiBuilder.svelte';
  import BotTestingPanel from './BotTestingPanel.svelte';


  let config = {};
  let currentSection = 'overview';
  let currentBuildMethod = 'manual';
  let loading = false;
  let errorMessages = {};
  let hasUnsavedChanges = false;
  let showNotifications = false;
  let activePreviewTab = 'manual';
  let selectedPersona = null;
  let showAiSetupLanding = true; // Show the "Start AI Setup" landing page initially


  // Subscribe to stores
  $: config = $chatbotConfig;
  $: currentSection = $activeSection;
  $: currentBuildMethod = $buildMethod;
  $: loading = $isLoading;
  $: errorMessages = $errors;
  $: hasUnsavedChanges = $isDirty;

  // Close notifications when clicking outside and deselect persona when clicking outside persona area
  onMount(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !(event.target)?.closest('.notification-container')) {
        showNotifications = false;
      }
      if (selectedPersona && !(event.target)?.closest('.persona-selection')) {
        selectedPersona = null;
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  });

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
    // Reset AI setup landing when switching build methods
    if (method === 'ai') {
      showAiSetupLanding = true;
    }
  }

  function startAiSetup() {
    showAiSetupLanding = false;
  }

  async function handleSave() {
    const result = await saveConfig();
    if (result.success) {
      // Show success message
      console.log('Configuration saved successfully!', result.data);
      // Optionally redirect to chatbot list or edit page
      // window.location.href = `/chatbots/${result.data.id}`;
    } else {
      // Errors are now handled by the store and displayed under fields
      console.error('Failed to save configuration:', result.error);
    }
  }



  function handleContinue() {
    const currentIndex = sections.findIndex(section => section.id === currentSection);
    if (currentIndex < sections.length - 1) {
      // Move to next section
      const nextSection = sections[currentIndex + 1];
      setActiveSection(nextSection.id);
    } else {
      // Last section - save configuration
      handleSave();
    }
  }

  function getContinueButtonText() {
    const currentIndex = sections.findIndex(section => section.id === currentSection);
    return currentIndex === sections.length - 1 ? 'Save' : 'Continue';
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

<!-- Top Bar -->
<div class="h-12 bg-white shadow-md flex items-center justify-between fixed top-0 left-0 right-0 z-50">
  <!-- Left side - Menu Button Only -->
  <div class="flex items-center h-full">
    <!-- Menu Toggle Button -->
    <div class="px-4">
      <button
        class="p-1.5 hover:bg-gray-100 rounded transition"
        on:click={() => {
          showSidebar.set(!$showSidebar);
        }}
        aria-label="Toggle Menu"
      >
        <MenuLines />
      </button>
    </div>
  </div>

  <!-- Right side - Notifications and User Menu -->
  <div class="flex items-center space-x-3">
    <!-- Notification Bell -->
    <div class="relative notification-container">
      <button
        class="p-2 hover:bg-gray-100 rounded-full transition relative"
        on:click={() => {
          showNotifications = !showNotifications;
        }}
        aria-label="Notifications"
      >
        <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4" />
        </svg>
        <!-- Notification dot -->
        <span class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
      </button>

      <!-- Notifications Dropdown -->
      {#if showNotifications}
        <div class="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg z-50">
          <div class="p-4">
            <h3 class="font-semibold text-gray-900">Notifications</h3>
          </div>
          <div class="p-4">
            <p class="text-gray-500 text-sm">No new notifications</p>
          </div>
        </div>
      {/if}
    </div>

    <!-- User Avatar with Menu -->
    {#if $user !== undefined}
      <UserMenu>
        <button
          class="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition"
          aria-label="User Menu"
        >
          <img
            src={$user?.profile_image_url}
            class="w-8 h-8 object-cover rounded-full"
            alt="User profile"
          />
        </button>
      </UserMenu>
    {/if}
  </div>
</div>

<div class="flex min-h-screen relative pt-12 overflow-y-auto" style="background: #FFFFFF;">
  <!-- Custom Chatbot Builder Sidebar -->
  <Sidebar />

  <!-- Main Content - Account for 72px sidebar and 48px topbar -->
  <div class="flex-1 min-h-0 flex flex-col ml-[72px]">
    <!-- Header -->
    <div class="px-6 py-4" style="background: #FFFFFF;">
      <div class="flex items-center mb-6">
        <button class="mr-4 p-2 hover:bg-gray-100 rounded-lg">
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 class="text-xl font-semibold text-gray-900">Chatbot Builder</h1>
          <p class="text-sm text-gray-500">Dashboard / Blogs</p>
        </div>
      </div>

      <!-- Build Method Title -->
      <h2 class="text-lg font-medium mb-4" style="color: #6878B6;">Build Method</h2>
    </div>

    <!-- Content Area -->
    <div class="flex-1 flex flex-col md:flex-row gap-4 min-w-0 min-h-0 overflow-hidden">
      <!-- Left Panel -->
      <div class="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
        <!-- Build Method Tabs -->
        <div class="px-6 pb-4">
          <div class="flex rounded-lg overflow-hidden" style="background: linear-gradient(0deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1)), linear-gradient(0deg, #E4DCFF, #E4DCFF);">
            <button
              on:click={() => setBuildMethod('ai')}
              class="flex-1 py-3 px-6 text-sm font-medium transition-colors border-b-2 {currentBuildMethod === 'ai' ? 'border-blue-600 text-gray-700' : 'border-transparent text-gray-600'}"
              style="border-bottom-color: {currentBuildMethod === 'ai' ? '#6878B6' : 'transparent'};"
            >
              <div class="text-center">
                <div style="font-weight: 400; font-size: 12px; line-height: 100%; letter-spacing: 0%; color:#8B49DE" class="font-medium">AI-Assisted build</div>
                <div class="text-xs mt-1">Smart template-based creation</div>
              </div>
            </button>
            <button
              on:click={() => setBuildMethod('manual')}
              class="flex-1 py-3 px-6 text-sm font-medium transition-colors border-b-2 {currentBuildMethod === 'manual' ? 'border-blue-600 text-gray-700' : 'border-transparent text-gray-600'}"
              style="border-bottom-color: {currentBuildMethod === 'manual' ? '#6878B6' : 'transparent'};"
            >
              <div class="text-center">
                <div style="font-weight: 400; font-size: 12px; line-height: 100%; letter-spacing: 0%; color:#8B49DE" class="font-medium">Manual Configuration</div>
                <div class="text-xs mt-1">Full Customization Control</div>
              </div>
            </button>
          </div>
        </div>

        <!-- Section Content -->
        <div class="flex-1 min-h-0 overflow-hidden">
          {#if currentBuildMethod === 'ai'}
            {#if showAiSetupLanding}
              <!-- AI-Assisted Build Landing Page -->
              <div class="flex items-center justify-center h-full p-6">
                <div class="text-center max-w-md w-full p-12 rounded-2xl bg-gray-50">
                  <div class="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
                    <div class="w-16 h-16 bg-white rounded-xl shadow-lg flex items-center justify-center">
                      <span class="text-3xl">🤖</span>
                    </div>
                  </div>
                  <h3 class="text-2xl font-bold text-gray-900 mb-4">AI-Assisted Build</h3>
                  <p class="text-gray-600 mb-8 leading-relaxed">
                    Have a conversation with our AI to create your chatbot with smart defaults and personalized configurations
                  </p>
                  <button
                    class="px-6 py-3 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    style="background: #6878B6;"
                    on:click={startAiSetup}
                  >
                    Start AI Setup
                  </button>
                </div>
              </div>
            {:else}
              <ConversationalAiBuilder on:applied={() => { /* applied */ }} />
            {/if}
          {:else}
            <!-- Manual Build Interface -->
            <div class="flex h-full min-w-0">
              <!-- Configuration Sidebar -->
              <div class="w-64 border border-gray-200 rounded-lg m-4 sticky top-4 h-fit" style="background: #FFFFFF;">
                <!-- Sidebar Header -->
                <div class="p-4 border-b border-gray-200" style="background: linear-gradient(261.37deg, rgba(135, 206, 250, 0.1) 25.1%, rgba(104, 120, 182, 0.1) 76.25%);">
                  <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600; font-size: 14px; color: #6878B6;">Configuration</h3>
                </div>

                <!-- Navigation Items -->
                <div class="p-4">
                  <nav class="space-y-1">
                    {#each sections as section}
                      <button
                        on:click={() => setActiveSection(section.id)}
                        class="w-full text-left px-3 py-2 rounded-lg transition-colors {currentSection === section.id ? '' : 'hover:bg-gray-100 hover:text-gray-900'}"
                        style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 400; font-size: 12px; color: {currentSection === section.id ? '#6878B6' : '#6B7280'};"
                      >
                        {section.label}
                      </button>
                    {/each}
                  </nav>
                </div>
              </div>

              <!-- Section Content -->
              <div class="flex-1 min-h-0 p-6 overflow-y-auto pb-24" style="background: #FFFFFF;">
                <div class="max-w-2xl pb-8">
                  <h3 class="text-xl font-semibold mb-6" style="color: #6878B6;">
                    {sections.find(s => s.id === currentSection)?.label}
                  </h3>

                  <!-- Dynamic Section Component -->
                  <svelte:component this={renderCurrentSection()} data={config} onContinue={handleContinue} continueButtonText={getContinueButtonText()} />
                </div>
              </div>
            </div>
          {/if}
        </div>
      </div>

      <!-- Right Panel - Live Preview -->
      <div class="w-full md:shrink-0 md:min-w-[340px] md:w-[360px] lg:w-[420px] xl:w-[520px] h-full p-4 md:p-6 overflow-y-auto">
        <!-- Preview Header with Toggle -->
        <div class="flex items-center justify-between mb-4">
          <h3 style="font-weight: 600; font-size: 18px; line-height: 100%; letter-spacing: 0%; color: #6878B6;">Live Bot Preview</h3>
          <div class="flex rounded-lg overflow-hidden" style="background: #F5F5F5;">
            <button
              on:click={() => activePreviewTab = 'manual'}
              class="py-2 px-4 text-sm font-medium transition-colors {activePreviewTab === 'manual' ? 'text-white' : 'text-gray-600 hover:text-gray-900'}"
              style="background: {activePreviewTab === 'manual' ? '#6878B6' : 'transparent'};"
            >
              Manual Test
            </button>
            <button
              on:click={() => activePreviewTab = 'ai'}
              class="py-2 px-4 text-sm font-medium transition-colors {activePreviewTab === 'ai' ? 'text-white' : 'text-gray-600 hover:text-gray-900'}"
              style="background: {activePreviewTab === 'ai' ? '#6878B6' : 'transparent'};"
            >
              AI Persona Test
            </button>
          </div>
        </div>

        <!-- Inactive Status -->
        <div class="flex items-center justify-between px-4 py-3 mb-4 rounded-lg" style="background: #F2EEFF;">
          <div class="flex items-center">
            <div class="w-2 h-2 rounded-full bg-gray-400 mr-3"></div>
            <span class="text-sm text-gray-700">Inactive</span>
          </div>
          <div class="flex items-center space-x-2">
            <button class="p-1 text-gray-400 hover:text-gray-600">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button class="p-1 text-gray-400 hover:text-gray-600">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Persona Selection (Only show for AI Persona Test) -->
        {#if activePreviewTab === 'ai'}
        <div class="mb-4 persona-selection">
          <label class="block mb-3" style="font-family: 'Plus Jakarta Sans'; font-weight: 600; font-size: 12px; line-height: 100%; letter-spacing: 0%; color: #374151;">
            Select a persona from below
          </label>

          <!-- First Row -->
          <div class="flex flex-wrap gap-2 mb-2">
            <!-- New Teacher -->
            <button
              on:click={() => selectedPersona = selectedPersona === 'new_teacher' ? null : 'new_teacher'}
              class="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors"
              style="background: {selectedPersona === 'new_teacher' ? '#8B49DE' : '#F2F2F2'}; font-family: 'Plus Jakarta Sans'; font-weight: 400; font-size: 12px; line-height: 100%; color: {selectedPersona === 'new_teacher' ? 'white' : '#6B7280'};"
            >
              <span class="text-sm">👨‍🏫</span>
              <span>New Teacher</span>
            </button>

            <!-- Experienced Teacher -->
            <button
              on:click={() => selectedPersona = selectedPersona === 'experienced_teacher' ? null : 'experienced_teacher'}
              class="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors"
              style="background: {selectedPersona === 'experienced_teacher' ? '#8B49DE' : '#F2F2F2'}; font-family: 'Plus Jakarta Sans'; font-weight: 400; font-size: 12px; line-height: 100%; color: {selectedPersona === 'experienced_teacher' ? 'white' : '#6B7280'};"
            >
              <span class="text-sm">👩‍🏫</span>
              <span>Experienced Teacher</span>
            </button>

            <!-- Struggling Student -->
            <button
              on:click={() => selectedPersona = selectedPersona === 'struggling_student' ? null : 'struggling_student'}
              class="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors"
              style="background: {selectedPersona === 'struggling_student' ? '#8B49DE' : '#F2F2F2'}; font-family: 'Plus Jakarta Sans'; font-weight: 400; font-size: 12px; line-height: 100%; color: {selectedPersona === 'struggling_student' ? 'white' : '#6B7280'};"
            >
              <span class="text-sm">📚</span>
              <span>Struggling Student</span>
            </button>
          </div>

          <!-- Second Row -->
          <div class="flex flex-wrap gap-2">
            <!-- Average Student -->
            <button
              on:click={() => selectedPersona = selectedPersona === 'average_student' ? null : 'average_student'}
              class="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors"
              style="background: {selectedPersona === 'average_student' ? '#8B49DE' : '#F2F2F2'}; font-family: 'Plus Jakarta Sans'; font-weight: 400; font-size: 12px; line-height: 100%; color: {selectedPersona === 'average_student' ? 'white' : '#6B7280'};"
            >
              <span class="text-sm">🎓</span>
              <span>Average Student</span>
            </button>

            <!-- Advanced Student -->
            <button
              on:click={() => selectedPersona = selectedPersona === 'advanced_student' ? null : 'advanced_student'}
              class="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors"
              style="background: {selectedPersona === 'advanced_student' ? '#8B49DE' : '#F2F2F2'}; font-family: 'Plus Jakarta Sans'; font-weight: 400; font-size: 12px; line-height: 100%; color: {selectedPersona === 'advanced_student' ? 'white' : '#6B7280'};"
            >
              <span class="text-sm">🏆</span>
              <span>Advanced Student</span>
            </button>

            <!-- Off-Task Student -->
            <button
              on:click={() => selectedPersona = selectedPersona === 'off_task_student' ? null : 'off_task_student'}
              class="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors"
              style="background: {selectedPersona === 'off_task_student' ? '#8B49DE' : '#F2F2F2'}; font-family: 'Plus Jakarta Sans'; font-weight: 400; font-size: 12px; line-height: 100%; color: {selectedPersona === 'off_task_student' ? 'white' : '#6B7280'};"
            >
              <span class="text-sm">😴</span>
              <span>Off-Task Student</span>
            </button>

            <!-- +2 More button -->
            <button class="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors" style="background: #F2F2F2; font-family: 'Plus Jakarta Sans'; font-weight: 400; font-size: 12px; line-height: 100%; color: #6B7280;">
              <span class="text-sm">+</span>
              <span>+2 More</span>
            </button>
          </div>
        </div>
        {/if}

        <LiveBotPreview botName={config.name || 'Your Chatbot'} activeTab={activePreviewTab} persona={selectedPersona} />

        <!-- Testing Panel -->
        {#if $chatbotConfig.id}
          <div class="mt-6">
            <BotTestingPanel botId={String($chatbotConfig.id)} className="max-h-96" />
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

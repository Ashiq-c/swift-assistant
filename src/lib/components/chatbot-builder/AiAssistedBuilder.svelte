<script>
  // @ts-nocheck
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import { chatbotConfig, updateConfig, buildMethod, activeSection, saveConfig } from '$lib/chatbot-builder-stores.js';
  import { createChatViaAPI } from '$lib/apis/chats';
  import { fetchLanguages } from '$lib/api/languages.js';
  import { streamChatMessage as sseStream } from '$lib/api/streamChatMessage';
  import { GRADE_LEVELS } from '$lib/chatbot-builder-types.js';

  export let initialPrompt = '';

  const dispatch = createEventDispatcher();

  let chatId = null;
  let isGenerating = false;
  let error = '';
  let streamRef = null;
  let isSaving = false;
  let currentStep = 1;
  let totalSteps = 4;
  let availableLanguages = [];
  let loadingLanguages = false;
  let showTooltip = null;
  let progressSaved = false;

  // Save progress to localStorage
  function saveProgress() {
    try {
      localStorage.setItem('ai-builder-progress', JSON.stringify({
        currentStep,
        questionnaire: q,
        timestamp: Date.now()
      }));
      progressSaved = true;
      setTimeout(() => progressSaved = false, 2000);
    } catch (e) {
      console.warn('Failed to save progress:', e);
    }
  }

  // Load progress from localStorage
  function loadProgress() {
    try {
      const saved = localStorage.getItem('ai-builder-progress');
      if (saved) {
        const data = JSON.parse(saved);
        // Only load if saved within last 24 hours
        if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
          currentStep = data.currentStep || 1;
          q = { ...q, ...data.questionnaire };
          return true;
        }
      }
    } catch (e) {
      console.warn('Failed to load progress:', e);
    }
    return false;
  }

  // Auto-save progress when questionnaire changes
  $: if (q) {
    saveProgress();
  }

  // Enhanced questionnaire with step-by-step approach
  let q = {
    // Step 1: Basic Information
    purpose: '',
    subject: '',
    audience: '',
    gradeLevel: '',

    // Step 2: Behavior & Personality
    tone: '',
    botRole: '',
    teachingStyle: '',

    // Step 3: Language & Communication
    languages: { primary: 'en', secondary: [] },
    conversationStyle: 'formal',

    // Step 4: Capabilities & Features
    capabilities: {
      webSearch: true,
      fileUpload: false,
      imageUpload: false,
      imageCreation: false,
      drawingTools: false,
      canvasEdit: false
    },
    sessionControl: {
      duration: 0,
      pauseResume: false
    }
  };

  // Predefined options for better UX
  const subjects = [
    'Mathematics', 'Science', 'English Language Arts', 'Social Studies', 'History',
    'Geography', 'Art', 'Music', 'Physical Education', 'Computer Science',
    'Foreign Language', 'Special Education', 'General Education'
  ];

  const botRoles = [
    'Teaching Assistant', 'Subject Expert', 'Tutor', 'Mentor',
    'Study Buddy', 'Research Assistant', 'Learning Coach'
  ];

  const teachingStyles = [
    'Socratic (Question-based)', 'Direct Instruction', 'Collaborative Learning',
    'Problem-based Learning', 'Inquiry-based Learning', 'Adaptive Learning'
  ];

  const tones = [
    'Encouraging and Supportive', 'Professional and Formal', 'Friendly and Casual',
    'Patient and Understanding', 'Enthusiastic and Energetic', 'Calm and Reassuring'
  ];

  // Smart suggestions based on user inputs
  let smartSuggestions = {
    purpose: [],
    audience: [],
    capabilities: []
  };

  // Auto-complete and smart defaults
  function generateSmartSuggestions() {
    // Purpose suggestions based on subject
    if (q.subject) {
      const subjectSuggestions = {
        'Mathematics': [
          'Help students solve math problems step-by-step',
          'Provide practice problems and explanations',
          'Assist with homework and concept understanding',
          'Guide through mathematical reasoning'
        ],
        'Science': [
          'Explain scientific concepts and phenomena',
          'Help with lab report analysis',
          'Guide through scientific method',
          'Provide interactive science experiments'
        ],
        'English Language Arts': [
          'Assist with writing and grammar',
          'Help analyze literature and texts',
          'Provide writing feedback and suggestions',
          'Guide through reading comprehension'
        ],
        'Social Studies': [
          'Explain historical events and contexts',
          'Help with research and analysis',
          'Guide through critical thinking about society',
          'Assist with geography and cultural understanding'
        ]
      };
      smartSuggestions.purpose = subjectSuggestions[q.subject] || [];
    }

    // Audience suggestions based on grade level
    if (q.gradeLevel) {
      const gradeSuggestions = {
        'Kindergarten': ['Young learners (ages 5-6)', 'Beginning readers', 'Early childhood students'],
        'Elementary (K-5)': ['Elementary students', 'Young learners (ages 5-11)', 'Primary school children'],
        'Middle School (6-8)': ['Middle school students', 'Pre-teens (ages 11-14)', 'Junior high students'],
        'High School (9-12)': ['High school students', 'Teenagers (ages 14-18)', 'College-prep students'],
        'College/University': ['College students', 'University learners', 'Adult learners']
      };
      smartSuggestions.audience = gradeSuggestions[q.gradeLevel] || [];
    }

    // Capability suggestions based on subject and grade
    const capabilitySuggestions = [];
    if (q.subject === 'Mathematics' || q.subject === 'Science') {
      capabilitySuggestions.push('drawingTools', 'imageCreation');
    }
    if (q.subject === 'English Language Arts') {
      capabilitySuggestions.push('fileUpload', 'canvasEdit');
    }
    if (q.gradeLevel && (q.gradeLevel.includes('High School') || q.gradeLevel.includes('College'))) {
      capabilitySuggestions.push('webSearch', 'fileUpload');
    }
    smartSuggestions.capabilities = capabilitySuggestions;
  }

  // Apply smart defaults when subject or grade changes
  $: if (q.subject || q.gradeLevel) {
    generateSmartSuggestions();
  }

  // Auto-apply suggested capabilities
  function applySuggestedCapabilities() {
    smartSuggestions.capabilities.forEach(cap => {
      if (q.capabilities.hasOwnProperty(cap)) {
        q.capabilities[cap] = true;
      }
    });
  }

  // Form validation
  function validateCurrentStep() {
    switch (currentStep) {
      case 1:
        return q.purpose.trim() && q.audience.trim() && q.gradeLevel;
      case 2:
        return q.botRole && q.tone;
      case 3:
        return q.languages.primary;
      case 4:
        return true; // Capabilities are optional
      default:
        return true;
    }
  }

  // Get step completion status
  function getStepStatus(step) {
    switch (step) {
      case 1:
        return q.purpose.trim() && q.audience.trim() && q.gradeLevel ? 'complete' : 'incomplete';
      case 2:
        return q.botRole && q.tone ? 'complete' : 'incomplete';
      case 3:
        return q.languages.primary ? 'complete' : 'incomplete';
      case 4:
        return 'complete'; // Always complete since capabilities are optional
      default:
        return 'incomplete';
    }
  }

  // Load languages on mount
  onMount(async () => {
    try {
      loadingLanguages = true;
      availableLanguages = await fetchLanguages();
    } catch (err) {
      console.error('Failed to load languages:', err);
      availableLanguages = [
        { id: '1', code: 'en', name: 'English' },
        { id: '2', code: 'es', name: 'Spanish' },
        { id: '3', code: 'fr', name: 'French' }
      ];
    } finally {
      loadingLanguages = false;
    }
  });

  // Streaming output buffer and parsed config
  let aiOutput = '';
  let parsedConfig = null;

  function buildGenerationPrompt() {
    const summary = `You are an expert educational AI assistant that creates comprehensive chatbot configurations for classroom use.

Create a detailed chatbot configuration based on the following requirements. Output ONLY valid JSON with no backticks, commentary, or additional text.

Use this exact schema (keys in camelCase):
{
  "name": "string (creative, educational name)",
  "description": "string (detailed description of bot's purpose and capabilities)",
  "botRole": "string (specific educational role)",
  "instructions": "string (comprehensive behavioral instructions, 200-400 words)",
  "greetingMessage": "string (warm, engaging greeting that sets expectations)",
  "gradeLevel": "string (specific grade level or range)",
  "primaryLanguage": "string (language code like 'en', 'es', 'fr')",
  "secondaryLanguages": ["string array of language codes"],
  "conversationStarters": ["array of 4-6 engaging conversation starters"],
  "gradingRubric": {
    "beginning": "string (criteria for beginning level performance)",
    "emerging": "string (criteria for emerging level performance)"
  },
  "capabilities": {
    "webSearch": boolean,
    "fileUpload": boolean,
    "imageUpload": boolean,
    "imageCreation": boolean,
    "drawingTools": boolean,
    "canvasEdit": boolean
  },
  "sessionControl": {
    "duration": number (minutes, 0 for unlimited),
    "pauseResume": boolean
  }
}

Requirements:
- Purpose/Subject: ${q.purpose || 'General Education'} ${q.subject ? `(${q.subject})` : ''}
- Target Audience: ${q.audience || 'Students'}
- Grade Level: ${q.gradeLevel || 'Elementary'}
- Bot Role: ${q.botRole || 'Teaching Assistant'}
- Teaching Style: ${q.teachingStyle || 'Supportive'}
- Tone: ${q.tone || 'Encouraging and Supportive'}
- Conversation Style: ${q.conversationStyle || 'formal'}
- Primary Language: ${q.languages.primary || 'en'}
- Secondary Languages: ${(q.languages.secondary||[]).join(', ') || 'none'}
- Enabled Capabilities: ${Object.entries(q.capabilities).filter(([,v])=>v).map(([k])=>k).join(', ') || 'webSearch only'}
- Session Duration: ${q.sessionControl.duration || 'unlimited'} minutes
- Pause/Resume: ${q.sessionControl.pauseResume ? 'enabled' : 'disabled'}

Create engaging, age-appropriate content that aligns with educational best practices.`;
    return summary;
  }

  async function ensureChat() {
    if (chatId) return chatId;
    const res = await createChatViaAPI('');
    if (res && res.success && res.chat) {
      chatId = res.chat;
      return chatId;
    }
    throw new Error('Failed to create chat for AI setup');
  }

  function extractJsonFrom(text) {
    try {
      // Try direct parse
      return JSON.parse(text);
    } catch {}

    // Try code fence
    const fenceMatch = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/i);
    if (fenceMatch) {
      try { return JSON.parse(fenceMatch[1]); } catch {}
    }

    // Heuristic: find first { ... }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const candidate = text.slice(firstBrace, lastBrace + 1);
      try { return JSON.parse(candidate); } catch {}
    }
    return null;
  }

  function stopStream() {
    if (streamRef && typeof streamRef.close === 'function') {
      try { streamRef.close(); } catch {}
      streamRef = null;
    }
  }
  onDestroy(stopStream);

  async function generateConfig() {
    error = '';
    parsedConfig = null;
    aiOutput = '';
    isGenerating = true;

    try {
      await ensureChat();
      const prompt = buildGenerationPrompt();

      // Start streaming; collect text
      streamRef = sseStream({
        chatId,
        prompt,
        onChunk: (data) => {
          let token = '';
          try {
            const parsed = JSON.parse(data);
            token = parsed?.token ?? '';
          } catch {
            token = data;
          }
          if (!token) return;
          aiOutput += token;
        },
        onDone: () => {
          streamRef = null;
          try {
            const json = extractJsonFrom(aiOutput);
            if (!json) {
              error = 'Could not parse AI output as JSON. Please tweak answers and try again.';
            } else {
              parsedConfig = json;
            }
          } catch (e) {
            error = e?.message || 'Failed to parse AI output.';
          } finally {
            isGenerating = false;
          }
        },
        onError: (e) => {
          streamRef = null;
          isGenerating = false;
          error = typeof e === 'string' ? e : (e?.message || 'Streaming error');
        }
      });
    } catch (e) {
      isGenerating = false;
      error = e?.message || 'Failed to start generation';
    }
  }

  async function applyToBuilder() {
    if (!parsedConfig) return;
    try {
      // Resolve languages to numeric IDs expected by backend
      let resolvedPrimary = parsedConfig.primaryLanguage || q.languages.primary || 'en';
      let resolvedSecondary = Array.isArray(parsedConfig.secondaryLanguages) ? parsedConfig.secondaryLanguages : (q.languages.secondary || []);
      let langs = availableLanguages.length ? availableLanguages : null;

      if (!langs) {
        try { langs = await fetchLanguages(); } catch {}
      }

      // Primary language mapping
      if (langs && langs.length) {
        const matchByCode = langs.find(l => l.code === resolvedPrimary);
        const matchByName = langs.find(l => l.name.toLowerCase() === resolvedPrimary.toLowerCase());
        const matchStartsWith = langs.find(l => l.name.toLowerCase().startsWith(resolvedPrimary.toLowerCase()));
        const chosen = matchByCode || matchByName || matchStartsWith || langs[0];
        resolvedPrimary = chosen?.id ? String(chosen.id) : '1';
      } else {
        resolvedPrimary = '1';
      }

      // Secondary languages mapping
      const resolvedSecondaryIds = [];
      if (Array.isArray(resolvedSecondary) && resolvedSecondary.length && langs) {
        for (const langCode of resolvedSecondary) {
          const found = langs.find(l => l.code === langCode || l.name.toLowerCase() === langCode.toLowerCase());
          if (found?.id) {
            resolvedSecondaryIds.push(found.id);
          }
        }
      }

      // Transform AI config to match manual builder format
      const transformedConfig = {
        name: parsedConfig.name || q.purpose.slice(0, 50) || 'AI Generated Bot',
        description: parsedConfig.description || q.purpose || '',
        curriculumInfo: '', // Not generated by AI
        botRole: parsedConfig.botRole || q.botRole || '',
        instructions: parsedConfig.instructions || '',
        greetingMessage: parsedConfig.greetingMessage || '',
        gradeLevel: parsedConfig.gradeLevel || q.gradeLevel || '',
        primaryLanguage: resolvedPrimary,
        secondaryLanguages: resolvedSecondaryIds,
        conversationStarters: Array.isArray(parsedConfig.conversationStarters) ? parsedConfig.conversationStarters : [],
        gradingRubric: typeof parsedConfig.gradingRubric === 'object' ? parsedConfig.gradingRubric : { beginning: '', emerging: '' },
        capabilities: {
          webSearch: !!(parsedConfig?.capabilities?.webSearch || q.capabilities.webSearch),
          fileUpload: !!(parsedConfig?.capabilities?.fileUpload || q.capabilities.fileUpload),
          imageUpload: !!(parsedConfig?.capabilities?.imageUpload || q.capabilities.imageUpload),
          imageCreation: !!(parsedConfig?.capabilities?.imageCreation || q.capabilities.imageCreation),
          drawingTools: !!(parsedConfig?.capabilities?.drawingTools || q.capabilities.drawingTools),
          canvasEdit: !!(parsedConfig?.capabilities?.canvasEdit || q.capabilities.canvasEdit)
        },
        sessionControl: {
          duration: parsedConfig?.sessionControl?.duration || q.sessionControl.duration || 0,
          pauseResume: !!(parsedConfig?.sessionControl?.pauseResume || q.sessionControl.pauseResume)
        }
      };

      // Update the store with transformed config
      updateConfig(transformedConfig);

      // Persist immediately so a bot is created
      isSaving = true;
      try {
        // microtask to ensure store update propagates before saving
        await Promise.resolve();
        const result = await saveConfig();
        if (!result?.success) {
          error = result?.error || 'Failed to create bot';
          return;
        }

        // Clear progress on successful creation
        try {
          localStorage.removeItem('ai-builder-progress');
        } catch {}

        // Switch to manual mode for refinement
        buildMethod.set('manual');
        activeSection.set('overview');
        dispatch('applied');

      } finally {
        isSaving = false;
      }
    } catch (e) {
      console.error('Apply to builder error:', e);
      error = e?.message || 'Failed to apply config';
    }
  }
</script>

<div class="w-full h-full min-h-0 flex justify-center p-4 md:p-6 overflow-auto">
  <div class="w-full max-w-4xl bg-white border border-gray-200 rounded-2xl max-h-[80vh] flex flex-col overflow-hidden relative">

    <!-- Header with Progress -->
    <div class="p-6 border-b border-gray-200">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-xl font-semibold" style="color:#6878B6;">AI-Assisted Bot Builder</h3>
          <p class="text-sm text-gray-600 mt-1">Create a personalized chatbot with AI guidance</p>
        </div>
        <div class="text-right">
          <div class="text-sm text-gray-500">Step {currentStep} of {totalSteps}</div>
          {#if progressSaved}
            <div class="text-xs text-green-600 flex items-center mt-1">
              <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Progress saved
            </div>
          {/if}
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: {(currentStep / totalSteps) * 100}%"></div>
      </div>

      <!-- Step Labels -->
      <div class="flex justify-between mt-2 text-xs text-gray-500">
        <span class="{currentStep >= 1 ? 'text-blue-600 font-medium' : ''}">Basic Info</span>
        <span class="{currentStep >= 2 ? 'text-blue-600 font-medium' : ''}">Behavior</span>
        <span class="{currentStep >= 3 ? 'text-blue-600 font-medium' : ''}">Language</span>
        <span class="{currentStep >= 4 ? 'text-blue-600 font-medium' : ''}">Capabilities</span>
      </div>
    </div>

    <div class="flex-1 min-h-0 overflow-y-auto p-6">

      <!-- Step 1: Basic Information -->
      {#if currentStep === 1}
        <div class="space-y-6">
          <div class="text-center mb-6">
            <h4 class="text-lg font-semibold text-gray-900 mb-2">Basic Information</h4>
            <p class="text-gray-600">Tell us about your chatbot's purpose and audience</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="ai-purpose" class="block text-sm font-medium text-gray-700 mb-2">What is the main purpose of your chatbot?</label>
              <textarea id="ai-purpose" class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows="3" bind:value={q.purpose} placeholder="e.g., Help students practice math word problems, provide writing feedback, explain science concepts..." />

              <!-- Smart Suggestions for Purpose -->
              {#if smartSuggestions.purpose.length > 0 && !q.purpose.trim()}
                <div class="mt-2">
                  <p class="text-xs text-gray-600 mb-2">💡 Suggestions based on your subject:</p>
                  <div class="flex flex-wrap gap-2">
                    {#each smartSuggestions.purpose.slice(0, 3) as suggestion}
                      <button
                        type="button"
                        class="text-xs px-3 py-1 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
                        on:click={() => q.purpose = suggestion}
                      >
                        {suggestion}
                      </button>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>

            <div>
              <label for="ai-subject" class="block text-sm font-medium text-gray-700 mb-2">Subject Area</label>
              <select id="ai-subject" class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent" bind:value={q.subject}>
                <option value="">Select a subject</option>
                {#each subjects as subject}
                  <option value={subject}>{subject}</option>
                {/each}
              </select>
            </div>

            <div>
              <label for="ai-audience" class="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
              <input id="ai-audience" class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent" bind:value={q.audience} placeholder="e.g., 6th grade students, high school seniors, adult learners..." />

              <!-- Smart Suggestions for Audience -->
              {#if smartSuggestions.audience.length > 0 && !q.audience.trim()}
                <div class="mt-2">
                  <p class="text-xs text-gray-600 mb-2">💡 Suggestions based on your grade level:</p>
                  <div class="flex flex-wrap gap-2">
                    {#each smartSuggestions.audience as suggestion}
                      <button
                        type="button"
                        class="text-xs px-3 py-1 bg-green-50 text-green-700 rounded-full hover:bg-green-100 transition-colors"
                        on:click={() => q.audience = suggestion}
                      >
                        {suggestion}
                      </button>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>

            <div>
              <label for="ai-grade" class="block text-sm font-medium text-gray-700 mb-2">Grade Level</label>
              <select id="ai-grade" class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent" bind:value={q.gradeLevel}>
                <option value="">Select grade level</option>
                {#each Object.entries(GRADE_LEVELS) as [key, level]}
                  <option value={level}>{level}</option>
                {/each}
              </select>
            </div>
          </div>
        </div>
      {/if}

      <!-- Step 2: Behavior & Personality -->
      {#if currentStep === 2}
        <div class="space-y-6">
          <div class="text-center mb-6">
            <h4 class="text-lg font-semibold text-gray-900 mb-2">Behavior & Personality</h4>
            <p class="text-gray-600">Define how your chatbot should interact with students</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="ai-bot-role" class="block text-sm font-medium text-gray-700 mb-2">Bot Role</label>
              <select id="ai-bot-role" class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent" bind:value={q.botRole}>
                <option value="">Select a role</option>
                {#each botRoles as role}
                  <option value={role}>{role}</option>
                {/each}
              </select>
            </div>

            <div>
              <label for="ai-teaching-style" class="block text-sm font-medium text-gray-700 mb-2">Teaching Style</label>
              <select id="ai-teaching-style" class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent" bind:value={q.teachingStyle}>
                <option value="">Select teaching style</option>
                {#each teachingStyles as style}
                  <option value={style}>{style}</option>
                {/each}
              </select>
            </div>

            <div class="md:col-span-2">
              <label for="ai-tone" class="block text-sm font-medium text-gray-700 mb-2">Tone & Personality</label>
              <select id="ai-tone" class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent" bind:value={q.tone}>
                <option value="">Select tone</option>
                {#each tones as tone}
                  <option value={tone}>{tone}</option>
                {/each}
              </select>
            </div>
          </div>
        </div>
      {/if}

      <!-- Step 3: Language & Communication -->
      {#if currentStep === 3}
        <div class="space-y-6">
          <div class="text-center mb-6">
            <h4 class="text-lg font-semibold text-gray-900 mb-2">Language & Communication</h4>
            <p class="text-gray-600">Configure language settings and communication style</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="ai-primary-lang" class="block text-sm font-medium text-gray-700 mb-2">Primary Language</label>
              {#if loadingLanguages}
                <div class="w-full border border-gray-300 rounded-lg p-3 text-gray-500">Loading languages...</div>
              {:else}
                <select id="ai-primary-lang" class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent" bind:value={q.languages.primary}>
                  <option value="">Select primary language</option>
                  {#each availableLanguages as lang}
                    <option value={lang.code}>{lang.name}</option>
                  {/each}
                </select>
              {/if}
            </div>

            <div>
              <label for="ai-conversation-style" class="block text-sm font-medium text-gray-700 mb-2">Conversation Style</label>
              <select id="ai-conversation-style" class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent" bind:value={q.conversationStyle}>
                <option value="formal">Formal & Academic</option>
                <option value="casual">Casual & Friendly</option>
                <option value="encouraging">Encouraging & Supportive</option>
                <option value="professional">Professional</option>
              </select>
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">Secondary Languages (Optional)</label>
              {#if !loadingLanguages}
                <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {#each availableLanguages.filter(lang => lang.code !== q.languages.primary) as lang}
                    <label class="inline-flex items-center">
                      <input type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                             checked={q.languages.secondary.includes(lang.code)}
                             on:change={(e) => {
                               if (e.target.checked) {
                                 q.languages.secondary = [...q.languages.secondary, lang.code];
                               } else {
                                 q.languages.secondary = q.languages.secondary.filter(code => code !== lang.code);
                               }
                             }} />
                      <span class="ml-2 text-sm text-gray-700">{lang.name}</span>
                    </label>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        </div>
      {/if}

      <!-- Step 4: Capabilities & Features -->
      {#if currentStep === 4}
        <div class="space-y-6">
          <div class="text-center mb-6">
            <h4 class="text-lg font-semibold text-gray-900 mb-2">Capabilities & Features</h4>
            <p class="text-gray-600">Choose what your chatbot can do</p>
          </div>

          <div class="space-y-6">
            <fieldset>
              <legend class="text-sm font-medium text-gray-700 mb-4">Bot Capabilities</legend>

              <!-- Smart Capability Suggestions -->
              {#if smartSuggestions.capabilities.length > 0}
                <div class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-sm font-medium text-yellow-800">💡 Recommended for {q.subject || 'your subject'}</p>
                      <p class="text-xs text-yellow-700">Based on your subject and grade level, we recommend these capabilities:</p>
                    </div>
                    <button
                      type="button"
                      class="text-xs px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full hover:bg-yellow-300 transition-colors"
                      on:click={applySuggestedCapabilities}
                    >
                      Apply All
                    </button>
                  </div>
                  <div class="mt-2 flex flex-wrap gap-2">
                    {#each smartSuggestions.capabilities as cap}
                      <span class="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                        {cap.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                    {/each}
                  </div>
                </div>
              {/if}

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                {#each Object.entries(q.capabilities) as [key, value]}
                  <label class="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer {smartSuggestions.capabilities.includes(key) ? 'border-yellow-300 bg-yellow-50' : ''}">
                    <input type="checkbox" class="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500" bind:checked={q.capabilities[key]} />
                    <div class="flex-1">
                      <div class="text-sm font-medium text-gray-900 capitalize flex items-center">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        {#if smartSuggestions.capabilities.includes(key)}
                          <span class="ml-2 text-xs px-2 py-0.5 bg-yellow-200 text-yellow-800 rounded-full">Recommended</span>
                        {/if}
                      </div>
                      <div class="text-xs text-gray-500">
                        {#if key === 'webSearch'}Enable real-time web search capabilities
                        {:else if key === 'fileUpload'}Allow students to upload and analyze files
                        {:else if key === 'imageUpload'}Enable image upload and analysis with GPT Vision
                        {:else if key === 'imageCreation'}Allow AI to create images and infographics
                        {:else if key === 'drawingTools'}Provide whiteboard and drawing tools
                        {:else if key === 'canvasEdit'}Enable text editing and modification tools
                        {/if}
                      </div>
                    </div>
                  </label>
                {/each}
              </div>
            </fieldset>

            <fieldset>
              <legend class="text-sm font-medium text-gray-700 mb-4">Session Control</legend>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label for="ai-duration" class="block text-sm font-medium text-gray-700 mb-2">Session Duration (minutes)</label>
                  <input id="ai-duration" type="number" min="0" max="300" class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent" bind:value={q.sessionControl.duration} placeholder="0 for unlimited" />
                  <p class="text-xs text-gray-500 mt-1">0 = unlimited session time</p>
                </div>

                <div class="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                  <input type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" bind:checked={q.sessionControl.pauseResume} />
                  <div>
                    <div class="text-sm font-medium text-gray-900">Enable Pause/Resume</div>
                    <div class="text-xs text-gray-500">Allow students to pause and resume sessions</div>
                  </div>
                </div>
              </div>
            </fieldset>
          </div>
        </div>
      {/if}

    </div>

    <!-- Navigation and Action Buttons -->
    <div class="border-t border-gray-200 p-6">
      <div class="flex items-center justify-between">
        <!-- Previous Button -->
        <button
          class="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={currentStep === 1}
          on:click={() => currentStep = Math.max(1, currentStep - 1)}
        >
          Previous
        </button>

        <!-- Step Indicators -->
        <div class="flex space-x-3">
          {#each Array(totalSteps) as _, i}
            <div class="flex items-center">
              <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                {i + 1 < currentStep ? 'bg-green-500 text-white' :
                 i + 1 === currentStep ? 'bg-blue-600 text-white' :
                 'bg-gray-300 text-gray-600'}">
                {i + 1 < currentStep ? '✓' : i + 1}
              </div>
              {#if i < totalSteps - 1}
                <div class="w-8 h-0.5 {i + 1 < currentStep ? 'bg-green-500' : 'bg-gray-300'}"></div>
              {/if}
            </div>
          {/each}
        </div>

        <!-- Next/Generate Button -->
        {#if currentStep < totalSteps}
          <button
            class="px-6 py-2 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style="background:#6878B6;"
            disabled={!validateCurrentStep()}
            on:click={() => currentStep = Math.min(totalSteps, currentStep + 1)}
          >
            Next
            {#if !validateCurrentStep()}
              <span class="ml-1 text-xs">(Complete required fields)</span>
            {/if}
          </button>
        {:else}
          <div class="flex items-center gap-3">
            <button
              class="px-6 py-2 rounded-lg text-white disabled:opacity-50"
              style="background:#6878B6;"
              on:click={generateConfig}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating…' : 'Generate AI Config'}
            </button>
            {#if parsedConfig}
              <button
                class="px-6 py-2 rounded-lg border border-green-500 text-green-700 hover:bg-green-50"
                on:click={applyToBuilder}
                disabled={isSaving}
              >
                {isSaving ? 'Creating…' : 'Apply & Create Bot'}
              </button>
            {/if}
            {#if streamRef}
              <button
                class="px-4 py-2 rounded-lg border border-red-500 text-red-700 hover:bg-red-50"
                on:click={stopStream}
              >
                Stop
              </button>
            {/if}
          </div>
        {/if}
      </div>
    </div>

    <!-- Error Display -->
    {#if error}
      <div class="p-6 border-t border-gray-200">
        <div class="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-4">
          <div class="flex items-center">
            <svg class="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <strong>Error:</strong>
          </div>
          <p class="mt-1">{error}</p>
        </div>
      </div>
    {/if}

    <!-- AI Output Display (only show when generating or completed) -->
    {#if aiOutput || parsedConfig}
      <div class="border-t border-gray-200 p-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 class="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              AI Generation Stream
            </h4>
            <div class="h-48 w-full overflow-auto whitespace-pre-wrap text-xs border border-gray-200 rounded-lg p-3 bg-gray-50 font-mono">
              {aiOutput || 'Generation output will appear here...'}
            </div>
          </div>

          <div>
            <h4 class="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Parsed Configuration
            </h4>
            <pre class="h-48 w-full overflow-auto text-xs border border-gray-200 rounded-lg p-3 bg-gray-50 font-mono">
              {parsedConfig ? JSON.stringify(parsedConfig, null, 2) : 'Parsed configuration will appear here...'}
            </pre>
          </div>
        </div>
      </div>
    {/if}

    <!-- Testing Section (show after bot is created) -->
    {#if $chatbotConfig.id && parsedConfig}
      <div class="border-t border-gray-200 p-6">
        <div class="mb-4">
          <h4 class="text-lg font-semibold text-gray-900 mb-2 flex items-center">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Test Your AI Bot
          </h4>
          <p class="text-sm text-gray-600">Your bot has been created! Test it now to ensure it works as expected.</p>
        </div>

        <!-- Import and use the testing panel -->
        {#await import('./BotTestingPanel.svelte') then { default: BotTestingPanel }}
          <BotTestingPanel botId={String($chatbotConfig.id)} className="border-0" />
        {:catch}
          <div class="text-center py-8">
            <p class="text-gray-500">Testing panel could not be loaded</p>
          </div>
        {/await}
      </div>
    {/if}
  </div>
</div>


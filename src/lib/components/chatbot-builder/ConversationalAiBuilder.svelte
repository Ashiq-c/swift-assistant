<script>
  // @ts-nocheck
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { chatbotConfig, updateConfig, saveConfig, buildMethod, activeSection } from '$lib/chatbot-builder-stores.js';
  import { fetchLanguages } from '$lib/api/languages.js';

  const dispatch = createEventDispatcher();

  // Conversational state
  let conversation = [];
  let currentMessage = '';
  let isTyping = false;
  let isGenerating = false;
  let currentQuestionIndex = 0;
  let userResponses = {};
  let isComplete = false;
  let error = '';
  let isSaving = false;
  let chatContainer;

  // Available options for suggestions
  let availableLanguages = [];

  // Final generated config
  let generatedConfig = null;

  // Quick reply suggestions
  let currentSuggestions = [];

  // Conversation flow - questions the AI assistant will ask
  const questions = [
    {
      id: 'welcome',
      text: "Hi! I'm your AI assistant, and I'm here to help you create the perfect chatbot. Let's start with the basics - what would you like your chatbot to help with? For example, are you creating it for education, customer support, or something else?",
      type: 'open',
      key: 'purpose'
    },
    {
      id: 'subject',
      text: "That sounds great! If this is for educational purposes, what subject or topic area will your chatbot focus on? (e.g., Math, Science, History, Language Arts, or something else)",
      type: 'open',
      key: 'subject',
      condition: (responses) => responses.purpose?.toLowerCase().includes('educat') || responses.purpose?.toLowerCase().includes('teach') || responses.purpose?.toLowerCase().includes('learn')
    },
    {
      id: 'audience',
      text: "Perfect! Who will be the main users of this chatbot? Are you targeting students, teachers, parents, or a general audience?",
      type: 'open',
      key: 'audience'
    },
    {
      id: 'gradeLevel',
      text: "What grade level or age group are you targeting? This helps me adjust the language and complexity appropriately.",
      type: 'open',
      key: 'gradeLevel'
    },
    {
      id: 'personality',
      text: "Now let's talk about personality! How would you like your chatbot to communicate? Should it be formal and professional, friendly and casual, encouraging and supportive, or something else?",
      type: 'open',
      key: 'tone'
    },
    {
      id: 'role',
      text: "What role should your chatbot play? For example: a helpful tutor, a knowledgeable expert, a friendly guide, a supportive mentor, or something else?",
      type: 'open',
      key: 'botRole'
    },
    {
      id: 'capabilities',
      text: "What special capabilities would you like your chatbot to have? I can enable features like:\n\n• Web search for current information\n• File upload and analysis\n• Image processing and vision\n• Image creation\n• Drawing tools\n• Canvas editing\n\nJust tell me which ones sound useful for your chatbot!",
      type: 'open',
      key: 'capabilities'
    },
    {
      id: 'language',
      text: "What language should your chatbot primarily use? And would you like it to support any additional languages?",
      type: 'open',
      key: 'languages'
    },
    {
      id: 'final',
      text: "Excellent! I have all the information I need. Let me create your chatbot configuration now...",
      type: 'final',
      key: 'complete'
    }
  ];

  onMount(async () => {
    // Load available languages
    try {
      availableLanguages = await fetchLanguages();
    } catch (e) {
      console.warn('Failed to load languages:', e);
    }

    // Start the conversation
    startConversation();
  });

  function startConversation() {
    conversation = [];
    currentQuestionIndex = 0;
    userResponses = {};
    isComplete = false;
    
    // Add welcome message
    addBotMessage(questions[0].text);

    // Set initial suggestions
    updateSuggestions(questions[0]);
  }

  function addBotMessage(text, delay = 1000) {
    isTyping = true;
    
    setTimeout(() => {
      conversation = [...conversation, {
        type: 'bot',
        text: text,
        timestamp: new Date()
      }];
      isTyping = false;
      scrollToBottom();
    }, delay);
  }

  function addUserMessage(text) {
    conversation = [...conversation, {
      type: 'user',
      text: text,
      timestamp: new Date()
    }];
    scrollToBottom();
  }

  function scrollToBottom() {
    setTimeout(() => {
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }

  async function handleUserResponse() {
    if (!currentMessage.trim()) return;

    const userText = currentMessage.trim();
    addUserMessage(userText);

    // Store the response
    const currentQuestion = questions[currentQuestionIndex];
    userResponses[currentQuestion.key] = userText;

    console.log(`Question ${currentQuestionIndex}: ${currentQuestion.key} = ${userText}`);
    console.log('All responses so far:', userResponses);

    // Clear input and suggestions
    currentMessage = '';
    currentSuggestions = [];

    // Process the response and move to next question
    await processResponse(userText, currentQuestion);
  }

  async function processResponse(userText, question) {
    console.log(`Processing response for question ${currentQuestionIndex}: ${question.key}`);

    // Add contextual acknowledgment based on the response
    let acknowledgment = await getAcknowledgment(userText, question);
    if (acknowledgment) {
      addBotMessage(acknowledgment, 800);
    }

    // Check if we need a follow-up question based on the response
    const followUpQuestion = await generateFollowUpQuestion(userText, question);
    if (followUpQuestion) {
      console.log('Generated follow-up question:', followUpQuestion);
      setTimeout(() => {
        addBotMessage(followUpQuestion.text);
        // Store this as a dynamic question
        userResponses[followUpQuestion.key] = ''; // Will be filled by next response
        return; // Don't move to next predefined question yet
      }, acknowledgment ? 1500 : 800);
      return;
    }

    // Move to next question
    currentQuestionIndex++;
    console.log(`Moving to question index: ${currentQuestionIndex} of ${questions.length}`);

    // Check if we have more questions
    if (currentQuestionIndex < questions.length) {
      const nextQuestion = questions[currentQuestionIndex];
      console.log(`Next question: ${nextQuestion.key} - ${nextQuestion.text.slice(0, 50)}...`);

      // Check condition if exists
      if (nextQuestion.condition && !nextQuestion.condition(userResponses)) {
        console.log('Skipping question due to condition');
        // Skip this question and move to next
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
          setTimeout(() => {
            addBotMessage(questions[currentQuestionIndex].text);
            updateSuggestions(questions[currentQuestionIndex]);
          }, acknowledgment ? 1500 : 800);
        } else {
          console.log('No more questions after skip, generating chatbot');
          setTimeout(() => generateChatbot(), acknowledgment ? 1500 : 800);
        }
      } else {
        // Check if this is the final question
        if (nextQuestion.type === 'final') {
          // This is the final message, generate chatbot immediately
          setTimeout(() => {
            addBotMessage(nextQuestion.text);
            // Generate chatbot after showing the final message
            setTimeout(() => generateChatbot(), 1500);
          }, acknowledgment ? 1500 : 800);
        } else {
          // Ask next question with appropriate delay
          setTimeout(() => {
            addBotMessage(nextQuestion.text);
            updateSuggestions(nextQuestion);
          }, acknowledgment ? 1500 : 800);
        }
      }
    } else {
      // All questions answered, generate the chatbot
      console.log('All questions completed, generating chatbot');
      setTimeout(() => generateChatbot(), acknowledgment ? 1500 : 800);
    }
  }

  async function generateFollowUpQuestion(userText, question) {
    // Disable follow-up questions for now to avoid breaking the flow
    // TODO: Re-enable once the main flow is working properly
    return null;
  }

  async function getAcknowledgment(userText, question) {
    // Use pattern-based acknowledgments for reliability
    // TODO: Re-enable AI acknowledgments once the main flow is stable
    return getFallbackAcknowledgment(userText, question);
  }



  function getFallbackAcknowledgment(userText, question) {
    const text = userText.toLowerCase();

    switch (question.key) {
      case 'purpose':
        if (text.includes('educat') || text.includes('teach') || text.includes('learn')) {
          return "Education - excellent choice! Educational chatbots can be incredibly helpful for learning.";
        } else if (text.includes('support') || text.includes('help')) {
          return "Support and assistance - that's a great use case for chatbots!";
        } else {
          return "Interesting! That sounds like a valuable application.";
        }

      case 'subject':
        return `${userText} - that's a fascinating subject! I'll make sure your chatbot is well-suited for that area.`;

      case 'audience':
        return "Perfect! Understanding your audience helps me tailor the chatbot's communication style.";

      case 'gradeLevel':
        return "Got it! I'll adjust the complexity and language appropriately for that level.";

      case 'tone':
        return "Excellent choice for the communication style! That will really shape how users interact with your bot.";

      case 'botRole':
        return "That's a great role for your chatbot! It will help define its personality and approach.";

      case 'capabilities':
        return "Those capabilities will make your chatbot much more powerful and useful!";

      case 'languages':
        return "Language support noted! I'll configure that for you.";

      default:
        return "Great! I've noted that information.";
    }
  }

  async function generateChatbot() {
    isGenerating = true;
    addBotMessage("Perfect! Let me analyze your responses and create your chatbot...", 500);

    try {
      console.log('Starting chatbot generation with responses:', userResponses);

      // Create the configuration based on responses
      const config = await createConfigFromResponses();
      console.log('Generated config:', config);

      if (!config) {
        throw new Error('Configuration generation returned null');
      }

      generatedConfig = config;

      // Show success message
      addBotMessage(`Great! I've created your chatbot configuration. Your bot will be named "${config.name}" and will help with ${config.description.toLowerCase()}. Would you like me to create the bot now?`, 1000);

      isComplete = true;
      currentSuggestions = []; // Clear suggestions when complete
    } catch (e) {
      console.error('Chatbot generation error:', e);
      error = e.message || 'Failed to generate chatbot configuration';
      addBotMessage("I'm sorry, there was an error creating your chatbot configuration. Let me try a different approach...", 1000);

      // Try fallback generation
      try {
        const fallbackConfig = await createBasicConfigFromResponses();
        if (fallbackConfig) {
          generatedConfig = fallbackConfig;
          addBotMessage(`I've created your chatbot using a simplified approach. Your bot "${fallbackConfig.name}" is ready! Would you like me to create it?`, 1500);
          isComplete = true;
          currentSuggestions = [];
        }
      } catch (fallbackError) {
        console.error('Fallback generation also failed:', fallbackError);
        addBotMessage("I'm having trouble generating your chatbot. Please try starting over or contact support.", 1000);
      }
    } finally {
      isGenerating = false;
    }
  }

  async function createConfigFromResponses() {
    console.log('Creating config from responses:', userResponses);

    // Use the intelligent pattern matching (no external APIs needed)
    try {
      const basicConfig = await createBasicConfigFromResponses();
      console.log('Config created successfully:', basicConfig);
      return basicConfig;
    } catch (basicError) {
      console.error('Config creation failed:', basicError);
      // Last resort: create minimal config
      return createMinimalConfig();
    }
  }

  function createMinimalConfig() {
    console.log('Creating minimal fallback config');
    return {
      name: 'AI Assistant',
      description: 'AI Assistant',
      botRole: 'helpful assistant',
      instructions: 'You are a helpful AI assistant.',
      greetingMessage: 'Hello! How can I help you today?',
      gradeLevel: '',
      primaryLanguage: '1',
      secondaryLanguages: [],
      conversationStarters: ['How can you help me?', 'What can you do?', 'Tell me about yourself'],
      capabilities: {
        webSearch: false,
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
  }



  async function createBasicConfigFromResponses() {
    // Enhanced fallback parsing with intelligent pattern matching
    const responses = userResponses;

    // Smart capability parsing
    const capabilitiesText = (responses.capabilities || '').toLowerCase();
    const capabilities = {
      webSearch: /web|search|internet|online|current|news|real.?time/.test(capabilitiesText),
      fileUpload: /file|upload|document|pdf|analyze|attachment/.test(capabilitiesText),
      imageUpload: /image|photo|picture|vision|visual|see/.test(capabilitiesText),
      imageCreation: /create|generate|make|draw.*image|image.*create/.test(capabilitiesText),
      drawingTools: /draw|sketch|paint|canvas|art/.test(capabilitiesText),
      canvasEdit: /canvas|edit|modify|change/.test(capabilitiesText)
    };

    // Smart language parsing
    const languageText = (responses.languages || 'english').toLowerCase();
    let primaryLanguage = '1'; // Default English
    let secondaryLanguages = [];

    if (availableLanguages.length > 0) {
      // Try to find primary language
      const primaryMatch = availableLanguages.find(lang =>
        languageText.includes(lang.name.toLowerCase()) ||
        (lang.code && languageText.includes(lang.code.toLowerCase()))
      );
      if (primaryMatch) {
        primaryLanguage = String(primaryMatch.id);
      }

      // Look for multiple language indicators
      if (/multiple|several|many|bilingual|multilingual/.test(languageText)) {
        // Add common secondary languages
        const commonSecondary = availableLanguages.filter(lang =>
          ['spanish', 'french', 'german', 'chinese'].includes(lang.name.toLowerCase())
        );
        secondaryLanguages = commonSecondary.slice(0, 2).map(lang => String(lang.id));
      }
    }

    // Smart name generation
    const purpose = responses.purpose || 'Assistant';
    const subject = responses.subject || '';
    let botName;

    if (subject && purpose) {
      if (purpose.toLowerCase().includes('educat')) {
        botName = `${subject} Tutor`;
      } else if (purpose.toLowerCase().includes('support')) {
        botName = `${subject} Support Bot`;
      } else {
        botName = `${subject} ${purpose}`;
      }
    } else if (subject) {
      botName = `${subject} Assistant`;
    } else {
      botName = purpose;
    }

    // Smart role inference
    let botRole = responses.botRole || 'helpful assistant';
    if (!responses.botRole) {
      if (purpose.toLowerCase().includes('educat') || purpose.toLowerCase().includes('teach')) {
        botRole = 'educational tutor';
      } else if (purpose.toLowerCase().includes('support')) {
        botRole = 'support specialist';
      } else if (subject) {
        botRole = `${subject} expert`;
      }
    }

    // Smart instruction generation
    const instructions = generateSmartInstructions(responses, botRole);

    // Smart greeting generation
    const greetingMessage = generateSmartGreeting(responses, botRole, subject);

    return {
      name: botName.slice(0, 100),
      description: responses.purpose || 'AI Assistant',
      botRole: botRole,
      instructions: instructions,
      greetingMessage: greetingMessage,
      gradeLevel: responses.gradeLevel || '',
      primaryLanguage: primaryLanguage,
      secondaryLanguages: secondaryLanguages,
      conversationStarters: generateConversationStarters(),
      capabilities: capabilities,
      sessionControl: {
        duration: 0,
        pauseResume: false
      }
    };
  }

  function generateSmartInstructions(responses, botRole) {
    let instructions = `You are a ${botRole}`;

    if (responses.subject) {
      instructions += ` specializing in ${responses.subject}`;
    }

    if (responses.audience) {
      instructions += `. Your primary audience is ${responses.audience}`;
    }

    if (responses.gradeLevel) {
      instructions += ` at ${responses.gradeLevel} level`;
    }

    if (responses.tone) {
      instructions += `. Your communication style should be ${responses.tone}`;
    } else {
      instructions += '. Your communication style should be friendly and professional';
    }

    instructions += '. Always be helpful, accurate, and encouraging in your responses.';

    return instructions;
  }

  function generateSmartGreeting(responses, botRole, subject) {
    const greetings = [
      `Hello! I'm your ${botRole}${subject ? ` for ${subject}` : ''}. How can I help you today?`,
      `Hi there! I'm here to help you${subject ? ` with ${subject}` : ''}. What would you like to know?`,
      `Welcome! I'm your ${botRole}${subject ? ` specializing in ${subject}` : ''}. What can I assist you with?`
    ];

    // Choose greeting based on tone
    const tone = responses.tone?.toLowerCase() || '';
    if (tone.includes('casual') || tone.includes('friendly')) {
      return greetings[0];
    } else if (tone.includes('professional') || tone.includes('formal')) {
      return greetings[2];
    } else {
      return greetings[1];
    }
  }

  function generateConversationStarters() {
    const subject = userResponses.subject || '';
    const role = userResponses.botRole || 'assistant';
    
    const starters = [];
    
    if (subject) {
      starters.push(`Tell me about ${subject}`);
      starters.push(`How can you help me with ${subject}?`);
      starters.push(`What ${subject} topics do you know about?`);
    } else {
      starters.push(`What can you help me with?`);
      starters.push(`Tell me about your capabilities`);
      starters.push(`How do you work?`);
    }
    
    return starters;
  }

  async function createBot() {
    if (!generatedConfig) return;

    console.log('🚀 Creating bot with config:', generatedConfig);
    isSaving = true;
    addBotMessage("Creating your chatbot now...", 500);

    try {
      // Update the store with the generated config
      console.log('📝 Updating config store...');
      updateConfig(generatedConfig);

      // Save to backend
      console.log('💾 Saving to backend...');
      const result = await saveConfig();
      console.log('✅ Backend response:', result);

      if (result?.success) {
        addBotMessage("🎉 Success! Your chatbot has been created and is ready to use. You can now test it or switch to manual editing to make further adjustments.", 1000);

        // Switch to manual mode after creation
        setTimeout(() => {
          buildMethod.set('manual');
          activeSection.set('overview');
          dispatch('applied');
        }, 2000);
      } else {
        throw new Error(result?.error || 'Failed to create chatbot');
      }
    } catch (e) {
      console.error('❌ Error creating bot:', e);
      error = e.message || 'Failed to create chatbot';
      addBotMessage("I'm sorry, there was an error creating your chatbot. Please try again.", 1000);
    } finally {
      isSaving = false;
    }
  }

  function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleUserResponse();
    }
  }

  function restartConversation() {
    startConversation();
    generatedConfig = null;
    error = '';
  }

  async function updateSuggestions(question) {
    // Use contextual static suggestions (no external APIs needed)
    getStaticSuggestions(question);
  }



  function getStaticSuggestions(question) {
    switch (question.key) {
      case 'purpose':
        currentSuggestions = ['Education & Learning', 'Customer Support', 'Personal Assistant', 'Training & Onboarding'];
        break;
      case 'subject':
        // Make subject suggestions contextual based on purpose
        if (userResponses.purpose?.toLowerCase().includes('educat')) {
          currentSuggestions = ['Mathematics', 'Science', 'History', 'Language Arts', 'Computer Science', 'Art'];
        } else {
          currentSuggestions = ['Technology', 'Business', 'Healthcare', 'Finance', 'General Knowledge'];
        }
        break;
      case 'audience':
        currentSuggestions = ['Elementary Students', 'High School Students', 'College Students', 'Teachers', 'General Public'];
        break;
      case 'gradeLevel':
        currentSuggestions = ['K-2', '3-5', '6-8', '9-12', 'College Level', 'Adult Learning'];
        break;
      case 'tone':
        currentSuggestions = ['Friendly & Casual', 'Professional & Formal', 'Encouraging & Supportive', 'Playful & Fun'];
        break;
      case 'botRole':
        // Make role suggestions contextual
        if (userResponses.purpose?.toLowerCase().includes('educat')) {
          currentSuggestions = ['Helpful Tutor', 'Study Buddy', 'Learning Coach', 'Subject Expert'];
        } else {
          currentSuggestions = ['Helpful Assistant', 'Expert Advisor', 'Friendly Guide', 'Problem Solver'];
        }
        break;
      case 'capabilities':
        currentSuggestions = ['Web Search', 'File Analysis', 'Image Processing', 'All Capabilities', 'Basic Chat Only'];
        break;
      case 'languages':
        currentSuggestions = ['English Only', 'English + Spanish', 'Multiple Languages', 'Other Language'];
        break;
      default:
        currentSuggestions = [];
    }
  }

  function selectSuggestion(suggestion) {
    currentMessage = suggestion;
    handleUserResponse();
  }
</script>

<div class="h-full flex flex-col bg-white">
  <!-- Header -->
  <div class="border-b border-gray-200 p-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold text-gray-900">AI Chatbot Builder</h2>
        <p class="text-sm text-gray-600">Let our AI assistant guide you through creating your perfect chatbot</p>
      </div>
      <button
        class="text-sm text-blue-600 hover:text-blue-700"
        on:click={restartConversation}
      >
        Start Over
      </button>
    </div>
  </div>

  <!-- Chat Container -->
  <div class="flex-1 overflow-y-auto p-4" bind:this={chatContainer}>
    <div class="max-w-3xl mx-auto space-y-4">
      {#each conversation as message}
        <div class="flex {message.type === 'user' ? 'justify-end' : 'justify-start'}">
          <div class="max-w-xs lg:max-w-md">
            {#if message.type === 'bot'}
              <div class="flex items-start space-x-2">
                <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div class="bg-gray-100 rounded-lg px-4 py-2">
                  <p class="text-sm text-gray-800 whitespace-pre-wrap">{message.text}</p>
                </div>
              </div>
            {:else}
              <div class="bg-blue-600 text-white rounded-lg px-4 py-2">
                <p class="text-sm whitespace-pre-wrap">{message.text}</p>
              </div>
            {/if}
          </div>
        </div>
      {/each}

      <!-- Typing Indicator -->
      {#if isTyping}
        <div class="flex justify-start">
          <div class="flex items-start space-x-2">
            <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div class="bg-gray-100 rounded-lg px-4 py-2">
              <div class="flex space-x-1">
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Input Area -->
  <div class="border-t border-gray-200 p-4">
    <div class="max-w-3xl mx-auto">
      {#if isComplete && generatedConfig}
        <!-- Action Buttons -->
        <div class="flex items-center justify-center space-x-4">
          <button
            class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            on:click={createBot}
            disabled={isSaving}
          >
            {isSaving ? 'Creating Bot...' : 'Yes, Create My Bot!'}
          </button>
          <button
            class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            on:click={restartConversation}
          >
            Start Over
          </button>
        </div>
      {:else if !isGenerating}
        <!-- Quick Reply Suggestions -->
        {#if currentSuggestions.length > 0 && !isTyping}
          <div class="mb-4">
            <p class="text-sm text-gray-600 mb-2">Quick replies:</p>
            <div class="flex flex-wrap gap-2">
              {#each currentSuggestions as suggestion}
                <button
                  class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                  on:click={() => selectSuggestion(suggestion)}
                >
                  {suggestion}
                </button>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Message Input -->
        <div class="flex space-x-2">
          <input
            type="text"
            class="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Type your response or use quick replies above..."
            bind:value={currentMessage}
            on:keypress={handleKeyPress}
            disabled={isTyping}
          />
          <button
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            on:click={handleUserResponse}
            disabled={!currentMessage.trim() || isTyping}
          >
            Send
          </button>
        </div>
      {/if}

      <!-- Error Display -->
      {#if error}
        <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-center">
            <svg class="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="text-sm text-red-700">{error}</span>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<script>
  // @ts-nocheck
  import { chatbotConfig } from '$lib/chatbot-builder-stores.js';
  import { PERSONAS } from '$lib/chatbot-builder-types.js';
  import { createChatViaAPI } from '$lib/apis/chats';
  import { streamChatMessage as sseStream } from '$lib/api/streamChatMessage';
  import { getChatbot } from '$lib/api/chatbots.js';
  import { onMount, tick, onDestroy, setContext } from 'svelte';
  import Suggestions from '$lib/components/chat/Suggestions.svelte';
  import Plus from '$lib/components/icons/Plus.svelte';
  // Temporarily disable full chat MessageInput in preview to avoid blocking overlays
  // import MessageInput from '$lib/components/chat/MessageInput.svelte';
  import i18n from '$lib/i18n';

  export let botName = "Your Chatbot";
  export let className = "";
  export let activeTab = 'manual';
  export let persona = null;
  let isActive = false;
  let message = '';
  let messages = [];
  let chatId = null;
  let streamRef = null;
  let savedBot = null; // loaded from backend when a saved bot id exists
  // MessageInput bindings/state for 1:1 chat controls
  let files = [];
  let autoScroll = false;
  let selectedToolIds = [];
  let selectedFilterIds = [];
  let imageGenerationEnabled = false;
  let codeInterpreterEnabled = false;
  let webSearchEnabled = false;
  let showCommands = false;
  // Provide i18n context for descendants (MessageInput expects it)
  setContext('i18n', i18n);

  // Use simple input in preview for now; avoids global listeners/overlays from MessageInput
  let inputWrapEl;

  // Local dropdown for capability toggles (like chat screen's + menu)
  let showCapMenu = false;
  let menuBtnEl;
  let menuEl;
  let fileInputEl;
  function openFilePicker() { fileInputEl?.click(); }
  function onFilesSelected(e) {
    const picked = Array.from(e?.target?.files || []);
    if (!picked.length) return;
    picked.forEach((file) => {
      if (file.type && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result || '';
          files = [...files, { type: 'image', url: String(dataUrl), name: file.name, size: file.size }];
        };
        reader.readAsDataURL(file);
      } else {
        // Non-image: keep minimal info so we can render a pill
        files = [...files, { type: 'file', name: file.name, size: file.size }];
      }
    });
    // Close after picking, similar to ChatGPT behavior
    showCapMenu = false;
  }

  function removeFileAt(idx) {
    if (idx < 0 || idx >= files.length) return;
    files = [...files.slice(0, idx), ...files.slice(idx + 1)];
  }
  onMount(() => {
    const onDocClick = (e) => {
      if (!showCapMenu) return;
      const t = e.target;
      if (menuEl && menuEl.contains(t)) return;
      if (menuBtnEl && menuBtnEl.contains(t)) return;
      showCapMenu = false;
    };
    const onKey = (e) => { if (e.key === 'Escape') showCapMenu = false; };
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  });


  let streamError = null;

  // Use current chatbot id from builder config, if saved
  $: currentChatbotId = $chatbotConfig?.id || '';
  $: if (currentChatbotId) {
    (async () => {
      try {
        savedBot = await getChatbot(currentChatbotId);
      } catch (e) {
        console.warn('Failed to load saved bot for preview', e);
        savedBot = null;
      }
    })();
  } else {
    savedBot = null;
  }

  async function ensureChat() {
    if (chatId) return chatId;
    const res = await createChatViaAPI('', currentChatbotId || undefined);
    if (res && res.success && res.chat) {
      chatId = res.chat;
      return chatId;
    } else {
      throw new Error('Failed to create chat');
    }
  }

  function startStreaming(prompt, personaKey, previewCfg) {
    // Close previous stream if any
    if (streamRef && typeof streamRef.close === 'function') {
      try { streamRef.close(); } catch {}
    }
    streamError = null;


    streamRef = sseStream({
      chatId,
      prompt,
      persona: personaKey || undefined,
      previewConfig: previewCfg || undefined,
      onChunk: (data) => {
        let token = '';
        try {
          const parsed = JSON.parse(data);
          token = parsed?.token ?? '';
        } catch {
          token = data;
        }
        if (!token) return;
        // Append to last bot message
        const last = messages[messages.length - 1];
        if (last && last.sender === 'bot') {
          last.content += token;
          messages = [...messages.slice(0, -1), last];
        }
      },
      onDone: () => {
        streamRef = null;
      },
      onError: (err) => {
        try {
          if (err?.status || err?.statusText) {
            streamError = `${err.status || ''} ${err.statusText || ''}`.trim();
          } else if (typeof err === 'string') {
            streamError = err;
          } else if (err && typeof err === 'object') {
            streamError = err.error || err.message || JSON.stringify(err);
          } else {
            streamError = 'Streaming error occurred';
          }
        } catch {
          streamError = 'Streaming error occurred';
        }
        console.error('Preview stream error', err);
        streamRef = null;
      }
    });
  }

  function compactPreviewConfig(cfg) {
    try {
      const truncate = (s, n) => (typeof s === 'string' && s.length > n ? s.slice(0, n) + '…' : (s || ''));
      return {
        name: truncate(cfg?.name, 80),
        botRole: truncate(cfg?.botRole || cfg?.bot_role, 160),
        instructions: truncate(cfg?.instructions, 1200),
        greetingMessage: truncate(cfg?.greetingMessage, 160),
        gradeLevel: truncate(cfg?.gradeLevel, 40),
        primaryLanguage: cfg?.primaryLanguage ?? null,
        secondaryLanguages: Array.isArray(cfg?.secondaryLanguages) ? cfg.secondaryLanguages.slice(0, 3) : [],
        capabilities: cfg?.capabilities ? {
          webSearch: !!cfg.capabilities.webSearch,
          fileUpload: !!cfg.capabilities.fileUpload,
          imageUpload: !!cfg.capabilities.imageUpload,
          imageCreation: !!(cfg.capabilities.imageCreation || cfg.capabilities.createImages),
          drawingTools: !!cfg.capabilities.drawingTools,
          canvasEdit: !!cfg.capabilities.canvasEdit
        } : undefined,
        // Keep rubric very compact
        gradingRubric: typeof cfg?.gradingRubric === 'string' ? truncate(cfg.gradingRubric, 240) : {
          beginning: truncate(cfg?.gradingRubric?.beginning, 160),
          emerging: truncate(cfg?.gradingRubric?.emerging, 160)
        }
      };
    } catch {
      return undefined;
    }
  }

  // Capability toggle keys for preview UI (normalized)
  const CAP_TOGGLE_KEYS = ['webSearch', 'fileUpload', 'imageUpload', 'imageCreation', 'drawingTools', 'canvasEdit'];
  // Local override state; when undefined, fall back to builder config
  let capState = {};
  function isCapActive(key) {
    const fromState = capState?.[key];
    const fromCfg = $chatbotConfig?.capabilities?.[key];
    return typeof fromState === 'boolean' ? fromState : !!fromCfg;
  }
  function toggleCap(key) {
    capState = { ...capState, [key]: !isCapActive(key) };
  }

  function previewConfigWithUIOverrides(cfg) {
    try {
      const base = JSON.parse(JSON.stringify(cfg || {}));
      base.capabilities = { ...(base?.capabilities || {}) };
      for (const key of CAP_TOGGLE_KEYS) {
        const val = !!isCapActive(key);
        base.capabilities[key] = val;
        if (key === 'imageCreation') {
          // keep alias in sync if backend expects createImages
          base.capabilities.createImages = val;
        }
      }
      return compactPreviewConfig(base);
    } catch {
      return compactPreviewConfig(cfg);
    }
  }

  // Map for displaying enabled capabilities (normalize createImages/imageCreation)
  const CAP_LABELS = {
    webSearch: 'Web Search',
    fileUpload: 'File Upload',
    imageUpload: 'Image Upload',
    imageCreation: 'Image Creation',
    createImages: 'Image Creation',
    drawingTools: 'Drawing Tools',
    canvasEdit: 'Canvas Edit'
  };
  function getCapIconPath(key) {
    const icons = {
      webSearch: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
      fileUpload: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
      imageUpload: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
      imageCreation: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5v12a2 2 0 002 2 2 2 0 002-2V3z',
      drawingTools: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
      canvasEdit: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
    };
    return icons[key] || icons.webSearch;
  }

  function mapSavedToPreviewCfg(bot) {
    try {
      return {
        name: bot?.name || '',
        botRole: bot?.bot_role || '',
        instructions: bot?.instructions || '',
        greetingMessage: bot?.greeting_message || '',
        gradeLevel: bot?.grade_level || '',
        primaryLanguage: bot?.primary_language?.id?.toString?.() || bot?.primary_language_id?.toString?.() || '',
        secondaryLanguages: Array.isArray(bot?.secondary_languages) ? bot.secondary_languages.map(l => typeof l === 'object' ? String(l.id) : String(l)) : (Array.isArray(bot?.secondary_language_ids) ? bot.secondary_language_ids.map(String) : []),
        capabilities: {
          webSearch: !!bot?.real_time_web_search,
          fileUpload: !!bot?.file_upload_analysis,
          imageUpload: !!bot?.image_upload_gpt_vision,
          imageCreation: !!bot?.create_images,
          drawingTools: !!bot?.drawing_tools,
          canvasEdit: !!bot?.canvas_edit_modify,
        },
        conversationStarters: Array.isArray(bot?.conversation_starters) ? bot.conversation_starters.map(s => s?.text || String(s)) : [],
        gradingRubric: bot?.grading_rubric || ''
      };
    } catch {
      return undefined;
    }
  }

  $: displayCfg = savedBot ? mapSavedToPreviewCfg(savedBot) : $chatbotConfig;

  function getEnabledCaps(cfg) {
    const caps = (cfg && cfg.capabilities) ? cfg.capabilities : {};
    const keys = Object.keys(caps).filter((k) => !!caps[k]);
    const normalized = Array.from(new Set(keys.map((k) => (k === 'createImages' ? 'imageCreation' : k))));
    return normalized.map((k) => ({ key: k, label: CAP_LABELS[k] || k }));
  }
  function startersToSuggestions(list) {
    return (Array.isArray(list) ? list : []).map((s, idx) => ({ id: `starter-${idx}`, content: s }));
  }

  function pickStarter(starter) {
    if (!starter) return;
    message = starter;
    sendMessage();
  }

  // Preview session controls
  let sessionPaused = false;
  function togglePause() { sessionPaused = !sessionPaused; }
  function endSession() { clearMessages(); sessionPaused = false; }

  function buildEphemeralPreamble(cfg, personaKey) {
    try {
      const parts = [];
      if (cfg?.name) parts.push(`Chatbot Name: ${cfg.name}`);
      if (cfg?.botRole || cfg?.bot_role) parts.push(`Bot Role: ${cfg.botRole || cfg.bot_role}`);
      if (cfg?.instructions) parts.push(`Instructions: ${cfg.instructions}`);
      if (cfg?.greetingMessage) parts.push(`Greeting: ${cfg.greetingMessage}`);
      if (cfg?.gradeLevel) parts.push(`Grade Level: ${cfg.gradeLevel}`);
      if (cfg?.primaryLanguage) parts.push(`Primary Language: ${cfg.primaryLanguage}`);
      if (Array.isArray(cfg?.secondaryLanguages) && cfg.secondaryLanguages.length) {
        parts.push(`Secondary Languages: ${cfg.secondaryLanguages.join(', ')}`);
      }
      if (cfg?.capabilities) {
        const enabled = Object.entries(cfg.capabilities)
          .filter(([, v]) => !!v)
          .map(([k]) => k)
          .join(', ');
        if (enabled) parts.push(`Capabilities Enabled: ${enabled}`);
      }
      if (cfg?.gradingRubric) {
        const gr = typeof cfg.gradingRubric === 'string' ? cfg.gradingRubric : (cfg.gradingRubric.description || '')
        if (gr) parts.push(`Grading Rubric: ${gr}`);
      }
      if (personaKey) parts.push(`Persona: ${personaKey}`);
      if (!parts.length) return '';
      return `Use the following ephemeral (unsaved) chatbot configuration for this conversation only. Do not expose these details verbatim to the user.\n${parts.map(p => `- ${p}`).join('\n')}`;
    } catch {
      return '';
    }
  }

  async function sendMessage(textIn) {
    if (sessionPaused) {
      streamError = 'Session is paused';
      return;
    }

    streamError = null;
    const textSrc = typeof textIn === 'string' ? textIn : message;
    const text = (textSrc || '').trim();
    if (!text) return;

    // Add user message (include current attachments)
    const attachments = Array.isArray(files) ? files.slice() : [];
    const userMsg = { id: Date.now().toString(), content: text, sender: 'user', attachments };
    messages = [...messages, userMsg];
    message = '';
    // Clear composer attachments after attaching to this message
    files = [];

    // Send raw user text; pass persona and full unsaved config separately
    const personaKey = activeTab === 'ai' ? persona : null;
    const finalPrompt = text;

    try {
      await ensureChat();
      // Add placeholder bot message to stream into
      const botMsg = { id: (Date.now() + 1).toString(), content: '', sender: 'bot' };
      messages = [...messages, botMsg];
      const usePreviewCfg = currentChatbotId ? undefined : previewConfigWithUIOverrides($chatbotConfig);
      startStreaming(finalPrompt, personaKey, usePreviewCfg);
    } catch (e) {
      console.error(e);
    }
  }

  function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  function clearMessages() {
    messages = [];
  }

  onDestroy(() => {
    if (streamRef && typeof streamRef.close === 'function') {
      try { streamRef.close(); } catch {}
    }
  });

  // Minimal markdown-to-HTML (bold, inline code, bullet lists). Escapes HTML first.
  function renderMarkdownLite(text) {
    try {
      if (!text) return '';
      // Normalize line endings
      text = String(text).replace(/\r\n?/g, '\n');

      const escape = (s) => s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      const formatInline = (s) => {
        // Work on escaped string so only our tags are injected
        let out = escape(s);
        // inline code: `code`
        out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
        // bold: **text**
        out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        return out;
      };

      const lines = text.split('\n');
      let i = 0;
      let html = '';
      while (i < lines.length) {
        const line = lines[i];
        if (/^\s*[-*]\s+/.test(line)) {
          // Collect consecutive bullet lines
          html += '<ul style="margin:0 0 8px 18px; padding:0;">';
          while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
            const item = lines[i].replace(/^\s*[-*]\s+/, '');
            html += `<li>${formatInline(item)}</li>`;
            i++;
          }
          html += '</ul>';
          continue;
        }
        // Empty line -> spacer
        if (/^\s*$/.test(line)) {
          html += '<div style="height:4px;"></div>';
          i++;
          continue;
        }
        html += `<p style="margin:0 0 8px 0;">${formatInline(line)}</p>`;
        i++;
      }
      return html;
    } catch (_) {
      return text;
    }
  }
</script>

<div class="shadow-sm {className}" style="width: 100%; max-width: 560px; height: auto; max-height: 70vh; opacity: 1; border-radius: 20px; border: 1px solid #EBEBEB; background: #FFFFFF;">
  <!-- Chatbot Header -->
  <div class="border-b border-gray-200 px-4 py-3" style="width: 100%; height: 58px; opacity: 1; border-top-left-radius: 19px; border-top-right-radius: 19px; background: linear-gradient(261.37deg, rgba(135, 206, 250, 0.1) 25.1%, rgba(104, 120, 182, 0.1) 76.25%); box-sizing: border-box;">
    <div class="flex items-center space-x-3">
      <!-- Chatbot Avatar -->
      <div class="w-10 h-10 rounded-full flex items-center justify-center" style="background: #E8E8E8;">
        <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>

      <!-- Chatbot Info -->
      <div class="flex-1">
        <h3 class="text-sm font-medium text-gray-900">{savedBot?.name || botName}</h3>
        <p class="text-xs text-gray-500">{savedBot?.bot_role || 'No Subject Selected'}</p>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center space-x-1">
        <button class="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zM12 13a1 1 0 110-2 1 1 0 010 2zM12 20a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>
    </div>
  </div>

  <!-- Preview Content -->
  <div style="width: 100%; height: auto; max-height: calc(70vh - 58px); opacity: 1; border-radius: 20px; background: #F9F9F9; padding: 16px; display: flex; flex-direction: column; box-sizing: border-box;">
    <!-- Messages Area -->
    <div style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 4px;">
      {#if streamError}
        <div role="alert" style="margin-bottom: 8px; background: #FEF2F2; color: #991B1B; border: 1px solid #FECACA; border-radius: 8px; padding: 8px 12px; font-size: 12px;">
          <strong style="margin-right:6px;">Error:</strong> {streamError}
        </div>
      {/if}
      {#if messages.length === 0}
        <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;">
          <h3 style="font-size: 24px; font-weight: 600; color: #6B7280; margin-bottom: 8px; text-align: center;">Test your bot</h3>
          <p style="font-size: 14px; color: #9CA3AF; text-align: center;">Start a conversation to test your bot</p>
          <div class="mx-auto w-full max-w-2xl font-primary mt-3">
            <div class="mx-2">
              <Suggestions
                suggestionPrompts={startersToSuggestions((displayCfg?.conversationStarters) || [])}
                inputValue={message}
                onSelect={({ data }) => {
                  message = data;

                }}
              />
            </div>
          </div>
        </div>
      {:else}
        {#each messages as m}
          <div class="w-full flex" style="justify-content: {m.sender === 'user' ? 'flex-end' : 'flex-start'};">
            <div style="max-width: 85%; padding: 10px 12px; border-radius: 12px; font-size: 14px; line-height: 1.4; color: #111827; background: {m.sender === 'user' ? '#FFFFFF' : '#EEF2FF'}; border: 1px solid #E5E7EB;">
              {@html renderMarkdownLite(m.content)}
              {#if m.attachments && m.attachments.length}
                <div style="margin-top:8px; display:flex; gap:8px; flex-wrap:wrap;">
                  {#each m.attachments as a}
                    {#if a.type === 'image'}
                      <img src={a.url} alt={a.name} style="width:96px; height:96px; object-fit:cover; border-radius:8px; border:1px solid #E5E7EB;" />
                    {:else}
                      <span style="display:inline-flex; align-items:center; gap:6px; padding:4px 8px; border:1px solid #E5E7EB; border-radius:999px; background:#FFFFFF; font-size:12px;">{a.name}</span>
                    {/if}
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        {/each}
      {/if}
    </div>

    {#if getEnabledCaps(displayCfg).length}
      <div style="display:flex; gap:6px; flex-wrap:wrap; margin:8px 0 6px 0;">
        {#each getEnabledCaps(displayCfg) as cap}
          <span title="Enabled capability"
            style="padding:6px 10px; border:1px solid #E5E7EB; border-radius:999px; background:#F9FAFB; color:#374151; font-size:12px; display:inline-flex; align-items:center; gap:6px;">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getCapIconPath(cap.key)} />
            </svg>
            {cap.label}
          </span>

        {/each}
      </div>
    {/if}

    {#if $chatbotConfig?.sessionControl}
      {#if $chatbotConfig.sessionControl.duration || $chatbotConfig.sessionControl.deadline || $chatbotConfig.sessionControl.pauseResume}
        <div style="display:flex; gap:6px; flex-wrap:wrap; margin:4px 0 8px 0;">
          {#if $chatbotConfig.sessionControl.duration}
            <span style="padding:4px 8px; border:1px solid #E5E7EB; border-radius:999px; background:#FFFFFF; color:#374151; font-size:12px;">Duration limit enabled</span>
          {/if}
          {#if $chatbotConfig.sessionControl.deadline}
            <span style="padding:4px 8px; border:1px solid #E5E7EB; border-radius:999px; background:#FFFFFF; color:#374151; font-size:12px;">Deadline enabled</span>
          {/if}
          {#if $chatbotConfig.sessionControl.pauseResume}
            <span style="padding:4px 8px; border:1px solid #E5E7EB; border-radius:999px; background:#FFFFFF; color:#374151; font-size:12px;">Pause/Resume enabled</span>
          {/if}
        </div>
      {/if}
      {#if $chatbotConfig.sessionControl.pauseResume}
        <div style="display:flex; justify-content:flex-end; gap:6px; margin-bottom:8px;">
          <button on:click={togglePause}


            style="padding:6px 10px; border:1px solid #E5E7EB; border-radius:999px; background:#F3F4F6; color:#374151; font-size:12px;">
            {sessionPaused ? 'Resume' : 'Pause'}
          </button>
          <button on:click={endSession}
            style="padding:6px 10px; border:1px solid #E5E7EB; border-radius:999px; background:#FEF2F2; color:#991B1B; font-size:12px;">
            End
          </button>
        </div>
      {/if}
    {/if}

    {#if files.length}
      <div style="display:flex; gap:8px; flex-wrap:wrap; margin:6px 4px 2px 4px;">
        {#each files as f, idx}
          {#if f.type === 'image'}
            <div style="position:relative; width:64px; height:64px; border-radius:8px; overflow:hidden; border:1px solid #E5E7EB; background:#FFFFFF;">
              <img src={f.url} alt={f.name} style="object-fit:cover; width:100%; height:100%;" />
              <button type="button" on:click={() => removeFileAt(idx)}
                style="position:absolute; top:2px; right:2px; width:18px; height:18px; border-radius:999px; background:#111827; color:#FFFFFF; font-size:12px; line-height:16px; text-align:center; border:none; cursor:pointer;">
                ×
              </button>
            </div>
          {:else}
            <div style="display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border:1px solid #E5E7EB; border-radius:999px; background:#FFFFFF; font-size:12px;">
              <svg class="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getCapIconPath('fileUpload')} />
              </svg>
              <span>{f.name}</span>
              <button type="button" on:click={() => removeFileAt(idx)} style="margin-left:4px; background:transparent; border:none; color:#6B7280; cursor:pointer;">×</button>
            </div>
          {/if}
        {/each}
      </div>
    {/if}



    <!-- Message Input (ported from chat) -->
    <div class="pb-2" bind:this={inputWrapEl} style="background: #F9F9F9; padding-top: 6px;">
      <div style="position: relative; display: flex; gap: 8px; align-items: center; margin-top: 6px;">
        <!-- Plus button opens capability dropdown, similar to chat screen -->
        <button
          type="button"
          aria-label="Open capabilities"
          bind:this={menuBtnEl}
          on:click|stopPropagation={() => (showCapMenu = !showCapMenu)}
          style="display:inline-flex; align-items:center; justify-content:center; width:36px; height:36px; border-radius:999px; border:1px solid #E5E7EB; background:#FFFFFF; color:#374151;"
        >
          <Plus class="w-4 h-4" />
        </button>

        <!-- Text input -->
        <input
          id="live-preview-input"
          type="text"
          placeholder="Type your message..."
          style="flex: 1; padding: 12px 16px; border: 1px solid #E5E7EB; border-radius: 24px; background: #FFFFFF; font-size: 14px; outline: none;"
          bind:value={message}
          on:keypress={(e) => e.key === 'Enter' && sendMessage(message)}
        />

        <!-- Send button -->
        <button
          on:click={() => sendMessage(message)}
          style="padding: 12px 20px; background: #6878B6; color: white; border: none; border-radius: 24px; font-size: 14px; font-weight: 500; cursor: pointer;"
        >
          Send
        </button>

        <!-- ChatGPT-like dropdown menu -->
        {#if showCapMenu}
          <div
            bind:this={menuEl}
            style="position:absolute; bottom: 46px; left: 0; background:#FFFFFF; border:1px solid #E5E7EB; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); padding: 8px; min-width: 260px; z-index: 10;"
            role="menu"
            aria-label="Composer actions"
          >
            <!-- Hidden file input for uploads -->
            <input bind:this={fileInputEl} type="file" multiple style="display:none" on:change={onFilesSelected} />

            <div style="font-size:11px; letter-spacing:0.02em; color:#6B7280; padding:6px 8px; text-transform:uppercase;">Quick actions</div>
            <button type="button" on:click|stopPropagation={openFilePicker}
              style="width:100%; display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:8px; cursor:pointer; background:#FFFFFF; color:#111827; border:none; text-align:left;">
              <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getCapIconPath('fileUpload')} />
              </svg>
              <span style="font-size:13px;">Upload files</span>
            </button>

            <div style="height:8px;"></div>
            <div style="font-size:11px; letter-spacing:0.02em; color:#6B7280; padding:6px 8px; text-transform:uppercase;">Capabilities</div>

            <div style="max-height: 260px; overflow:auto; padding:2px 0;">
              {#each CAP_TOGGLE_KEYS as key}
                <label style="width:100%; display:flex; align-items:center; justify-content:space-between; gap:10px; padding:8px 10px; border-radius:8px; cursor:pointer; background:#FFFFFF; color:#111827;">
                  <span style="display:flex; align-items:center; gap:10px;">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getCapIconPath(key)} />
                    </svg>
                    <span style="font-size:13px;">{CAP_LABELS[key] || key}</span>
                  </span>
                  <input type="checkbox" checked={isCapActive(key)} on:change|stopPropagation={() => toggleCap(key)} />
                </label>
              {/each}
            </div>
          </div>
        {/if}
      </div>

    </div>
  </div>
</div>

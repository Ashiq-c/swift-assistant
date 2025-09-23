<script>
  // @ts-nocheck
  import { createEventDispatcher, onDestroy } from 'svelte';
  import { chatbotConfig, updateConfig, buildMethod, activeSection, saveConfig } from '$lib/chatbot-builder-stores.js';
  import { createChatViaAPI } from '$lib/apis/chats';
  import { fetchLanguages } from '$lib/api/languages.js';
  import { streamChatMessage as sseStream } from '$lib/api/streamChatMessage';

  export let initialPrompt = '';

  const dispatch = createEventDispatcher();

  let chatId = null;
  let isGenerating = false;
  let error = '';
  let streamRef = null;
  let isSaving = false;

  // Simple questionnaire
  let q = {
    purpose: '',
    audience: '',
    gradeLevel: '',
    tone: '',
    languages: { primary: '', secondary: [] },
    capabilities: {
      webSearch: true,
      fileUpload: false,
      imageUpload: false,
      imageCreation: false,
      drawingTools: false,
      canvasEdit: false
    }
  };

  // Streaming output buffer and parsed config
  let aiOutput = '';
  let parsedConfig = null;

  function buildGenerationPrompt() {
    const summary = `You are an expert assistant that converts requirements into a concise chatbot configuration JSON for a classroom assistant.\n` +
      `Output ONLY JSON. No backticks. No commentary. Use this exact schema (keys in camelCase):\n` +
      `{"name":"string","description":"string","botRole":"string","instructions":"string","greetingMessage":"string","gradeLevel":"string","primaryLanguage":"string","secondaryLanguages":["string"],"conversationStarters":["string"],"gradingRubric":{"beginning":"string","emerging":"string"},"capabilities":{"webSearch":bool,"fileUpload":bool,"imageUpload":bool,"imageCreation":bool,"drawingTools":bool,"canvasEdit":bool}}\n` +
      `Keep values short and practical.\n` +
      `Requirements:\n` +
      `- Purpose: ${q.purpose || 'N/A'}\n` +
      `- Audience: ${q.audience || 'N/A'}\n` +
      `- Grade level: ${q.gradeLevel || 'N/A'}\n` +
      `- Tone: ${q.tone || 'N/A'}\n` +
      `- Primary language: ${q.languages.primary || 'en'}\n` +
      `- Secondary languages: ${(q.languages.secondary||[]).join(', ') || 'none'}\n` +
      `- Capabilities: ${Object.entries(q.capabilities).filter(([,v])=>v).map(([k])=>k).join(', ') || 'none'}\n`;
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
      // Resolve languages to numeric string IDs expected by backend
      let resolvedPrimary = String(parsedConfig.primaryLanguage || '').trim();
      let resolvedSecondary = Array.isArray(parsedConfig.secondaryLanguages) ? parsedConfig.secondaryLanguages.slice() : [];
      let langs = null;
      try { langs = await fetchLanguages(); } catch {}

      // Primary language mapping
      if (!/^\d+$/.test(resolvedPrimary)) {
        if (langs && langs.length) {
          const matchByCode = langs.find(l => l.code === resolvedPrimary);
          const matchByName = langs.find(l => l.name.toLowerCase() === resolvedPrimary.toLowerCase());
          const matchStartsWith = langs.find(l => l.name.toLowerCase().startsWith(resolvedPrimary.toLowerCase()));
          const chosen = matchByCode || matchByName || matchStartsWith || langs[0];
          if (chosen?.code) resolvedPrimary = String(chosen.code);
        } else {
          resolvedPrimary = '1';
        }
      }

      // Secondary languages mapping
      if (Array.isArray(resolvedSecondary) && resolvedSecondary.length) {
        if (langs && langs.length) {
          resolvedSecondary = resolvedSecondary.map((val) => {
            const v = String(val || '').trim();
            if (/^\d+$/.test(v)) return v;
            const mByCode = langs.find(l => l.code === v);
            const mByName = langs.find(l => l.name.toLowerCase() === v.toLowerCase());
            const mStarts = langs.find(l => l.name.toLowerCase().startsWith(v.toLowerCase()));
            const found = mByCode || mByName || mStarts;
            return found?.code ? String(found.code) : null;
          }).filter(Boolean);
        } else {
          resolvedSecondary = [];
        }
      }

      updateConfig({
        name: parsedConfig.name || '',
        description: parsedConfig.description || '',
        botRole: parsedConfig.botRole || '',
        instructions: parsedConfig.instructions || '',
        greetingMessage: parsedConfig.greetingMessage || '',
        gradeLevel: parsedConfig.gradeLevel || '',
        primaryLanguage: resolvedPrimary,
        secondaryLanguages: resolvedSecondary,
        conversationStarters: Array.isArray(parsedConfig.conversationStarters) ? parsedConfig.conversationStarters : [],
        gradingRubric: parsedConfig.gradingRubric || { beginning: '', emerging: '' },
        capabilities: {
          webSearch: !!parsedConfig?.capabilities?.webSearch,
          fileUpload: !!parsedConfig?.capabilities?.fileUpload,
          imageUpload: !!parsedConfig?.capabilities?.imageUpload,
          imageCreation: !!parsedConfig?.capabilities?.imageCreation,
          drawingTools: !!parsedConfig?.capabilities?.drawingTools,
          canvasEdit: !!parsedConfig?.capabilities?.canvasEdit
        }
      });
      // Persist immediately so a bot is created
      isSaving = true;
      try {
        // microtask to ensure store update propagates before saving
        await Promise.resolve();
        const result = await saveConfig();
        if (!result?.success) {
          error = result?.error || 'Failed to create bot';
        }
      } finally {
        isSaving = false;
      }
      // Switch to manual mode for refinement
      buildMethod.set('manual');
      activeSection.set('overview');
      dispatch('applied');
    } catch (e) {
      error = e?.message || 'Failed to apply config';
    }
  }
</script>

<div class="w-full h-full min-h-0 flex justify-center p-4 md:p-6 overflow-auto">
  <div class="w-full max-w-3xl bg-white border border-gray-200 rounded-2xl max-h-[75vh] flex flex-col overflow-hidden relative p-6">
    <h3 class="text-xl font-semibold mb-4" style="color:#6878B6;">AI-Assisted Setup</h3>

    <div class="min-w-0 flex-1 min-h-0 overflow-y-auto pr-1 pt-1">


    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
      <div>
        <label for="ai-purpose" class="block text-xs text-gray-600 mb-1">Purpose</label>
        <textarea id="ai-purpose" class="w-full border rounded-lg p-2" rows="3" bind:value={q.purpose} placeholder="e.g., Help students practice math word problems" />
      </div>
      <div>
        <label for="ai-audience" class="block text-xs text-gray-600 mb-1">Audience</label>
        <input id="ai-audience" class="w-full border rounded-lg p-2" bind:value={q.audience} placeholder="e.g., 6th grade students" />
      </div>
      <div>
        <label for="ai-grade" class="block text-xs text-gray-600 mb-1">Grade level</label>
        <input id="ai-grade" class="w-full border rounded-lg p-2" bind:value={q.gradeLevel} placeholder="e.g., 6th Grade" />
      </div>
      <div>
        <label for="ai-tone" class="block text-xs text-gray-600 mb-1">Tone</label>
        <input id="ai-tone" class="w-full border rounded-lg p-2" bind:value={q.tone} placeholder="e.g., encouraging, warm, concise" />
      </div>
      <div>
        <label for="ai-primary-lang" class="block text-xs text-gray-600 mb-1">Primary language (code)</label>
        <input id="ai-primary-lang" class="w-full border rounded-lg p-2" bind:value={q.languages.primary} placeholder="e.g., en" />
      </div>
      <div>
        <label for="ai-secondary-lang" class="block text-xs text-gray-600 mb-1">Secondary languages (comma-separated codes)</label>
        <input id="ai-secondary-lang" class="w-full border rounded-lg p-2" on:change={(e)=>{q.languages.secondary=String(e.target.value).split(',').map(s=>s.trim()).filter(Boolean);}} placeholder="e.g., es, fr" />
      </div>
    </div>

    <fieldset class="mt-4">
      <legend class="block text-xs text-gray-600 mb-2">Capabilities</legend>
      <div class="flex flex-wrap gap-2">
        {#each Object.keys(q.capabilities) as key}
          <label class="inline-flex items-center gap-2 text-sm border rounded-full px-3 py-1">
            <input type="checkbox" bind:checked={q.capabilities[key]} />
            <span>{key}</span>
          </label>
        {/each}
      </div>
    </fieldset>

    <div class="mt-6 flex items-center gap-3">
      <button class="px-4 py-2 rounded-lg text-white disabled:opacity-50" style="background:#6878B6;" on:click={generateConfig} disabled={isGenerating}>
        {isGenerating ? 'Generating…' : 'Generate AI Config'}
      </button>
      {#if parsedConfig}
        <button class="px-4 py-2 rounded-lg border" on:click={applyToBuilder} disabled={isSaving}>{isSaving ? 'Creating…' : 'Apply & Create Bot'}</button>
      {/if}
      {#if streamRef}
        <button class="px-4 py-2 rounded-lg border" on:click={stopStream}>Stop</button>
      {/if}
    </div>

    {#if error}
      <div class="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">{error}</div>
    {/if}

    <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
      <div class="min-w-0 w-full">
        <h4 class="text-sm font-medium mb-2">AI Output (stream)</h4>
        <div class="h-48 w-full overflow-auto overflow-x-auto whitespace-pre-wrap break-words text-xs border rounded p-2 bg-gray-50 max-w-full">{aiOutput}</div>
      </div>
      <div class="min-w-0 w-full">
        <h4 class="text-sm font-medium mb-2">Parsed JSON</h4>
        <pre class="h-48 w-full overflow-auto overflow-x-auto text-xs border rounded p-2 bg-gray-50 max-w-full">{parsedConfig ? JSON.stringify(parsedConfig, null, 2) : '—'}</pre>
      </div>
    </div>
    </div>
  </div>
</div>


# AI Assistant Chatbot Builder

This is a complete copy of the chatbot builder functionality for the AI Assistant project.

## Structure

- `components/chatbot-builder/` - All chatbot builder components
  - `ChatbotBuilder.svelte` - Main builder page
  - `Sidebar.svelte` - Builder sidebar navigation
  - `OverviewSection.svelte` - Bot overview and basic info
  - `BehaviorKnowledgeSection.svelte` - Bot behavior and knowledge base
  - `LanguageControlSection.svelte` - Language settings
  - `GradingSection.svelte` - Grading rubric configuration
  - `BotCapabilitiesSection.svelte` - Bot capabilities and features
  - `SessionControlSection.svelte` - Session time and control settings
  - `LiveBotPreview.svelte` - Real-time bot preview and testing
- `routes/` - Svelte route definitions
- `lib/` - Utilities, stores, and types
  - `stores.js` - Svelte stores for state management
  - `types.js` - Type definitions and constants

## Features

### Complete Chatbot Builder
- **Overview Section**: Bot name, description, and avatar upload
- **Behavior & Knowledge**: Grade level, bot role, instructions, greeting, conversation starters
- **Language Control**: Primary and secondary language selection
- **Grading**: Rubric configuration for different performance levels
- **Bot Capabilities**: Enable/disable features like web search, file upload, image generation
- **Session Control**: Time limits, deadlines, pause/resume functionality
- **Live Preview**: Real-time testing with manual and AI-assisted modes

### Sidebar Navigation
- Clean, minimal sidebar with gradient background
- Navigation links for Builder, Bots, and Settings
- Responsive design

### State Management
- Svelte stores for reactive state management
- Automatic saving and dirty state tracking
- Error handling and validation

## Usage

### As a Standalone Route
The ai_assistant folder can be used as a standalone route in your Svelte application:

```javascript
// In your main app routes
import ChatbotBuilder from './ai_assistant/routes/+page.svelte';
```

### As Components
Import individual components as needed:

```javascript
import { ChatbotBuilder, Sidebar, OverviewSection } from './ai_assistant/index.js';
```

### Integration with Existing Project
To integrate with the main open-webui project:

1. Copy the ai_assistant folder to your desired location
2. Add a route in `src/routes/(app)/ai-assistant/+page.svelte`:
   ```svelte
   <script>
     import ChatbotBuilder from '../../../ai_assistant/components/chatbot-builder/ChatbotBuilder.svelte';
   </script>

   <ChatbotBuilder />
   ```

## Customization

The chatbot builder is fully customizable:
- Modify styles in individual components
- Add new sections by creating new components
- Extend the stores for additional functionality
- Customize the sidebar navigation

## Dependencies

This implementation uses:
- Svelte/SvelteKit
- Standard HTML/CSS (no external UI libraries)
- Tailwind CSS classes (can be replaced with custom CSS)

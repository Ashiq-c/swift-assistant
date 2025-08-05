<script>
  import { chatbotConfig } from '$lib/chatbot-builder-stores.js';
  import { PERSONAS } from '$lib/chatbot-builder-types.js';
  
  export let botName = "Your Chatbot";
  export let className = "";
  export let activeTab = 'manual';
  let selectedPersona = null;
  let isActive = false;
  let message = '';
  let messages = [];
  
  function sendMessage() {
    if (!message.trim()) return;
    
    const newMessage = {
      id: Date.now().toString(),
      content: message,
      sender: 'user'
    };
    
    messages = [...messages, newMessage];
    message = '';
    
    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: (Date.now() + 1).toString(),
        content: "Thank you for your message! I'm here to help you with your learning journey.",
        sender: 'bot'
      };
      messages = [...messages, botResponse];
    }, 1000);
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
</script>

<div class="shadow-sm {className}" style="width: 573px; height: 564px; opacity: 1; border-radius: 20px; border: 1px solid #EBEBEB; background: #FFFFFF;">
  <!-- Chatbot Header -->
  <div class="border-b border-gray-200 px-4 py-3" style="width: 572px; height: 58px; opacity: 1; border-top-left-radius: 19px; border-top-right-radius: 19px; background: linear-gradient(261.37deg, rgba(135, 206, 250, 0.1) 25.1%, rgba(104, 120, 182, 0.1) 76.25%); box-sizing: border-box;">
    <div class="flex items-center space-x-3">
      <!-- Chatbot Avatar -->
      <div class="w-10 h-10 rounded-full flex items-center justify-center" style="background: #E8E8E8;">
        <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>

      <!-- Chatbot Info -->
      <div class="flex-1">
        <h3 class="text-sm font-medium text-gray-900">{botName}</h3>
        <p class="text-xs text-gray-500">No Subject Selected</p>
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
  <div style="width: 572px; height: 504px; opacity: 1; border-radius: 20px; background: #F9F9F9; padding: 16px; display: flex; flex-direction: column; box-sizing: border-box;">
    <!-- Center Content -->
    <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;">
      <h3 style="font-size: 24px; font-weight: 600; color: #6B7280; margin-bottom: 8px; text-align: center;">Test your bot</h3>
      <p style="font-size: 14px; color: #9CA3AF; text-align: center;">Start a conversation to test your bot</p>
    </div>

    <!-- Message Input at Bottom -->
    <div style="display: flex; gap: 8px; align-items: center;">
      <input
        type="text"
        placeholder="Type your message..."
        style="flex: 1; padding: 12px 16px; border: 1px solid #E5E7EB; border-radius: 24px; background: #FFFFFF; font-size: 14px; outline: none;"
        bind:value={message}
        on:keypress={(e) => e.key === 'Enter' && sendMessage()}
      />
      <button
        on:click={sendMessage}
        style="padding: 12px 20px; background: #6878B6; color: white; border: none; border-radius: 24px; font-size: 14px; font-weight: 500; cursor: pointer;"
      >
        Send
      </button>
    </div>
  </div>
</div>

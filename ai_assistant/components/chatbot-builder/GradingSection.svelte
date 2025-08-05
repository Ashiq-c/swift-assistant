<script>
  import { chatbotConfig, updateConfig } from '../../lib/stores.js';
  
  export let data = {};
  
  function updateGradingRubric(level, value) {
    const rubric = { ...data.gradingRubric, [level]: value };
    updateConfig({ gradingRubric: rubric });
  }
</script>

<div class="space-y-6">
  <!-- Grading Rubric Introduction -->
  <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
    <div class="flex items-start">
      <svg class="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
      <div>
        <h4 class="text-sm font-medium text-yellow-800 mb-1">Grading Rubric</h4>
        <p class="text-sm text-yellow-700">
          Define criteria for different performance levels to help the bot provide consistent and meaningful feedback to students.
        </p>
      </div>
    </div>
  </div>

  <!-- Beginning Level -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
      Beginning Level Criteria
    </label>
    <textarea
      value={data.gradingRubric?.beginning || ''}
      on:input={(e) => updateGradingRubric('beginning', e.target.value)}
      placeholder="Describe what constitutes beginning level performance..."
      rows="4"
      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
    ></textarea>
    <p class="text-xs text-gray-500 mt-1">
      Define the characteristics and expectations for students at the beginning level
    </p>
  </div>

  <!-- Emerging Level -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
      Emerging Level Criteria
    </label>
    <textarea
      value={data.gradingRubric?.emerging || ''}
      on:input={(e) => updateGradingRubric('emerging', e.target.value)}
      placeholder="Describe what constitutes emerging level performance..."
      rows="4"
      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
    ></textarea>
    <p class="text-xs text-gray-500 mt-1">
      Define the characteristics and expectations for students at the emerging level
    </p>
  </div>

  <!-- Add More Levels Button -->
  <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
    <button
      type="button"
      class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
    >
      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      Add More Performance Levels
    </button>
    <p class="text-xs text-gray-500 mt-2">
      Add additional performance levels like Proficient, Advanced, etc.
    </p>
  </div>

  <!-- Grading Guidelines -->
  <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
    <h4 class="text-sm font-medium text-gray-800 mb-2">Grading Guidelines</h4>
    <ul class="text-sm text-gray-600 space-y-1">
      <li class="flex items-start">
        <span class="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
        Be specific and measurable in your criteria
      </li>
      <li class="flex items-start">
        <span class="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
        Use clear, student-friendly language
      </li>
      <li class="flex items-start">
        <span class="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
        Focus on learning objectives and skills
      </li>
      <li class="flex items-start">
        <span class="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
        Provide actionable feedback for improvement
      </li>
    </ul>
  </div>
</div>

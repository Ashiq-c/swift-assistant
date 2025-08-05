// Chatbot configuration types for AI Assistant

export const GRADE_LEVELS = [
  'Pre-K',
  'Kindergarten',
  '1st Grade',
  '2nd Grade',
  '3rd Grade',
  '4th Grade',
  '5th Grade',
  '6th Grade',
  '7th Grade',
  '8th Grade',
  '9th Grade',
  '10th Grade',
  '11th Grade',
  '12th Grade',
  'College',
  'Graduate'
];

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' }
];

export const PERSONAS = {
  friendly: {
    name: 'Friendly',
    description: 'Warm and approachable',
    color: 'bg-green-100 text-green-800'
  },
  professional: {
    name: 'Professional',
    description: 'Formal and structured',
    color: 'bg-blue-100 text-blue-800'
  },
  encouraging: {
    name: 'Encouraging',
    description: 'Supportive and motivating',
    color: 'bg-yellow-100 text-yellow-800'
  },
  patient: {
    name: 'Patient',
    description: 'Understanding and calm',
    color: 'bg-purple-100 text-purple-800'
  }
};

// Default chatbot configuration
export const defaultChatbotConfig = {
  id: '',
  name: '',
  description: '',
  image: null,
  curriculumSelected: false,
  gradeLevel: '',
  botRole: '',
  instructions: '',
  greetingMessage: '',
  conversationStarters: [],
  knowledgeBase: [],
  primaryLanguage: 'en',
  secondaryLanguages: [],
  gradingRubric: {
    beginning: '',
    emerging: ''
  },
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
    deadline: null,
    pauseResume: false
  }
};

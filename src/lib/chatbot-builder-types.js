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
  newTeacher: {
    name: 'New Teacher',
    description: 'Fresh perspective and enthusiasm',
    color: 'bg-purple-100 text-purple-800',
    icon: '👩‍🏫'
  },
  experiencedTeacher: {
    name: 'Experienced Teacher',
    description: 'Seasoned educator with deep knowledge',
    color: 'bg-blue-100 text-blue-800',
    icon: '👨‍🏫'
  },
  strugglingStudent: {
    name: 'Struggling Student',
    description: 'Needs extra support and guidance',
    color: 'bg-red-100 text-red-800',
    icon: '😟'
  },
  averageStudent: {
    name: 'Average Student',
    description: 'Typical learner with standard needs',
    color: 'bg-gray-100 text-gray-800',
    icon: '🙂'
  },
  advancedStudent: {
    name: 'Advanced Student',
    description: 'High achiever seeking challenges',
    color: 'bg-green-100 text-green-800',
    icon: '🤓'
  },
  offTaskStudent: {
    name: 'Off-Task Student',
    description: 'Easily distracted, needs engagement',
    color: 'bg-orange-100 text-orange-800',
    icon: '😴'
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
  primaryLanguage: '',
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

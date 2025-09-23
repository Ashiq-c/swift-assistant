# Chatbot API Test Data

This document provides comprehensive test data for testing the chatbot builder API integration.

## Test Scenarios

### 1. Math Tutor Bot (Complete Configuration)
**Purpose:** Test all API fields with a comprehensive mathematics tutor configuration.

```json
{
  "name": "Advanced Math Tutor Bot",
  "description": "Comprehensive mathematics tutor for high school and college students",
  "curriculumInfo": "Covers algebra, geometry, trigonometry, calculus, and statistics aligned with Common Core standards",
  "curriculumSelected": true,
  "gradeLevel": "High School",
  "botRole": "Mathematics Teaching Assistant",
  "instructions": "Provide step-by-step solutions, encourage critical thinking, and adapt explanations to student's level. Always show work and explain reasoning.",
  "greetingMessage": "Hello! I'm your personal math tutor. What mathematical concept would you like to explore today?",
  "primaryLanguage": "1",
  "secondaryLanguages": ["2", "3"],
  "conversationStarters": [
    "Help me solve quadratic equations",
    "Explain derivatives and their applications",
    "Show me how to graph functions",
    "What are the properties of triangles?",
    "How do I calculate probability?"
  ],
  "capabilities": {
    "webSearch": true,
    "fileUpload": true,
    "imageUpload": true,
    "imageCreation": true,
    "drawingTools": true,
    "canvasEdit": true
  },
  "sessionControl": {
    "duration": 90,
    "deadline": null,
    "pauseResume": true
  },
  "gradingRubric": {
    "beginning": "Student shows basic understanding but needs significant guidance. Can identify key concepts with help.",
    "emerging": "Student demonstrates growing understanding and can solve simple problems with minimal assistance."
  },
  "knowledgeFiles": [
    "algebra-handbook.pdf",
    "calculus-guide.docx", 
    "geometry-theorems.xlsx"
  ]
}
```

**Expected API Transformation:**
- `curriculumSelected` → `select_from_curriculum: "1"`
- `imageCreation` → `create_images: true`
- `pauseResume` → `pause_session: true`
- `gradingRubric` → `analysis_scales` array with Beginning/Emerging levels
- `knowledgeFiles` → `chatbot_files` array

### 2. Language Helper (Minimal Configuration)
**Purpose:** Test minimal required fields only.

```json
{
  "name": "Spanish Language Helper",
  "description": "Basic Spanish conversation practice",
  "primaryLanguage": "1",
  "conversationStarters": [
    "Help me practice Spanish greetings",
    "Teach me basic vocabulary"
  ],
  "capabilities": {
    "webSearch": false,
    "fileUpload": false,
    "imageUpload": false,
    "imageCreation": false,
    "drawingTools": false,
    "canvasEdit": false
  },
  "sessionControl": {
    "duration": 0,
    "deadline": null,
    "pauseResume": false
  },
  "gradingRubric": {
    "beginning": "Basic vocabulary recognition",
    "emerging": "Can form simple sentences"
  },
  "knowledgeFiles": []
}
```

**Expected API Transformation:**
- All capability fields should be `false`
- `pause_session: false`
- Empty `chatbot_files` array
- Default `analysis_scales` with Beginning/Proficient/Advanced levels

### 3. Science Lab Assistant (File-Heavy)
**Purpose:** Test multiple file uploads and complex configurations.

```json
{
  "name": "Chemistry Lab Assistant",
  "description": "Interactive chemistry tutor with lab safety and experiment guidance",
  "curriculumInfo": "High school chemistry curriculum including organic, inorganic, and physical chemistry",
  "curriculumSelected": true,
  "gradeLevel": "High School",
  "botRole": "Laboratory Teaching Assistant",
  "instructions": "Prioritize safety in all lab procedures. Explain chemical reactions step-by-step and help students understand molecular interactions.",
  "greetingMessage": "Welcome to the chemistry lab! I'm here to help you understand chemical concepts and ensure safe laboratory practices.",
  "primaryLanguage": "1",
  "secondaryLanguages": ["2"],
  "conversationStarters": [
    "Explain the periodic table trends",
    "How do I balance chemical equations?",
    "What safety precautions should I take?",
    "Help me understand molecular bonding",
    "Show me how to calculate molarity"
  ],
  "capabilities": {
    "webSearch": true,
    "fileUpload": true,
    "imageUpload": true,
    "imageCreation": true,
    "drawingTools": true,
    "canvasEdit": false
  },
  "sessionControl": {
    "duration": 120,
    "deadline": null,
    "pauseResume": true
  },
  "gradingRubric": {
    "beginning": "Student can identify basic chemical elements and simple compounds with guidance",
    "emerging": "Student demonstrates understanding of chemical reactions and can perform basic calculations"
  },
  "knowledgeFiles": [
    "periodic-table-data.xlsx",
    "lab-safety-manual.pdf",
    "chemical-reactions.docx",
    "molecular-structures.pdf"
  ]
}
```

## API Field Mapping Reference

### Required Fields
- `name` (string, max 100 chars) ✅
- `primary_language_id` (integer) ✅ 
- `chatbot_files` (array, can be empty) ✅
- `conversation_starters` (array, can be empty) ✅
- `analysis_scales` (array, can be empty) ✅

### UI to API Field Mappings
- `primaryLanguage` → `primary_language_id` (string to integer)
- `secondaryLanguages` → `secondary_language_ids` (array of strings to integers)
- `gradeLevel` → `grade_level`
- `botRole` → `bot_role`
- `greetingMessage` → `greeting_message`
- `curriculumInfo` → `curriculum_info`
- `curriculumSelected` → `select_from_curriculum` ("1" or "0")
- `imageCreation` → `create_images`
- `pauseResume` → `pause_session`
- `knowledgeFiles` → `chatbot_files`

### Capability Mappings
- `webSearch` → `real_time_web_search`
- `fileUpload` → `file_upload_analysis`
- `imageUpload` → `image_upload_gpt_vision`
- `imageCreation` → `create_images`
- `drawingTools` → `drawing_tools`
- `canvasEdit` → `canvas_edit_modify`

### Grading Rubric Transformation
UI format:
```json
{
  "beginning": "Description for beginning level",
  "emerging": "Description for emerging level"
}
```

API format:
```json
[
  {
    "level_name": "Beginning",
    "description": "Description for beginning level",
    "color": "red"
  },
  {
    "level_name": "Emerging", 
    "description": "Description for emerging level",
    "color": "yellow"
  }
]
```

## Testing Instructions

1. **Access Test Page:** Navigate to `http://localhost:5174/test-chatbot-api`

2. **Select Scenario:** Choose from the three test scenarios to load different configurations

3. **Review Data:** Check the "Current Test Configuration" section to see what will be sent

4. **Preview Transformation:** Use "Data Transformation Preview" to see UI → API mapping

5. **Run Test:** Click the test button to send data to your API endpoint

6. **Check Results:** Review success/error responses and console logs

7. **Verify API:** Confirm your API receives data in the expected format

## Manual Testing with cURL

You can also test the API directly with cURL using the transformed data:

```bash
curl -X POST http://localhost:8000/api/v1/chatbots/chatbot-create/ \
  -H "Content-Type: multipart/form-data" \
  -F "name=Test Bot" \
  -F "primary_language_id=1" \
  -F "description=Test description" \
  -F "conversation_starters[0][text]=Hello" \
  -F "analysis_scales[0][level_name]=Beginning" \
  -F "analysis_scales[0][description]=Basic level" \
  -F "analysis_scales[0][color]=red"
```

## Debugging Tips

1. **Check Browser Console:** All transformation steps are logged
2. **Use Network Tab:** Inspect the actual HTTP request sent to API
3. **Verify Field Names:** Ensure API expects the exact field names being sent
4. **Test File Uploads:** Confirm file handling works with your API
5. **Validate Required Fields:** Make sure all required fields are present

## Common Issues

1. **CORS Errors:** Ensure your API allows requests from localhost:5174
2. **Field Name Mismatches:** Check that API field names match exactly
3. **Type Mismatches:** Verify integer fields are parsed correctly
4. **File Upload Issues:** Confirm API handles multipart/form-data properly
5. **Missing Required Fields:** Ensure all required fields are populated

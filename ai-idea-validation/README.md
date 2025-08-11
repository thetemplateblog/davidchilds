# AI-Powered Idea Validation Canvas

An interactive, AI-powered form that guides entrepreneurs through validating their startup ideas with real-time feedback and personalized insights.

## Features

- 🤖 **AI-Powered Analysis**: Real-time feedback using Claude 3 (Anthropic) or GPT-4 (OpenAI)
- 📊 **Validation Scoring**: Comprehensive scoring across problem, solution, market, and validation readiness
- 🎯 **Personalized Recommendations**: Suggests the right validation tier based on idea complexity
- 📈 **Progress Tracking**: Visual progress bar and stage indicators
- 📑 **Detailed Reports**: Generate comprehensive validation reports with actionable next steps
- 💾 **Export Options**: Download reports as PDF (with additional implementation)
- 🔄 **Dual AI Support**: Choose between Anthropic's Claude or OpenAI's GPT-4

## Tech Stack

- **Frontend**: React with Tailwind CSS
- **Backend**: Next.js API Routes
- **AI**: Anthropic Claude 3 API or OpenAI GPT-4 API
- **Icons**: Lucide React
- **Optional**: SendGrid for email notifications

## Installation

### 1. Clone or Copy the Files

```bash
# Create a new Next.js app (if you don't have one)
npx create-next-app@latest my-validation-app
cd my-validation-app

# Copy the AI validation files to your project
cp -r ai-idea-validation/* .
```

### 2. Install Dependencies

```bash
npm install @anthropic-ai/sdk openai lucide-react
# Optional: For email notifications
npm install @sendgrid/mail
# Optional: For PDF generation
npm install jspdf html2canvas
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local` and add your API keys:

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
# Choose your AI provider: 'anthropic' or 'openai'
AI_PROVIDER=anthropic

# For Anthropic Claude (recommended)
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here

# For OpenAI GPT-4 (optional fallback)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Optional email notifications
NOTIFICATION_EMAIL=your-email@example.com
SENDGRID_API_KEY=your-sendgrid-api-key
```

### 4. Add Tailwind CSS Configuration

If not already configured, add these to your `tailwind.config.js`:

```javascript
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### 5. Run the Development Server

```bash
npm run dev
```

Visit `http://localhost:3000/idea-validation` to see the form in action.

## Integration with Your Existing Site

### Option 1: Standalone Page

Simply link to `/idea-validation` from your main site:

```html
<a href="/idea-validation" class="btn-primary">
  Try AI Idea Canvas
</a>
```

### Option 2: Embed as Component

Import and use the component anywhere:

```jsx
import IdeaValidationForm from './components/IdeaValidationForm';

function YourPage() {
  return (
    <div>
      <h1>Validate Your Idea</h1>
      <IdeaValidationForm />
    </div>
  );
}
```

### Option 3: Modal/Popup

```jsx
import { useState } from 'react';
import IdeaValidationForm from './components/IdeaValidationForm';

function YourPage() {
  const [showValidation, setShowValidation] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowValidation(true)}>
        Open AI Canvas
      </button>
      
      {showValidation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="max-h-screen overflow-y-auto">
            <IdeaValidationForm />
          </div>
        </div>
      )}
    </>
  );
}
```

## Customization

### Modify Questions

Edit the `stages` array in `components/IdeaValidationForm.jsx`:

```javascript
const stages = [
  {
    id: 'problem',
    title: 'Your Custom Stage',
    questions: [
      {
        id: 'custom_question',
        question: "Your custom question?",
        placeholder: "Placeholder text...",
        minLength: 30,
        help: "Help text for the user"
      }
    ]
  }
];
```

### Customize AI Prompts

Edit the prompts in `pages/api/validate-idea.js`:

```javascript
const STAGE_PROMPTS = {
  problem: `Your custom prompt for analyzing problems...`,
  solution: `Your custom prompt for solutions...`
};
```

### Styling

The component uses Tailwind CSS classes. Modify colors by changing:
- `bg-blue-600` → `bg-primary-600` (your brand color)
- `text-blue-600` → `text-primary-600`

### Add Database Storage

To save submissions to a database:

```javascript
// pages/api/generate-validation-report.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Add after generating report:
await prisma.submission.create({
  data: {
    answers: answers,
    report: report,
    email: answers.email?.answer
  }
});
```

## API Endpoints

### POST `/api/validate-idea`

Analyzes a single answer and provides AI feedback.

**Request:**
```json
{
  "stage": "problem",
  "questionId": "problem_statement",
  "question": "What problem are you solving?",
  "answer": "User's answer here",
  "previousAnswers": {}
}
```

**Response:**
```json
{
  "insight": "AI-generated insight about the answer",
  "followUpQuestion": "Optional follow-up question",
  "stage": "problem",
  "questionId": "problem_statement"
}
```

### POST `/api/generate-validation-report`

Generates a comprehensive validation report.

**Request:**
```json
{
  "answers": {
    "problem_statement": {
      "question": "What problem are you solving?",
      "answer": "User's answer",
      "insight": "AI insight"
    }
  }
}
```

**Response:**
```json
{
  "scores": {
    "problem": 8,
    "solution": 7,
    "market": 6,
    "validation": 7
  },
  "insights": ["Key insight 1", "Key insight 2"],
  "recommendedTier": "Month Sprint",
  "tierReason": "Your idea needs comprehensive testing",
  "nextSteps": ["Step 1", "Step 2"],
  "risks": ["Risk 1", "Risk 2"],
  "opportunities": ["Opportunity 1", "Opportunity 2"],
  "overallScore": 7
}
```

## Cost Considerations

### Anthropic Claude API Costs
- Claude 3 Opus: $15 per million input tokens + $75 per million output tokens
- Claude 3 Sonnet: $3 per million input tokens + $15 per million output tokens
- Average session: ~2,000-3,000 tokens total
- **Estimated cost per validation: $0.10-0.20 (Sonnet) or $0.15-0.30 (Opus)**

### OpenAI API Costs (if used)
- GPT-4: ~$0.03 per 1K tokens (input) + $0.06 per 1K tokens (output)
- GPT-3.5-turbo: ~$0.0015 per 1K tokens (input) + $0.002 per 1K tokens (output)
- **Estimated cost per validation: $0.15-0.25 (GPT-4) or $0.01-0.02 (GPT-3.5)**

### Ways to Reduce Costs:
1. Use Claude 3 Sonnet instead of Opus for most questions
2. Use GPT-3.5-turbo as a fallback (10x cheaper than GPT-4)
3. Cache common responses
4. Limit retries and implement rate limiting
5. Use fallback responses when API fails
6. Mix models: Use cheaper models for simple questions, premium for complex analysis

## Troubleshooting

### "OpenAI API Key not found"
- Make sure `.env.local` file exists with your API key
- Restart the Next.js development server after adding env variables

### "Failed to analyze answer"
- Check your OpenAI API key is valid
- Ensure you have credits in your OpenAI account
- Check the browser console for detailed error messages

### Styling issues
- Make sure Tailwind CSS is properly configured
- Run `npm run build` to rebuild CSS

## Advanced Features (Not Implemented)

Ideas for extending the validation canvas:

1. **Save & Resume**: Store progress in localStorage
2. **Multiple Languages**: Add i18n support
3. **Team Collaboration**: Allow multiple people to contribute
4. **Integration with CRM**: Auto-create leads in HubSpot/Salesforce
5. **Custom Branding**: White-label option for agencies
6. **Analytics Dashboard**: Track which questions cause drop-offs
7. **A/B Testing**: Test different question flows

## License

MIT - Feel free to use this in your projects!

## Support

For questions or issues, please create an issue on GitHub or reach out via email.
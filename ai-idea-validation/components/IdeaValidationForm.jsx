import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const IdeaValidationForm = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState('');
  const [validationReport, setValidationReport] = useState(null);
  const [error, setError] = useState('');

  // Define the validation journey stages
  const stages = [
    {
      id: 'problem',
      title: 'Problem Discovery',
      questions: [
        {
          id: 'problem_statement',
          question: "What problem are you solving?",
          placeholder: "Describe the specific problem your target customers face...",
          minLength: 50,
          help: "Be specific about who has this problem and why it matters to them."
        },
        {
          id: 'target_customer',
          question: "Who experiences this problem most?",
          placeholder: "Describe your ideal customer (demographics, role, industry)...",
          minLength: 30,
          help: "The more specific, the better. 'Everyone' is not a target market."
        },
        {
          id: 'problem_frequency',
          question: "How often does this problem occur?",
          placeholder: "Daily, weekly, monthly? In what situations?",
          minLength: 20,
          help: "Frequent problems are more valuable to solve."
        },
        {
          id: 'current_solution',
          question: "How do people currently solve this?",
          placeholder: "What alternatives, workarounds, or competitors exist?",
          minLength: 30,
          help: "Understanding current solutions helps position your approach."
        }
      ]
    },
    {
      id: 'solution',
      title: 'Solution Validation',
      questions: [
        {
          id: 'proposed_solution',
          question: "How does your solution work?",
          placeholder: "Describe your unique approach to solving this problem...",
          minLength: 50,
          help: "Focus on what makes your solution different and better."
        },
        {
          id: 'unique_value',
          question: "What's your unique value proposition?",
          placeholder: "Why would someone choose your solution over alternatives?",
          minLength: 30,
          help: "This is your competitive advantage."
        },
        {
          id: 'feasibility',
          question: "What resources do you need to build this?",
          placeholder: "Technical skills, time, money, partnerships needed...",
          minLength: 30,
          help: "Be realistic about what it takes to deliver your solution."
        }
      ]
    },
    {
      id: 'market',
      title: 'Market Analysis',
      questions: [
        {
          id: 'market_size',
          question: "How many potential customers exist?",
          placeholder: "Estimate the number of people/businesses with this problem...",
          minLength: 20,
          help: "Even a rough estimate helps gauge opportunity size."
        },
        {
          id: 'pricing_model',
          question: "What would customers pay?",
          placeholder: "One-time fee? Subscription? How much?",
          minLength: 20,
          help: "Price based on value delivered, not cost to build."
        },
        {
          id: 'competitors',
          question: "Who are your main competitors?",
          placeholder: "List 3-5 direct or indirect competitors...",
          minLength: 30,
          help: "If there are no competitors, make sure there's a market."
        }
      ]
    },
    {
      id: 'validation',
      title: 'Validation Strategy',
      questions: [
        {
          id: 'riskiest_assumption',
          question: "What's your riskiest assumption?",
          placeholder: "What needs to be true for this to work?",
          minLength: 30,
          help: "Identify what could make or break your idea."
        },
        {
          id: 'success_metrics',
          question: "How will you measure success?",
          placeholder: "Signups, pre-orders, engagement metrics?",
          minLength: 20,
          help: "Define specific, measurable validation goals."
        },
        {
          id: 'timeline',
          question: "When do you want to launch?",
          placeholder: "What's your timeline and key milestones?",
          minLength: 20,
          help: "Having deadlines creates urgency and focus."
        }
      ]
    }
  ];

  // Calculate progress
  const totalQuestions = stages.reduce((acc, stage) => acc + stage.questions.length, 0);
  const currentQuestionIndex = stages
    .slice(0, Math.floor(currentStep / 10))
    .reduce((acc, stage) => acc + stage.questions.length, 0) + (currentStep % 10);
  const progress = ((Object.keys(answers).length) / totalQuestions) * 100;

  // Get current stage and question
  const currentStageIndex = Math.floor(currentStep / 10);
  const currentQuestionInStage = currentStep % 10;
  const currentStage = stages[currentStageIndex];
  const currentQuestion = currentStage?.questions[currentQuestionInStage];

  // Analyze answer with AI
  const analyzeAnswer = async () => {
    if (!currentAnswer || currentAnswer.length < (currentQuestion?.minLength || 20)) {
      setError(`Please provide at least ${currentQuestion?.minLength || 20} characters`);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/validate-idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: currentStage.id,
          questionId: currentQuestion.id,
          question: currentQuestion.question,
          answer: currentAnswer,
          previousAnswers: answers
        })
      });

      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        return;
      }

      // Store answer and AI insight
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: {
          question: currentQuestion.question,
          answer: currentAnswer,
          insight: data.insight
        }
      }));
      
      setAiInsight(data.insight);

      // Move to next question after a brief delay to show insight
      setTimeout(() => {
        moveToNext();
      }, 2000);

    } catch (err) {
      setError('Failed to analyze answer. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation
  const moveToNext = () => {
    // Check if we've completed all questions
    if (currentStageIndex === stages.length - 1 && 
        currentQuestionInStage === currentStage.questions.length - 1) {
      generateReport();
      return;
    }

    // Move to next question
    if (currentQuestionInStage < currentStage.questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Move to next stage
      setCurrentStep((currentStageIndex + 1) * 10);
    }
    
    setCurrentAnswer('');
    setAiInsight('');
  };

  const moveToPrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      // Load previous answer if it exists
      const prevStageIndex = Math.floor((currentStep - 1) / 10);
      const prevQuestionInStage = (currentStep - 1) % 10;
      const prevQuestion = stages[prevStageIndex]?.questions[prevQuestionInStage];
      if (prevQuestion && answers[prevQuestion.id]) {
        setCurrentAnswer(answers[prevQuestion.id].answer);
        setAiInsight(answers[prevQuestion.id].insight || '');
      }
    }
  };

  // Generate final validation report
  const generateReport = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-validation-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      });

      const report = await response.json();
      setValidationReport(report);
    } catch (err) {
      setError('Failed to generate report. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Render validation report
  if (validationReport) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-2">Validation Report Ready!</h2>
            <p className="text-gray-600">Here's your personalized startup validation analysis</p>
          </div>

          {/* Score Card */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{validationReport.scores.problem}/10</div>
              <div className="text-sm text-gray-600">Problem Clarity</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{validationReport.scores.solution}/10</div>
              <div className="text-sm text-gray-600">Solution Fit</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{validationReport.scores.market}/10</div>
              <div className="text-sm text-gray-600">Market Potential</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{validationReport.scores.validation}/10</div>
              <div className="text-sm text-gray-600">Validation Ready</div>
            </div>
          </div>

          {/* Key Insights */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Key Insights</h3>
            <div className="space-y-3">
              {validationReport.insights.map((insight, index) => (
                <div key={index} className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-gray-700">{insight}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Validation Tier */}
          <div className="mb-8 p-6 bg-blue-50 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Recommended Validation Path</h3>
            <p className="text-lg font-medium text-blue-700 mb-2">{validationReport.recommendedTier}</p>
            <p className="text-gray-700">{validationReport.tierReason}</p>
          </div>

          {/* Next Steps */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Your Next Steps</h3>
            <ol className="space-y-2">
              {validationReport.nextSteps.map((step, index) => (
                <li key={index} className="flex items-start">
                  <span className="font-medium text-blue-600 mr-2">{index + 1}.</span>
                  <span className="text-gray-700">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => window.location.href = '#contact-form'}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Start Your Validation Sprint
            </button>
            <button
              onClick={() => {
                // Download report as PDF (implement with jsPDF or similar)
                console.log('Download PDF');
              }}
              className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition"
            >
              Download Report (PDF)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Progress Bar */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">
              {currentStage?.title}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Section */}
        <div className="p-8">
          <h3 className="text-2xl font-bold mb-2">
            {currentQuestion?.question}
          </h3>
          <p className="text-gray-600 mb-6">
            {currentQuestion?.help}
          </p>

          <textarea
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            placeholder={currentQuestion?.placeholder}
            className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="6"
            disabled={isLoading}
            minLength={currentQuestion?.minLength}
          />

          {/* Character count */}
          <div className="mt-2 text-sm text-gray-500">
            {currentAnswer.length} / {currentQuestion?.minLength} minimum characters
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* AI Insight */}
          {aiInsight && !isLoading && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-900 mb-1">AI Insight</p>
                  <p className="text-blue-700 text-sm">{aiInsight}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={moveToPrevious}
              disabled={currentStep === 0 || isLoading}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Previous
            </button>

            <button
              onClick={analyzeAnswer}
              disabled={isLoading || !currentAnswer}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-5 h-5 ml-1" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdeaValidationForm;
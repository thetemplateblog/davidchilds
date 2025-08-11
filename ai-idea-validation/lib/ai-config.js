// AI Provider Configuration
// This file centralizes AI model selection and configuration

export const AI_CONFIG = {
  // Primary provider: 'anthropic' or 'openai'
  provider: process.env.AI_PROVIDER || 'anthropic',
  
  // Anthropic Claude Models
  anthropic: {
    // Use Opus for complex analysis and report generation
    complexModel: 'claude-3-opus-20240229',
    
    // Use Sonnet for quick questions and follow-ups
    fastModel: 'claude-3-sonnet-20240229',
    
    // Use Haiku for very simple tasks (coming soon)
    cheapModel: 'claude-3-haiku-20240307',
    
    // Default parameters
    temperature: 0.7,
    maxTokens: {
      analysis: 150,
      followUp: 50,
      report: 1000
    }
  },
  
  // OpenAI Models
  openai: {
    // Use GPT-4 for complex analysis
    complexModel: 'gpt-4-turbo-preview',
    
    // Use GPT-3.5 for quick questions
    fastModel: 'gpt-3.5-turbo',
    
    // Default parameters
    temperature: 0.7,
    maxTokens: {
      analysis: 150,
      followUp: 50,
      report: 1000
    }
  },
  
  // Cost optimization settings
  optimization: {
    // Use cheaper models for these question types
    useFastModelFor: [
      'problem_frequency',
      'market_size',
      'timeline',
      'pricing_model'
    ],
    
    // Cache responses for these common patterns
    cacheableQuestions: [
      'competitors',
      'current_solution'
    ],
    
    // Fallback to cheaper model if primary fails
    enableFallback: true
  },
  
  // Response formatting
  formatting: {
    // Clean up AI responses
    removeMarkdown: true,
    trimWhitespace: true,
    maxResponseLength: 500
  }
};

// Helper function to get the appropriate model
export function getModel(complexity = 'fast') {
  const provider = AI_CONFIG.provider;
  const config = AI_CONFIG[provider];
  
  switch (complexity) {
    case 'complex':
      return config.complexModel;
    case 'cheap':
      return config.cheapModel || config.fastModel;
    case 'fast':
    default:
      return config.fastModel;
  }
}

// Helper function to determine model complexity for a question
export function getModelComplexity(questionId, stage) {
  // Use fast model for simple questions
  if (AI_CONFIG.optimization.useFastModelFor.includes(questionId)) {
    return 'fast';
  }
  
  // Use complex model for critical questions
  if (questionId === 'problem_statement' || questionId === 'proposed_solution') {
    return 'complex';
  }
  
  // Use complex model for final report
  if (stage === 'report') {
    return 'complex';
  }
  
  // Default to fast model
  return 'fast';
}

// Cost calculation helper
export function estimateCost(tokensUsed, model) {
  const costs = {
    // Anthropic pricing (per million tokens)
    'claude-3-opus-20240229': { input: 15, output: 75 },
    'claude-3-sonnet-20240229': { input: 3, output: 15 },
    'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
    
    // OpenAI pricing (per 1K tokens)
    'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 }
  };
  
  const modelCost = costs[model];
  if (!modelCost) return 0;
  
  // Estimate 70% input, 30% output for typical usage
  const inputTokens = tokensUsed * 0.7;
  const outputTokens = tokensUsed * 0.3;
  
  // Calculate cost based on model
  if (model.includes('claude')) {
    // Anthropic uses per-million pricing
    return (inputTokens * modelCost.input / 1000000) + 
           (outputTokens * modelCost.output / 1000000);
  } else {
    // OpenAI uses per-1K pricing
    return (inputTokens * modelCost.input / 1000) + 
           (outputTokens * modelCost.output / 1000);
  }
}
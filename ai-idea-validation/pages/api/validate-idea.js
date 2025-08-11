import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// Initialize AI clients based on environment configuration
const AI_PROVIDER = process.env.AI_PROVIDER || 'anthropic'; // 'anthropic' or 'openai'

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
}) : null;

// System prompts for different stages
const STAGE_PROMPTS = {
  problem: `You are a startup validation expert analyzing problem statements. 
    Provide brief, actionable insights about the problem's clarity, specificity, and market potential.
    Keep responses under 100 words and focus on constructive feedback.`,
  
  solution: `You are a startup validation expert analyzing proposed solutions.
    Evaluate the feasibility, uniqueness, and value proposition.
    Keep responses under 100 words and focus on constructive feedback.`,
  
  market: `You are a startup validation expert analyzing market potential.
    Assess market size, competition, and pricing strategy.
    Keep responses under 100 words and focus on constructive feedback.`,
  
  validation: `You are a startup validation expert analyzing validation strategies.
    Evaluate the testing approach, metrics, and timeline.
    Keep responses under 100 words and focus on constructive feedback.`
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { stage, questionId, question, answer, previousAnswers } = req.body;

  if (!stage || !answer || !question) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Build context from previous answers
    const context = Object.entries(previousAnswers || {})
      .map(([key, value]) => `${value.question}: ${value.answer}`)
      .join('\n');

    // Create the prompt for AI analysis
    const userPrompt = `
      Previous context:
      ${context}
      
      Current question: ${question}
      User's answer: ${answer}
      
      Provide a brief insight about this answer. Focus on:
      1. Strengths in their approach
      2. Potential gaps or concerns
      3. One specific suggestion for improvement
      
      Be encouraging but honest. Keep it concise.
    `;

    // Get AI response based on provider
    let insight;
    
    if (AI_PROVIDER === 'anthropic' && anthropic) {
      // Use Claude API
      const completion = await anthropic.messages.create({
        model: 'claude-3-opus-20240229', // or 'claude-3-sonnet-20240229' for cheaper option
        max_tokens: 150,
        temperature: 0.7,
        system: STAGE_PROMPTS[stage] || STAGE_PROMPTS.problem,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      });
      
      insight = completion.content[0].text;
      
    } else if (openai) {
      // Use OpenAI API
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: STAGE_PROMPTS[stage] || STAGE_PROMPTS.problem
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      });

      insight = completion.choices[0].message.content;
      
    } else {
      throw new Error('No AI provider configured');
    }

    // Optional: Generate follow-up question based on the answer
    let followUpQuestion = null;
    
    // Only generate follow-up for certain critical questions
    if (questionId === 'problem_statement' || questionId === 'proposed_solution') {
      if (AI_PROVIDER === 'anthropic' && anthropic) {
        const followUpCompletion = await anthropic.messages.create({
          model: 'claude-3-sonnet-20240229', // Use faster model for follow-ups
          max_tokens: 50,
          temperature: 0.7,
          system: 'Generate one specific follow-up question based on the user\'s answer. Keep it short and focused.',
          messages: [
            {
              role: 'user',
              content: `Based on this answer: "${answer}", what's one important clarifying question?`
            }
          ]
        });
        
        followUpQuestion = followUpCompletion.content[0].text;
        
      } else if (openai) {
        const followUpCompletion = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'Generate one specific follow-up question based on the user\'s answer. Keep it short and focused.'
            },
            {
              role: 'user',
              content: `Based on this answer: "${answer}", what's one important clarifying question?`
            }
          ],
          temperature: 0.7,
          max_tokens: 50
        });
        
        followUpQuestion = followUpCompletion.choices[0].message.content;
      }
    }

    // Return the insight and optional follow-up
    res.status(200).json({
      insight,
      followUpQuestion,
      stage,
      questionId
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Fallback to non-AI response if API fails
    const fallbackInsights = {
      problem_statement: "Good start! Make sure to be specific about who experiences this problem and how often.",
      target_customer: "The more specific your target customer, the easier it is to validate and reach them.",
      proposed_solution: "Focus on what makes your solution uniquely valuable compared to existing alternatives.",
      market_size: "Even a rough estimate helps. Consider starting with a niche and expanding.",
      default: "Interesting perspective. Consider how you can validate this assumption with real customer feedback."
    };

    res.status(200).json({
      insight: fallbackInsights[questionId] || fallbackInsights.default,
      followUpQuestion: null,
      stage,
      questionId
    });
  }
}
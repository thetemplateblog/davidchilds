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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { answers } = req.body;

  if (!answers || Object.keys(answers).length === 0) {
    return res.status(400).json({ error: 'No answers provided' });
  }

  try {
    // Prepare the full context for analysis
    const fullContext = Object.entries(answers)
      .map(([key, value]) => `${value.question}: ${value.answer}`)
      .join('\n\n');

    // Generate comprehensive analysis
    const analysisPrompt = `
      As a startup validation expert, analyze this startup idea based on the following information:
      
      ${fullContext}
      
      Provide a detailed JSON response with the following structure:
      {
        "scores": {
          "problem": <1-10 score for problem clarity and importance>,
          "solution": <1-10 score for solution viability>,
          "market": <1-10 score for market potential>,
          "validation": <1-10 score for validation readiness>
        },
        "insights": [
          <3-5 key insights about the idea's strengths and weaknesses>
        ],
        "recommendedTier": "<Week Test|Month Sprint|Quarter Launch>",
        "tierReason": "<Why this tier is recommended>",
        "nextSteps": [
          <4-5 specific action items for validation>
        ],
        "risks": [
          <2-3 main risks to address>
        ],
        "opportunities": [
          <2-3 growth opportunities>
        ]
      }
    `;

    let completion;
    let report;

    if (AI_PROVIDER === 'anthropic' && anthropic) {
      // Use Claude API
      completion = await anthropic.messages.create({
        model: 'claude-3-opus-20240229', // Use Opus for complex analysis
        max_tokens: 1000,
        temperature: 0.7,
        system: 'You are a startup validation expert. Analyze the provided information and return a JSON response with scores, insights, and recommendations. Be constructive but honest. Return ONLY valid JSON, no additional text.',
        messages: [
          {
            role: 'user',
            content: analysisPrompt
          }
        ]
      });
      
      try {
        // Claude returns text content, parse it as JSON
        const responseText = completion.content[0].text;
        // Clean up the response if it has markdown code blocks
        const cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        report = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error('Failed to parse Claude response:', parseError);
        report = generateFallbackReport(answers);
      }
      
    } else if (openai) {
      // Use OpenAI API
      completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a startup validation expert. Analyze the provided information and return a JSON response with scores, insights, and recommendations. Be constructive but honest.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      });

      try {
        report = JSON.parse(completion.choices[0].message.content);
      } catch (parseError) {
        report = generateFallbackReport(answers);
      }
      
    } else {
      // No AI provider available, use fallback
      report = generateFallbackReport(answers);
    }

    // Add additional metadata
    report.generatedAt = new Date().toISOString();
    report.totalQuestions = Object.keys(answers).length;
    
    // Calculate overall score
    const scores = Object.values(report.scores);
    report.overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    // Send email notification (optional)
    if (process.env.NOTIFICATION_EMAIL) {
      await sendNotificationEmail(answers, report);
    }

    res.status(200).json(report);

  } catch (error) {
    console.error('Report generation error:', error);
    
    // Return fallback report if AI fails
    const fallbackReport = generateFallbackReport(answers);
    res.status(200).json(fallbackReport);
  }
}

function generateFallbackReport(answers) {
  // Analyze answers programmatically for fallback
  const hasCleanProblem = answers.problem_statement?.answer?.length > 100;
  const hasTargetMarket = answers.target_customer?.answer?.length > 50;
  const hasSolution = answers.proposed_solution?.answer?.length > 100;
  const hasCompetitors = answers.competitors?.answer?.includes(',') || answers.competitors?.answer?.length > 50;
  
  // Calculate basic scores
  const problemScore = hasCleanProblem && hasTargetMarket ? 7 : 5;
  const solutionScore = hasSolution ? 7 : 5;
  const marketScore = hasCompetitors ? 6 : 4;
  const validationScore = answers.success_metrics?.answer ? 7 : 5;

  // Determine recommended tier based on complexity
  let recommendedTier = 'Week Test';
  let tierReason = 'Start with a simple landing page to test core interest.';
  
  if (hasCleanProblem && hasSolution && hasCompetitors) {
    if (answers.pricing_model?.answer?.includes('subscription')) {
      recommendedTier = 'Quarter Launch';
      tierReason = 'Your subscription model needs extended testing to validate recurring revenue potential.';
    } else {
      recommendedTier = 'Month Sprint';
      tierReason = 'You have a clear vision that needs comprehensive testing with multiple touchpoints.';
    }
  }

  return {
    scores: {
      problem: problemScore,
      solution: solutionScore,
      market: marketScore,
      validation: validationScore
    },
    insights: [
      hasCleanProblem ? 
        "You've identified a specific problem with a clear target audience." :
        "Consider narrowing down your problem statement to be more specific.",
      hasSolution ?
        "Your solution approach shows promise and differentiation." :
        "Focus on what makes your solution uniquely valuable.",
      hasCompetitors ?
        "Good awareness of competitive landscape helps positioning." :
        "Research existing solutions to better understand your differentiation.",
      "Consider starting with a small, focused test to validate core assumptions.",
      "Focus on getting early customer feedback before building features."
    ],
    recommendedTier,
    tierReason,
    nextSteps: [
      "Create a one-page summary of your value proposition",
      "Identify 10 potential customers to interview",
      "Design a simple landing page that clearly communicates your solution",
      "Set up analytics to track visitor behavior and conversion",
      "Prepare a simple ad campaign to drive targeted traffic"
    ],
    risks: [
      "Market validation is critical before significant investment",
      "Ensure your solution is significantly better than existing alternatives"
    ],
    opportunities: [
      "Early validation can help refine your product-market fit",
      "Quick testing can reveal unexpected customer segments"
    ],
    generatedAt: new Date().toISOString(),
    totalQuestions: Object.keys(answers).length,
    overallScore: Math.round((problemScore + solutionScore + marketScore + validationScore) / 4)
  };
}

// Optional: Send notification email
async function sendNotificationEmail(answers, report) {
  // Implement email sending logic here using SendGrid, AWS SES, etc.
  // This is a placeholder for the email functionality
  
  try {
    // Example with SendGrid (you'd need to install @sendgrid/mail)
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    // const msg = {
    //   to: process.env.NOTIFICATION_EMAIL,
    //   from: 'noreply@yoursite.com',
    //   subject: 'New Idea Validation Submission',
    //   html: `
    //     <h2>New Validation Report Generated</h2>
    //     <p>Overall Score: ${report.overallScore}/10</p>
    //     <p>Recommended Tier: ${report.recommendedTier}</p>
    //     <p>Check your dashboard for full details.</p>
    //   `
    // };
    
    // await sgMail.send(msg);
    
    console.log('Email notification would be sent here');
  } catch (error) {
    console.error('Email sending failed:', error);
  }
}
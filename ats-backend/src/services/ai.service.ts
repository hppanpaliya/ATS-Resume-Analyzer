import OpenAI from 'openai';
import axios from 'axios';

// Initialize OpenAI with OpenRouter
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.BASE_URL || 'https://openrouter.ai/api/v1',
});

// Model cache with 24-hour expiration
let modelCache = {
    data: [],
    lastFetched: null as number | null,
    isLoading: false
};

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const DEFAULT_MODEL = process.env.ANALYSIS_MODEL || 'google/gemini-2.0-flash-exp:free';

export class AIService {
    async getAvailableModels() {
        const now = Date.now();

        // Return cached data if still valid
        if (modelCache.data.length > 0 &&
            modelCache.lastFetched &&
            (now - modelCache.lastFetched) < CACHE_DURATION) {
            return modelCache.data;
        }

        // Prevent multiple simultaneous requests
        if (modelCache.isLoading) {
            // Wait for existing request to complete
            while (modelCache.isLoading) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return modelCache.data;
        }

        modelCache.isLoading = true;

        try {
            const response = await axios.get('https://openrouter.ai/api/v1/models');

            // Filter and format models
            const models = response.data.data
                .filter((model: any) => model.id.includes('free') || model.pricing?.prompt === '0')
                .map((model: any) => ({
                    id: model.id,
                    name: model.name || model.id,
                    provider: model.id.split('/')[0],
                    context_length: model.context_length || 4096,
                    supported_parameters: model.supported_parameters || [],
                    per_request_limits: model.per_request_limits,
                    pricing: model.pricing,
                    created: model.created,
                    description: model.description || '',
                    architecture: model.architecture,
                }));

            modelCache.data = models;
            modelCache.lastFetched = now;

            return models;
        } catch (error) {
            console.error('Error fetching models:', error);
            // Return cached data if available, even if expired
            if (modelCache.data.length > 0) {
                return modelCache.data;
            }
            throw error;
        } finally {
            modelCache.isLoading = false;
        }
    }

    async refreshModelsCache() {
        modelCache.data = [];
        modelCache.lastFetched = null;
        return this.getAvailableModels();
    }

    async analyzeResume(
        text: string, 
        jobDescription: string, 
        selectedModel?: string,
        modelParameters?: {
            temperature?: number;
            max_tokens?: number;
            include_reasoning?: boolean;
        }
    ) {
        const model = selectedModel || DEFAULT_MODEL;

        const prompt = `You are an expert ATS (Applicant Tracking System) analyzer, specializing in providing feedback for university students in technical fields. Analyze the following resume against the job description and provide a detailed assessment based on career advising best practices.


Resume Text:
${text}


Job Description:
${jobDescription}


Please provide a comprehensive analysis in the following JSON format:
{
  "overallScore": <number 0-100>,
  "skillsAnalysis": {
    "score": <number 0-100>,
    "matchedKeywords": [<array of matched keywords from the job description>],
    "missingKeywords": [<array of important missing keywords>],
    "recommendations": [<array of suggestions for the skills section>]
  },
  "formattingScore": {
    "score": <number 0-100>,
    "issues": [<array of specific formatting issues found>],
    "suggestions": [<array of concrete suggestions for how to fix the issues>]
  },
  "experienceRelevance": {
    "score": <number 0-100>,
    "relevantExperience": <string describing how the candidate's experience aligns with the role>,
    "gaps": [<array of experience gaps>]
  },
  "actionableAdvice": [<array of specific, actionable recommendations for the candidate>],
  "modelUsed": {
    "id": "${model}",
    "name": "<model display name>",
    "provider": "<provider name>"
  }
}


Focus on these rules:
1.  **Skills and Keyword Optimization**: In the skillsAnalysis, identify keywords. In the recommendations for that section, check if there is a "Technical Skills" section. If there is also a general "Skills" section, recommend combining them into a single, well-organized "Technical Skills" section as per university guidelines.

2.  **Quantify Achievements Carefully**: When providing advice in actionableAdvice to quantify results (e.g., "improved speed by X%"), you MUST include the following stipulation: **"Only add metrics if they are accurate and you can explain how you arrived at the number. Do not invent data, as this can be problematic in the hiring process."**

3.  **Summary/Objective Statements**: In actionableAdvice, check for a "Summary" or "Objective" section. If the resume appears to be for an undergraduate student, recommend removing it to keep the resume to a single page, which is standard practice.

4.  **Formatting**: In the formattingScore, be specific. For every issue listed in issues, provide a corresponding suggestion in suggestions.

5.  **Experience Relevance**: Analyze how the candidate's experience connects to the job description, highlighting both strengths and areas that are not covered.

6.  **Overall Score**: The overallScore should reflect the resume's overall ATS compatibility and readiness for the application.

Be thorough but concise. Provide specific examples and actionable advice based on the rules above.
`;

        try {
            // Build completion parameters with defaults and user overrides
            const completionParams: any = {
                model: model,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: modelParameters?.temperature ?? 0.15,
                max_tokens: Math.min(modelParameters?.max_tokens ?? 4000, 16000),
                seed: 42, // Fixed seed for reproducibility
            };

            // Add reasoning if enabled
            if (modelParameters?.include_reasoning) {
                completionParams.reasoning_effort = 'medium'; // Can be 'low', 'medium', or 'high'
            }

            const completion = await openai.chat.completions.create(completionParams);

            const response = completion.choices[0]?.message?.content;
            if (!response) {
                throw new Error('No response from AI model');
            }

            // Extract JSON from markdown code blocks if present
            let jsonString = response.trim();
            if (jsonString.startsWith('```json')) {
                jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (jsonString.startsWith('```')) {
                jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }

            // Parse the JSON response
            const analysisResult = JSON.parse(jsonString);

            // Ensure the response has the expected structure
            if (!analysisResult.overallScore || !analysisResult.skillsAnalysis || !analysisResult.formattingScore) {
                throw new Error('Invalid response format from AI model');
            }

            return analysisResult;

        } catch (error) {
            console.error('AI Analysis error:', error);
            throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async checkHealth() {
        try {
            // Test OpenRouter API connectivity
            const response = await axios.get('https://openrouter.ai/api/v1/models');

            return {
                status: 'healthy',
                openrouter: true,
                models: response.data.data?.length || 0
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                openrouter: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}
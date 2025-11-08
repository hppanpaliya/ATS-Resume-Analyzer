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

        const prompt = `You are an expert ATS (Applicant Tracking System) analyzer. Analyze the following resume against the job description and provide a detailed assessment.

Resume Text:
${text}

Job Description:
${jobDescription}

Please provide a comprehensive analysis in the following JSON format:
{
  "overallScore": <number 0-100>,
  "keywordMatch": {
    "score": <number 0-100>,
    "matchedKeywords": [<array of matched keywords>],
    "missingKeywords": [<array of important missing keywords>]
  },
  "formattingScore": {
    "score": <number 0-100>,
    "issues": [<array of formatting issues>],
    "suggestions": [<array of formatting suggestions>]
  },
  "experienceRelevance": {
    "score": <number 0-100>,
    "relevantExperience": <string describing relevant experience>,
    "gaps": [<array of experience gaps>]
  },
  "actionableAdvice": [<array of specific actionable recommendations>],
  "modelUsed": {
    "id": "${model}",
    "name": "<model display name>",
    "provider": "<provider name>"
  }
}

Focus on:
1. Keyword optimization for ATS systems
2. Resume formatting and structure
3. Experience relevance to the job
4. Specific, actionable improvements
5. Overall ATS compatibility score

Be thorough but concise. Provide specific examples and actionable advice.`;

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
            if (!analysisResult.overallScore || !analysisResult.keywordMatch || !analysisResult.formattingScore) {
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
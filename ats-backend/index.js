// server.js - Main server file
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const OpenAI = require('openai');
const axios = require('axios');
require('dotenv').config();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize OpenAI with OpenRouter
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.BASE_URL || 'https://openrouter.ai/api/v1',
});

// Model cache with 24-hour expiration
let modelCache = {
    data: [],
    lastFetched: null,
    isLoading: false
};

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const DEFAULT_MODEL = 'google/gemini-2.0-flash-exp:free';

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads (store in memory)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF and DOCX are allowed.'));
        }
    }
});

// Function to fetch models from OpenRouter API
async function fetchModelsFromOpenRouter() {
    try {
        console.log('Fetching models from OpenRouter API...');
        
        const response = await axios.get('https://openrouter.ai/api/v1/models', {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 second timeout
        });

        if (!response.data || !response.data.data) {
            throw new Error('Invalid response format from OpenRouter API');
        }

        // Filter for free models and extract required fields
        const freeModels = response.data.data
            .filter(model => model.id.endsWith(':free'))
            .map(model => ({
                id: model.id,
                name: model.name,
                created: model.created,
                description: model.description || '',
                context_length: model.context_length,
                architecture: model.architecture,
                per_request_limits: model.per_request_limits,
                supported_parameters: model.supported_parameters,
                // Extract provider name from model ID
                provider: model.id.split('/')[0] || 'Unknown',
                // Mark recommended models (you can customize this logic)
                recommended: model.id === DEFAULT_MODEL || 
                            model.id.includes('gemini') || 
                            model.id.includes('llama-3') ||
                            model.id.includes('deepseek') ||
                            model.id.includes('openai') ||
                            model.id.includes('anthropic')
            }))
            .sort((a, b) => {
                // Sort by created date in descending order by default (newest first)
                const dateA = a.created || 0;
                const dateB = b.created || 0;
                return dateB - dateA;
            });

        console.log(`Successfully fetched ${freeModels.length} free models from OpenRouter`);
        
        // Update cache
        modelCache = {
            data: freeModels,
            lastFetched: Date.now(),
            isLoading: false
        };

        return freeModels;
    } catch (error) {
        console.error('Error fetching models from OpenRouter:', error.message);
        
        // If we have cached data, use it
        if (modelCache.data.length > 0) {
            console.log('Using cached model data due to fetch error');
            return modelCache.data;
        }
        
        // Fallback to a minimal default model list
        console.log('Using fallback default model');
        const fallbackModels = [{
            id: DEFAULT_MODEL,
            name: 'Gemini 2.0 Flash',
            created: Date.now(),
            description: 'Google\'s latest Gemini model with excellent reasoning capabilities',
            context_length: 32768,
            architecture: { modality: 'text->text' },
            per_request_limits: null,
            supported_parameters: [
            "max_tokens",
            "response_format",
            "seed",
            "stop",
            "temperature",
            "tool_choice",
            "tools",
            "top_p"
            ],
            provider: 'Google',
            recommended: true
        }];
        
        modelCache = {
            data: fallbackModels,
            lastFetched: Date.now(),
            isLoading: false
        };
        
        return fallbackModels;
    }
}

// Function to get cached models or fetch if expired
async function getAvailableModels() {
    const now = Date.now();
    const isCacheExpired = !modelCache.lastFetched || 
                          (now - modelCache.lastFetched) > CACHE_DURATION;
    
    // If cache is valid and not empty, return cached data
    if (!isCacheExpired && modelCache.data.length > 0) {
        console.log('Returning cached models');
        return modelCache.data;
    }
    
    // If already loading, wait for it to complete
    if (modelCache.isLoading) {
        console.log('Model fetch already in progress, waiting...');
        // Wait for the current fetch to complete (with timeout)
        let attempts = 0;
        while (modelCache.isLoading && attempts < 30) { // 30 seconds max wait
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
        }
        return modelCache.data;
    }
    
    // Start fetching
    modelCache.isLoading = true;
    
    try {
        return await fetchModelsFromOpenRouter();
    } finally {
        modelCache.isLoading = false;
    }
}

// Initialize models on server start
(async () => {
    try {
        await getAvailableModels();
        console.log('Initial model cache populated');
    } catch (error) {
        console.error('Failed to populate initial model cache:', error.message);
    }
})();

// Utility function to extract text from uploaded file
async function extractTextFromFile(fileBuffer, mimeType) {
    try {
        let text = '';
        
        if (mimeType === 'application/pdf') {
            // Extract text from PDF
            const pdfData = await pdfParse(fileBuffer);
            text = pdfData.text;
        } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            // Extract text from DOCX
            const result = await mammoth.extractRawText({ buffer: fileBuffer });
            text = result.value;
        }
        
        // Clean up the text
        text = text.replace(/\s+/g, ' ').trim();
        return text;
    } catch (error) {
        console.error('Error extracting text:', error);
        throw new Error('Failed to extract text from file');
    }
}

// Function to validate model
async function validateModel(modelId) {
    if (!modelId) {
        return DEFAULT_MODEL;
    }
    
    try {
        const availableModels = await getAvailableModels();
        const isValidModel = availableModels.some(model => model.id === modelId);
        
        if (!isValidModel) {
            console.warn(`Invalid model ID: ${modelId}. Using default model.`);
            return DEFAULT_MODEL;
        }
        
        return modelId;
    } catch (error) {
        console.error('Error validating model:', error.message);
        return DEFAULT_MODEL;
    }
}

// Function to get AI analysis from OpenAI/OpenRouter
async function getAIAnalysis(resumeText, jobDescription, modelId = null) {
    const validatedModel = await validateModel(modelId);
    
    const systemPrompt = `You are an expert ATS (Applicant Tracking System) and professional career coach. Your purpose is to analyze a student's resume against a specific job description and provide a detailed, constructive, and encouraging report. You must be thorough and act as a guide to help the student improve their resume.

Your output MUST be a valid JSON object and nothing else.

The JSON object must have the following structure:

{
  "overallScore": <An integer between 0 and 100, representing the overall match. This is a weighted average you calculate: 40% keyword match, 30% experience relevance, 30% formatting score.>,
  "keywordAnalysis": {
    "foundKeywords": ["<list of important keywords from the JD found in the resume>"],
    "missingKeywords": ["<list of important keywords from the JD NOT found in the resume>"]
  },
  "experienceRelevance": {
    "summary": "<A 2-3 sentence summary of how well the candidate's experience aligns with the job's core responsibilities.>",
    "details": [
      {
        "jdRequirement": "<A key responsibility from the job description>",
        "resumeEvidence": "<The most relevant phrase or sentence from the resume that matches this requirement. State 'No direct evidence found' if applicable.>",
        "matchStrength": "<A rating of 'Strong', 'Partial', or 'Weak'>"
      }
    ]
  },
  "atsFormattingScore": {
    "score": <An integer between 0 and 100>,
    "feedback": "<A brief explanation for the score, noting positive aspects (like clean format) or negative ones (like use of columns, graphics, or non-standard fonts).>"
  },
  "actionableAdvice": [
    "<A concrete, encouraging tip for improving keyword alignment.>",
    "<A specific suggestion on how to better showcase relevant experience.>",
    "<A piece of advice on improving the resume's formatting for ATS compatibility.>"
  ]
}

Instructions for Analysis:

1. Keyword Analysis: Identify the most critical hard skills, tools, and qualifications from the job description. Compare this list against the entire resume text.

2. Experience Relevance: Go beyond keywords. Semantically analyze the work experience described in the resume. Does the story of the resume match the needs of the job description?

3. Formatting Score: Assume a perfect score of 100. Deduct points for common ATS issues: complex tables, columns, images, headers/footers containing contact info, and overly creative fonts. A clean, single-column resume with standard fonts gets a high score.

4. Tone: Your feedback, especially in the actionableAdvice section, should be positive and empowering. Frame suggestions as opportunities for improvement.`;

    const userPrompt = `Please analyze this resume against the job description and provide a detailed ATS analysis report.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}`;

    try {
        console.log(`Using AI model: ${validatedModel}`);
        const completion = await openai.chat.completions.create({
            model: validatedModel,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.3,
            response_format: { type: "json_object" }
        });

        const analysis = JSON.parse(completion.choices[0].message.content);
        console.log('AI Analysis completed successfully');
        
        // Add model info to response
        const availableModels = await getAvailableModels();
        const usedModel = availableModels.find(m => m.id === validatedModel);
        
        analysis.modelUsed = {
            id: validatedModel,
            name: usedModel?.name || 'Unknown Model',
            provider: usedModel?.provider || 'Unknown'
        };
        
        return analysis;
    } catch (error) {
        console.error('AI API Error:', error);
        
        // More detailed error handling
        if (error.status === 429) {
            throw new Error('Rate limit exceeded. Please try again in a moment.');
        } else if (error.status === 401) {
            throw new Error('API authentication failed. Please check your API key configuration.');
        } else if (error.status === 400) {
            throw new Error('Invalid request format. Please try again.');
        } else {
            throw new Error(`Failed to analyze resume: ${error.message || 'Unknown error'}`);
        }
    }
}

// API endpoint to get available models
app.get('/api/models', async (req, res) => {
    try {
        const models = await getAvailableModels();
        
        res.json({
            models: models,
            default: DEFAULT_MODEL,
            cacheInfo: {
                lastFetched: modelCache.lastFetched,
                cacheAge: modelCache.lastFetched ? Date.now() - modelCache.lastFetched : null,
                totalModels: models.length
            }
        });
    } catch (error) {
        console.error('Error getting models:', error);
        res.status(500).json({ 
            error: 'Failed to fetch available models',
            details: error.message 
        });
    }
});

// API endpoint to force refresh models cache
app.post('/api/models/refresh', async (req, res) => {
    try {
        // Reset cache to force refresh
        modelCache.lastFetched = null;
        modelCache.data = [];
        
        const models = await getAvailableModels();
        
        res.json({
            message: 'Models cache refreshed successfully',
            models: models,
            totalModels: models.length
        });
    } catch (error) {
        console.error('Error refreshing models:', error);
        res.status(500).json({ 
            error: 'Failed to refresh models cache',
            details: error.message 
        });
    }
});

// Main API endpoint
app.post('/api/analyze', upload.single('resume'), async (req, res) => {
    try {
        // Validate inputs
        if (!req.file) {
            return res.status(400).json({ error: 'No resume file provided' });
        }
        
        if (!req.body.jobDescription) {
            return res.status(400).json({ error: 'No job description provided' });
        }

        const selectedModel = req.body.model; // Get the selected model from request
        console.log('Processing file:', req.file.originalname);
        console.log('Selected model:', selectedModel || 'default');
        
        // Extract text from resume
        const resumeText = await extractTextFromFile(req.file.buffer, req.file.mimetype);
        
        if (!resumeText || resumeText.length < 100) {
            return res.status(400).json({ error: 'Could not extract sufficient text from resume' });
        }

        console.log('Extracted text length:', resumeText.length);
        
        // Get AI analysis with selected model
        const analysis = await getAIAnalysis(resumeText, req.body.jobDescription, selectedModel);
        
        // Send response
        res.json(analysis);
        
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            error: 'Failed to analyze resume',
            details: error.message 
        });
    }
});

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const models = await getAvailableModels();
        
        res.json({ 
            status: 'OK', 
            timestamp: new Date().toISOString(),
            modelCache: {
                totalModels: models.length,
                lastFetched: modelCache.lastFetched,
                cacheAge: modelCache.lastFetched ? Date.now() - modelCache.lastFetched : null,
                isExpired: modelCache.lastFetched ? (Date.now() - modelCache.lastFetched) > CACHE_DURATION : true
            },
            defaultModel: DEFAULT_MODEL
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Models endpoint: http://localhost:${PORT}/api/models`);
    console.log(`Default model: ${DEFAULT_MODEL}`);
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size too large. Maximum size is 5MB.' });
        }
    }
    res.status(500).json({ error: error.message });
});

// Serve React frontend
app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});
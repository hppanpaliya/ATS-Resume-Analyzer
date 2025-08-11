// server.js - Main server file
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const OpenAI = require('openai');
require('dotenv').config();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.BASE_URL || 'https://api.openai.com/v1',

});

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

// Function to get AI analysis from OpenAI
async function getAIAnalysis(resumeText, jobDescription) {
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
        const completion = await openai.chat.completions.create({
            model: process.env.ANALYSIS_MODEL || 'google/gemini-2.0-flash-exp:free',
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.3,
            response_format: { type: "json_object" }
        });

        const analysis = JSON.parse(completion.choices[0].message.content);
        console.log('AI Analysis:', analysis);
        return analysis;
    } catch (error) {
        console.error('OpenAI API Error:', error);
        throw new Error('Failed to analyze resume');
    }
}

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

        console.log('Processing file:', req.file.originalname);
        
        // Extract text from resume
        const resumeText = await extractTextFromFile(req.file.buffer, req.file.mimetype);
        
        if (!resumeText || resumeText.length < 100) {
            return res.status(400).json({ error: 'Could not extract sufficient text from resume' });
        }

        console.log('Extracted text length:', resumeText.length);
        
        // Get AI analysis
        const analysis = await getAIAnalysis(resumeText, req.body.jobDescription);
        
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
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
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
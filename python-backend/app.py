# app.py - Hybrid Flask application with ML and LLM analysis
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import re
import json
import traceback
from werkzeug.utils import secure_filename
import PyPDF2
from docx import Document
import io
import numpy as np
import pandas as pd
import logging
from datetime import datetime
import openai
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.stem import WordNetLemmatizer
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize OpenAI
openai.api_key = os.getenv('OPENAI_API_KEY')
openai.base_url = os.getenv('BASE_URL', 'https://api.openai.com/v1')

# Initialize NLTK components
def initialize_nltk():
    """Download required NLTK data"""
    try:
        nltk.download('punkt', quiet=True)
        nltk.download('stopwords', quiet=True)
        nltk.download('wordnet', quiet=True)
        nltk.download('averaged_perceptron_tagger', quiet=True)
        logger.info("NLTK data downloaded successfully")
    except Exception as e:
        logger.error(f"Error downloading NLTK data: {e}")

# Initialize components
initialize_nltk()
lemmatizer = WordNetLemmatizer()

try:
    stop_words = set(stopwords.words('english'))
except:
    stop_words = set()

class HybridResumeAnalyzer:
    def __init__(self):
        self.skills_database = self.load_skills_database()
        self.common_jd_keywords = self.load_common_jd_keywords()
        self.sentence_model = self.load_sentence_transformer()
        
    def load_sentence_transformer(self):
        """Load sentence transformer model for better semantic analysis"""
        try:
            # Using a lightweight but effective model
            model = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("Sentence transformer model loaded successfully")
            return model
        except Exception as e:
            logger.error(f"Error loading sentence transformer: {e}")
            logger.info("Falling back to TF-IDF for semantic analysis")
            return None
    
    def load_skills_database(self):
        """Load comprehensive skills database categorized by domain"""
        return {
            "technical_skills": [
                "python", "java", "javascript", "typescript", "html", "css", "react", "angular", 
                "vue", "nodejs", "node.js", "express", "django", "flask", "fastapi", "spring", 
                "hibernate", "sql", "mysql", "postgresql", "mongodb", "nosql", "redis", "aws", 
                "azure", "gcp", "google cloud", "docker", "kubernetes", "jenkins", "git", "github", 
                "gitlab", "ci/cd", "machine learning", "deep learning", "artificial intelligence",
                "natural language processing", "computer vision", "tensorflow", "pytorch", "keras",
                "scikit-learn", "pandas", "numpy", "data analysis", "data science", "big data",
                "hadoop", "spark", "kafka", "elasticsearch", "kibana", "tableau", "power bi",
                "rest api", "graphql", "microservices", "devops", "cloud computing", "serverless",
                "linux", "unix", "windows", "android", "ios", "mobile development", "blockchain",
                "solidity", "smart contracts", "web3", "cybersecurity", "penetration testing"
            ],
            "soft_skills": [
                "communication", "teamwork", "leadership", "problem solving", "critical thinking",
                "decision making", "time management", "organization", "adaptability", "creativity",
                "interpersonal skills", "collaboration", "mentoring", "presentation", "analytical",
                "attention to detail", "multitasking", "customer service", "negotiation", "empathy"
            ],
            "business_skills": [
                "project management", "product management", "business analysis", "strategic planning",
                "stakeholder management", "risk management", "quality assurance", "budget management",
                "marketing", "sales", "crm", "operations", "human resources", "process improvement",
                "vendor management", "compliance", "regulatory", "financial analysis", "forecasting"
            ],
            "industry_specific": [
                "healthcare", "finance", "fintech", "e-commerce", "retail", "manufacturing",
                "automotive", "aerospace", "telecommunications", "media", "entertainment",
                "education", "research", "consulting", "startup", "enterprise"
            ]
        }

    def load_common_jd_keywords(self):
        """Load common job description keywords for better matching"""
        return {
            "experience_indicators": ["experience", "years", "minimum", "required", "preferred"],
            "education_indicators": ["bachelor", "master", "phd", "degree", "certification", "diploma"],
            "requirement_indicators": ["must", "should", "required", "essential", "mandatory", "preferred"],
            "responsibility_indicators": ["responsible", "duties", "tasks", "role", "responsibilities"],
            "action_verbs": ["develop", "design", "implement", "manage", "lead", "collaborate", "analyze"]
        }

    def preprocess_text(self, text):
        """Enhanced text preprocessing"""
        if not text:
            return ""
        
        # Convert to lowercase
        text = text.lower()
        
        # Remove URLs and email addresses
        text = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '', text)
        text = re.sub(r'\S+@\S+', '', text)
        
        # Remove special characters but keep alphanumeric and spaces
        text = re.sub(r'[^\w\s]', ' ', text)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text

    def extract_text_from_pdf(self, file_buffer):
        """Extract text from PDF file"""
        try:
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_buffer))
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text
        except Exception as e:
            logger.error(f"Error extracting PDF text: {e}")
            raise Exception("Failed to extract text from PDF")

    def extract_text_from_docx(self, file_buffer):
        """Extract text from DOCX file"""
        try:
            doc = Document(io.BytesIO(file_buffer))
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text
        except Exception as e:
            logger.error(f"Error extracting DOCX text: {e}")
            raise Exception("Failed to extract text from DOCX")

    def extract_skills_advanced(self, text):
        """Enhanced skills extraction with context awareness"""
        found_skills = {}
        text_lower = text.lower()
        
        # Flatten all skills for processing
        all_skills = []
        for category, skills in self.skills_database.items():
            all_skills.extend(skills)
        
        for skill in all_skills:
            # Check for exact matches with word boundaries
            pattern = r'\b' + re.escape(skill.lower()) + r'\b'
            if re.search(pattern, text_lower):
                # Categorize the skill
                for category, skills in self.skills_database.items():
                    if skill in skills:
                        if category not in found_skills:
                            found_skills[category] = []
                        found_skills[category].append(skill)
                        break
        
        return found_skills

    def calculate_semantic_similarity_advanced(self, text1, text2):
        """Enhanced semantic similarity using sentence transformers"""
        try:
            if self.sentence_model:
                # Use sentence transformer for better semantic understanding
                embeddings = self.sentence_model.encode([text1, text2])
                similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
                return similarity * 100
            else:
                # Fallback to TF-IDF
                return self.calculate_tfidf_similarity(text1, text2)
        except Exception as e:
            logger.error(f"Error in advanced semantic similarity: {e}")
            return self.calculate_tfidf_similarity(text1, text2)

    def calculate_tfidf_similarity(self, text1, text2):
        """Fallback TF-IDF similarity calculation"""
        try:
            processed_text1 = self.preprocess_text(text1)
            processed_text2 = self.preprocess_text(text2)
            
            if not processed_text1 or not processed_text2:
                return 0
            
            vectorizer = TfidfVectorizer(stop_words='english', max_features=1000, ngram_range=(1, 2))
            tfidf_matrix = vectorizer.fit_transform([processed_text1, processed_text2])
            
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            return similarity * 100
        except Exception as e:
            logger.error(f"Error calculating TF-IDF similarity: {e}")
            return 0

    def analyze_keyword_match_advanced(self, resume_text, job_text):
        """Advanced keyword matching with weighted importance"""
        resume_skills = self.extract_skills_advanced(resume_text)
        job_skills = self.extract_skills_advanced(job_text)
        
        # Flatten for comparison
        resume_skills_flat = []
        for skills in resume_skills.values():
            resume_skills_flat.extend(skills)
        
        job_skills_flat = []
        for skills in job_skills.values():
            job_skills_flat.extend(skills)
        
        # Weight technical skills higher
        technical_weight = 1.5
        other_weight = 1.0
        
        weighted_found = 0
        weighted_total = 0
        found_keywords = []
        missing_keywords = []
        
        for skill in set(job_skills_flat):
            weight = technical_weight if skill in self.skills_database.get('technical_skills', []) else other_weight
            weighted_total += weight
            
            if skill in resume_skills_flat:
                weighted_found += weight
                found_keywords.append(skill)
            else:
                missing_keywords.append(skill)
        
        # Calculate match score
        match_score = (weighted_found / weighted_total * 100) if weighted_total > 0 else 0
        
        return match_score, found_keywords, missing_keywords

    def analyze_experience_relevance_advanced(self, resume_text, job_text):
        """Enhanced experience relevance analysis"""
        try:
            # Extract requirements from job description
            job_sentences = sent_tokenize(job_text)
            resume_sentences = sent_tokenize(resume_text)
            
            # Filter for meaningful requirements
            requirements = []
            requirement_indicators = self.common_jd_keywords['requirement_indicators']
            responsibility_indicators = self.common_jd_keywords['responsibility_indicators']
            
            for sentence in job_sentences:
                if len(sentence.strip()) > 30:  # Meaningful sentence length
                    if any(indicator in sentence.lower() for indicator in requirement_indicators + responsibility_indicators):
                        requirements.append(sentence.strip())
            
            # Take top requirements
            requirements = requirements[:5] if requirements else ["General job requirements"]
            
            details = []
            for req in requirements:
                # Find best matching evidence using advanced similarity
                best_match = ""
                best_score = 0
                
                for res_sentence in resume_sentences:
                    if len(res_sentence.strip()) > 30:
                        score = self.calculate_semantic_similarity_advanced(req, res_sentence)
                        if score > best_score:
                            best_score = score
                            best_match = res_sentence.strip()
                
                # Determine match strength with refined thresholds
                if best_score > 75:
                    strength = "Strong"
                elif best_score > 50:
                    strength = "Partial"
                else:
                    strength = "Weak"
                    best_match = "No direct evidence found"
                
                details.append({
                    "jdRequirement": req,
                    "resumeEvidence": best_match,
                    "matchStrength": strength
                })
            
            # Generate summary
            strong_matches = sum(1 for d in details if d["matchStrength"] == "Strong")
            partial_matches = sum(1 for d in details if d["matchStrength"] == "Partial")
            total_reqs = len(details)
            
            if strong_matches >= total_reqs * 0.7:
                summary = f"Excellent alignment with {strong_matches} out of {total_reqs} key requirements strongly matched."
            elif (strong_matches + partial_matches) >= total_reqs * 0.7:
                summary = f"Good alignment with {strong_matches + partial_matches} out of {total_reqs} requirements showing relevant experience."
            else:
                summary = f"Limited alignment with only {strong_matches} out of {total_reqs} requirements strongly matched."
            
            return {
                "summary": summary,
                "details": details
            }
        
        except Exception as e:
            logger.error(f"Error in advanced experience relevance analysis: {e}")
            return {
                "summary": "Unable to analyze experience relevance due to processing error.",
                "details": [{
                    "jdRequirement": "General job requirements",
                    "resumeEvidence": "Resume analysis unavailable",
                    "matchStrength": "Weak"
                }]
            }

    def calculate_ats_formatting_score_advanced(self, resume_text):
        """Enhanced ATS formatting score with detailed analysis"""
        score = 100
        feedback_points = []
        positive_points = []
        
        # Length analysis
        text_length = len(resume_text)
        if text_length < 800:
            score -= 25
            feedback_points.append("Resume appears too short for comprehensive evaluation")
        elif text_length > 4000:
            score -= 15
            feedback_points.append("Resume may be too long for optimal ATS parsing")
        else:
            positive_points.append("Appropriate length for ATS systems")
        
        # Section analysis
        section_keywords = {
            "summary": ["summary", "objective", "profile"],
            "experience": ["experience", "work", "employment", "professional"],
            "education": ["education", "degree", "university", "college"],
            "skills": ["skills", "competencies", "technical", "proficiencies"],
            "projects": ["projects", "portfolio"],
            "certifications": ["certification", "certificate", "license"]
        }
        
        found_sections = 0
        for section, keywords in section_keywords.items():
            if any(keyword in resume_text.lower() for keyword in keywords):
                found_sections += 1
        
        if found_sections < 3:
            score -= 20
            feedback_points.append("Missing essential resume sections")
        elif found_sections >= 4:
            positive_points.append("Well-structured with clear sections")
        
        # Structure analysis
        bullet_count = resume_text.count('•') + resume_text.count('-') + resume_text.count('*')
        if bullet_count < 8:
            score -= 15
            feedback_points.append("Consider using more bullet points for better readability")
        else:
            positive_points.append("Good use of bullet points for structure")
        
        # Contact information analysis
        contact_indicators = ["email", "@", "phone", "linkedin", "github"]
        contact_found = sum(1 for indicator in contact_indicators if indicator in resume_text.lower())
        if contact_found < 2:
            score -= 10
            feedback_points.append("Ensure contact information is clearly present")
        
        # Generate comprehensive feedback
        if score >= 85:
            feedback = f"Excellent ATS compatibility. {' '.join(positive_points)}"
        elif score >= 70:
            feedback = f"Good ATS formatting. {' '.join(positive_points)} Areas for improvement: {' '.join(feedback_points[:2])}"
        else:
            feedback = f"ATS formatting needs improvement. Focus on: {' '.join(feedback_points[:3])}"
        
        return {
            "score": max(0, min(100, score)),
            "feedback": feedback
        }

    def prepare_llm_context(self, keyword_score, experience_score, ats_score, found_keywords, missing_keywords):
        """Prepare context for LLM with scoring methodology"""
        scoring_context = f"""
PYTHON ML ANALYSIS RESULTS:

Overall Scoring Methodology:
- Keyword Match: {keyword_score:.1f}% (40% weight) - Calculated using weighted skill matching with technical skills given 1.5x importance
- Experience Relevance: {experience_score:.1f}% (30% weight) - Measured using semantic similarity between job requirements and resume content
- ATS Formatting: {ats_score}% (30% weight) - Based on structure, length, sections, and formatting best practices

Detailed Findings:
✓ Found Keywords ({len(found_keywords)}): {', '.join(found_keywords[:10])}{'...' if len(found_keywords) > 10 else ''}
✗ Missing Keywords ({len(missing_keywords)}): {', '.join(missing_keywords[:10])}{'...' if len(missing_keywords) > 10 else ''}

Technical Analysis Notes:
- Used sentence transformers for semantic similarity when available
- Applied domain-specific skill categorization
- Weighted technical skills higher than soft skills
- Analyzed resume structure and ATS compatibility factors
"""
        return scoring_context

    async def get_llm_analysis(self, resume_text, job_description, ml_context):
        """Get enhanced analysis from LLM using ML context"""
        system_prompt = f"""You are an expert ATS and career coach. You have received preliminary analysis from an ML system. Use this data to provide a comprehensive, encouraging report.

{ml_context}

Your output MUST be a valid JSON object with this structure:

{{
  "overallScore": <integer 0-100, consider the ML scores but adjust based on qualitative analysis>,
  "keywordAnalysis": {{
    "foundKeywords": ["<list of important keywords found>"],
    "missingKeywords": ["<list of critical missing keywords>"]
  }},
  "experienceRelevance": {{
    "summary": "<2-3 sentence summary of experience alignment>",
    "details": [
      {{
        "jdRequirement": "<key requirement from job description>",
        "resumeEvidence": "<matching evidence from resume or 'No direct evidence found'>",
        "matchStrength": "<Strong/Partial/Weak>"
      }}
    ]
  }},
  "atsFormattingScore": {{
    "score": <integer 0-100>,
    "feedback": "<brief explanation of formatting assessment>"
  }},
  "actionableAdvice": [
    "<specific, encouraging improvement suggestion>",
    "<concrete advice for better keyword alignment>",
    "<formatting or experience enhancement tip>"
  ]
}}

Instructions:
1. Use the ML analysis as a foundation but apply human-like qualitative judgment
2. Be encouraging and constructive in feedback
3. Provide specific, actionable advice
4. Focus on the most impactful improvements
5. Ensure JSON is valid and complete"""

        user_prompt = f"""Analyze this resume against the job description:

RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}"""

        try:
            client = openai.OpenAI(
                api_key=openai.api_key,
                base_url=openai.base_url
            )
            
            response = client.chat.completions.create(
                model=os.getenv('ANALYSIS_MODEL', 'gpt-3.5-turbo'),
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            analysis = json.loads(response.choices[0].message.content)
            logger.info('LLM analysis completed successfully')
            return analysis
            
        except Exception as e:
            logger.error(f"LLM analysis error: {e}")
            # Return enhanced ML-based fallback
            return self.create_fallback_analysis(resume_text, job_description)

    def create_fallback_analysis(self, resume_text, job_description):
        """Create comprehensive fallback analysis using only ML techniques"""
        # Perform full ML analysis
        keyword_score, found_keywords, missing_keywords = self.analyze_keyword_match_advanced(resume_text, job_description)
        experience_relevance = self.analyze_experience_relevance_advanced(resume_text, job_description)
        ats_formatting = self.calculate_ats_formatting_score_advanced(resume_text)
        
        # Calculate experience score from relevance analysis
        strong_matches = sum(1 for d in experience_relevance["details"] if d["matchStrength"] == "Strong")
        partial_matches = sum(1 for d in experience_relevance["details"] if d["matchStrength"] == "Partial")
        total_matches = len(experience_relevance["details"])
        experience_score = ((strong_matches * 100 + partial_matches * 60) / total_matches) if total_matches > 0 else 0
        
        # Calculate overall score
        overall_score = int(0.4 * keyword_score + 0.3 * experience_score + 0.3 * ats_formatting["score"])
        
        # Generate actionable advice
        advice = []
        if len(missing_keywords) > 0:
            advice.append(f"Incorporate these relevant keywords naturally: {', '.join(missing_keywords[:5])}")
        if experience_score < 70:
            advice.append("Strengthen experience descriptions with specific examples and quantifiable achievements")
        if ats_formatting["score"] < 80:
            advice.append("Improve ATS compatibility with cleaner formatting and standard section headers")
        if not advice:
            advice.append("Focus on tailoring your resume more specifically to this job description")
        
        return {
            "overallScore": overall_score,
            "keywordAnalysis": {
                "foundKeywords": found_keywords,
                "missingKeywords": missing_keywords
            },
            "experienceRelevance": experience_relevance,
            "atsFormattingScore": ats_formatting,
            "actionableAdvice": advice[:4]
        }

    def analyze_resume_hybrid(self, resume_text, job_description):
        """Main hybrid analysis combining ML and LLM"""
        try:
            logger.info("Starting hybrid resume analysis...")
            
            # Step 1: ML Analysis
            logger.info("Performing ML analysis...")
            keyword_score, found_keywords, missing_keywords = self.analyze_keyword_match_advanced(resume_text, job_description)
            experience_relevance = self.analyze_experience_relevance_advanced(resume_text, job_description)
            ats_formatting = self.calculate_ats_formatting_score_advanced(resume_text)
            
            # Calculate experience score for context
            strong_matches = sum(1 for d in experience_relevance["details"] if d["matchStrength"] == "Strong")
            partial_matches = sum(1 for d in experience_relevance["details"] if d["matchStrength"] == "Partial")
            total_matches = len(experience_relevance["details"])
            experience_score = ((strong_matches * 100 + partial_matches * 60) / total_matches) if total_matches > 0 else 0
            
            # Step 2: Prepare LLM context
            ml_context = self.prepare_llm_context(keyword_score, experience_score, ats_formatting["score"], found_keywords, missing_keywords)
            
            # Step 3: LLM Enhancement (async call)
            try:
                import asyncio
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                result = loop.run_until_complete(self.get_llm_analysis(resume_text, job_description, ml_context))
                loop.close()
                logger.info("Hybrid analysis completed successfully")
                return result
            except Exception as llm_error:
                logger.warning(f"LLM analysis failed, using enhanced ML fallback: {llm_error}")
                return self.create_fallback_analysis(resume_text, job_description)
            
        except Exception as e:
            logger.error(f"Error in hybrid analysis: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise Exception("Failed to analyze resume")

# Initialize analyzer
analyzer = HybridResumeAnalyzer()

@app.route('/health', methods=['GET'])
def health_check():
    """Enhanced health check endpoint"""
    return jsonify({
        "status": "OK",
        "timestamp": datetime.now().isoformat(),
        "nltk_available": bool(stop_words),
        "sentence_transformer_available": analyzer.sentence_model is not None,
        "openai_configured": bool(openai.api_key),
        "version": "2.0.0-hybrid"
    })

@app.route('/api/analyze', methods=['POST'])
def analyze_resume():
    """Main hybrid analysis endpoint"""
    try:
        # Validate request
        if 'resume' not in request.files:
            return jsonify({"error": "No resume file provided"}), 400
        
        if 'jobDescription' not in request.form:
            return jsonify({"error": "No job description provided"}), 400
        
        resume_file = request.files['resume']
        job_description = request.form['jobDescription']
        
        if resume_file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        # Extract text from resume
        file_buffer = resume_file.read()
        mime_type = resume_file.content_type
        
        if mime_type == 'application/pdf':
            resume_text = analyzer.extract_text_from_pdf(file_buffer)
        elif mime_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            resume_text = analyzer.extract_text_from_docx(file_buffer)
        else:
            return jsonify({"error": "Unsupported file type. Please upload PDF or DOCX."}), 400
        
        if not resume_text or len(resume_text.strip()) < 100:
            return jsonify({"error": "Could not extract sufficient text from resume"}), 400
        
        logger.info(f"Extracted {len(resume_text)} characters from resume")
        
        # Perform hybrid analysis
        results = analyzer.analyze_resume_hybrid(resume_text, job_description)
        
        return jsonify(results)
        
    except Exception as e:
        logger.error(f"Analysis error: {str(e)}")
        return jsonify({
            "error": "Analysis failed",
            "details": str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 3001))
    app.run(debug=True, host='0.0.0.0', port=port)
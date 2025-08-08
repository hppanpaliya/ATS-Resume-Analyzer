# app.py - Main Flask application
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import re
import nltk
import spacy
import json
import traceback
from werkzeug.utils import secure_filename
import PyPDF2
from docx import Document
import io
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.stem import WordNetLemmatizer
import logging
import pandas as pd

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

# Initialize spaCy
def initialize_spacy():
    """Load spaCy model"""
    try:
        return spacy.load('en_core_web_sm')
    except IOError:
        logger.error("spaCy model not found. Please install with: python -m spacy download en_core_web_sm")
        return None

# Initialize components
initialize_nltk()
nlp = initialize_spacy()
lemmatizer = WordNetLemmatizer()

try:
    stop_words = set(stopwords.words('english'))
except:
    stop_words = set()

class ResumeAnalyzer:
    def __init__(self):
        self.skills_database = self.load_skills_database()
        self.common_jd_keywords = self.load_common_jd_keywords()
    
    def load_skills_database(self):
        """Load comprehensive skills database"""
        tech_skills = [
            "python", "java", "javascript", "typescript", "html", "css", "react", "angular", 
            "vue", "nodejs", "node.js", "express", "django", "flask", "fastapi", "spring", 
            "hibernate", "sql", "mysql", "postgresql", "mongodb", "nosql", "redis", "aws", 
            "azure", "gcp", "google cloud", "docker", "kubernetes", "jenkins", "git", "github", 
            "gitlab", "ci/cd", "machine learning", "deep learning", "artificial intelligence",
            "natural language processing", "computer vision", "tensorflow", "pytorch", "keras",
            "scikit-learn", "pandas", "numpy", "data analysis", "data science", "big data",
            "hadoop", "spark", "kafka", "elasticsearch", "kibana", "tableau", "power bi",
            "rest api", "graphql", "microservices", "devops", "cloud computing", "serverless",
            "linux", "unix", "windows", "android", "ios", "mobile development", "agile", "scrum"
        ]

        soft_skills = [
            "communication", "teamwork", "leadership", "problem solving", "critical thinking",
            "decision making", "time management", "organization", "adaptability", "creativity",
            "interpersonal skills", "collaboration", "mentoring", "presentation", "analytical",
            "attention to detail", "multitasking", "customer service", "project management"
        ]

        business_skills = [
            "project management", "product management", "business analysis", "strategic planning",
            "stakeholder management", "risk management", "quality assurance", "budget management",
            "marketing", "sales", "crm", "operations", "human resources", "process improvement"
        ]

        return tech_skills + soft_skills + business_skills

    def load_common_jd_keywords(self):
        """Load common job description keywords for better matching"""
        return [
            "experience", "years", "bachelor", "master", "degree", "certification",
            "required", "preferred", "essential", "responsibilities", "duties",
            "collaborate", "develop", "design", "implement", "manage", "lead"
        ]

    def preprocess_text(self, text):
        """Clean and preprocess text"""
        if not text:
            return ""
        
        # Convert to lowercase
        text = text.lower()
        
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

    def extract_skills(self, text):
        """Extract skills from text"""
        found_skills = []
        text_lower = text.lower()
        
        for skill in self.skills_database:
            # Check for exact matches (case insensitive)
            if skill.lower() in text_lower:
                # Use word boundaries to avoid partial matches
                pattern = r'\b' + re.escape(skill.lower()) + r'\b'
                if re.search(pattern, text_lower):
                    found_skills.append(skill)
        
        return list(set(found_skills))

    def calculate_keyword_similarity(self, resume_text, job_text):
        """Calculate similarity based on keywords"""
        resume_skills = self.extract_skills(resume_text)
        job_skills = self.extract_skills(job_text)
        
        # Find matching skills
        found_keywords = [skill for skill in resume_skills if skill in job_skills]
        missing_keywords = [skill for skill in job_skills if skill not in resume_skills]
        
        # Calculate match percentage
        if not job_skills:
            match_score = 0
        else:
            match_score = (len(found_keywords) / len(job_skills)) * 100
        
        return match_score, found_keywords, missing_keywords

    def calculate_semantic_similarity(self, text1, text2):
        """Calculate semantic similarity using TF-IDF"""
        try:
            processed_text1 = self.preprocess_text(text1)
            processed_text2 = self.preprocess_text(text2)
            
            if not processed_text1 or not processed_text2:
                return 0
            
            vectorizer = TfidfVectorizer(stop_words='english', max_features=1000)
            tfidf_matrix = vectorizer.fit_transform([processed_text1, processed_text2])
            
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            return similarity * 100
        except Exception as e:
            logger.error(f"Error calculating semantic similarity: {e}")
            return 0

    def analyze_experience_relevance(self, resume_text, job_text):
        """Analyze experience relevance"""
        try:
            # Extract key requirements from job description
            job_sentences = sent_tokenize(job_text)
            resume_sentences = sent_tokenize(resume_text)
            
            # Look for experience-related keywords
            exp_keywords = ["experience", "years", "worked", "developed", "managed", "led"]
            req_keywords = ["required", "must", "should", "preferred", "essential"]
            
            requirements = []
            for sentence in job_sentences:
                if sentence and len(sentence.strip()) > 20:  # Filter out very short sentences
                    if any(keyword in sentence.lower() for keyword in req_keywords + exp_keywords):
                        requirements.append(sentence.strip())
            
            # Take top 3-5 requirements
            requirements = requirements[:5] if requirements else ["General experience requirements"]
            
            details = []
            for req in requirements:
                # Find best matching evidence in resume
                best_match = ""
                best_score = 0
                
                for res_sentence in resume_sentences:
                    if res_sentence and len(res_sentence.strip()) > 20:
                        score = self.calculate_semantic_similarity(req, res_sentence)
                        if score > best_score:
                            best_score = score
                            best_match = res_sentence.strip()
                
                # Determine match strength
                if best_score > 70:
                    strength = "Strong"
                elif best_score > 40:
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
            total_reqs = len(details)
            
            if strong_matches >= total_reqs * 0.7:
                summary = f"Strong alignment with {strong_matches} out of {total_reqs} key requirements well matched."
            elif strong_matches >= total_reqs * 0.4:
                summary = f"Good alignment with {strong_matches} out of {total_reqs} requirements showing relevant experience."
            else:
                summary = f"Limited alignment with only {strong_matches} out of {total_reqs} requirements strongly matched."
            
            return {
                "summary": summary,
                "details": details
            }
        
        except Exception as e:
            logger.error(f"Error in experience relevance analysis: {e}")
            # Return a default response
            return {
                "summary": "Unable to analyze experience relevance due to text processing error.",
                "details": [{
                    "jdRequirement": "General job requirements",
                    "resumeEvidence": "Resume content analysis unavailable",
                    "matchStrength": "Weak"
                }]
            }

    def calculate_ats_formatting_score(self, resume_text):
        """Calculate ATS formatting score based on text analysis"""
        score = 100
        feedback_points = []
        
        # Check for good practices
        if len(resume_text) < 500:
            score -= 20
            feedback_points.append("Resume appears too short")
        
        if len(resume_text) > 5000:
            score -= 10
            feedback_points.append("Resume may be too long for optimal ATS parsing")
        
        # Check for section headers
        section_keywords = ["experience", "education", "skills", "summary"]
        found_sections = sum(1 for keyword in section_keywords if keyword in resume_text.lower())
        
        if found_sections < 3:
            score -= 15
            feedback_points.append("Missing some standard resume sections")
        
        # Check for bullet points or structured content
        if resume_text.count('•') + resume_text.count('-') + resume_text.count('*') < 5:
            score -= 10
            feedback_points.append("Consider using more bullet points for better structure")
        
        # Positive feedback
        positive_points = []
        if len(resume_text) >= 800 and len(resume_text) <= 3000:
            positive_points.append("Good length for ATS systems")
        
        if found_sections >= 4:
            positive_points.append("Well-structured with clear sections")
        
        # Generate feedback
        if score >= 85:
            feedback = "Excellent ATS compatibility. " + " ".join(positive_points)
        elif score >= 70:
            feedback = "Good ATS formatting with minor improvements needed. " + " ".join(feedback_points[:2])
        else:
            feedback = "ATS formatting needs improvement. " + " ".join(feedback_points)
        
        return {
            "score": max(0, min(100, score)),
            "feedback": feedback
        }

    def generate_actionable_advice(self, keyword_score, missing_keywords, experience_relevance, ats_score):
        """Generate actionable advice based on analysis"""
        advice = []
        
        # Keyword advice
        if keyword_score < 50 and missing_keywords:
            advice.append(f"Add these important keywords to your resume: {', '.join(missing_keywords[:5])}. Make sure they accurately reflect your experience.")
        elif missing_keywords:
            advice.append(f"Consider adding these relevant skills if you have them: {', '.join(missing_keywords[:3])}.")
        
        # Experience advice
        weak_matches = [d for d in experience_relevance["details"] if d["matchStrength"] == "Weak"]
        if len(weak_matches) > 2:
            advice.append("Strengthen your experience descriptions with more specific examples and quantifiable achievements that match the job requirements.")
        
        # ATS formatting advice
        if ats_score["score"] < 80:
            advice.append("Improve your resume's ATS compatibility by using standard section headers and a clean, simple format.")
        
        # General advice
        if keyword_score > 70:
            advice.append("Your keyword match is strong! Focus on tailoring your experience descriptions to better showcase relevant accomplishments.")
        else:
            advice.append("Review the job description carefully and incorporate more relevant keywords naturally into your experience and skills sections.")
        
        return advice[:4]  # Limit to 4 pieces of advice

    def analyze_resume(self, resume_text, job_description):
        """Main analysis function"""
        try:
            logger.info("Starting resume analysis...")
            
            # Calculate keyword analysis
            logger.info("Calculating keyword similarity...")
            keyword_score, found_keywords, missing_keywords = self.calculate_keyword_similarity(
                resume_text, job_description
            )
            logger.info(f"Keyword analysis complete. Score: {keyword_score}")
            
            # Calculate semantic similarity
            logger.info("Calculating semantic similarity...")
            semantic_score = self.calculate_semantic_similarity(resume_text, job_description)
            logger.info(f"Semantic analysis complete. Score: {semantic_score}")
            
            # Analyze experience relevance
            logger.info("Analyzing experience relevance...")
            experience_relevance = self.analyze_experience_relevance(resume_text, job_description)
            logger.info("Experience relevance analysis complete.")
            
            # Calculate ATS formatting score
            logger.info("Calculating ATS formatting score...")
            ats_formatting = self.calculate_ats_formatting_score(resume_text)
            logger.info(f"ATS formatting analysis complete. Score: {ats_formatting['score']}")
            
            # Calculate overall score (weighted average)
            overall_score = int(
                0.4 * keyword_score + 
                0.3 * semantic_score + 
                0.3 * ats_formatting["score"]
            )
            logger.info(f"Overall score calculated: {overall_score}")
            
            # Generate actionable advice
            logger.info("Generating actionable advice...")
            actionable_advice = self.generate_actionable_advice(
                keyword_score, missing_keywords, experience_relevance, ats_formatting
            )
            logger.info("Actionable advice generated.")
            
            result = {
                "overallScore": overall_score,
                "keywordAnalysis": {
                    "foundKeywords": found_keywords,
                    "missingKeywords": missing_keywords
                },
                "experienceRelevance": experience_relevance,
                "atsFormattingScore": ats_formatting,
                "actionableAdvice": actionable_advice
            }
            
            logger.info("Resume analysis completed successfully.")
            return result
            
        except Exception as e:
            logger.error(f"Error in resume analysis: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise Exception("Failed to analyze resume")

# Initialize analyzer
analyzer = ResumeAnalyzer()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    from datetime import datetime
    return jsonify({
        "status": "OK",
        "timestamp": datetime.now().isoformat(),
        "nltk_available": bool(stop_words),
        "spacy_available": nlp is not None
    })

@app.route('/api/analyze', methods=['POST'])
def analyze_resume():
    """Main analysis endpoint"""
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
        
        # Perform analysis
        results = analyzer.analyze_resume(resume_text, job_description)
        
        return jsonify(results)
        
    except Exception as e:
        logger.error(f"Analysis error: {str(e)}")
        return jsonify({
            "error": "Analysis failed",
            "details": str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=3001)
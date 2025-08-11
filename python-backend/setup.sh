#!/bin/bash

echo "Setting up ATS Resume Analyzer Hybrid Backend..."

# Create virtual environment
echo "Creating virtual environment..."
python -m venv ats_env

# Activate virtual environment
echo "Activating virtual environment..."
source ats_env/bin/activate  # On Windows: ats_env\Scripts\activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "Installing requirements..."
pip install -r requirements.txt

# Download spaCy model
echo "Downloading spaCy English model..."
python -m spacy download en_core_web_sm

# Download NLTK data
echo "Downloading NLTK data..."
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords'); nltk.download('wordnet'); nltk.download('averaged_perceptron_tagger')"

# Download sentence-transformers model (will download on first use)
echo "Pre-downloading BERT model..."
python -c "from sentence_transformers import SentenceTransformer; model = SentenceTransformer('all-MiniLM-L6-v2'); print('BERT model downloaded successfully')"

echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Create a .env file with your OpenAI API key"
echo "2. Run the server with: python app.py"
echo "3. The server will be available at http://localhost:3001"

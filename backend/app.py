from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import pipeline
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
import torch
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Download required NLTK data
nltk.download('punkt')
nltk.download('stopwords')

app = Flask(__name__)
CORS(app)

# Initialize sentiment analysis pipeline
sentiment_analyzer = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")

# Initialize text classification pipeline for content filtering
content_classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

# Load stopwords
stop_words = set(stopwords.words('english'))

def analyze_content(text: str) -> dict:
    """
    Analyze content using multiple NLP models
    """
    # Sentiment analysis
    sentiment_result = sentiment_analyzer(text[:512])[0]
    
    # Content classification
    categories = ["spam", "advertisement", "political", "entertainment", "news"]
    classification_result = content_classifier(text[:512], categories, multi_label=True)
    
    # Extract key terms (simple implementation)
    tokens = word_tokenize(text.lower())
    key_terms = [token for token in tokens if token not in stop_words and len(token) > 2]
    
    return {
        "sentiment": sentiment_result,
        "categories": dict(zip(classification_result["labels"], classification_result["scores"])),
        "key_terms": key_terms[:10]  # Top 10 key terms
    }

@app.route('/api/analyze', methods=['POST'])
def analyze():
    try:
        data = request.get_json()
        content = data.get('content', '')
        
        if not content:
            return jsonify({"error": "No content provided"}), 400
            
        analysis_result = analyze_content(content)
        
        # Determine if content should be blocked based on analysis
        should_block = (
            analysis_result["sentiment"]["label"] == "NEGATIVE" and 
            analysis_result["sentiment"]["score"] > 0.8 or
            analysis_result["categories"]["spam"] > 0.7 or
            analysis_result["categories"]["advertisement"] > 0.8
        )
        
        return jsonify({
            "should_block": should_block,
            "analysis": analysis_result,
            "reason": "Content matches blocking criteria" if should_block else "Content is acceptable"
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"})

if __name__ == '__main__':
    app.run(debug=True, port=5000) 
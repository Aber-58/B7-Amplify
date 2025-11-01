from transformers import pipeline
import logging
import re
from typing import Optional, List

logger = logging.getLogger(__name__)

# Configuration constants
# For 5-class model, only filter extremely low confidence (< 0.3)
# Random chance is 20%, so 0.3 is very low
MIN_CONFIDENCE_THRESHOLD = 0.3  # Only for extreme uncertainty
MIN_TEXT_LENGTH = 3
MAX_TEXT_LENGTH = 5000


class SentimentAnalyzer:
    """
    Professional sentiment analysis using Hugging Face model.
    Features:
    - Enhanced preprocessing (text cleaning, normalization)
    - Confidence threshold validation
    - Input validation
    - Batch processing support
    - Improved error handling
    - Automatic neutral detection for low-confidence predictions
    """
    
    _instance = None
    _analyzer = None
    
    def __new__(cls):
        """Singleton pattern to ensure only one instance exists"""
        if cls._instance is None:
            cls._instance = super(SentimentAnalyzer, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize the analyzer (model is loaded lazily)"""
        if self._analyzer is None:
            self._load_model()
    
    def _load_model(self):
        """Load the sentiment analysis model from Hugging Face"""
        try:
            model_name = "tabularisai/multilingual-sentiment-analysis"
            logger.info("Loading sentiment analysis model: %s", model_name)
            self._analyzer = pipeline(
                'sentiment-analysis',
                model=model_name,
                # Use CPU (-1), change to 0+ for GPU if available
                device=-1,
                # Only return top prediction
                return_all_scores=False
            )
            logger.info("Model loaded successfully")
        except Exception as e:
            logger.error(
                "Error loading sentiment analysis model: %s",
                e,
                exc_info=True
            )
            raise
    
    def _preprocess_text(self, text: str) -> str:
        """
        Clean and normalize text for sentiment analysis.
        
        Args:
            text: Raw input text
            
        Returns:
            Preprocessed text ready for analysis
        """
        if not text:
            return ""
        
        # Remove URLs
        text = re.sub(r'http\S+|www\.\S+', '', text)
        
        # Remove email addresses
        text = re.sub(r'\S+@\S+', '', text)
        
        # Normalize whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove leading/trailing whitespace
        text = text.strip()
        
        return text
    
    def _validate_input(self, text: str) -> tuple[bool, Optional[str]]:
        """
        Validate input text quality.
        
        Args:
            text: Text to validate
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not text or not text.strip():
            return False, "Text is empty"
        
        text_length = len(text.strip())

        if text_length < MIN_TEXT_LENGTH:
            msg = f"Text too short (minimum {MIN_TEXT_LENGTH} characters)"
            return False, msg

        if text_length > MAX_TEXT_LENGTH:
            msg = f"Text too long (maximum {MAX_TEXT_LENGTH} characters)"
            return False, msg
        
        return True, None
    
    def _process_result(self, result: dict, original_text: str) -> dict:
        """
        Process raw model output and apply validation rules.

        This model is a 5-class classifier (Very Negative, Negative,
        Neutral, Positive, Very Positive). We map to 3 classes and
        trust the model's prediction unless confidence is extremely low.

        Args:
            result: Raw model output
            original_text: Original input text for context (unused)

        Returns:
            Processed sentiment result
        """
        _ = original_text  # Acknowledge parameter even if unused
        label = result.get('label', '').upper()
        score = float(result.get('score', 0.5))
        
        # Map 5-class model labels to our 3-class system
        # Model returns: Very Negative, Negative, Neutral,
        # Positive, Very Positive
        label_mapping = {
            'VERY NEGATIVE': 'NEGATIVE',
            'VERY_NEGATIVE': 'NEGATIVE',
            'NEGATIVE': 'NEGATIVE',
            'NEG': 'NEGATIVE',
            'NEUTRAL': 'NEUTRAL',
            'NEU': 'NEUTRAL',
            'POSITIVE': 'POSITIVE',
            'POS': 'POSITIVE',
            'VERY POSITIVE': 'POSITIVE',
            'VERY_POSITIVE': 'POSITIVE'
        }
        
        # Get normalized label (map 5-class to 3-class)
        normalized_label = label_mapping.get(label, label)
        
        # For multi-class model (5 classes), random chance is 20%
        # Only filter if confidence is extremely low (< 0.3)
        # A score of 0.54 for NEGATIVE in 5-class is actually good confidence
        if score < MIN_CONFIDENCE_THRESHOLD:
            # Extremely low confidence - might be uncertain
            confidence_level = 'low'
            # Only mark as neutral if we can't determine sentiment from label
            if normalized_label not in ['POSITIVE', 'NEGATIVE', 'NEUTRAL']:
                normalized_label = 'NEUTRAL'
                score = 0.5
        elif score >= 0.7:
            confidence_level = 'high'
        else:
            confidence_level = 'medium'
        
        # Determine sentiment from normalized label
        if normalized_label in ['POSITIVE']:
            sentiment = 'positive'
        elif normalized_label in ['NEGATIVE']:
            sentiment = 'negative'
        else:
            sentiment = 'neutral'
        
        return {
            'label': normalized_label,
            'score': float(score),
            'sentiment': sentiment,
            'confidence': confidence_level,
            'original_label': label,  # Keep original for debugging
            'original_score': score
        }
    
    def _get_error_result(self, error: Exception, text: str) -> dict:
        """
        Generate error result with proper logging.

        Args:
            error: Exception that occurred
            text: Input text that caused the error

        Returns:
            Error result dictionary
        """
        logger.error(
            "Error analyzing sentiment for text (length: %d): %s",
            len(text),
            error,
            exc_info=True
        )
        return {
            'label': 'ERROR',
            'score': 0.0,
            'sentiment': 'error',
            'confidence': 'none',
            'error': str(error),
            'error_type': type(error).__name__
        }
    
    def analyze(self, text: str) -> dict:
        """
        Analyze sentiment of the given text.
        
        Args:
            text: The text to analyze
            
        Returns:
            dict: Contains sentiment analysis results with:
                - label: The sentiment label (POSITIVE, NEGATIVE, NEUTRAL, ERROR)
                - score: The confidence score (0.0 to 1.0)
                - sentiment: Normalized sentiment label in lowercase
                - confidence: Confidence level (high/low/none)
                - Additional metadata for low-confidence or error cases
        """
        # Input validation
        is_valid, error_msg = self._validate_input(text)
        if not is_valid:
            logger.warning("Invalid input: %s", error_msg)
            return {
                'label': 'ERROR',
                'score': 0.0,
                'sentiment': 'error',
                'confidence': 'none',
                'error': error_msg
            }
        
        # Preprocess text
        processed_text = self._preprocess_text(text)
        
        # Check if preprocessing resulted in empty text
        if not processed_text or not processed_text.strip():
            return {
                'label': 'NEUTRAL',
                'score': 0.5,
                'sentiment': 'neutral',
                'confidence': 'none',
                'note': 'Text contained only URLs, emails, or whitespace'
            }
        
        try:
            # Ensure model is loaded
            if self._analyzer is None:
                self._load_model()
            
            # Analyze the text
            result = self._analyzer(processed_text)[0]
            
            # Process and validate result
            return self._process_result(result, processed_text)
            
        except Exception as e:
            return self._get_error_result(e, text)
    
    def analyze_batch(self, texts: List[str]) -> List[dict]:
        """
        Analyze multiple texts efficiently in batch.
        
        Args:
            texts: List of texts to analyze
            
        Returns:
            List of sentiment analysis results (one per input text)
        """
        if not texts:
            return []
        
        try:
            # Ensure model is loaded
            if self._analyzer is None:
                self._load_model()
            
            # Filter and preprocess texts
            valid_texts = []
            text_indices = []
            
            for i, text in enumerate(texts):
                is_valid, _ = self._validate_input(text)
                if is_valid:
                    processed = self._preprocess_text(text)
                    if processed and processed.strip():
                        valid_texts.append(processed)
                        text_indices.append(i)
            
            if not valid_texts:
                # All texts were invalid
                return [self.analyze(text) for text in texts]
            
            # Batch analyze valid texts
            try:
                results = self._analyzer(valid_texts)
                processed_results = []
                result_idx = 0
                
                for i, text in enumerate(texts):
                    if i in text_indices:
                        # Valid text - use batch result
                        if isinstance(results[result_idx], dict):
                            result = results[result_idx]
                        else:
                            result = results[result_idx][0]
                        processed_results.append(
                            self._process_result(result, text)
                        )
                        result_idx += 1
                    else:
                        # Invalid text - analyze individually
                        processed_results.append(self.analyze(text))
                
                return processed_results
                
            except Exception as e:
                logger.error("Batch analysis error: %s", e, exc_info=True)
                # Fallback to individual analysis
                return [self.analyze(text) for text in texts]

        except Exception as e:
            logger.error("Error in batch analysis: %s", e, exc_info=True)
            # Fallback to individual analysis
            return [self.analyze(text) for text in texts]
    
    def get_sentiment_stats(self, results: List[dict]) -> dict:
        """
        Calculate aggregate sentiment statistics from multiple results.
        
        Args:
            results: List of sentiment analysis results
            
        Returns:
            Dictionary with aggregated statistics
        """
        if not results:
            return {
                'total': 0,
                'positive': 0,
                'negative': 0,
                'neutral': 0,
                'errors': 0,
                'positive_percent': 0.0,
                'negative_percent': 0.0,
                'neutral_percent': 0.0,
                'bias': 0.0  # Positive = 1.0, Neutral = 0.0, Negative = -1.0
            }
        
        stats = {
            'total': len(results),
            'positive': 0,
            'negative': 0,
            'neutral': 0,
            'errors': 0,
            'total_score': 0.0
        }
        
        for result in results:
            sentiment = result.get('sentiment', 'error')
            if sentiment == 'positive':
                stats['positive'] += 1
            elif sentiment == 'negative':
                stats['negative'] += 1
            elif sentiment == 'neutral':
                stats['neutral'] += 1
            else:
                stats['errors'] += 1
            
            # Accumulate scores (excluding errors and low confidence)
            if result.get('confidence') == 'high':
                score = result.get('score', 0.5)
                label = result.get('label', 'NEUTRAL')
                if label == 'POSITIVE':
                    stats['total_score'] += score
                elif label == 'NEGATIVE':
                    stats['total_score'] += (1 - score)
                else:
                    stats['total_score'] += 0.5
        
        # Calculate percentages
        valid_count = stats['total'] - stats['errors']
        if valid_count > 0:
            stats['positive_percent'] = (stats['positive'] / valid_count) * 100
            stats['negative_percent'] = (stats['negative'] / valid_count) * 100
            stats['neutral_percent'] = (stats['neutral'] / valid_count) * 100
            
            # Calculate bias: (positive - negative) / total
            # Normalized to -1 to 1
            stats['bias'] = (
                (stats['positive'] - stats['negative']) / valid_count
            )
        else:
            stats['positive_percent'] = 0.0
            stats['negative_percent'] = 0.0
            stats['neutral_percent'] = 0.0
            stats['bias'] = 0.0
        
        return stats



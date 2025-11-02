from transformers import pipeline
import logging
import re
from typing import Optional, List

logger = logging.getLogger(__name__)

# Configuration constants for binary sentiment analysis
# Using stricter thresholds to better distinguish good vs bad
MIN_CONFIDENCE_THRESHOLD = 0.55  # Minimum confidence for classification
HIGH_CONFIDENCE_THRESHOLD = 0.85  # Threshold for high confidence
MIN_TEXT_LENGTH = 3
MAX_TEXT_LENGTH = 5000


class SentimentAnalyzer:
    """
    Professional binary sentiment analysis using Hugging Face model.
    Features:
    - Enhanced preprocessing (text cleaning, normalization)
    - Binary classification (positive/negative only, no neutral)
    - Strict confidence thresholds for better distinction
    - Input validation
    - Batch processing support
    - Improved error handling
    - Clear distinction between good and bad sentiments
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
        """Load the binary sentiment analysis model from Hugging Face"""
        try:
            # Using DistilBERT model fine-tuned for binary sentiment
            # This model is excellent at distinguishing between good and bad
            model_name = "distilbert-base-uncased-finetuned-sst-2-english"
            logger.info("Loading binary sentiment analysis model: %s", model_name)
            self._analyzer = pipeline(
                'sentiment-analysis',
                model=model_name,
                # Use CPU (-1), change to 0+ for GPU if available
                device=-1,
                # Only return top prediction
                return_all_scores=False
            )
            logger.info("Binary sentiment model loaded successfully")
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

        This model is a binary classifier (POSITIVE/NEGATIVE only).
        We force all results to be either positive or negative - no neutral.
        Uses strict confidence thresholds to better distinguish good vs bad.

        Args:
            result: Raw model output
            original_text: Original input text for context (unused)

        Returns:
            Processed sentiment result (POSITIVE or NEGATIVE only)
        """
        _ = original_text  # Acknowledge parameter even if unused
        label = result.get('label', '').upper()
        score = float(result.get('score', 0.5))
        
        # Map various label formats to binary labels
        # Model returns: POSITIVE or NEGATIVE (binary)
        label_mapping = {
            'POSITIVE': 'POSITIVE',
            'POS': 'POSITIVE',
            'POSITIV': 'POSITIVE',
            'NEGATIVE': 'NEGATIVE',
            'NEG': 'NEGATIVE',
            'NEGATIV': 'NEGATIVE',
            'LABEL_0': 'NEGATIVE',  # Some models use numeric labels
            'LABEL_1': 'POSITIVE',
            'NEUTRAL': None,  # Will be forced to binary based on score
        }
        
        # Normalize the label
        normalized_label = label_mapping.get(label)
        
        # If label mapping didn't work, force binary classification from score
        # This shouldn't happen with SST-2 model, but kept as fallback
        if normalized_label is None:
            # Force binary classification based on score
            # With binary models, score > 0.5 typically means positive
            if score > 0.5:
                normalized_label = 'POSITIVE'
            else:
                normalized_label = 'NEGATIVE'
                # Score represents confidence in positive, so for negative:
                score = 1.0 - score
        
        # Note: Binary models return the score for the predicted label
        # If model returns "NEGATIVE" with score 0.9, that means 90% confidence
        # We keep the score as-is since it represents confidence in the label
        
        # Apply confidence thresholds
        if score < MIN_CONFIDENCE_THRESHOLD:
            # Low confidence - still classify but mark as low confidence
            # We force binary, so we'll use the label but with lower confidence
            confidence_level = 'low'
        elif score >= HIGH_CONFIDENCE_THRESHOLD:
            confidence_level = 'high'
        else:
            confidence_level = 'medium'
        
        # Force binary - always positive or negative, never neutral
        if normalized_label == 'POSITIVE':
            sentiment = 'positive'
        else:
            sentiment = 'negative'
        
        return {
            'label': normalized_label,
            'score': float(score),
            'sentiment': sentiment,
            'confidence': confidence_level,
            'original_label': label,  # Keep original for debugging
            'original_score': result.get('score', 0.5)
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
                - label: The sentiment label (POSITIVE or NEGATIVE only)
                - score: The confidence score (0.0 to 1.0)
                - sentiment: Normalized sentiment label in lowercase
                - confidence: Confidence level (high/medium/low)
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
            # Force binary - default to negative for empty/invalid text
            return {
                'label': 'NEGATIVE',
                'score': 0.5,
                'sentiment': 'negative',
                'confidence': 'low',
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
                'errors': 0,
                'positive_percent': 0.0,
                'negative_percent': 0.0,
                'bias': 0.0  # Positive = 1.0, Negative = -1.0
            }
        
        stats = {
            'total': len(results),
            'positive': 0,
            'negative': 0,
            'errors': 0,
            'total_score': 0.0
        }
        
        for result in results:
            sentiment = result.get('sentiment', 'error')
            if sentiment == 'positive':
                stats['positive'] += 1
            elif sentiment == 'negative':
                stats['negative'] += 1
            else:
                stats['errors'] += 1
            
            # Accumulate scores (excluding errors and low confidence)
            if result.get('confidence') == 'high':
                score = result.get('score', 0.5)
                label = result.get('label', 'NEGATIVE')
                if label == 'POSITIVE':
                    stats['total_score'] += score
                elif label == 'NEGATIVE':
                    # For negative, score represents confidence in negative
                    # To calculate bias, we subtract from 0.5 (neutral point)
                    stats['total_score'] += (1 - score)
                else:
                    stats['total_score'] += 0.5
        
        # Calculate percentages
        valid_count = stats['total'] - stats['errors']
        if valid_count > 0:
            stats['positive_percent'] = (stats['positive'] / valid_count) * 100
            stats['negative_percent'] = (stats['negative'] / valid_count) * 100
            
            # Calculate bias: (positive - negative) / total
            # Normalized to -1 to 1 (negative) to 1 (positive)
            stats['bias'] = (
                (stats['positive'] - stats['negative']) / valid_count
            )
        else:
            stats['positive_percent'] = 0.0
            stats['negative_percent'] = 0.0
            stats['bias'] = 0.0
        
        return stats



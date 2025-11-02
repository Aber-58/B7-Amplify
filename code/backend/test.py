import utils_chat as uc
from sentiment_analyzer import SentimentAnalyzer
import warnings
warnings.filterwarnings("ignore", message="`return_all_scores` is now deprecated")


_analyzer = None

def get_chat_LV_popularity(LVs, texts):
    """Analyze sentiment popularity per LV (lazy-loads analyzer)."""
    global _analyzer

    if _analyzer is None:
        _analyzer = SentimentAnalyzer()

    sentiment_results = _analyzer.analyze_batch(texts)
    sentiment_results = [result['sentiment'] for result in sentiment_results]

    category_results = uc.categorize_sentences(LV=LVs, sentences=texts)

    score_map = {'positive': 1, 'negative': -1, 'neutral': 0}

    result = {}
    for text, sentiment in zip(texts, sentiment_results):
        lv = category_results.get(text)
        if not lv or lv == "Uncategorized":
            continue  # Skip uncategorized
        score = score_map.get(sentiment, 0)
        result[lv] = result.get(lv, 0) + score

    return result


if __name__ == "__main__":
    # Example test data
    LVs = ['LV1', 'LV2', 'LV3']
    texts = ['i hate LV1', 'i love LV2', 'LV3 is so BS']

    result = get_chat_LV_popularity(LVs, texts)

    print("Texts:", texts)
    print("Popularity result:", result)

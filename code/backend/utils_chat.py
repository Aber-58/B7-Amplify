from sentence_transformers import SentenceTransformer, util


_model = None
_cached = {}

def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer('all-MiniLM-L6-v2')
    return _model

def categorize_sentences(LV, sentences, threshold=0.1):
    model = get_model()
    key = "||".join(LV)
    if key not in _cached:
        _cached[key] = model.encode(LV, convert_to_tensor=True)
    lv_emb = _cached[key]

    s_emb = model.encode(sentences, convert_to_tensor=True)
    sims = util.cos_sim(s_emb, lv_emb)

    out = {}
    for i, s in enumerate(sentences):
        j = int(sims[i].argmax())
        sc = float(sims[i][j])
        out[s] = LV[j] if sc >= threshold else "Uncategorized"
    return out


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

if __name__ == "__main__": # feel free to test, it lazy loads the model so first call is slow
    LV = ['Update server', 'Buy server', 'Cloud Solution']
    sentences = [
        'Im for updating the servers',
        'I think buying a new one is the best solution',
        'Nah, we should go and get cloud!',
        'I dont think relying on the cloud is a good idea',
        "Hahahahaha",
        "I like servers, lets update and use it for a long time"
    ]

    print(categorize_sentences(LV, sentences))



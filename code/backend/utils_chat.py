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
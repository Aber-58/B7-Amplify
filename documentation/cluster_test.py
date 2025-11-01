import argparse
import pickle
import random
from sentence_transformers import SentenceTransformer
from sklearn.cluster import HDBSCAN, DBSCAN, KMeans, AgglomerativeClustering
from sklearn.manifold import TSNE
import numpy as np

CORPORA_PROMPTS = {
    "what_blocks_you": "What is currently blocking you the most in your daily work?",
    "office_trash_solutions": "How should we solve the issue of trash piling up in the office?",
}

CORPORA = {
    "what_blocks_you": [
        "spontanious calls",
        "My coworkers distracting me, hate em",
        "loud office environment",
        "Getting distracted by social media and friends",
        "loud noisy people",
        "ci is incredibly slow. it takes half a day to run our test suite!",
        "meetings are scheduled back to back, making everyone late",
        "Hardware is stopping working",
        "Transportation and information flow sucks",
        "🍉🍔🍟🤤",
        "When I did not sleep well last night. I am just tired and cannot focus at all. Sometimes there are street workers near my home and they always wake me up.",
        "it support is incredibly slow. it can take weeks to get some software installed",
        "Coworkers being suspicously sick",
        "waiting for code reviews that take days to get feedback",
        "constant context switching between different projects",
        "unclear requirements that keep changing mid-sprint",
        "outdated documentation that doesn't match the current system",
        "legacy code that's impossible to understand or modify",
        "slow internet connection making everything take forever",
        "having to attend too many status meetings with no clear agenda",
        "tools and systems that crash frequently during peak hours",
        "lack of proper development environment setup",
        "dependencies on other teams that never respond on time",
        "debugging production issues with no logging or monitoring",
        "manual deployment processes that break half the time",
        "working with APIs that have poor or missing documentation",
        "password and access management that takes weeks to resolve",
        "having to use multiple different tools that don't integrate well"
    ],
    "office_trash_solutions": [
        "add more trash bins around the office",
        "hire a cleaning service that comes twice a day",
        "set up recycling stations with clear labels",
        "send weekly reminders to clean up after yourself",
        "designate someone as office cleanliness coordinator",
        "install bigger trash cans in high-traffic areas",
        "create a rotating cleanup schedule for all employees",
        "put trash bins next to every desk and workstation",
        "organize monthly office cleaning days with pizza",
        "implement a 'clean desk policy' at end of day",
        "add compost bins for food waste",
        "place hand sanitizer stations near all trash areas",
        "create incentives for keeping common areas clean",
        "install motion sensor trash cans that open automatically",
        "set up a system where messiest area gets called out weekly",
        "provide more paper towels and cleaning supplies",
        "establish clear rules about personal food storage",
        "create designated eating areas only",
        "add more frequent building maintenance visits",
        "install better ventilation to reduce odors from trash"
    ]
}

def hdbscan_clustering(embeddings):
    clusterer = HDBSCAN(min_samples=2, min_cluster_size=2, cluster_selection_method="leaf",
                       allow_single_cluster=True, metric="cosine")
    return clusterer.fit_predict(embeddings)

def dbscan_clustering(embeddings):
    clusterer = DBSCAN(eps=0.5, min_samples=2, metric="cosine")
    return clusterer.fit_predict(embeddings)

def kmeans_clustering(embeddings, n_clusters=3):
    clusterer = KMeans(n_clusters=n_clusters, random_state=42)
    return clusterer.fit_predict(embeddings)

def agglomerative_clustering(embeddings, n_clusters=3):
    clusterer = AgglomerativeClustering(n_clusters=n_clusters, linkage='ward')
    return clusterer.fit_predict(embeddings)

def tsne_hdbscan_clustering(embeddings):
    tsne = TSNE(n_components=3, perplexity=2, random_state=42)
    reduced_embeddings = tsne.fit_transform(embeddings)
    return hdbscan_clustering(reduced_embeddings)

CLUSTERING_ALGORITHMS = {
    "hdbscan": hdbscan_clustering,
    "dbscan": dbscan_clustering,
    "kmeans": kmeans_clustering,
    "agglomerative": agglomerative_clustering,
    "tsne_hdbscan": tsne_hdbscan_clustering
}

def embed_stage(texts, model_name, pickle_dir, corpus_name):
    import os
    pickle_file = os.path.join(pickle_dir, f"{corpus_name}.pkl")

    print(f"Loading model: {model_name}")
    model = SentenceTransformer(model_name)

    print(f"Encoding {len(texts)} texts...")
    embeddings = model.encode(texts)

    print(f"Saving embeddings to {pickle_file}")
    os.makedirs(pickle_dir, exist_ok=True)
    with open(pickle_file, 'wb') as f:
        pickle.dump({'embeddings': embeddings, 'texts': texts}, f)

    print(f"Embeddings saved. Shape: {embeddings.shape}")

def cluster_stage(pickle_dir, corpus_name):
    import os
    pickle_file = os.path.join(pickle_dir, f"{corpus_name}.pkl")

    print(f"Loading embeddings from {pickle_file}")
    with open(pickle_file, 'rb') as f:
        data = pickle.load(f)

    embeddings = data['embeddings']
    texts = data['texts']

    for algorithm in CLUSTERING_ALGORITHMS:
        print(f"\nRunning {algorithm} clustering...")
        labels = CLUSTERING_ALGORITHMS[algorithm](embeddings)

        print(f"Clustering results ({algorithm}):")
        for text, label in sorted(zip(texts, labels), key=lambda x: x[1]):
            print(f"[Cluster {label}] {text}")
        print("-" * 50)

def main():
    parser = argparse.ArgumentParser(description='Two-stage embedding and clustering testbench')
    parser.add_argument('mode', choices=['embed', 'cluster'], help='Stage to run')
    parser.add_argument('--pickle-dir', default='/state', help='Directory for pickle files')
    parser.add_argument('--model', default='google/embeddinggemma-300m', help='Embedding model name')
    parser.add_argument('--corpus', default='what_blocks_you', choices=list(CORPORA.keys()), help='Corpus to use')

    args = parser.parse_args()

    if args.mode == 'embed':
        random.seed(42)
        texts = CORPORA[args.corpus].copy()
        random.shuffle(texts)
        embed_stage(texts, args.model, args.pickle_dir, args.corpus)

    elif args.mode == 'cluster':
        cluster_stage(args.pickle_dir, args.corpus)

if __name__ == '__main__':
    main()

import multiprocessing
import uuid
import random
import database as db
from sentence_transformers import SentenceTransformer
from sklearn.cluster import DBSCAN
import numpy as np

_worker_pool = None
_task_queue = None

def init():
    global _worker_pool, _task_queue
    _task_queue = multiprocessing.Queue()
    _worker_pool = []
    for i in range(4):
        p = multiprocessing.Process(target=worker_process, args=(_task_queue,))
        p.start()
        _worker_pool.append(p)

def trigger(topic_uuid):
    assert _task_queue is not None, "Worker pool not initialized"
    assert _worker_pool is not None, "Worker pool not initialized"
    _task_queue.put(topic_uuid)

def worker_process(task_queue):
    while True:
        topic_uuid = task_queue.get()
        if topic_uuid is None:
            break
        try:
            opinions = db.get_raw_opinions_for_topic(topic_uuid)
            print(f"Worker processing {len(opinions)} opinions for topic: {topic_uuid}")

            clusters = cluster_raw_opinions(opinions)
            print(f"Generated {len(clusters)} clusters")

            winners = pick_random_winners(clusters)
            print(f"Selected {len(winners)} cluster leaders")

            clusters_data = [{
                'heading': winner_data['winner']['opinion'],
                'leader_id': winner_data['username'],
                'raw_opinions': winner_data['cluster']
            } for winner_data in winners]

            cluster_ids = db.replace_clusters_for_topic(clusters_data, topic_uuid)

            for i, cluster_id in enumerate(cluster_ids):
                print(f"Created cluster {cluster_id} with leader {clusters_data[i]['leader_id']} and {len(clusters_data[i]['raw_opinions'])} opinions")

        except Exception as e:
            print(f"Worker error processing {topic_uuid}: {e}")
            # TODO: Mark task as failed in database

def cluster_raw_opinions(raw_opinions):
    if len(raw_opinions) < 2:
        return [raw_opinions] if raw_opinions else []

    texts = [opinion['opinion'] for opinion in raw_opinions]

    model = SentenceTransformer('tencent/Youtu-Embedding', trust_remote_code=True)
    embeddings = model.encode([f"clustering: {text}" for text in texts])

    clusterer = DBSCAN(eps=0.5, min_samples=2, metric="manhattan")
    labels = clusterer.fit_predict(embeddings)

    clusters = {}
    for i, label in enumerate(labels):
        if label not in clusters:
            clusters[label] = []
        clusters[label].append(raw_opinions[i])

    return list(clusters.values())

def pick_random_winners(clusters):
    winners = []
    for cluster in clusters:
        if cluster:
            weights = np.array([opinion['weight'] for opinion in cluster])

            exp_weights = np.exp(weights)
            probabilities = exp_weights / np.sum(exp_weights)
            winner_idx = np.random.choice(len(cluster), p=probabilities)
            random_winner = cluster[winner_idx]
            username = random_winner['username']

            winners.append({
                'cluster': cluster,
                'winner': random_winner,
                'username': username
            })
    return winners

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

            for winner_data in winners:
                cluster_id = db.insert_clustered_opinion(
                    current_heading=winner_data['winner']['opinion'],
                    uuid=topic_uuid,
                    leader_id=winner_data['username']
                )

                for raw_opinion in winner_data['cluster']:
                    db.update_raw_opinion_cluster(raw_opinion['raw_id'], cluster_id)

                print(f"Created cluster {cluster_id} with leader {winner_data['username']} and {len(winner_data['cluster'])} opinions")

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
            random_winner = random.choice(cluster)
            username = random_winner['username']
            winners.append({
                'cluster': cluster,
                'winner': random_winner,
                'username': username
            })
    return winners

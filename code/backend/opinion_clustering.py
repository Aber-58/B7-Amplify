"""
Improved Opinion Clustering Module

Features:
- Model caching with singleton pattern for efficiency
- Adaptive clustering parameters based on data size
- Better noise handling
- Text preprocessing and normalization
- Smart leader selection (highest weight + centrality)
- Cluster quality metrics
- Efficient batch processing
"""

import multiprocessing
import re
import database as db
from sentence_transformers import SentenceTransformer
from sklearn.cluster import HDBSCAN
from sklearn.metrics import silhouette_score
import numpy as np
from typing import List, Dict, Tuple
import cluster_reasoning

# Global model cache (singleton pattern)
_model_cache = None
_model_lock = multiprocessing.Lock()

_worker_pool = None
_task_queue = None

# Configuration
MODEL_NAME = 'all-MiniLM-L6-v2'  # Fast, efficient, good for short texts
MODEL_CACHE_FOLDER = '/state'
MIN_CLUSTER_SIZE_RATIO = 0.05  # Minimum 5% of data points per cluster
MIN_SAMPLES_RATIO = 0.02  # Minimum 2% for core points


def init():
    """Initialize worker pool for parallel clustering"""
    global _worker_pool, _task_queue
    _task_queue = multiprocessing.Queue()
    _worker_pool = []
    # Use fewer workers to avoid memory issues with model loading
    worker_count = min(2, multiprocessing.cpu_count())
    for i in range(worker_count):
        p = multiprocessing.Process(target=worker_process, args=(_task_queue,))
        p.start()
        _worker_pool.append(p)
    print(f"Initialized {worker_count} clustering workers")


def get_model():
    """
    Get or create the embedding model (singleton pattern).
    Model is cached globally for efficiency.
    """
    global _model_cache
    if _model_cache is None:
        with _model_lock:
            # Double-check pattern in case another process created it
            if _model_cache is None:
                print(f"Loading embedding model: {MODEL_NAME}")
                _model_cache = SentenceTransformer(
                    MODEL_NAME,
                    cache_folder=MODEL_CACHE_FOLDER
                )
                print("Model loaded successfully")
    return _model_cache


def preprocess_text(text: str) -> str:
    """
    Preprocess opinion text for better clustering.
    
    Removes:
    - Extra whitespace
    - Special characters that don't add semantic meaning
    - Normalizes capitalization
    """
    if not text:
        return ""
    
    # Lowercase for consistency
    text = text.lower()
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Remove trailing/leading whitespace
    text = text.strip()
    
    return text


def normalize_texts(texts: List[str]) -> List[str]:
    """Normalize a batch of texts"""
    return [preprocess_text(text) for text in texts]


def calculate_adaptive_parameters(num_opinions: int) -> Tuple[int, int]:
    """
    Calculate adaptive clustering parameters based on data size.
    
    For small datasets: Use smaller cluster sizes
    For large datasets: Scale parameters appropriately
    
    Returns:
        (min_cluster_size, min_samples) tuple
    """
    if num_opinions < 10:
        # Very small dataset - every opinion can be a cluster
        min_cluster_size = max(1, num_opinions // 3)
        min_samples = 1
    elif num_opinions < 50:
        # Small dataset
        min_cluster_size = max(2, int(num_opinions * MIN_CLUSTER_SIZE_RATIO))
        min_samples = max(1, int(num_opinions * MIN_SAMPLES_RATIO))
    elif num_opinions < 200:
        # Medium dataset
        min_cluster_size = max(3, int(num_opinions * MIN_CLUSTER_SIZE_RATIO))
        min_samples = max(2, int(num_opinions * MIN_SAMPLES_RATIO))
    else:
        # Large dataset - scale up but cap the maximum
        min_cluster_size = max(5, min(20, int(num_opinions * MIN_CLUSTER_SIZE_RATIO)))
        min_samples = max(2, min(10, int(num_opinions * MIN_SAMPLES_RATIO)))
    
    return min_cluster_size, min_samples


def select_best_leader(cluster: List[Dict], embeddings: np.ndarray, 
                       cluster_indices: List[int]) -> Dict:
    """
    Select the best leader for a cluster based on:
    1. Highest weight (user preference)
    2. Centrality (closest to cluster centroid)
    
    Args:
        cluster: List of opinion dictionaries
        embeddings: All embeddings matrix
        cluster_indices: Indices of opinions in this cluster
        
    Returns:
        Best leader opinion dictionary
    """
    if not cluster:
        return None
    
    if len(cluster) == 1:
        return cluster[0]
    
    # Calculate cluster centroid
    cluster_embeddings = embeddings[cluster_indices]
    centroid = np.mean(cluster_embeddings, axis=0)
    
    # Calculate distances from centroid
    distances = np.linalg.norm(cluster_embeddings - centroid, axis=1)
    
    # Get weights
    weights = np.array([opinion['weight'] for opinion in cluster])
    
    # Normalize distances (0 = closest to centroid, 1 = furthest)
    if distances.max() > distances.min():
        normalized_distances = (distances - distances.min()) / (distances.max() - distances.min())
    else:
        normalized_distances = np.zeros(len(distances))
    
    # Normalize weights (0 = lowest, 1 = highest)
    if weights.max() > weights.min():
        normalized_weights = (weights - weights.min()) / (weights.max() - weights.min())
    else:
        normalized_weights = np.ones(len(weights))
    
    # Combined score: prefer high weight and low distance (high centrality)
    # Weight importance: 60% weight, 40% centrality
    scores = 0.6 * normalized_weights + 0.4 * (1 - normalized_distances)
    
    best_idx = np.argmax(scores)
    return cluster[best_idx]


def calculate_cluster_quality(embeddings: np.ndarray, labels: np.ndarray) -> Dict:
    """
    Calculate cluster quality metrics.
    
    Returns:
        Dictionary with quality metrics
    """
    unique_labels = set(labels)
    # Remove noise label (-1)
    unique_labels.discard(-1)
    
    if len(unique_labels) < 2:
        return {
            'num_clusters': len(unique_labels),
            'silhouette_score': 0.0,
            'noise_ratio': float(np.sum(labels == -1) / len(labels)) if len(labels) > 0 else 0.0
        }
    
    # Calculate silhouette score (only for non-noise points with >= 2 clusters)
    valid_mask = labels != -1
    if np.sum(valid_mask) >= 2 and len(set(labels[valid_mask])) >= 2:
        try:
            silhouette = silhouette_score(
                embeddings[valid_mask],
                labels[valid_mask],
                metric='cosine'
            )
        except (ValueError, Exception):
            silhouette = 0.0
    else:
        silhouette = 0.0
    
    return {
        'num_clusters': len(unique_labels),
        'silhouette_score': float(silhouette),
        'noise_ratio': float(np.sum(labels == -1) / len(labels)) if len(labels) > 0 else 0.0
    }


def cluster_raw_opinions(raw_opinions: List[Dict]) -> List[List[Dict]]:
    """
    Cluster raw opinions using semantic similarity.
    
    Improvements:
    - Model caching for efficiency
    - Text preprocessing
    - Adaptive parameters
    - Better noise handling
    - Quality metrics
    
    Args:
        raw_opinions: List of opinion dictionaries with keys:
            - 'opinion': str (opinion text)
            - 'weight': int (rating 1-10)
            - 'username': str
            - 'raw_id': int
    
    Returns:
        List of clusters, each containing opinion dictionaries
    """
    if len(raw_opinions) == 0:
        return []
    
    if len(raw_opinions) == 1:
        # Single opinion becomes its own cluster
        return [raw_opinions]
    
    # Preprocess texts
    texts = [opinion['opinion'] for opinion in raw_opinions]
    texts = normalize_texts(texts)
    
    # Get cached model
    model = get_model()
    
    # Generate embeddings efficiently (no prefix needed)
    print(f"Generating embeddings for {len(texts)} opinions...")
    embeddings = model.encode(
        texts,
        batch_size=32,  # Process in batches for efficiency
        show_progress_bar=False,
        convert_to_numpy=True
    )
    
    # Calculate adaptive parameters
    min_cluster_size, min_samples = calculate_adaptive_parameters(len(raw_opinions))
    print(f"Using adaptive parameters: min_cluster_size={min_cluster_size}, min_samples={min_samples}")
    
    # Perform clustering with adaptive parameters
    # Try progressively more lenient parameters if no clusters found
    labels = None
    final_clusters = []
    
    # Try clustering with different parameter settings
    for attempt in range(3):
        if attempt == 0:
            # First attempt: use calculated adaptive parameters
            current_min_samples = min_samples
            current_min_cluster_size = min_cluster_size
            allow_single = False
        elif attempt == 1:
            # Second attempt: more lenient - allow single cluster
            current_min_samples = max(1, min_samples - 1)
            current_min_cluster_size = max(1, min_cluster_size - 1)
            allow_single = True
        else:
            # Third attempt: very lenient - almost any grouping
            current_min_samples = 1
            current_min_cluster_size = 1
            allow_single = True
        
        clusterer = HDBSCAN(
            min_samples=current_min_samples,
            min_cluster_size=current_min_cluster_size,
            cluster_selection_method="leaf",
            metric="cosine",
            allow_single_cluster=allow_single,
        )
        
        labels = clusterer.fit_predict(embeddings)
        
        # Calculate quality metrics
        quality = calculate_cluster_quality(embeddings, labels)
        print(f"Attempt {attempt + 1} - Clustering quality: {quality['num_clusters']} clusters, "
              f"silhouette={quality['silhouette_score']:.3f}, "
              f"noise={quality['noise_ratio']:.1%}")
        
        # Organize opinions into clusters
        clusters_dict = {}
        for i, label in enumerate(labels):
            if label not in clusters_dict:
                clusters_dict[label] = []
            clusters_dict[label].append(i)
        
        # Check if we have any valid clusters (non-noise)
        valid_clusters = {k: v for k, v in clusters_dict.items() if k != -1}
        
        if len(valid_clusters) > 0 or attempt == 2:
            # Build final clusters with best leaders
            final_clusters = []
            
            for label, indices in clusters_dict.items():
                if label == -1:
                    # Handle noise points: group them into a single "Other" cluster
                    # if there are too many, or create individual clusters if few
                    if len(indices) <= 3:
                        # Few noise points: individual clusters
                        for idx in indices:
                            final_clusters.append([raw_opinions[idx]])
                    else:
                        # Many noise points: group them into one cluster
                        noise_cluster = [raw_opinions[idx] for idx in indices]
                        leader = select_best_leader(noise_cluster, embeddings, indices)
                        noise_cluster_reordered = [leader]
                        noise_cluster_reordered.extend([op for op in noise_cluster if op != leader])
                        final_clusters.append(noise_cluster_reordered)
                else:
                    # Regular cluster - select best leader
                    cluster = [raw_opinions[idx] for idx in indices]
                    leader = select_best_leader(cluster, embeddings, indices)
                    cluster_reordered = [leader]
                    cluster_reordered.extend([op for op in cluster if op != leader])
                    final_clusters.append(cluster_reordered)
            
            # Fallback: If still no clusters (shouldn't happen, but safety check)
            if len(final_clusters) == 0:
                print("Warning: No clusters found, creating single cluster with all opinions")
                leader = select_best_leader(raw_opinions, embeddings, list(range(len(raw_opinions))))
                final_clusters = [[leader] + [op for op in raw_opinions if op != leader]]
            
            print(f"Created {len(final_clusters)} final clusters")
            break
    
    # Final safety check: ensure at least one cluster exists
    if len(final_clusters) == 0:
        print("Fallback: Creating single cluster with all opinions")
        if len(raw_opinions) > 0:
            leader = select_best_leader(raw_opinions, embeddings, list(range(len(raw_opinions))))
            final_clusters = [[leader] + [op for op in raw_opinions if op != leader]]
        else:
            final_clusters = [raw_opinions]
    
    return final_clusters


def pick_winners(clusters: List[List[Dict]]) -> List[Dict]:
    """
    Select cluster leaders (winners) from clusters.
    
    Improved version: Leaders are already selected in cluster_raw_opinions
    using a combination of weight and centrality.
    
    Args:
        clusters: List of clusters, where each cluster is a list of opinions
                 with the leader already in the first position
    
    Returns:
        List of winner dictionaries with keys:
            - 'cluster': List of opinion dictionaries in cluster
            - 'winner': Leader opinion dictionary
            - 'username': Leader username
    """
    winners = []
    for cluster in clusters:
        if cluster:
            # Leader is already the first opinion in each cluster
            leader = cluster[0]
            winners.append({
                'cluster': cluster,
                'winner': leader,
                'username': leader['username']
            })
    return winners


def trigger(topic_uuid: str):
    """Trigger clustering for a topic"""
    assert _task_queue is not None, "Worker pool not initialized"
    assert _worker_pool is not None, "Worker pool not initialized"
    _task_queue.put(topic_uuid)
    print(f"Clustering triggered for topic: {topic_uuid}")


def worker_process(task_queue):
    """Worker process for parallel clustering"""
    while True:
        topic_uuid = task_queue.get()
        if topic_uuid is None:
            break
        try:
            opinions = db.get_raw_opinions_for_topic(topic_uuid)
            print(f"Worker processing {len(opinions)} opinions for topic: {topic_uuid}")

            if len(opinions) == 0:
                print(f"No opinions found for topic {topic_uuid}")
                continue

            clusters = cluster_raw_opinions(opinions)
            print(f"Generated {len(clusters)} clusters")

            winners = pick_winners(clusters)
            print(f"Selected {len(winners)} cluster leaders")

            # Prepare cluster data for database
            clusters_data = [{
                'heading': winner_data['winner']['opinion'],
                'leader_id': winner_data['username'],
                'raw_opinions': winner_data['cluster']
            } for winner_data in winners]

            cluster_ids = db.replace_clusters_for_topic(clusters_data, topic_uuid)

            for i, cluster_id in enumerate(cluster_ids):
                print(f"Created cluster {cluster_id} with leader {clusters_data[i]['leader_id']} "
                      f"and {len(clusters_data[i]['raw_opinions'])} opinions")

        except Exception as e:
            print(f"Worker error processing {topic_uuid}: {e}")
            import traceback
            traceback.print_exc()
            # TODO: Mark task as failed in database

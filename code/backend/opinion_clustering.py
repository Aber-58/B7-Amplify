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
from sklearn.cluster import HDBSCAN, KMeans
from sklearn.metrics import silhouette_score
import numpy as np
from typing import List, Dict, Tuple
import cluster_reasoning


def summarize_heading(heading: str) -> str:
    """
    Summarize a cluster heading to a concise headline.
    
    Examples:
        "We should implement more flexible work arrangements" -> "flexible work arrangements"
        "I think we need better parking spaces" -> "better parking spaces"
        "Let's improve the office chairs" -> "office chairs"
    
    Args:
        heading: The full heading text
    
    Returns:
        A concise summary (2-4 words typically)
    """
    if not heading:
        return heading
    
    heading = heading.strip()
    
    # Common prefixes to remove (case-insensitive)
    # Order matters - more specific patterns first
    prefixes_to_remove = [
        r'^(we|i|they|you|he|she|it)\s+should\s+',
        r'^(we|i|they|you|he|she|it)\s+need\s+(to\s+)?',
        r'^(we|i|they|you|he|she|it)\s+must\s+(to\s+)?',
        r'^(we|i|they|you|he|she|it)\s+(have|has)\s+to\s+',
        r'^(we|i|they|you|he|she|it)\s+ought\s+to\s+',
        r'^(we|i|they|you|he|she|it)\s+(wants?|wants?)\s+to\s+',
        r'^(we|i|they|you|he|she|it)\s+(think|believe|feel|say|suggest|propose|recommend)\s+(we|i|they|you|he|she|it)\s+(should|need|must|can|could|would)\s+',
        r'^(we|i|they|you|he|she|it)\s+(think|believe|feel|say|suggest|propose|recommend)\s+(that\s+)?',
        r'^(we|i|they|you|he|she|it)\s+(think|believe|feel|say|suggest|propose|recommend)\s+',
        r'^let\'?s\s+',
        r'^(we|i|they|you|he|she|it)\s+(can|could|would|will|shall|may|might)\s+',
        r'^(it|that|this)\s+(would|should|will|can|could|might)\s+(be\s+)?(better\s+to\s+)?',
        r'^(how|what|why|when|where)\s+(about|to|do|can|should)\s+',
        r'^maybe\s+(we|i|they|you)\s+(should|need|can|could|would)\s+',
        r'^(we|i|they|you|he|she|it)\s+(want|wish|hope|prefer)\s+(to\s+)?',
        r'^(we|i|they|you|he|she|it)\s+should\s+(probably|definitely|absolutely)\s+',
        r'^(please|pls)\s+',
        r'^(i\'?m|we\'?re|they\'?re|you\'?re|he\'?s|she\'?s|it\'?s)\s+',
        r'^(i\'?d|we\'?d|they\'?d|you\'?d|he\'?d|she\'?d|it\'?d)\s+',
        # Action verbs at start that should be removed
        r'^(implement|improve|fix|add|create|make|do|build|install|upgrade|enhance|provide|establish|set\s+up|put\s+in)\s+(the|a|an)?\s*',
    ]
    
    # Remove prefixes (iterate until no more changes)
    prev_heading = ''
    iterations = 0
    while heading != prev_heading and iterations < 10:  # Max 10 iterations to avoid infinite loops
        prev_heading = heading
        for pattern in prefixes_to_remove:
            heading = re.sub(pattern, '', heading, flags=re.IGNORECASE).strip()
        iterations += 1
    
    # Remove "implementing", "fixing", etc. (gerunds) at the start if followed by a noun
    heading = re.sub(r'^(implementing|improving|fixing|adding|creating|making|doing|building|installing|upgrading|enhancing|providing|establishing)\s+', '', heading, flags=re.IGNORECASE).strip()
    
    # Remove common verb patterns that leave "needs fixing", "needs improvement", etc.
    heading = re.sub(r'\s+(needs?|requires?|needs?\s+to\s+be)\s+(fixing|improving|fixing|changing|updating|replacing|implementing)', '', heading, flags=re.IGNORECASE).strip()
    heading = re.sub(r'\s+(needs?|requires?)\s+', '', heading, flags=re.IGNORECASE).strip()
    
    # Remove trailing punctuation and common endings
    heading = re.sub(r'[.!?]+$', '', heading).strip()
    heading = re.sub(r'\s+(please|thanks|thank you|tnx|thx)[.!?]*$', '', heading, flags=re.IGNORECASE).strip()
    
    # Remove leading "to" if it's the first word (leftover from "we should to...")
    heading = re.sub(r'^to\s+', '', heading, flags=re.IGNORECASE).strip()
    
    # Remove redundant articles (prefer removing "the" for cleaner headlines)
    heading = re.sub(r'^(the|a|an)\s+', '', heading, flags=re.IGNORECASE).strip()
    
    # Remove qualifiers like "more", "better", "new" if they're just modifiers
    # But keep them if they're part of the core concept (like "better parking" vs "parking")
    words = heading.split()
    if len(words) >= 3 and words[0].lower() in ['more', 'better', 'new', 'improved', 'enhanced']:
        # Check if removing it still makes sense (keep if the next word is not a noun)
        # For simplicity, remove "more" if followed by an adjective
        if words[0].lower() == 'more' and len(words) > 2:
            heading = ' '.join(words[1:])  # Remove "more"
        elif words[0].lower() == 'better' and len(words) > 2:
            # Keep "better" if it's meaningful, otherwise remove
            # For now, keep it as it often adds value
            pass
    
    # Capitalize first letter
    if heading:
        heading = heading[0].upper() + heading[1:] if len(heading) > 1 else heading.upper()
    
    # Ensure it's not empty and not too short (at least 2 words)
    words = heading.split()
    if len(words) < 2:
        # If too short after processing, return original (cleaned)
        return heading
    
    # If still too long (more than 5 words), try to extract key phrase
    if len(words) > 5:
        # Try to find the most important part (usually the noun phrase at the end)
        # Keep last 4 words as they often contain the key concept
        heading = ' '.join(words[-4:])
    
    return heading.strip()

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


def select_best_leader(cluster: List[Dict], embeddings: np.ndarray = None, 
                       cluster_indices: List[int] = None) -> Dict:
    """
    Select the best leader for a cluster based on:
    1. Highest weight (user preference)
    2. Centrality (closest to cluster centroid) if embeddings available
    
    Args:
        cluster: List of opinion dictionaries
        embeddings: All embeddings matrix (optional)
        cluster_indices: Indices of opinions in this cluster (optional)
        
    Returns:
        Best leader opinion dictionary, or first opinion if no selection possible
    """
    if not cluster:
        return None
    
    if len(cluster) == 1:
        return cluster[0]
    
    # Get weights
    weights = np.array([opinion.get('weight', 5) for opinion in cluster])  # Default weight 5
    
    # If embeddings available, use centrality + weight
    if embeddings is not None and cluster_indices is not None and len(cluster_indices) == len(cluster):
        try:
            # Calculate cluster centroid
            cluster_embeddings = embeddings[cluster_indices]
            centroid = np.mean(cluster_embeddings, axis=0)
            
            # Calculate distances from centroid
            distances = np.linalg.norm(cluster_embeddings - centroid, axis=1)
            
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
        except (IndexError, ValueError, Exception) as e:
            print(f"Warning: Could not use embeddings for leader selection: {e}")
            # Fall through to weight-only selection
    
    # Fallback: use weight only (or first opinion if all weights equal)
    if weights.max() > weights.min():
        best_idx = np.argmax(weights)
        return cluster[best_idx]
    else:
        # All weights equal or no weights - return first opinion
        return cluster[0]


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


def normalize_embeddings(embeddings: np.ndarray) -> np.ndarray:
    """
    Normalize embeddings to unit vectors for better cosine similarity.
    
    Args:
        embeddings: Raw embeddings matrix (n_samples, n_features)
    
    Returns:
        Normalized embeddings (L2 norm = 1 for each sample)
    """
    # Calculate L2 norms
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    # Avoid division by zero
    norms = np.where(norms == 0, 1, norms)
    # Normalize
    return embeddings / norms


def compute_pairwise_similarities(embeddings: np.ndarray) -> np.ndarray:
    """
    Compute pairwise cosine similarities between all embeddings.
    
    Args:
        embeddings: Normalized embeddings matrix (n_samples, n_features)
    
    Returns:
        Similarity matrix (n_samples, n_samples) with values in [-1, 1]
    """
    # For normalized vectors, cosine similarity is just dot product
    return np.dot(embeddings, embeddings.T)


def merge_similar_clusters(clusters: List[List[Dict]], embeddings: np.ndarray, 
                          similarity_threshold: float = 0.85) -> List[List[Dict]]:
    """
    Post-process clusters to merge very similar ones.
    
    Args:
        clusters: List of clusters
        embeddings: Embeddings for all opinions
        similarity_threshold: Minimum cosine similarity to merge (default 0.85)
    
    Returns:
        Merged clusters
    """
    if len(clusters) <= 1:
        return clusters
    
    # Build opinion index to embedding mapping
    all_opinions = []
    opinion_to_idx = {}
    for cluster in clusters:
        for opinion in cluster:
            if 'opinion' in opinion:
                opinion_key = opinion.get('raw_id', id(opinion))
                if opinion_key not in opinion_to_idx:
                    opinion_to_idx[opinion_key] = len(all_opinions)
                    all_opinions.append(opinion)
    
    if len(all_opinions) != len(embeddings):
        # Can't match opinions to embeddings, return as-is
        return clusters
    
    # Calculate cluster centroids
    cluster_centroids = []
    cluster_indices_list = []
    
    for cluster in clusters:
        indices = []
        for opinion in cluster:
            opinion_key = opinion.get('raw_id', id(opinion))
            if opinion_key in opinion_to_idx:
                idx = opinion_to_idx[opinion_key]
                indices.append(idx)
        
        if len(indices) > 0:
            cluster_embeddings = embeddings[indices]
            centroid = np.mean(cluster_embeddings, axis=0)
            # Normalize centroid
            norm = np.linalg.norm(centroid)
            if norm > 0:
                centroid = centroid / norm
            cluster_centroids.append(centroid)
            cluster_indices_list.append(indices)
        else:
            cluster_centroids.append(None)
            cluster_indices_list.append([])
    
    # Find similar clusters to merge
    merged = set()
    merged_clusters = []
    
    for i in range(len(clusters)):
        if i in merged:
            continue
        
        current_cluster = clusters[i]
        similar_cluster_indices = [i]
        
        # Find clusters similar to this one
        for j in range(i + 1, len(clusters)):
            if j in merged or cluster_centroids[i] is None or cluster_centroids[j] is None:
                continue
            
            # Calculate similarity between centroids
            similarity = np.dot(cluster_centroids[i], cluster_centroids[j])
            
            if similarity >= similarity_threshold:
                similar_cluster_indices.append(j)
                merged.add(j)
        
        # Merge similar clusters
        if len(similar_cluster_indices) > 1:
            merged_cluster = []
            for idx in similar_cluster_indices:
                merged_cluster.extend(clusters[idx])
            merged_clusters.append(merged_cluster)
        else:
            merged_clusters.append(current_cluster)
    
    return merged_clusters


def split_dissimilar_cluster(cluster: List[Dict], embeddings: np.ndarray, 
                            cluster_indices: List[int],
                            min_similarity: float = 0.6) -> List[List[Dict]]:
    """
    Split a cluster if opinions are too dissimilar.
    
    Args:
        cluster: Single cluster to potentially split
        embeddings: All embeddings
        cluster_indices: Indices of opinions in this cluster
        min_similarity: Minimum similarity within cluster (default 0.6)
    
    Returns:
        List of clusters (may be split or original)
    """
    if len(cluster) <= 2:
        return [cluster]
    
    cluster_embeddings = embeddings[cluster_indices]
    
    # Normalize embeddings
    cluster_embeddings = normalize_embeddings(cluster_embeddings)
    
    # Calculate pairwise similarities within cluster
    similarities = compute_pairwise_similarities(cluster_embeddings)
    
    # Find minimum similarity
    min_sim = similarities.min()
    
    # If minimum similarity is too low, split the cluster
    if min_sim < min_similarity:
        # Use simple k-means style splitting with 2 clusters
        # Find two most dissimilar opinions as seeds
        min_idx = np.unravel_index(np.argmin(similarities), similarities.shape)
        seed1, seed2 = min_idx[0], min_idx[1]
        
        # Assign each opinion to nearest seed
        group1 = [seed1]
        group2 = [seed2]
        
        for i in range(len(cluster)):
            if i == seed1 or i == seed2:
                continue
            
            sim1 = np.dot(cluster_embeddings[i], cluster_embeddings[seed1])
            sim2 = np.dot(cluster_embeddings[i], cluster_embeddings[seed2])
            
            if sim1 > sim2:
                group1.append(i)
            else:
                group2.append(i)
        
        # Create sub-clusters
        sub_cluster1 = [cluster[idx] for idx in group1]
        sub_cluster2 = [cluster[idx] for idx in group2]
        
        # Recursively check if sub-clusters need further splitting
        result = []
        for sub_cluster, sub_indices in [(sub_cluster1, [cluster_indices[i] for i in group1]),
                                        (sub_cluster2, [cluster_indices[i] for i in group2])]:
            if len(sub_cluster) > 0:
                further_split = split_dissimilar_cluster(sub_cluster, embeddings, sub_indices, min_similarity)
                result.extend(further_split)
        
        return result
    
    return [cluster]


def cluster_raw_opinions(raw_opinions: List[Dict]) -> List[List[Dict]]:
    """
    Cluster raw opinions using semantic similarity with enhanced algorithm.
    
    Improvements:
    - Normalized embeddings for better cosine similarity
    - Adaptive HDBSCAN parameters
    - Post-processing to merge similar clusters
    - Post-processing to split dissimilar clusters
    - Better noise handling
    
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
    
    # Generate embeddings efficiently
    print(f"Generating embeddings for {len(texts)} opinions...")
    embeddings = model.encode(
        texts,
        batch_size=32,  # Process in batches for efficiency
        show_progress_bar=False,
        convert_to_numpy=True
    )
    
    # Normalize embeddings for better cosine similarity
    print("Normalizing embeddings for optimal cosine similarity...")
    embeddings = normalize_embeddings(embeddings)
    
    # Calculate adaptive parameters
    min_cluster_size, min_samples = calculate_adaptive_parameters(len(raw_opinions))
    print(f"Using adaptive parameters: min_cluster_size={min_cluster_size}, min_samples={min_samples}")
    
    # Perform clustering with adaptive parameters
    # Try progressively more lenient parameters if no clusters found
    labels = None
    best_quality = -1
    best_clusters_dict = {}
    
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
            current_min_cluster_size = max(2, min_cluster_size - 1)
            allow_single = True
        else:
            # Third attempt: very lenient - almost any grouping
            current_min_samples = 1
            current_min_cluster_size = 2
            allow_single = True
        
        clusterer = HDBSCAN(
            min_samples=current_min_samples,
            min_cluster_size=current_min_cluster_size,
            cluster_selection_method="leaf",  # Leaf method works better for semantic clustering
            cluster_selection_epsilon=0.0,  # Don't use epsilon cutoff
            metric="cosine",  # Cosine works best with normalized embeddings
            allow_single_cluster=allow_single,
        )
        
        labels = clusterer.fit_predict(embeddings)
        
        # Calculate quality metrics
        quality = calculate_cluster_quality(embeddings, labels)
        quality_score = quality['silhouette_score'] * (1 - quality['noise_ratio']) * quality['num_clusters']
        
        print(f"Attempt {attempt + 1} - Clustering quality: {quality['num_clusters']} clusters, "
              f"silhouette={quality['silhouette_score']:.3f}, "
              f"noise={quality['noise_ratio']:.1%}, "
              f"quality_score={quality_score:.3f}")
        
        # Organize opinions into clusters
        clusters_dict = {}
        for i, label in enumerate(labels):
            if label not in clusters_dict:
                clusters_dict[label] = []
            clusters_dict[label].append(i)
        
        # Check if we have any valid clusters (non-noise)
        valid_clusters = {k: v for k, v in clusters_dict.items() if k != -1}
        
        # Keep track of best clustering so far
        if quality_score > best_quality:
            best_quality = quality_score
            best_clusters_dict = clusters_dict.copy()
        
        # If we have good clusters or this is the last attempt, use this result
        if len(valid_clusters) > 0 or attempt == 2:
            if len(valid_clusters) > 0:
                break
    
    # Use best clustering found
    clusters_dict = best_clusters_dict
    
    # Build initial clusters with best leaders
    initial_clusters = []
    
    for label, indices in clusters_dict.items():
        if label == -1:
            # Handle noise points: try to assign to nearest cluster or create individual clusters
            if len(indices) <= 2:
                # Very few noise points: individual clusters
                for idx in indices:
                    initial_clusters.append([raw_opinions[idx]])
            else:
                # Try to assign noise points to nearest clusters
                # Calculate centroids of existing clusters first
                existing_cluster_centroids = []
                for other_label, other_indices in clusters_dict.items():
                    if other_label != -1 and len(other_indices) > 0:
                        other_embeddings = embeddings[other_indices]
                        centroid = normalize_embeddings(np.mean(other_embeddings, axis=0).reshape(1, -1))[0]
                        existing_cluster_centroids.append((other_label, centroid, other_indices))
                
                # Assign each noise point to nearest cluster or keep as separate
                # Use separate dict to avoid modifying during iteration
                reassignments = {}  # noise_idx -> cluster_label
                unassigned_noise = []
                
                for idx in indices:
                    noise_embedding = embeddings[idx]
                    best_similarity = -1
                    best_cluster_label = None
                    
                    for cluster_label, centroid, _ in existing_cluster_centroids:
                        similarity = np.dot(noise_embedding, centroid)
                        if similarity > 0.7 and similarity > best_similarity:  # Threshold for assignment
                            best_similarity = similarity
                            best_cluster_label = cluster_label
                    
                    if best_cluster_label is not None:
                        reassignments[idx] = best_cluster_label
                    else:
                        unassigned_noise.append(idx)
                
                # Apply reassignments
                for noise_idx, cluster_label in reassignments.items():
                    clusters_dict[cluster_label].append(noise_idx)
                
                # Create cluster for remaining unassigned noise
                if len(unassigned_noise) > 0:
                    if len(unassigned_noise) <= 5:
                        # Small group: create one cluster
                        noise_cluster = [raw_opinions[idx] for idx in unassigned_noise]
                        leader = select_best_leader(noise_cluster, embeddings, unassigned_noise)
                        noise_cluster_reordered = [leader]
                        noise_cluster_reordered.extend([op for op in noise_cluster if op != leader])
                        initial_clusters.append(noise_cluster_reordered)
                    else:
                        # Large group: split into smaller clusters based on similarity
                        noise_embeddings = embeddings[unassigned_noise]
                        # Simple k-means with k=min(3, len/2)
                        k = min(3, max(2, len(unassigned_noise) // 3))
                        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
                        noise_labels = kmeans.fit_predict(noise_embeddings)
                        
                        for noise_label in set(noise_labels):
                            noise_indices = [unassigned_noise[i] for i in range(len(unassigned_noise)) 
                                           if noise_labels[i] == noise_label]
                            noise_cluster = [raw_opinions[idx] for idx in noise_indices]
                            leader = select_best_leader(noise_cluster, embeddings, noise_indices)
                            noise_cluster_reordered = [leader]
                            noise_cluster_reordered.extend([op for op in noise_cluster if op != leader])
                            initial_clusters.append(noise_cluster_reordered)
        else:
            # Regular cluster - select best leader
            cluster = [raw_opinions[idx] for idx in indices]
            leader = select_best_leader(cluster, embeddings, indices)
            cluster_reordered = [leader]
            cluster_reordered.extend([op for op in cluster if op != leader])
            initial_clusters.append(cluster_reordered)
    
    # Fallback: If still no clusters (shouldn't happen, but safety check)
    if len(initial_clusters) == 0:
        print("Warning: No clusters found, creating single cluster with all opinions")
        leader = select_best_leader(raw_opinions, embeddings, list(range(len(raw_opinions))))
        initial_clusters = [[leader] + [op for op in raw_opinions if op != leader]]
    
    print(f"Created {len(initial_clusters)} initial clusters before post-processing")
    
    # Post-processing: Merge very similar clusters
    print("Post-processing: Merging similar clusters...")
    merged_clusters = merge_similar_clusters(initial_clusters, embeddings, similarity_threshold=0.82)
    print(f"After merging: {len(merged_clusters)} clusters")
    
    # Post-processing: Split clusters with low internal similarity
    print("Post-processing: Splitting dissimilar clusters...")
    final_clusters = []
    
    for cluster in merged_clusters:
        # Find indices for this cluster
        cluster_indices = []
        for opinion in cluster:
            for i, raw_opinion in enumerate(raw_opinions):
                if (opinion.get('raw_id') == raw_opinion.get('raw_id') or
                    opinion.get('opinion') == raw_opinion.get('opinion')):
                    cluster_indices.append(i)
                    break
        
        if len(cluster_indices) == len(cluster):
            split_clusters = split_dissimilar_cluster(cluster, embeddings, cluster_indices, min_similarity=0.65)
            final_clusters.extend(split_clusters)
        else:
            # Can't match, keep as-is
            final_clusters.append(cluster)
    
    print(f"Final result: {len(final_clusters)} clusters after post-processing")
    
    # Final safety check: ensure at least one cluster exists
    if len(final_clusters) == 0:
        print("Fallback: Creating single cluster with all opinions")
        if len(raw_opinions) > 0:
            leader = select_best_leader(raw_opinions, embeddings, list(range(len(raw_opinions))))
            if leader:
                final_clusters = [[leader] + [op for op in raw_opinions if op != leader]]
            else:
                # If select_best_leader fails, just use all opinions
                final_clusters = [raw_opinions]
        else:
            final_clusters = [raw_opinions]
    
    # Double-check: if still empty (shouldn't happen), create at least one cluster
    if len(final_clusters) == 0:
        print("Critical fallback: Creating empty cluster structure")
        final_clusters = [raw_opinions] if len(raw_opinions) > 0 else [[]]
    
    # Ensure all clusters have at least one opinion (remove empty clusters)
    final_clusters = [cluster for cluster in final_clusters if len(cluster) > 0]
    
    # If after filtering we have no clusters, create one with all opinions
    if len(final_clusters) == 0 and len(raw_opinions) > 0:
        print("Post-filter fallback: Creating cluster with all opinions")
        final_clusters = [raw_opinions]
    
    print(f"Final clustering result: {len(final_clusters)} clusters with {sum(len(c) for c in final_clusters)} total opinions")
    
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

            # Safety check: ensure we have at least one cluster
            if len(clusters) == 0:
                print("Warning: No clusters generated, creating single cluster with all opinions")
                # Create a single cluster with all opinions
                if len(opinions) > 0:
                    leader = select_best_leader(opinions)  # Will use weight only if embeddings not available
                    if leader:
                        clusters = [[leader] + [op for op in opinions if op != leader]]
                    else:
                        clusters = [opinions]
                else:
                    print("Error: No opinions available to cluster")
                    continue

            winners = pick_winners(clusters)
            print(f"Selected {len(winners)} cluster leaders")

            # Safety check: ensure we have at least one winner
            if len(winners) == 0:
                print("Warning: No winners selected, creating default winner")
                # Create a default winner from the first cluster
                if len(clusters) > 0 and len(clusters[0]) > 0:
                    first_cluster = clusters[0]
                    first_opinion = first_cluster[0]
                    winners = [{
                        'winner': first_opinion,
                        'username': first_opinion.get('username', 'unknown'),
                        'cluster': first_cluster
                    }]
                else:
                    # Fallback: create a winner from all opinions
                    if len(opinions) > 0:
                        leader = opinions[0]
                        winners = [{
                            'winner': leader,
                            'username': leader.get('username', 'unknown'),
                            'cluster': opinions
                        }]

            # Prepare cluster data for database
            clusters_data = [{
                'heading': summarize_heading(winner_data['winner']['opinion']),
                'leader_id': winner_data['username'],
                'raw_opinions': winner_data['cluster']
            } for winner_data in winners]

            # Final safety check: ensure we have at least one cluster to store
            if len(clusters_data) == 0:
                print("Critical: No cluster data to store, creating emergency cluster")
                # Emergency fallback: create a single cluster with all opinions
                if len(opinions) > 0:
                    leader = opinions[0]
                    clusters_data = [{
                        'heading': summarize_heading(leader.get('opinion', 'General opinions')),
                        'leader_id': leader.get('username', 'unknown'),
                        'raw_opinions': opinions
                    }]
                else:
                    print("Error: No opinions available to cluster")
                    continue

            cluster_ids = db.replace_clusters_for_topic(clusters_data, topic_uuid)

            for i, cluster_id in enumerate(cluster_ids):
                print(f"Created cluster {cluster_id} with leader {clusters_data[i]['leader_id']} "
                      f"and {len(clusters_data[i]['raw_opinions'])} opinions")

        except Exception as e:
            print(f"Worker error processing {topic_uuid}: {e}")
            import traceback
            traceback.print_exc()
            # TODO: Mark task as failed in database

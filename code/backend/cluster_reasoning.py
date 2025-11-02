"""
AI Reasoning Module for Cluster Explanations

Generates explanations for:
1. Why opinions were clustered together
2. Why a particular opinion was selected as the cluster heading
"""

import utils_llm


def generate_cluster_reasoning(cluster_opinions: list, heading: str, leader_opinion: str) -> dict:
    """
    Generate AI reasoning for why opinions were clustered and why the heading was chosen.
    
    Args:
        cluster_opinions: List of opinion dictionaries with 'opinion', 'username', 'weight'
        heading: The selected heading for the cluster
        leader_opinion: The leader opinion that was chosen
    
    Returns:
        Dictionary with:
        - 'clustering_reason': Explanation of why opinions were grouped together
        - 'heading_rationale': Explanation of why this heading was chosen
    """
    
    # Extract opinion texts
    opinions_text = [op.get('opinion', op) for op in cluster_opinions]
    opinions_with_weight = [
        f"- {op.get('opinion', op)} (weight: {op.get('weight', 0)})" 
        for op in cluster_opinions
    ]
    
    # Generate clustering reasoning
    clustering_prompt = f"""Analyze the following group of opinions and explain why they were clustered together:

Opinions in this cluster:
{chr(10).join(opinions_with_weight)}

Provide a brief explanation (2-3 sentences) of:
1. What common themes or topics connect these opinions
2. Why they semantically belong together
3. What makes this group cohesive

Format your response as a clear, concise explanation. No JSON, just plain text."""

    try:
        clustering_reason = utils_llm.ask_mistral(clustering_prompt, model="mistral-small-latest")
        # Handle different response formats
        if isinstance(clustering_reason, dict):
            clustering_reason = clustering_reason.get('explanation', str(clustering_reason))
        elif not isinstance(clustering_reason, str):
            clustering_reason = str(clustering_reason)
    except Exception as e:
        print(f"Error generating clustering reason: {e}")
        clustering_reason = "These opinions share common themes and semantic similarity, which is why they were grouped together in this cluster."
    
    # Generate heading rationale
    heading_prompt = f"""Explain why this opinion was selected as the cluster heading:

Selected heading: "{heading}"
Leader opinion: "{leader_opinion}"

All opinions in this cluster:
{chr(10).join(opinions_text)}

Provide a brief explanation (2-3 sentences) of:
1. Why this heading best represents the cluster
2. What makes it a good summary of all opinions
3. Why it was chosen over other opinions in the cluster

Format your response as a clear, concise explanation. No JSON, just plain text."""

    try:
        heading_rationale = utils_llm.ask_mistral(heading_prompt, model="mistral-small-latest")
        # Handle different response formats
        if isinstance(heading_rationale, dict):
            heading_rationale = heading_rationale.get('explanation', str(heading_rationale))
        elif not isinstance(heading_rationale, str):
            heading_rationale = str(heading_rationale)
    except Exception as e:
        print(f"Error generating heading rationale: {e}")
        heading_rationale = f'The heading "{heading}" was selected because it best represents the common themes and ideas shared across all opinions in this cluster.'
    
    return {
        'clustering_reason': clustering_reason if isinstance(clustering_reason, str) else str(clustering_reason),
        'heading_rationale': heading_rationale if isinstance(heading_rationale, str) else str(heading_rationale)
    }


def generate_simple_reasoning(cluster_opinions: list, heading: str, leader_opinion: str) -> dict:
    """
    Generate simple reasoning without LLM calls (fallback).
    Analyzes common words and themes.
    """
    from collections import Counter
    import re
    
    # Extract common words
    all_words = []
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'we', 'should', 'need', 'can', 'will', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did'}
    
    for op in cluster_opinions:
        text = op.get('opinion', op).lower()
        words = re.findall(r'\b\w+\b', text)
        all_words.extend([w for w in words if w not in stop_words and len(w) > 3])
    
    word_freq = Counter(all_words)
    common_themes = [word for word, count in word_freq.most_common(5) if count > 1]
    
    if common_themes:
        clustering_reason = f"These opinions were clustered together because they share common themes around: {', '.join(common_themes[:3])}. They express similar ideas and concerns."
    else:
        clustering_reason = "These opinions were grouped together based on semantic similarity and shared concepts."
    
    # Simple heading rationale
    heading_rationale = f'The heading "{heading}" was chosen because it best summarizes the collective sentiment and represents the key idea that connects all {len(cluster_opinions)} opinions in this cluster.'
    
    return {
        'clustering_reason': clustering_reason,
        'heading_rationale': heading_rationale
    }


from utils_llm import choose_proposed_solutions, ask_mistral
from utils_chat import get_chat_LV_popularity

cluster_circle_sizes = {'LV1':16, "LV2": 16, "LV3":16}

LVs = list(cluster_circle_sizes.keys())
texts = ['LV1 Love', 'LV2 sucks']

adjustments = get_chat_LV_popularity(LVs, texts)  # e.g. {'LV1':1, 'LV2':-1, 'LV3':0}

original = cluster_circle_sizes.copy()

adjusted = {k: original.get(k, 0) + adjustments.get(k, 0) for k in original}

total = sum(adjusted.values())
cluster_circle_sizes = {k: v * 50 / total for k, v in adjusted.items()}

print(cluster_circle_sizes)

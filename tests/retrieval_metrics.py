"""
Information Retrieval metrics (task-agnostic)
"""

from typing import List, Set
from statistics import mean


def recall_at_k(
    retrieved_ids: List[str],
    relevant_ids: Set[str],
    k: int
) -> int:
    """
    Recall@K:
    1 if any relevant doc appears in top-K, else 0
    """
    return int(any(doc_id in relevant_ids for doc_id in retrieved_ids[:k]))


def reciprocal_rank(
    retrieved_ids: List[str],
    relevant_ids: Set[str]
) -> float:
    """
    Mean Reciprocal Rank for a single query
    """
    for rank, doc_id in enumerate(retrieved_ids, start=1):
        if doc_id in relevant_ids:
            return 1.0 / rank
    return 0.0


def average(values: List[float]) -> float:
    return mean(values) if values else 0.0

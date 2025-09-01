import numpy as np
from typing import List

def normalize_embedding(embedding: List[float]) -> List[float]:
    if not embedding:
        return [0.0] * 128
    
    embedding_array = np.array(embedding, dtype=np.float32)
    norm = np.linalg.norm(embedding_array)
    if norm == 0 or np.isnan(norm):
        return [0.0] * 128
    
    normalized = (embedding_array / norm).tolist()
    while len(normalized) < 128:
        normalized.append(0.0)
    return normalized[:128]

def cosine_similarity(embedding1: List[float], embedding2: List[float]) -> float:
    if not embedding1 or not embedding2:
        return 0.0
    
    e1 = np.array(embedding1[:128], dtype=np.float32)
    e2 = np.array(embedding2[:128], dtype=np.float32)
    
    dot_product = np.dot(e1, e2)
    norm1 = np.linalg.norm(e1)
    norm2 = np.linalg.norm(e2)
    
    if norm1 == 0 or norm2 == 0:
        return 0.0
    
    similarity = dot_product / (norm1 * norm2)
    return float(similarity)

def validate_embedding_size(embedding: List[float], expected_size: int = 128) -> bool:
    if not embedding:
        return False
    return len(embedding) >= expected_size and all(isinstance(x, (int, float)) for x in embedding[:expected_size])

def is_valid_embedding(embedding: List[float]) -> bool:
    if not validate_embedding_size(embedding):
        return False
    
    embedding_array = np.array(embedding[:128], dtype=np.float32)
    if np.any(np.isnan(embedding_array)) or np.any(np.isinf(embedding_array)):
        return False
    
    norm = np.linalg.norm(embedding_array)
    return norm > 0
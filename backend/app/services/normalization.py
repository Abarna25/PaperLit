import re
import unicodedata
from typing import List, Dict, Any, Tuple

def normalize_title(title: str) -> str:
    """
    Normalizes a scholarly paper title by:
    1. Lowercasing
    2. Decomposing Unicode characters and removing accents
    3. Stripping leading/trailing punctuation and version markers (e.g., [v1], (Preprint))
    4. Replacing punctuation with single spaces
    5. Collapsing consecutive whitespace
    """
    if not title:
        return ""
    
    # Unicode NFKD normalization to strip diacritics
    normalized = unicodedata.normalize('NFKD', title)
    normalized = "".join([c for c in normalized if not unicodedata.combining(c)])
    
    # Lowercase
    normalized = normalized.lower()
    
    # Strip common preprint / version markers
    normalized = re.sub(r'\[v\d+\]', '', normalized)
    normalized = re.sub(r'\(preprint\)', '', normalized)
    normalized = re.sub(r'\(journal version\)', '', normalized)
    
    # Replace punctuation and special characters with spaces
    normalized = re.sub(r'[^\w\s]', ' ', normalized)
    
    # Collapse multiple whitespaces
    normalized = re.sub(r'\s+', ' ', normalized).strip()
    return normalized

def normalize_author_name(name: str) -> Tuple[str, str]:
    """
    Splits an author's name into (first_initials, last_name).
    Handles "LastName, FirstName" and "FirstName LastName".
    """
    if not name:
        return ("", "")
    
    name = re.sub(r'[^\w\s,.-]', '', name).strip()
    
    if ',' in name:
        parts = [p.strip() for p in name.split(',', 1)]
        last_name = parts[0].lower()
        first_part = parts[1].lower() if len(parts) > 1 else ""
    else:
        parts = name.split()
        if len(parts) == 1:
            return ("", parts[0].lower())
        last_name = parts[-1].lower()
        first_part = " ".join(parts[:-1]).lower()
    
    # Extract first letter initials
    first_initials = "".join([w[0] for w in first_part.split() if w])
    return (first_initials, last_name)

def calculate_levenshtein_similarity(s1: str, s2: str) -> float:
    """
    Computes normalized Levenshtein similarity score between 0.0 and 1.0.
    1.0 means exact match; 0.0 means completely disjoint.
    """
    if s1 == s2:
        return 1.0
    if not s1 or not s2:
        return 0.0
    
    len1, len2 = len(s1), len(s2)
    dp = [[0] * (len2 + 1) for _ in range(len1 + 1)]
    
    for i in range(len1 + 1):
        dp[i][0] = i
    for j in range(len2 + 1):
        dp[0][j] = j
        
    for i in range(1, len1 + 1):
        for j in range(1, len2 + 1):
            cost = 0 if s1[i - 1] == s2[j - 1] else 1
            dp[i][j] = min(
                dp[i - 1][j] + 1,      # deletion
                dp[i][j - 1] + 1,      # insertion
                dp[i - 1][j - 1] + cost # substitution
            )
            
    distance = dp[len1][len2]
    max_len = max(len1, len2)
    return max(0.0, 1.0 - (distance / max_len))

def calculate_token_jaccard_similarity(s1: str, s2: str) -> float:
    """
    Calculates token-based Jaccard similarity between two normalized strings.
    """
    tokens1 = set(s1.split())
    tokens2 = set(s2.split())
    
    if not tokens1 or not tokens2:
        return 0.0
        
    intersection = tokens1.intersection(tokens2)
    union = tokens1.union(tokens2)
    return len(intersection) / len(union)

def calculate_title_similarity(title1: str, title2: str) -> float:
    """
    Hybrid title similarity combining normalized Levenshtein and token Jaccard.
    """
    n1 = normalize_title(title1)
    n2 = normalize_title(title2)
    
    if n1 == n2:
        return 1.0
    
    lev = calculate_levenshtein_similarity(n1, n2)
    jaccard = calculate_token_jaccard_similarity(n1, n2)
    
    # 60% Levenshtein + 40% Token Jaccard
    return round((0.6 * lev) + (0.4 * jaccard), 4)

def compare_authors(
    candidate_authors: List[Dict[str, Any]], 
    resolved_authors: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Compares author lists for citation verification, accounting for:
    - Formatting differences ('Last, First' vs 'First Last')
    - Initials vs full names
    - Author ordering and overlap
    """
    cand_lastnames = []
    for a in candidate_authors:
        name = a.get("name") or f"{a.get('first_name', '')} {a.get('last_name', '')}".strip()
        _, last = normalize_author_name(name)
        if last:
            cand_lastnames.append(last)
            
    resolved_lastnames = []
    for a in resolved_authors:
        name = a.get("name") or f"{a.get('first_name', '')} {a.get('last_name', '')}".strip()
        _, last = normalize_author_name(name)
        if last:
            resolved_lastnames.append(last)
            
    if not cand_lastnames or not resolved_lastnames:
        return {
            "first_author_match": False,
            "overlap_ratio": 0.0,
            "matching_authors": [],
            "candidate_count": len(cand_lastnames),
            "resolved_count": len(resolved_lastnames),
            "verdict": "INSUFFICIENT_AUTHOR_DATA"
        }
        
    first_author_match = (cand_lastnames[0] == resolved_lastnames[0])
    
    cand_set = set(cand_lastnames)
    resolved_set = set(resolved_lastnames)
    common = cand_set.intersection(resolved_set)
    overlap_ratio = len(common) / max(len(cand_set), len(resolved_set))
    
    verdict = "MATCH" if (first_author_match and overlap_ratio >= 0.5) or overlap_ratio >= 0.75 else "MISMATCH"
    
    return {
        "first_author_match": first_author_match,
        "first_candidate_author": cand_lastnames[0],
        "first_resolved_author": resolved_lastnames[0],
        "overlap_ratio": round(overlap_ratio, 4),
        "matching_authors": list(common),
        "candidate_count": len(cand_lastnames),
        "resolved_count": len(resolved_lastnames),
        "verdict": verdict
    }

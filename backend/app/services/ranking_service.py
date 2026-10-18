import math
import re
from typing import List, Dict, Any, Tuple
from app.models.schemas import PaperRecord, RelevanceAssessmentSchema, RankingConfig
from app.services.normalization import normalize_title

class RankingService:
    """
    Transparent ranking pipeline combining:
    - BM25 deterministic relevance scoring & keyword coverage
    - Research question semantic alignment
    - Publication year decay/preference
    - Preferred methodology bonus
    Every score includes a human-readable explanation and component breakdown.
    """

    def __init__(self, config: RankingConfig = RankingConfig()):
        self.config = config

    def rank_papers(
        self,
        papers: List[PaperRecord],
        question: str,
        keywords: List[str],
        year_start: int,
        year_end: int,
        preferred_methodologies: List[str]
    ) -> List[PaperRecord]:
        """
        Ranks papers and attaches detailed RelevanceAssessmentSchema to each paper.
        """
        if not papers:
            return []

        # Tokenize corpus for BM25
        tokenized_corpus = []
        for p in papers:
            text = f"{p.canonical_title} {p.abstract or ''}".lower()
            tokens = re.findall(r'\b\w+\b', text)
            tokenized_corpus.append(tokens)

        # Tokenize query
        q_tokens = re.findall(r'\b\w+\b', question.lower())
        kw_tokens = [kw.lower().strip() for kw in keywords if kw.strip()]
        method_tokens = [m.lower().strip() for m in preferred_methodologies if m.strip()]

        doc_count = len(papers)
        avg_doc_len = sum(len(doc) for doc in tokenized_corpus) / max(1, doc_count)

        # Document frequencies for BM25
        df: Dict[str, int] = {}
        for doc in tokenized_corpus:
            unique_terms = set(doc)
            for t in unique_terms:
                df[t] = df.get(t, 0) + 1

        k1 = 1.5
        b = 0.75

        for idx, paper in enumerate(papers):
            doc = tokenized_corpus[idx]
            doc_len = len(doc)
            term_freq: Dict[str, int] = {}
            for t in doc:
                term_freq[t] = term_freq.get(t, 0) + 1

            # 1. Question BM25 alignment score
            bm25_score = 0.0
            for qt in q_tokens:
                if qt in term_freq:
                    doc_freq = df.get(qt, 0)
                    idf = math.log((doc_count - doc_freq + 0.5) / (doc_freq + 0.5) + 1.0)
                    tf = term_freq[qt]
                    numerator = tf * (k1 + 1)
                    denominator = tf + k1 * (1 - b + b * (doc_len / avg_doc_len))
                    bm25_score += max(0.0, idf * (numerator / max(0.1, denominator)))

            # Normalize BM25 score to 0..1 range with sigmoid-like curve
            norm_bm25 = round(1.0 - math.exp(-0.25 * bm25_score), 4)

            # 2. Keyword coverage score
            paper_full_text = f"{paper.canonical_title} {paper.abstract or ''}".lower()
            matched_kws = [kw for kw in kw_tokens if kw in paper_full_text]
            keyword_score = round(len(matched_kws) / max(1, len(kw_tokens)), 4)

            # 3. Question exact phrase or word alignment
            norm_title = normalize_title(paper.canonical_title)
            q_norm = normalize_title(question)
            common_q_words = set(norm_title.split()).intersection(set(q_norm.split()))
            alignment_score = round(len(common_q_words) / max(1, len(set(q_norm.split()))), 4)

            # 4. Publication date constraints score
            pub_year = paper.publication_year or year_start
            if year_start <= pub_year <= year_end:
                recency_score = 1.0
            elif pub_year < year_start:
                recency_score = max(0.0, 1.0 - 0.15 * (year_start - pub_year))
            else:
                recency_score = 0.8  # Near future / recent preprint

            # 5. Preferred methodology match
            matched_methods = [m for m in method_tokens if m in paper_full_text]
            methodology_score = 1.0 if matched_methods else (0.5 if not method_tokens else 0.2)

            # Weighted final score
            final_score = round(
                (self.config.semantic_weight * norm_bm25) +
                (self.config.keyword_weight * keyword_score) +
                (self.config.alignment_weight * alignment_score) +
                (self.config.recency_weight * recency_score) +
                (self.config.methodology_weight * methodology_score),
                4
            )

            # Human-readable explanation
            explanation_parts = []
            explanation_parts.append(f"Query BM25 relevance score: {norm_bm25 * 100:.1f}%.")
            if matched_kws:
                explanation_parts.append(f"Matched {len(matched_kws)}/{len(kw_tokens)} required keywords ({', '.join(matched_kws)}).")
            else:
                explanation_parts.append("Matched zero required keywords directly in title/abstract.")
            if matched_methods:
                explanation_parts.append(f"Aligns with requested methodology: {', '.join(matched_methods)}.")
            explanation_parts.append(f"Publication year {pub_year} within range [{year_start}–{year_end}].")

            explanation = " ".join(explanation_parts)

            paper.relevance = RelevanceAssessmentSchema(
                score=final_score,
                score_components={
                    "semantic_bm25": norm_bm25,
                    "keyword_coverage": keyword_score,
                    "question_alignment": alignment_score,
                    "year_validity": recency_score,
                    "methodology_bonus": methodology_score
                },
                explanation=explanation,
                ranking_method=self.config.ranking_method
            )

        # Sort descending by score
        papers.sort(key=lambda p: (p.relevance.score if p.relevance else 0.0), reverse=True)
        return papers

import uuid
from typing import List, Dict, Any, Tuple
from app.services.normalization import (
    normalize_title,
    calculate_title_similarity,
    compare_authors
)
from app.models.schemas import PaperRecord, PaperVersionSchema, PaperSourceSchema

class PublicationLineageEngine:
    """
    Publication Lineage Intelligence:
    Identifies preprints, conference, and peer-reviewed journal versions of scholarly works.
    Merges duplicate/version records into a canonical representation while preserving all source links.
    """

    def classify_version_relationship(
        self,
        paper_a: PaperRecord,
        paper_b: PaperRecord
    ) -> Tuple[str, str, float, Dict[str, Any]]:
        """
        Compares two paper records and determines matching status:
        - CONFIRMED_DUPLICATE
        - LIKELY_DUPLICATE
        - DISTINCT
        - PENDING_REVIEW
        Returns:
            (matching_status, relationship_type, match_score, evidence_dict)
        """
        evidence: Dict[str, Any] = {}

        # 1. Exact Identifier Checks (Highest Confidence)
        has_doi_a = bool(paper_a.doi and paper_a.doi.strip())
        has_doi_b = bool(paper_b.doi and paper_b.doi.strip())
        clean_doi_a = paper_a.doi.strip().lower() if has_doi_a else None
        clean_doi_b = paper_b.doi.strip().lower() if has_doi_b else None

        if clean_doi_a and clean_doi_b and clean_doi_a == clean_doi_b:
            evidence["doi_match"] = True
            evidence["doi"] = clean_doi_a
            rel_type = self._determine_relationship_type(paper_a, paper_b)
            return "CONFIRMED_DUPLICATE", rel_type, 1.0, evidence

        # Check arXiv IDs in sources
        arxiv_ids_a = {s.source_record_id for s in paper_a.sources if s.source_name == "arxiv"}
        arxiv_ids_b = {s.source_record_id for s in paper_b.sources if s.source_name == "arxiv"}
        common_arxiv = arxiv_ids_a.intersection(arxiv_ids_b)
        if common_arxiv:
            evidence["arxiv_id_match"] = list(common_arxiv)
            rel_type = self._determine_relationship_type(paper_a, paper_b)
            return "CONFIRMED_DUPLICATE", rel_type, 0.98, evidence

        # 2. Title & Author Similarity
        title_sim = calculate_title_similarity(paper_a.canonical_title, paper_b.canonical_title)
        evidence["title_similarity"] = title_sim

        author_comp = compare_authors(paper_a.canonical_authors, paper_b.canonical_authors)
        evidence["author_comparison"] = author_comp

        # Score calculation
        combined_score = round((0.6 * title_sim) + (0.4 * author_comp.get("overlap_ratio", 0.0)), 4)
        evidence["combined_score"] = combined_score

        # Rule 1: High title similarity + author match -> CONFIRMED_DUPLICATE
        if title_sim >= 0.88 and author_comp.get("verdict") == "MATCH":
            rel_type = self._determine_relationship_type(paper_a, paper_b)
            return "CONFIRMED_DUPLICATE", rel_type, combined_score, evidence

        # Rule 2: Title similarity >= 0.78 and first author matches -> LIKELY_DUPLICATE
        if title_sim >= 0.78 and author_comp.get("first_author_match"):
            rel_type = self._determine_relationship_type(paper_a, paper_b)
            return "LIKELY_DUPLICATE", rel_type, combined_score, evidence

        # Rule 3: High title similarity but author mismatch or low author overlap -> PENDING_REVIEW
        # "Do not merge papers based only on similar titles. Ambiguous matches must remain separate or be marked PENDING_REVIEW."
        if title_sim >= 0.75:
            evidence["reason"] = "High title similarity but differing author list or low author overlap."
            return "PENDING_REVIEW", "UNCERTAIN_VERSION", combined_score, evidence

        # Otherwise DISTINCT
        return "DISTINCT", "NONE", combined_score, evidence

    def _determine_relationship_type(self, paper_a: PaperRecord, paper_b: PaperRecord) -> str:
        """
        Determines which is preprint and which is journal/conference publication.
        """
        has_arxiv_a = any(s.source_name == "arxiv" for s in paper_a.sources)
        has_arxiv_b = any(s.source_name == "arxiv" for s in paper_b.sources)

        venue_a = (paper_a.venue or "").lower()
        venue_b = (paper_b.venue or "").lower()

        # If one has a recognized journal or conference venue and the other is arXiv
        is_journal_a = bool(venue_a and "arxiv" not in venue_a)
        is_journal_b = bool(venue_b and "arxiv" not in venue_b)

        if has_arxiv_a and is_journal_b:
            return "JOURNAL_VERSION"
        elif has_arxiv_b and is_journal_a:
            return "PREPRINT"
        elif has_arxiv_a and has_arxiv_b:
            return "REVISED_PREPRINT"
        elif is_journal_a or is_journal_b:
            return "JOURNAL_VERSION"
        return "PREPRINT"

    def deduplicate_and_link_lineage(self, candidate_papers: List[PaperRecord]) -> List[PaperRecord]:
        """
        Runs candidate matching across all retrieved papers:
        - Merges confirmed duplicates into a single canonical record
        - Links preprint and journal versions
        - Retains all source records and provenance
        - Prefers journal metadata for canonical citation when confirmed
        """
        if not candidate_papers:
            return []

        canonical_records: List[PaperRecord] = []

        for candidate in candidate_papers:
            matched = False
            for existing in canonical_records:
                status, rel_type, score, evidence = self.classify_version_relationship(existing, candidate)
                if status in ("CONFIRMED_DUPLICATE", "LIKELY_DUPLICATE"):
                    matched = True
                    # Record version link
                    version_link = PaperVersionSchema(
                        canonical_paper_id=existing.id,
                        version_paper_id=candidate.id,
                        relationship_type=rel_type,
                        matching_status=status,
                        match_score=score,
                        matching_evidence=evidence
                    )
                    existing.versions.append(version_link)

                    # Preserve source records
                    for src in candidate.sources:
                        if not any(s.source_name == src.source_name and s.source_record_id == src.source_record_id for s in existing.sources):
                            existing.sources.append(src)

                    # If candidate has peer-reviewed journal venue or DOI while existing does not, elevate canonical
                    if (not existing.doi and candidate.doi) or (rel_type == "JOURNAL_VERSION" and candidate.venue):
                        existing.canonical_title = candidate.canonical_title
                        existing.canonical_authors = candidate.canonical_authors
                        if candidate.doi:
                            existing.doi = candidate.doi
                        if candidate.venue:
                            existing.venue = candidate.venue
                        if candidate.publication_year:
                            existing.publication_year = candidate.publication_year
                    break

            if not matched:
                canonical_records.append(candidate)

        return canonical_records

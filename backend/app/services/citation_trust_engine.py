from datetime import datetime, timezone
from typing import Dict, Any, Optional
from app.services.normalization import (
    normalize_title,
    calculate_title_similarity,
    compare_authors
)
from app.services.crossref_service import CrossrefService
from app.models.schemas import CitationVerificationSchema

class CitationTrustEngine:
    def __init__(self, crossref_service: Optional[CrossrefService] = None):
        self.crossref = crossref_service or CrossrefService()
        
    async def verify_paper_citation(
        self,
        candidate_title: str,
        candidate_authors: list,
        doi: Optional[str]
    ) -> CitationVerificationSchema:
        """
        Executes the full 10-step verification pipeline:
        - Resolves DOI independently
        - Retrieves authoritative Crossref metadata
        - Normalizes titles & authors
        - Compares title similarity (Levenshtein + Token Jaccard)
        - Compares author names and ordering
        - Distinguishes VERIFIED, MISMATCH, UNVERIFIED, NO_DOI, PENDING_REVIEW
        - Records granular verification evidence
        """
        now_str = datetime.now(timezone.utc).isoformat()
        
        # Step 1 & 2: Check DOI presence
        if not doi or not doi.strip():
            return CitationVerificationSchema(
                doi=None,
                resolution_status="NO_DOI",
                resolved_url=None,
                returned_title=None,
                returned_authors=[],
                title_match_score=0.0,
                author_match_result={"verdict": "NO_DOI"},
                verification_status="NO_DOI",
                evidence={
                    "trust_audit": "Paper has no registered DOI. Handled as separate unindexed record.",
                    "verified_in_bibliography": False
                },
                checked_at=now_str
            )
            
        clean_doi = doi.strip()
        if "doi.org/" in clean_doi:
            clean_doi = clean_doi.split("doi.org/")[-1].strip()
            
        # Step 3: Resolve DOI via Crossref
        resolution_status, resolved_meta, resolution_evidence = await self.crossref.resolve_doi(clean_doi)
        
        if resolution_status != "RESOLVED" or not resolved_meta:
            return CitationVerificationSchema(
                doi=clean_doi,
                resolution_status=resolution_status,
                resolved_url=None,
                returned_title=None,
                returned_authors=[],
                title_match_score=0.0,
                author_match_result={"verdict": "UNRESOLVED_DOI"},
                verification_status="UNVERIFIED",
                evidence={
                    "resolution_evidence": resolution_evidence,
                    "trust_audit": f"DOI resolution resulted in {resolution_status}. Authoritative metadata could not be fetched.",
                    "verified_in_bibliography": False
                },
                checked_at=now_str
            )
            
        resolved_title = resolved_meta.get("title", "")
        resolved_authors = resolved_meta.get("authors", [])
        resolved_url = resolved_meta.get("url", f"https://doi.org/{clean_doi}")
        
        # Step 4 & 5: Normalize and compare title similarity
        title_similarity = calculate_title_similarity(candidate_title, resolved_title)
        
        # Step 6: Compare author names and order
        author_comparison = compare_authors(candidate_authors, resolved_authors)
        
        # Step 7 & 8: Classification logic
        # High confidence match: title similarity >= 0.82 and author verdict is MATCH
        if title_similarity >= 0.82 and author_comparison.get("verdict") == "MATCH":
            verification_status = "VERIFIED"
            audit_message = (
                f"DOI successfully verified. Title similarity is {title_similarity * 100:.1f}%. "
                f"Author overlap ratio: {author_comparison.get('overlap_ratio', 0) * 100:.1f}%."
            )
        # Moderate title match, or author format ambiguity -> PENDING_REVIEW
        elif title_similarity >= 0.70 or (title_similarity >= 0.60 and author_comparison.get("first_author_match")):
            verification_status = "PENDING_REVIEW"
            audit_message = (
                f"Ambiguous match requiring human inspection. Title similarity {title_similarity * 100:.1f}%, "
                f"Author verdict: {author_comparison.get('verdict')}."
            )
        # Severe title or author divergence -> MISMATCH
        else:
            verification_status = "MISMATCH"
            audit_message = (
                f"FLAGGED MISMATCH: DOI resolves to a completely different work! "
                f"Candidate: '{candidate_title[:60]}...' vs Resolved: '{resolved_title[:60]}...'. "
                f"Title similarity is only {title_similarity * 100:.1f}%."
            )
            
        return CitationVerificationSchema(
            doi=clean_doi,
            resolution_status="RESOLVED",
            resolved_url=resolved_url,
            returned_title=resolved_title,
            returned_authors=resolved_authors,
            title_match_score=title_similarity,
            author_match_result=author_comparison,
            verification_status=verification_status,
            evidence={
                "resolution_evidence": resolution_evidence,
                "normalized_candidate_title": normalize_title(candidate_title),
                "normalized_resolved_title": normalize_title(resolved_title),
                "title_similarity": title_similarity,
                "author_comparison": author_comparison,
                "trust_audit": audit_message,
                "verified_in_bibliography": (verification_status == "VERIFIED")
            },
            checked_at=now_str
        )

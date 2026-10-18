from typing import Dict, Any, List
from app.models.schemas import PaperRecord, ResearchEvidencePassport
from app.services.normalization import normalize_title

class EvidencePassportService:
    """
    Research Evidence Passport Builder:
    Constructs an inspectable, cryptographic-grade provenance record for each paper.
    Categorizes every claim into:
    - VERIFIED_FACT (e.g., Cryptographically verified DOI match, Crossref registration)
    - SOURCE_REPORTED_CLAIM (e.g., Venue reported by publisher, author affiliations)
    - MODEL_GENERATED_INTERPRETATION (e.g., Objective and limitation extraction, BM25 score)
    - UNCERTAIN_FINDING (e.g., Ambiguous lineage matches, missing licenses)
    """

    def generate_passport(self, paper: PaperRecord) -> ResearchEvidencePassport:
        # Extract source IDs and URLs
        source_urls = [s.source_url for s in paper.sources if s.source_url]
        retrieval_timestamps = [s.retrieved_at for s in paper.sources]

        arxiv_id = None
        s2_id = None
        for s in paper.sources:
            if s.source_name == "arxiv":
                arxiv_id = s.source_record_id
            elif s.source_name == "semantic_scholar":
                s2_id = s.source_record_id

        # Verification state
        v_status = paper.citation_verification.verification_status if paper.citation_verification else "UNVERIFIED"
        doi_res_status = paper.citation_verification.resolution_status if paper.citation_verification else "NO_DOI"

        unresolved_issues: List[str] = []
        if v_status == "MISMATCH":
            unresolved_issues.append("CRITICAL: Authoritative DOI registry resolves to an incongruent scholarly title.")
        elif v_status == "NO_DOI":
            unresolved_issues.append("Unindexed work: No persistent DOI assigned; relied solely on preprint repository ID.")
        elif v_status == "PENDING_REVIEW":
            unresolved_issues.append("Review required: Author overlap or title similarity is borderline.")

        # Open access
        oa_status = paper.access.status if paper.access else "ACCESS_UNKNOWN"
        oa_evidence = paper.access.evidence if paper.access else {}
        license_info = paper.access.license_url if paper.access else None

        if oa_status == "PAYWALLED_OR_RESTRICTED":
            unresolved_issues.append("Restricted Access: Paper is hosted behind a commercial paywall; legitimate article link retained.")

        # Version evidence
        version_evidence = {
            "version_count": len(paper.versions),
            "linked_versions": [
                {
                    "relationship": v.relationship_type,
                    "status": v.matching_status,
                    "score": v.match_score
                }
                for v in paper.versions
            ]
        }

        # Provenance labels
        provenance = {
            "title": "VERIFIED_SOURCE_FACT" if v_status == "VERIFIED" else "SOURCE_REPORTED_CLAIM",
            "doi": "VERIFIED_FACT" if doi_res_status == "RESOLVED" else "SOURCE_REPORTED_CLAIM",
            "open_access": "VERIFIED_REPOSITORY_POLICY" if oa_status == "OPEN_ACCESS_VERIFIED" else "UNCERTAIN_FINDING",
            "annotation": "MODEL_GENERATED_INTERPRETATION",
            "relevance_score": "DETERMINISTIC_BM25_INTERPRETATION"
        }

        return ResearchEvidencePassport(
            paper_id=paper.id,
            canonical_title=paper.canonical_title,
            canonical_authors=paper.canonical_authors,
            publication_year=paper.publication_year,
            venue=paper.venue,
            doi=paper.doi,
            doi_resolution_status=doi_res_status,
            arxiv_id=arxiv_id,
            semantic_scholar_id=s2_id,
            source_urls=source_urls,
            retrieval_timestamps=retrieval_timestamps,
            original_source_metadata={s.source_name: s.source_metadata for s in paper.sources},
            normalized_metadata={
                "normalized_title": normalize_title(paper.canonical_title),
                "author_count": len(paper.canonical_authors),
                "has_doi": bool(paper.doi)
            },
            relevance_score=paper.relevance.score if paper.relevance else 0.0,
            relevance_rationale=paper.relevance.explanation if paper.relevance else "Unscored",
            duplicate_and_version_evidence=version_evidence,
            open_access_status=oa_status,
            open_access_evidence=oa_evidence,
            license_info=license_info,
            annotation=paper.annotation,
            verification_state=v_status,
            unresolved_issues=unresolved_issues,
            action_history=[],
            provenance_labels=provenance
        )

from datetime import datetime, timezone
from typing import Dict, Any, Optional
from app.models.schemas import PaperRecord, AccessAssessmentSchema

class OpenAccessService:
    """
    Open-Access Assessment Service:
    Evaluates legitimate open access availability without bypassing paywalls.
    Records repository origin, license details, and preserves authoritative publisher URLs.
    """

    def assess_paper_access(self, paper: PaperRecord) -> AccessAssessmentSchema:
        now_str = datetime.now(timezone.utc).isoformat()

        # Check for arXiv source (guaranteed open access repository)
        arxiv_sources = [s for s in paper.sources if s.source_name == "arxiv"]
        if arxiv_sources:
            arxiv_id = arxiv_sources[0].source_record_id
            pdf_url = f"https://arxiv.org/pdf/{arxiv_id}.pdf"
            return AccessAssessmentSchema(
                status="OPEN_ACCESS_VERIFIED",
                pdf_url=pdf_url,
                access_source="arXiv Open Repository",
                license_url="http://arxiv.org/licenses/nonexclusive-distrib/1.0/",
                evidence={
                    "repository": "arXiv",
                    "arxiv_id": arxiv_id,
                    "access_policy": "Permitted author self-archived repository",
                    "license": "arXiv non-exclusive distribution license",
                    "paywall_bypassed": False
                },
                checked_at=now_str
            )

        # Check Semantic Scholar openAccessPdf field
        for src in paper.sources:
            if src.source_name == "semantic_scholar":
                s2_meta = src.source_metadata
                oa_info = s2_meta.get("openAccessPdf")
                if oa_info and oa_info.get("url"):
                    return AccessAssessmentSchema(
                        status="OPEN_ACCESS_VERIFIED",
                        pdf_url=oa_info.get("url"),
                        access_source="Semantic Scholar Open Access Index",
                        license_url=oa_info.get("status"),
                        evidence={
                            "provider": "Semantic Scholar Open Graph",
                            "status": oa_info.get("status"),
                            "disclaimer": "Reachable PDF link provided by authoritative index. Redistribution subject to repository license.",
                            "paywall_bypassed": False
                        },
                        checked_at=now_str
                    )

        # Check if known paywalled publisher domain
        doi = paper.doi or ""
        publisher_venue = (paper.venue or "").lower()
        paywalled_publishers = ["elsevier", "ieee", "springer", "nature", "science", "wiley", "acm", "taylor & francis"]
        is_paywalled_venue = any(pub in publisher_venue for pub in paywalled_publishers)

        # If DOI is present but no OA link found and venue is a commercial publisher:
        if doi and is_paywalled_venue:
            legitimate_url = paper.canonical_url or f"https://doi.org/{doi}"
            return AccessAssessmentSchema(
                status="PAYWALLED_OR_RESTRICTED",
                pdf_url=None,
                access_source="Commercial Academic Publisher",
                license_url=None,
                evidence={
                    "venue": paper.venue,
                    "legitimate_article_url": legitimate_url,
                    "policy": "Restricted subscription access or paywalled publication. Paywall bypass strictly prohibited.",
                    "download_permitted": False,
                    "action_required": "Refer to institutional library subscription or request author copy via legitimate channels."
                },
                checked_at=now_str
            )

        # If canonical URL exists but no verified direct PDF
        if paper.canonical_url:
            return AccessAssessmentSchema(
                status="ACCESS_UNKNOWN",
                pdf_url=None,
                access_source="Web Index",
                license_url=None,
                evidence={
                    "canonical_url": paper.canonical_url,
                    "note": "Document metadata is indexed, but no verified open-access repository mirror was identified.",
                    "download_permitted": False
                },
                checked_at=now_str
            )

        return AccessAssessmentSchema(
            status="PDF_UNAVAILABLE",
            pdf_url=None,
            access_source="None",
            license_url=None,
            evidence={
                "note": "No PDF URL or open repository source discovered.",
                "download_permitted": False
            },
            checked_at=now_str
        )

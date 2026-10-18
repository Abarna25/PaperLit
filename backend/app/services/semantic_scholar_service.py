import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import httpx
from app.core.config import settings
from app.models.schemas import PaperRecord, PaperSourceSchema
from app.services.normalization import normalize_title

logger = logging.getLogger(__name__)

class SemanticScholarService:
    def __init__(self):
        self.base_url = "https://api.semanticscholar.org/graph/v1/paper/search"

    async def search(
        self,
        keywords: List[str],
        year_start: int,
        year_end: int,
        target_count: int = 25
    ) -> List[PaperRecord]:
        """
        Queries Semantic Scholar Academic Graph API.
        Extracts title, authors, year, venue, externalIds (DOI, ArXiv), abstract, and openAccessPdf.
        """
        query_str = " ".join(keywords)
        params = {
            "query": query_str,
            "fields": "paperId,title,abstract,venue,year,authors,externalIds,openAccessPdf",
            "year": f"{year_start}-{year_end}",
            "limit": min(target_count * 2, 40)
        }

        headers = {}
        if settings.SEMANTIC_SCHOLAR_API_KEY:
            headers["x-api-key"] = settings.SEMANTIC_SCHOLAR_API_KEY

        papers: List[PaperRecord] = []
        retrieved_at_str = datetime.now(timezone.utc).isoformat()

        try:
            async with httpx.AsyncClient(timeout=settings.HTTP_TIMEOUT_SECONDS, follow_redirects=True) as client:
                resp = await client.get(self.base_url, params=params, headers=headers)
                if resp.status_code == 200:
                    data = resp.json().get("data", [])
                    for item in data:
                        raw_title = item.get("title") or "Untitled"
                        clean_title = raw_title.strip()
                        abstract = item.get("abstract") or ""

                        authors = []
                        for a in item.get("authors", []):
                            if a.get("name"):
                                authors.append({"name": a.get("name")})

                        ext_ids = item.get("externalIds") or {}
                        doi = ext_ids.get("DOI")
                        arxiv_id = ext_ids.get("ArXiv")
                        paper_id = item.get("paperId", "")

                        canonical_url = f"https://www.semanticscholar.org/paper/{paper_id}" if paper_id else None

                        source = PaperSourceSchema(
                            source_name="semantic_scholar",
                            source_record_id=paper_id,
                            source_url=canonical_url,
                            source_metadata=item,
                            retrieved_at=retrieved_at_str
                        )

                        paper = PaperRecord(
                            id=f"s2_{paper_id[:12]}",
                            canonical_title=clean_title,
                            normalized_title=normalize_title(clean_title),
                            canonical_authors=authors,
                            publication_year=item.get("year"),
                            venue=item.get("venue"),
                            doi=doi,
                            abstract=abstract,
                            canonical_url=canonical_url,
                            sources=[source]
                        )
                        papers.append(paper)
                        if len(papers) >= target_count:
                            break
                elif resp.status_code == 429:
                    logger.warning("Semantic Scholar rate limit reached (HTTP 429).")
        except Exception as e:
            logger.warning(f"Semantic Scholar API error: {e}. Graceful continuation.")

        return papers

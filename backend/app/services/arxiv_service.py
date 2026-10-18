import asyncio
import logging
import re
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import httpx
from app.core.config import settings
from app.models.schemas import PaperRecord, PaperSourceSchema, AuthorSchema
from app.services.normalization import normalize_title

logger = logging.getLogger(__name__)

ARXIV_NAMESPACE = {"atom": "http://www.w3.org/2005/Atom", "arxiv": "http://arxiv.org/schemas/atom"}

class ArxivService:
    def __init__(self):
        self.base_url = "http://export.arxiv.org/api/query"
        self._last_request_time = 0.0

    async def _rate_limit(self):
        """Respect arXiv 3-second polite rate limit window."""
        now = asyncio.get_event_loop().time()
        elapsed = now - self._last_request_time
        if elapsed < 3.0:
            await asyncio.sleep(3.0 - elapsed)
        self._last_request_time = asyncio.get_event_loop().time()

    async def search(
        self,
        keywords: List[str],
        year_start: int,
        year_end: int,
        target_count: int = 25
    ) -> List[PaperRecord]:
        """
        Executes query against arXiv API and transforms Atom XML feed into PaperRecord list.
        """
        # Build search query: all:keyword1 AND all:keyword2
        clean_kws = [re.sub(r'[^a-zA-Z0-9_\- ]', '', kw).strip() for kw in keywords if kw.strip()]
        if not clean_kws:
            clean_kws = ["machine learning"]

        query_terms = [f"all:{kw}" for kw in clean_kws]
        search_query = " AND ".join(query_terms)

        params = {
            "search_query": search_query,
            "start": 0,
            "max_results": min(target_count * 2, 50),
            "sortBy": "relevance",
            "sortOrder": "descending"
        }

        papers: List[PaperRecord] = []
        retrieved_at_str = datetime.now(timezone.utc).isoformat()

        try:
            await self._rate_limit()
            async with httpx.AsyncClient(timeout=settings.HTTP_TIMEOUT_SECONDS, follow_redirects=True) as client:
                resp = await client.get(self.base_url, params=params)
                if resp.status_code == 200:
                    root = ET.fromstring(resp.text)
                    for entry in root.findall("atom:entry", ARXIV_NAMESPACE):
                        raw_id = entry.find("atom:id", ARXIV_NAMESPACE)
                        id_str = raw_id.text.strip() if raw_id is not None and raw_id.text else ""
                        arxiv_id = id_str.split("/abs/")[-1].strip() if "/abs/" in id_str else id_str

                        title_el = entry.find("atom:title", ARXIV_NAMESPACE)
                        raw_title = title_el.text.strip() if title_el is not None and title_el.text else "Untitled"
                        # Clean newlines from title
                        clean_title = re.sub(r'\s+', ' ', raw_title)

                        summary_el = entry.find("atom:summary", ARXIV_NAMESPACE)
                        abstract = summary_el.text.strip() if summary_el is not None and summary_el.text else ""
                        abstract = re.sub(r'\s+', ' ', abstract)

                        published_el = entry.find("atom:published", ARXIV_NAMESPACE)
                        published_str = published_el.text.strip() if published_el is not None and published_el.text else ""
                        pub_year = None
                        if published_str and len(published_str) >= 4:
                            try:
                                pub_year = int(published_str[:4])
                            except ValueError:
                                pass

                        # Year filtering
                        if pub_year and (pub_year < year_start or pub_year > year_end):
                            continue

                        authors = []
                        for author_el in entry.findall("atom:author", ARXIV_NAMESPACE):
                            name_el = author_el.find("atom:name", ARXIV_NAMESPACE)
                            if name_el is not None and name_el.text:
                                authors.append({"name": name_el.text.strip()})

                        # Check for DOI
                        doi_el = entry.find("arxiv:doi", ARXIV_NAMESPACE)
                        doi = doi_el.text.strip() if doi_el is not None and doi_el.text else None

                        canonical_url = f"https://arxiv.org/abs/{arxiv_id}"

                        source = PaperSourceSchema(
                            source_name="arxiv",
                            source_record_id=arxiv_id,
                            source_url=canonical_url,
                            source_metadata={
                                "published": published_str,
                                "arxiv_id": arxiv_id,
                                "doi": doi
                            },
                            retrieved_at=retrieved_at_str
                        )

                        paper = PaperRecord(
                            id=f"arxiv_{arxiv_id.replace('.', '_')}",
                            canonical_title=clean_title,
                            normalized_title=normalize_title(clean_title),
                            canonical_authors=authors,
                            publication_year=pub_year,
                            venue="arXiv.org",
                            doi=doi,
                            abstract=abstract,
                            canonical_url=canonical_url,
                            sources=[source]
                        )
                        papers.append(paper)
                        if len(papers) >= target_count:
                            break
        except Exception as e:
            logger.warning(f"arXiv live query error: {e}. Falling back gracefully.")

        return papers

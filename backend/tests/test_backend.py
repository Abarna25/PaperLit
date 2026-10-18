import pytest
import asyncio
from app.core.ssrf_guard import is_safe_external_url
from app.services.normalization import (
    normalize_title,
    calculate_title_similarity,
    compare_authors
)
from app.services.crossref_service import CrossrefService
from app.services.citation_trust_engine import CitationTrustEngine
from app.services.lineage_engine import PublicationLineageEngine
from app.services.open_access_service import OpenAccessService
from app.services.bibtex_service import BibtexService
from app.services.evaluation_lab_service import EvaluationLabService
from app.models.schemas import PaperRecord, PaperSourceSchema

# 1. SSRF Guard Tests
def test_ssrf_blocks_private_ips():
    assert is_safe_external_url("http://127.0.0.1/admin")[0] is False
    assert is_safe_external_url("http://localhost:8080")[0] is False
    assert is_safe_external_url("http://192.168.1.1/secret")[0] is False
    assert is_safe_external_url("http://10.0.0.5/api")[0] is False
    assert is_safe_external_url("http://169.254.169.254/latest/meta-data/")[0] is False

def test_ssrf_allows_public_url():
    assert is_safe_external_url("https://arxiv.org/pdf/1706.03762.pdf")[0] is True
    assert is_safe_external_url("https://api.crossref.org/works")[0] is True

# 2. Normalization & Similarity Tests
def test_title_normalization():
    t1 = "Attention Is All You Need [v1] (Preprint)"
    assert normalize_title(t1) == "attention is all you need"

    t2 = "BERT: Pre-training of Deep Bidirectional Transformers!"
    assert normalize_title(t2) == "bert pre training of deep bidirectional transformers"

def test_title_similarity():
    sim = calculate_title_similarity(
        "Attention Is All You Need",
        "Attention is All You Need [v2]"
    )
    assert sim >= 0.95

    diff_sim = calculate_title_similarity(
        "Attention Is All You Need",
        "Catalytic Dehydrogenation of Propane"
    )
    assert diff_sim < 0.20

def test_author_comparison():
    cands = [{"name": "Ashish Vaswani"}, {"name": "Noam Shazeer"}]
    resolved = [{"name": "Vaswani, A."}, {"name": "Shazeer, N."}]
    res = compare_authors(cands, resolved)
    assert res["first_author_match"] is True
    assert res["verdict"] == "MATCH"

# 3. Citation Trust Engine (TC4 mismatch assertion)
@pytest.mark.asyncio
async def test_citation_trust_engine_mismatch():
    engine = CitationTrustEngine()
    # Mismatch candidate pointing to chemistry DOI
    res = await engine.verify_paper_citation(
        candidate_title="Attention Is All You Need",
        candidate_authors=[{"name": "Ashish Vaswani"}],
        doi="10.1016/j.jcat.2018.04.012"
    )
    assert res.verification_status == "MISMATCH"
    assert res.title_match_score < 0.20
    assert "Catalytic Dehydrogenation" in (res.returned_title or "")

# 4. Publication Lineage Engine (TC2 preprint vs proceedings merge)
def test_lineage_engine_merge():
    engine = PublicationLineageEngine()
    p1 = PaperRecord(
        id="p1",
        canonical_title="Attention Is All You Need",
        normalized_title="attention is all you need",
        canonical_authors=[{"name": "Ashish Vaswani"}],
        publication_year=2017,
        venue="arXiv",
        sources=[PaperSourceSchema(source_name="arxiv", source_record_id="1706.03762", retrieved_at="now")]
    )
    p2 = PaperRecord(
        id="p2",
        canonical_title="Attention Is All You Need",
        normalized_title="attention is all you need",
        canonical_authors=[{"name": "Ashish Vaswani"}],
        publication_year=2017,
        venue="NeurIPS 2017 Proceedings",
        doi="10.5555/3295222.3295349",
        sources=[PaperSourceSchema(source_name="crossref", source_record_id="doi_vaswani", retrieved_at="now")]
    )
    merged = engine.deduplicate_and_link_lineage([p1, p2])
    assert len(merged) == 1
    canonical = merged[0]
    assert len(canonical.versions) == 1
    assert len(canonical.sources) == 2
    assert "NeurIPS" in canonical.venue

# 5. Open Access Assessment (TC3 paywall detection)
def test_open_access_assessment_paywall():
    oa_service = OpenAccessService()
    paper = PaperRecord(
        id="nature_paper",
        canonical_title="Quantum Processor",
        normalized_title="quantum processor",
        canonical_authors=[{"name": "A. Author"}],
        publication_year=2021,
        venue="Nature Publishing",
        doi="10.1038/nature12345",
        canonical_url="https://nature.com/articles/12345"
    )
    assessment = oa_service.assess_paper_access(paper)
    assert assessment.status == "PAYWALLED_OR_RESTRICTED"
    assert assessment.pdf_url is None
    assert assessment.evidence.get("download_permitted") is False

# 6. BibTeX Service Syntax & Exclusion
def test_bibtex_generation_and_validation():
    bib_service = BibtexService()
    from app.models.schemas import CitationVerificationSchema
    p_verified = PaperRecord(
        id="pv",
        canonical_title="Deep Learning Breakthroughs & Insights",
        normalized_title="deep learning breakthroughs insights",
        canonical_authors=[{"name": "Yann LeCun"}],
        publication_year=2022,
        venue="CACM",
        doi="10.1145/123456",
        citation_verification=CitationVerificationSchema(
            doi="10.1145/123456",
            resolution_status="RESOLVED",
            verification_status="VERIFIED",
            checked_at="now"
        )
    )
    p_unverified = PaperRecord(
        id="pu",
        canonical_title="Unverified Draft",
        normalized_title="unverified draft",
        canonical_authors=[{"name": "Anonymous"}],
        publication_year=2023,
        citation_verification=CitationVerificationSchema(
            resolution_status="UNRESOLVED",
            verification_status="UNVERIFIED",
            checked_at="now"
        )
    )
    bib_text, excluded = bib_service.generate_bibtex([p_verified, p_unverified], verified_only=True)
    assert len(excluded) == 1
    assert "Unverified Draft" in excluded[0]
    assert "Lecun2022Deep" in bib_text
    # Escaped ampersand
    assert r"\&" in bib_text

    is_valid, errors = bib_service.validate_bibtex_syntax(bib_text)
    assert is_valid is True
    assert len(errors) == 0

# 7. Official Test Cases TC1 - TC4
@pytest.mark.asyncio
async def test_official_tc1_topic_query():
    lab = EvaluationLabService()
    res = await lab.run_tc1()
    assert res.test_case == "TC1"
    assert res.status == "PASS"

@pytest.mark.asyncio
async def test_official_tc2_preprint_journal():
    lab = EvaluationLabService()
    res = await lab.run_tc2()
    assert res.test_case == "TC2"
    assert res.status == "PASS"
    assert res.actual_result["after_count"] == 1

@pytest.mark.asyncio
async def test_official_tc3_paywalled_paper():
    lab = EvaluationLabService()
    res = await lab.run_tc3()
    assert res.test_case == "TC3"
    assert res.status == "PASS"
    assert res.actual_result["proposed_download_count"] == 0

@pytest.mark.asyncio
async def test_official_tc4_mismatched_doi():
    lab = EvaluationLabService()
    res = await lab.run_tc4()
    assert res.test_case == "TC4"
    assert res.status == "PASS"
    assert res.actual_result["verification_status"] == "MISMATCH"
    assert res.actual_result["excluded_from_bibtex"] is True

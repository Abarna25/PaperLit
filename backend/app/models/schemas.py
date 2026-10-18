from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class ResearchRequestCreate(BaseModel):
    research_question: str = Field(..., min_length=5, description="Core scholarly research question")
    year_start: int = Field(..., ge=1900, le=2100, description="Start year filter")
    year_end: int = Field(..., ge=1900, le=2100, description="End year filter")
    keywords: List[str] = Field(..., min_length=1, description="Required search keywords")
    excluded_keywords: List[str] = Field(default_factory=list, description="Keywords to exclude")
    preferred_methodologies: List[str] = Field(default_factory=list, description="Preferred methodologies/models")
    target_count: int = Field(default=25, ge=1, le=50, description="Target papers (default 25)")
    min_relevance_threshold: float = Field(default=0.0, ge=0.0, le=1.0, description="Minimum relevance filter")

class QueryPlan(BaseModel):
    search_terms: List[str]
    sources: List[str]
    year_constraints: str
    planned_ranking_criteria: str
    duplicate_resolution_approach: str
    verification_steps: List[str]

class RankingConfig(BaseModel):
    semantic_weight: float = 0.40
    keyword_weight: float = 0.25
    alignment_weight: float = 0.20
    recency_weight: float = 0.10
    methodology_weight: float = 0.05
    ranking_method: str = "HYBRID_BM25_DETERMINISTIC"

class AuthorSchema(BaseModel):
    name: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    affiliation: Optional[str] = None
    orcid: Optional[str] = None

class PaperSourceSchema(BaseModel):
    id: Optional[str] = None
    paper_id: Optional[str] = None
    source_name: str  # 'arxiv', 'semantic_scholar', 'crossref', 'manual_fixture'
    source_record_id: str
    source_url: Optional[str] = None
    source_metadata: Dict[str, Any] = Field(default_factory=dict)
    retrieved_at: str

class PaperVersionSchema(BaseModel):
    canonical_paper_id: str
    version_paper_id: str
    relationship_type: str  # 'PREPRINT', 'JOURNAL_VERSION', 'CONFERENCE_VERSION', 'REVISED_PREPRINT'
    matching_status: str    # 'CONFIRMED', 'LIKELY', 'PENDING_REVIEW', 'REJECTED'
    match_score: float
    matching_evidence: Dict[str, Any] = Field(default_factory=dict)
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None

class RelevanceAssessmentSchema(BaseModel):
    score: float
    score_components: Dict[str, float]
    explanation: str
    ranking_method: str

class CitationVerificationSchema(BaseModel):
    doi: Optional[str] = None
    resolution_status: str  # 'RESOLVED', 'UNRESOLVED', 'NO_DOI', 'ERROR'
    resolved_url: Optional[str] = None
    returned_title: Optional[str] = None
    returned_authors: List[Dict[str, Any]] = Field(default_factory=list)
    title_match_score: float = 0.0
    author_match_result: Dict[str, Any] = Field(default_factory=dict)
    verification_status: str  # 'VERIFIED', 'MISMATCH', 'UNVERIFIED', 'NO_DOI', 'PENDING_REVIEW'
    evidence: Dict[str, Any] = Field(default_factory=dict)
    checked_at: str

class AccessAssessmentSchema(BaseModel):
    status: str  # 'OPEN_ACCESS_VERIFIED', 'PAYWALLED_OR_RESTRICTED', 'ACCESS_UNKNOWN', 'PDF_UNAVAILABLE'
    pdf_url: Optional[str] = None
    access_source: Optional[str] = None
    license_url: Optional[str] = None
    evidence: Dict[str, Any] = Field(default_factory=dict)
    checked_at: str

class AnnotationSchema(BaseModel):
    research_objective: str
    methodology: str
    main_findings: str
    limitations: str
    relevance_to_question: str
    basis: str  # 'ABSTRACT', 'FULL_TEXT', 'METADATA_ONLY'
    evidence_references: List[str] = Field(default_factory=list)

class ResearchEvidencePassport(BaseModel):
    paper_id: str
    canonical_title: str
    canonical_authors: List[Dict[str, Any]]
    publication_year: Optional[int] = None
    venue: Optional[str] = None
    doi: Optional[str] = None
    doi_resolution_status: str
    arxiv_id: Optional[str] = None
    semantic_scholar_id: Optional[str] = None
    source_urls: List[str] = Field(default_factory=list)
    retrieval_timestamps: List[str] = Field(default_factory=list)
    original_source_metadata: Dict[str, Any] = Field(default_factory=dict)
    normalized_metadata: Dict[str, Any] = Field(default_factory=dict)
    relevance_score: float
    relevance_rationale: str
    duplicate_and_version_evidence: Dict[str, Any] = Field(default_factory=dict)
    open_access_status: str
    open_access_evidence: Dict[str, Any] = Field(default_factory=dict)
    license_info: Optional[str] = None
    annotation: Optional[AnnotationSchema] = None
    verification_state: str  # 'VERIFIED', 'MISMATCH', 'UNVERIFIED', 'NO_DOI', 'PENDING_REVIEW'
    unresolved_issues: List[str] = Field(default_factory=list)
    action_history: List[Dict[str, Any]] = Field(default_factory=list)
    provenance_labels: Dict[str, str] = Field(
        default_factory=lambda: {
            "title": "VERIFIED_SOURCE_FACT",
            "doi": "RESOLVED_METADATA",
            "open_access": "VERIFIED_REPOSITORY_POLICY",
            "annotation": "SYNTHESIZED_ABSTRACT_ANALYSIS",
            "relevance": "DETERMINISTIC_SCORING_MODEL"
        }
    )

class PaperRecord(BaseModel):
    id: str
    canonical_title: str
    normalized_title: str
    canonical_authors: List[Dict[str, Any]]
    publication_year: Optional[int] = None
    venue: Optional[str] = None
    doi: Optional[str] = None
    abstract: Optional[str] = None
    canonical_url: Optional[str] = None
    canonical_version_id: Optional[str] = None
    sources: List[PaperSourceSchema] = Field(default_factory=list)
    versions: List[PaperVersionSchema] = Field(default_factory=list)
    relevance: Optional[RelevanceAssessmentSchema] = None
    citation_verification: Optional[CitationVerificationSchema] = None
    access: Optional[AccessAssessmentSchema] = None
    annotation: Optional[AnnotationSchema] = None
    passport: Optional[ResearchEvidencePassport] = None

class ResearchGapSchema(BaseModel):
    id: str
    research_run_id: str
    description: str
    gap_type: str  # 'METHODOLOGY_UNDERREPRESENTED', 'EVALUATION_CONTEXT_MISSING', 'CONTRADICTING_FINDINGS', 'REPEATED_LIMITATION'
    evidence_paper_ids: List[str]
    supporting_paper_titles: List[str] = Field(default_factory=list)
    counterevidence: List[Dict[str, Any]] = Field(default_factory=list)
    confidence: str  # 'HIGH', 'MEDIUM', 'HYPOTHESIS'
    status: str      # 'IDENTIFIED', 'INSUFFICIENT_EVIDENCE'
    created_at: str

class ResearchActionCreate(BaseModel):
    research_run_id: str
    action_type: str  # 'DOWNLOAD_PDF', 'UPDATE_BIBLIOGRAPHY', 'EXPORT_FILES', 'BATCH_DOWNLOAD'
    paper_ids: List[str] = Field(default_factory=list)
    proposed_changes: Dict[str, Any]

class ResearchActionSchema(BaseModel):
    id: str
    user_id: str
    research_run_id: str
    action_type: str
    proposed_changes: Dict[str, Any]
    action_hash: str
    idempotency_key: str
    status: str  # 'PENDING', 'APPROVED', 'REJECTED', 'EXECUTED', 'FAILED'
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    executed_at: Optional[str] = None
    result: Dict[str, Any] = Field(default_factory=dict)
    error_details: Optional[str] = None
    created_at: str

class ApprovalDecisionRequest(BaseModel):
    action_id: str
    decision: str  # 'APPROVE', 'REJECT'
    idempotency_key: str

class StoredArtifactSchema(BaseModel):
    id: str
    user_id: str
    paper_id: Optional[str] = None
    research_run_id: str
    artifact_type: str  # 'PDF', 'BIBTEX', 'EVALUATION_REPORT', 'EXPORT_JSON', 'EXPORT_CSV'
    storage_path: str
    original_filename: str
    checksum: str
    size_bytes: int
    verification_status: str  # 'VALID', 'CORRUPT', 'UNVERIFIED'
    download_url: Optional[str] = None
    created_at: str

class TestRunSchema(BaseModel):
    id: str
    user_id: Optional[str] = None
    test_case: str  # 'TC1', 'TC2', 'TC3', 'TC4'
    input_snapshot: Dict[str, Any]
    expected_result: Dict[str, Any]
    actual_result: Dict[str, Any]
    status: str  # 'PASS', 'FAIL', 'BLOCKED', 'NOT_RUN'
    evidence: Dict[str, Any]
    started_at: str
    completed_at: Optional[str] = None

class ResearchRunSummary(BaseModel):
    run_id: str
    request_id: str
    status: str
    started_at: str
    completed_at: Optional[str]
    papers_discovered: int
    unique_canonical_papers: int
    doi_verified_count: int
    open_access_count: int
    pending_review_count: int
    failed_verification_count: int
    query_plan: QueryPlan
    ranking_configuration: RankingConfig

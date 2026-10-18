import re
from typing import List, Dict, Any, Tuple
from app.models.schemas import PaperRecord
from app.services.normalization import normalize_author_name

def escape_bibtex(text: str) -> str:
    """
    Escapes LaTeX/BibTeX special characters.
    """
    if not text:
        return ""
    
    # Order matters: escape backslash first if needed, then other symbols
    replacements = [
        ('\\', r'\textbackslash{}'),
        ('&', r'\&'),
        ('%', r'\%'),
        ('$', r'\$'),
        ('#', r'\#'),
        ('_', r'\_'),
        ('{', r'\{'),
        ('}', r'\}'),
        ('~', r'\textasciitilde{}'),
        ('^', r'\textasciicircum{}'),
    ]
    escaped = text
    for char, repl in replacements:
        escaped = escaped.replace(char, repl)
    return escaped

def generate_citation_key(paper: PaperRecord, used_keys: set) -> str:
    """
    Generates a deterministic, standard citation key: [FirstAuthorLastname][Year][FirstTitleWord]
    Appends 'a', 'b', etc., if a collision occurs.
    """
    author_str = "Anonymous"
    if paper.canonical_authors:
        first_author = paper.canonical_authors[0]
        name = first_author.get("name") or first_author.get("last_name") or ""
        _, last_name = normalize_author_name(name)
        if last_name:
            author_str = last_name.capitalize()

    year_str = str(paper.publication_year) if paper.publication_year else "ND"
    
    # First substantive word of title
    title_words = re.findall(r'[a-zA-Z0-9]+', paper.canonical_title)
    substantive_word = "Paper"
    stopwords = {"a", "an", "the", "on", "in", "for", "with", "of", "and", "to", "towards"}
    for w in title_words:
        if w.lower() not in stopwords:
            substantive_word = w.capitalize()
            break

    base_key = f"{author_str}{year_str}{substantive_word}"
    clean_key = re.sub(r'[^a-zA-Z0-9]', '', base_key)

    key = clean_key
    counter = 1
    while key in used_keys:
        suffix = chr(ord('a') + (counter - 1)) if counter <= 26 else str(counter)
        key = f"{clean_key}_{suffix}"
        counter += 1

    used_keys.add(key)
    return key

class BibtexService:
    """
    BibTeX Generator and Syntax Validator:
    Constructs compliant BibTeX strings, strictly excluding failed or unverified citations from the verified export,
    and validates syntax structure.
    """

    def generate_bibtex(self, papers: List[PaperRecord], verified_only: bool = True) -> Tuple[str, List[str]]:
        """
        Generates BibTeX string for qualifying papers.
        verified_only: If True, only papers with verification_status == 'VERIFIED' are included.
        Returns:
            (bibtex_string, excluded_paper_titles)
        """
        used_keys = set()
        entries = []
        excluded_titles = []

        for paper in papers:
            # Check verification status
            is_verified = (
                paper.citation_verification is not None and 
                paper.citation_verification.verification_status == "VERIFIED"
            )

            if verified_only and not is_verified:
                excluded_titles.append(f"{paper.canonical_title} (Reason: Citation state is {paper.citation_verification.verification_status if paper.citation_verification else 'UNCHECKED'})")
                continue

            cite_key = generate_citation_key(paper, used_keys)

            # Authors formatted as "Last, First and Last, First"
            authors_formatted = []
            for a in paper.canonical_authors:
                name = a.get("name") or f"{a.get('first_name', '')} {a.get('last_name', '')}".strip()
                if name:
                    authors_formatted.append(escape_bibtex(name))
            author_field = " and ".join(authors_formatted) if authors_formatted else "Unknown Author"

            # Entry type: article if journal/venue exists, else misc/preprint
            entry_type = "article" if (paper.venue and "arxiv" not in paper.venue.lower()) else "misc"

            lines = [f"@{entry_type}{{{cite_key},"]
            lines.append(f"  title = {{{escape_bibtex(paper.canonical_title)}}},")
            lines.append(f"  author = {{{author_field}}},")
            if paper.publication_year:
                lines.append(f"  year = {{{paper.publication_year}}},")
            if paper.venue:
                if entry_type == "article":
                    lines.append(f"  journal = {{{escape_bibtex(paper.venue)}}},")
                else:
                    lines.append(f"  howpublished = {{{escape_bibtex(paper.venue)}}},")
            if paper.doi:
                lines.append(f"  doi = {{{escape_bibtex(paper.doi)}}},")
            if paper.canonical_url:
                lines.append(f"  url = {{{escape_bibtex(paper.canonical_url)}}},")
            if paper.abstract:
                # Truncate abstract cleanly for bibtex to avoid monstrous file sizes
                clean_abs = paper.abstract.replace('\n', ' ').strip()
                if len(clean_abs) > 500:
                    clean_abs = clean_abs[:497] + "..."
                lines.append(f"  note = {{Abstract: {escape_bibtex(clean_abs)}}},")
            lines.append("}\n")

            entries.append("\n".join(lines))

        header = [
            "% =============================================================================",
            "% Generated by LitTrust AI — Evidence-First Literature Intelligence",
            f"% Verified Entries: {len(entries)} | Excluded Unverified/Mismatched: {len(excluded_titles)}",
            "% =============================================================================\n"
        ]

        full_bibtex = "\n".join(header) + "\n".join(entries)
        return full_bibtex, excluded_titles

    def validate_bibtex_syntax(self, bibtex_content: str) -> Tuple[bool, List[str]]:
        """
        Parses and validates BibTeX syntax.
        Checks balanced braces, valid citation keys, and entry boundaries.
        """
        errors = []
        if not bibtex_content or not bibtex_content.strip():
            return False, ["BibTeX content is empty"]

        # Check brace balance
        open_braces = bibtex_content.count('{')
        close_braces = bibtex_content.count('}')
        if open_braces != close_braces:
            errors.append(f"Unbalanced braces: found {open_braces} open '{{' and {close_braces} close '}}'.")

        # Find all @entry{key, declarations
        entry_matches = re.findall(r'@([a-zA-Z]+)\s*\{\s*([a-zA-Z0-9_\-]+)\s*,', bibtex_content)
        if not entry_matches and "@" in bibtex_content:
            errors.append("Malformed BibTeX header: could not find valid @type{citekey, syntax.")

        keys = [m[1] for m in entry_matches]
        if len(keys) != len(set(keys)):
            errors.append(f"Duplicate citation keys detected: {len(keys) - len(set(keys))} duplicates found.")

        is_valid = len(errors) == 0
        return is_valid, errors

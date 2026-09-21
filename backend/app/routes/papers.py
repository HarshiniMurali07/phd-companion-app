import os
import re
from datetime import datetime
from pathlib import Path

import fitz
from dotenv import load_dotenv
from supabase import create_client 

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
)

from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Paper, PaperSection
from ..schemas import (
    PaperCreate,
    PaperNotesUpdate,
    PaperResponse,
    PaperTrackerUpdate,
)


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/api/papers",
    tags=["papers"],
)


# =========================================================
# FILE STORAGE
# =========================================================

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv(
    "SUPABASE_SERVICE_ROLE_KEY"
)

if not SUPABASE_URL:
    raise RuntimeError(
        "SUPABASE_URL is not configured."
    )

if not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError(
        "SUPABASE_SERVICE_ROLE_KEY is not configured."
    )

supabase = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
)

PAPERS_BUCKET = "papers"

def upload_pdf_to_storage(
    stored_filename: str,
    contents: bytes,
) -> str:
    """
    Upload a PDF to Supabase Storage and
    return its public URL.
    """

    storage_path = stored_filename

    supabase.storage.from_(
        PAPERS_BUCKET
    ).upload(
        storage_path,
        contents,
        file_options={
            "content-type": "application/pdf",
            "upsert": False,
        },
    )

    public_url = (
        supabase.storage
        .from_(PAPERS_BUCKET)
        .get_public_url(
            storage_path
        )
    )

    return public_url


def delete_pdf_from_storage(
    file_path: str | None,
):
    """
    Delete a stored PDF from Supabase Storage.

    The database stores the public URL, so we
    extract the storage path from that URL.
    """

    if not file_path:
        return

    marker = f"/storage/v1/object/public/{PAPERS_BUCKET}/"

    if marker not in file_path:
        return

    storage_path = file_path.split(
        marker,
        1,
    )[1]

    if not storage_path:
        return

    try:
        supabase.storage.from_(
            PAPERS_BUCKET
        ).remove(
            [storage_path]
        )
    except Exception as exc:
        print(
            "Could not delete PDF from "
            f"Supabase Storage: {exc}"
        )

# =========================================================
# GENERAL TEXT CLEANING
# =========================================================

def clean_text(text: str | None) -> str:
    """
    General text cleanup for extracted PDF text.
    """

    if not text:
        return ""

    text = text.replace("\x00", " ")

    text = text.replace("\r\n", "\n")
    text = text.replace("\r", "\n")

    # Join words split at line endings.
    text = re.sub(
        r"([A-Za-z]{2,})-\s*\n\s*([A-Za-z]{2,})",
        r"\1\2",
        text,
    )

    # Normalize horizontal whitespace.
    text = re.sub(
        r"[ \t]+",
        " ",
        text,
    )

    # Avoid excessive blank lines.
    text = re.sub(
        r"\n{3,}",
        "\n\n",
        text,
    )

    return text.strip()


def clean_line(text: str | None) -> str:
    """
    Clean a single PDF line.
    """

    if not text:
        return ""

    text = text.replace(
        "\x00",
        " ",
    )

    text = re.sub(
        r"[ \t]+",
        " ",
        text,
    )

    return text.strip()


def is_placeholder(value) -> bool:
    """
    Check whether a metadata value is empty
    or a common placeholder.
    """

    if value is None:
        return True

    if isinstance(value, str):

        value = value.strip().lower()

        return value in {
            "",
            "string",
            "null",
            "none",
        }

    if value == 0:
        return True

    return False


# =========================================================
# SECTION NAMES
# =========================================================

SECTION_ALIASES = {

    # -----------------------------------------------------
    # Main paper sections
    # -----------------------------------------------------

    "abstract":
        "Abstract",

    "introduction":
        "Introduction",

    "background":
        "Background",

    "related work":
        "Related Work",

    "related works":
        "Related Work",

    "literature review":
        "Literature Review",

    "method":
        "Methodology",

    "methods":
        "Methodology",

    "methodology":
        "Methodology",

    "approach":
        "Approach",

    "proposed method":
        "Proposed Method",

    # -----------------------------------------------------
    # Architecture
    # -----------------------------------------------------

    "model":
        "Model",

    "model architecture":
        "Model Architecture",

    "encoder and decoder stacks":
        "Encoder and Decoder Stacks",

    "attention":
        "Attention",

    "scaled dot-product attention":
        "Scaled Dot-Product Attention",

    "multi-head attention":
        "Multi-Head Attention",

    "applications of attention in our model":
        "Applications of Attention in our Model",

    "position-wise feed-forward networks":
        "Position-wise Feed-Forward Networks",

    "embeddings and softmax":
        "Embeddings and Softmax",

    "positional encoding":
        "Positional Encoding",

    # -----------------------------------------------------
    # Training
    # -----------------------------------------------------

    "training":
        "Training",

    "training data and batching":
        "Training Data and Batching",

    "hardware and schedule":
        "Hardware and Schedule",

    "optimizer":
        "Optimizer",

    "regularization":
        "Regularization",

    # -----------------------------------------------------
    # Experiments / Results
    # -----------------------------------------------------

    "experiments":
        "Experiments",

    "experimental setup":
        "Experimental Setup",

    "results":
        "Results",

    "evaluation":
        "Evaluation",

    "model variations":
        "Model Variations",

    "machine translation":
        "Machine Translation",

    "english constituency parsing":
        "English Constituency Parsing",

    # -----------------------------------------------------
    # Discussion
    # -----------------------------------------------------

    "discussion":
        "Discussion",

    "limitations":
        "Limitations",

    "conclusion":
        "Conclusion",

    "conclusions":
        "Conclusion",

    "future work":
        "Future Work",

    # -----------------------------------------------------
    # Ending
    # -----------------------------------------------------

    "acknowledgements":
        "Acknowledgements",

    "acknowledgments":
        "Acknowledgements",

    "references":
        "References",
}


# =========================================================
# FIRST PAGE BLOCK EXTRACTION
# =========================================================

def get_first_page_blocks(document):
    """
    Extract first-page lines with font information.

    Used for title and author detection.
    """

    if len(document) == 0:
        return []

    page = document[0]

    data = page.get_text(
        "dict"
    )

    blocks = data.get(
        "blocks",
        [],
    )

    extracted = []

    for block in blocks:

        if block.get("type") != 0:
            continue

        for line in block.get(
            "lines",
            [],
        ):

            text_parts = []

            font_sizes = []

            bold_count = 0

            span_count = 0

            for span in line.get(
                "spans",
                [],
            ):

                span_text = span.get(
                    "text",
                    "",
                )

                if not span_text:
                    continue

                text_parts.append(
                    span_text
                )

                if span_text.strip():

                    font_sizes.append(
                        span.get(
                            "size",
                            0,
                        )
                    )

                font_name = (
                    span.get(
                        "font",
                        "",
                    )
                    or ""
                )

                if (
                    "bold"
                    in font_name.lower()
                ):

                    bold_count += 1

                span_count += 1

            text = clean_line(
                "".join(text_parts)
            )

            if not text:
                continue

            average_size = (
                sum(font_sizes)
                / len(font_sizes)
                if font_sizes
                else 0
            )

            is_bold = (
                bold_count > 0
                and span_count > 0
            )

            extracted.append(
                {
                    "text": text,
                    "font_size": average_size,
                    "bold": is_bold,
                }
            )

    return extracted


# =========================================================
# TITLE
# =========================================================

def extract_title(
    document,
    metadata,
):
    """
    Extract title from PDF metadata first,
    then from first-page typography.
    """

    metadata_title = metadata.get(
        "title"
    )

    if (
        metadata_title
        and not is_placeholder(
            metadata_title
        )
        and len(
            metadata_title.strip()
        ) > 3
    ):

        return clean_text(
            metadata_title
        )

    blocks = get_first_page_blocks(
        document
    )

    if not blocks:

        return "Untitled paper"

    candidates = []

    for block in blocks[:40]:

        text = block["text"]

        if len(text) < 5:
            continue

        if len(text) > 250:
            continue

        candidates.append(
            block
        )

    if not candidates:

        return "Untitled paper"

    largest_size = max(
        block["font_size"]
        for block in candidates
    )

    largest = [
        block
        for block in candidates
        if block["font_size"]
        >= largest_size - 1
    ]

    if largest:

        return largest[0]["text"]

    return candidates[0]["text"]


# =========================================================
# AUTHORS
# =========================================================

def extract_authors(
    document,
    metadata,
):
    """
    Extract authors from PDF metadata or
    nearby first-page text.
    """

    metadata_authors = metadata.get(
        "author"
    )

    if (
        metadata_authors
        and not is_placeholder(
            metadata_authors
        )
    ):

        return clean_text(
            metadata_authors
        )

    blocks = get_first_page_blocks(
        document
    )

    if not blocks:

        return None

    title = extract_title(
        document,
        metadata,
    )

    title_index = -1

    for index, block in enumerate(
        blocks[:40]
    ):

        if block["text"] == title:

            title_index = index

            break

    possible = blocks[
        title_index + 1:
        title_index + 10
    ]

    candidates = []

    for block in possible:

        text = block["text"]

        lower = text.lower()

        if (
            "abstract" in lower
            or "introduction" in lower
            or "doi" in lower
            or "arxiv" in lower
        ):

            break

        if len(text) > 250:
            continue

        if re.search(
            r"[A-Za-z]{2,}\s+[A-Za-z]{2,}",
            text,
        ):

            candidates.append(
                text
            )

    if candidates:

        return " ".join(
            candidates
        )

    return None


# =========================================================
# YEAR
# =========================================================

def extract_year(
    document,
    metadata,
):
    """
    Extract publication year.
    """

    metadata_date = metadata.get(
        "creationDate"
    )

    if metadata_date:

        match = re.search(
            r"(19|20)\d{2}",
            str(metadata_date),
        )

        if match:

            return int(
                match.group()
            )

    text = ""

    for page in document[:3]:

        text += (
            page.get_text()
            + "\n"
        )

    years = re.findall(
        r"\b(?:19|20)\d{2}\b",
        text,
    )

    if years:

        return int(
            years[0]
        )

    return None


# =========================================================
# ABSTRACT
# =========================================================

def remove_author_notes(
    abstract: str,
) -> str:
    """
    Remove contribution/affiliation notes
    that may appear after the abstract.
    """

    if not abstract:
        return ""

    marker = re.search(
        r"\s*(?:"
        r"[∗*]\s*equal\s+contribution"
        r"|"
        r"[†‡]\s*work\s+performed\s+while"
        r"|"
        r"\bequal\s+contribution\b"
        r")",
        abstract,
        re.IGNORECASE,
    )

    if marker:

        abstract = abstract[
            :marker.start()
        ]

    phrases = [
        "Listing order is random.",
        "Jakob proposed replacing RNNs",
        "Ashish, with Illia, designed",
        "Noam proposed scaled dot-product",
        "Niki designed, implemented",
        "Llion also experimented",
        "Lukasz and Aidan spent",
    ]

    positions = []

    for phrase in phrases:

        position = abstract.find(
            phrase
        )

        if position != -1:

            positions.append(
                position
            )

    if positions:

        abstract = abstract[
            :min(positions)
        ]

    abstract = re.sub(
        r"\s*[†‡]\s*"
        r"work\s+performed\s+while.*$",
        "",
        abstract,
        flags=re.IGNORECASE,
    )

    return clean_text(
        abstract
    )


def extract_abstract(
    document,
):
    """
    Extract the actual abstract.

    The abstract ends at the first major section
    boundary, normally Introduction.
    """

    text = ""

    for page in document[:4]:

        text += (
            page.get_text()
            + "\n"
        )

    text = clean_text(
        text
    )

    if not text:

        return None

    abstract_match = re.search(
        r"\babstract\b",
        text,
        re.IGNORECASE,
    )

    if not abstract_match:

        return None

    after = text[
        abstract_match.end():
    ]

    boundaries = [
        r"\bintroduction\b",
        r"\bbackground\b",
        r"\brelated\s+work\b",
        r"\bkeywords?\b",
        r"\bindex\s+terms?\b",
    ]

    matches = []

    for pattern in boundaries:

        match = re.search(
            pattern,
            after,
            re.IGNORECASE,
        )

        if match:

            matches.append(
                match
            )

    if matches:

        boundary = min(
            matches,
            key=lambda m: m.start(),
        )

        abstract = after[
            :boundary.start()
        ]

    else:

        abstract = after[:2500]

    abstract = clean_text(
        abstract
    )

    abstract = remove_author_notes(
        abstract
    )

    if abstract:

        return abstract

    return None


# =========================================================
# HEADING NORMALIZATION
# =========================================================

def normalize_heading(
    text: str,
):
    """
    Convert a heading into its canonical name.
    """

    text = clean_line(
        text
    )

    if not text:

        return None

    # Remove numeric section number.
    text = re.sub(
        r"^\d+(?:\.\d+)*[\.\):\-]?\s*",
        "",
        text,
    )

    # Remove Roman numeral.
    text = re.sub(
        r"^[IVX]+[\.\):\-]?\s*",
        "",
        text,
        flags=re.IGNORECASE,
    )

    text = text.strip(
        " .:-"
    )

    normalized = SECTION_ALIASES.get(
        text.lower()
    )

    return normalized


# =========================================================
# NUMBERED HEADING
# =========================================================

def has_section_number(
    text: str,
):
    """
    Check whether a line begins with a
    conventional section number.
    """

    return bool(
        re.match(
            r"^(?:"
            r"\d+(?:\.\d+)*"
            r"|[IVX]+"
            r")"
            r"(?:[\.\):\-]|\s+)",
            clean_line(text),
            re.IGNORECASE,
        )
    )


# =========================================================
# HEADING CANDIDATE
# =========================================================

def is_heading_candidate(
    text: str,
    font_size: float,
    bold: bool,
    body_font_size: float,
):
    """
    Determine whether a PDF line has the
    characteristics of a genuine heading.
    """

    text = clean_line(
        text
    )

    if not text:

        return None

    if len(text) > 120:

        return None

    if len(text.split()) > 15:

        return None

    if not re.search(
        r"[A-Za-z]",
        text,
    ):

        return None

    normalized = normalize_heading(
        text
    )

    if not normalized:

        return None

    # Numbered headings are strong evidence.
    if has_section_number(
        text
    ):

        return normalized

    # Unnumbered headings need typography evidence.
    larger_font = (
        font_size >= body_font_size * 1.12
        if body_font_size > 0
        else False
    )

    if bold or larger_font:

        return normalized

    return None


# =========================================================
# PDF STRUCTURED LINES
# =========================================================

def extract_structured_lines(
    document,
):
    """
    Extract PDF lines while preserving
    block structure, font size, boldness,
    and approximate vertical position.
    """

    lines = []

    for page_number, page in enumerate(
        document
    ):

        data = page.get_text(
            "dict"
        )

        blocks = data.get(
            "blocks",
            [],
        )

        for block in blocks:

            if block.get("type") != 0:
                continue

            block_lines = block.get(
                "lines",
                [],
            )

            for line in block_lines:

                spans = line.get(
                    "spans",
                    [],
                )

                if not spans:
                    continue

                parts = []

                sizes = []

                bold_count = 0

                visible_spans = 0

                for span in spans:

                    span_text = span.get(
                        "text",
                        "",
                    )

                    if not span_text:
                        continue

                    parts.append(
                        span_text
                    )

                    if span_text.strip():

                        sizes.append(
                            span.get(
                                "size",
                                0,
                            )
                        )

                        font_name = (
                            span.get(
                                "font",
                                "",
                            )
                            or ""
                        )

                        if (
                            "bold"
                            in font_name.lower()
                        ):

                            bold_count += 1

                        visible_spans += 1

                text = clean_line(
                    "".join(parts)
                )

                if not text:

                    continue

                average_size = (
                    sum(sizes)
                    / len(sizes)
                    if sizes
                    else 0
                )

                bold = (
                    bold_count > 0
                    and visible_spans > 0
                )

                bbox = line.get(
                    "bbox",
                    [0, 0, 0, 0],
                )

                lines.append(
                    {
                        "page": page_number,
                        "text": text,
                        "font_size": average_size,
                        "bold": bold,
                        "x0": bbox[0],
                        "y0": bbox[1],
                        "x1": bbox[2],
                        "y1": bbox[3],
                    }
                )

    return lines


# =========================================================
# ESTIMATE BODY FONT SIZE
# =========================================================

def estimate_body_font_size(
    lines,
):
    """
    Estimate the most common body font size.
    """

    sizes = []

    for line in lines:

        text = line["text"]

        if len(text) < 25:
            continue

        if line["font_size"] > 20:
            continue

        sizes.append(
            round(
                line["font_size"],
                1,
            )
        )

    if not sizes:

        return 10.0

    frequency = {}

    for size in sizes:

        frequency[size] = (
            frequency.get(
                size,
                0,
            )
            + 1
        )

    return max(
        frequency,
        key=frequency.get,
    )


# =========================================================
# ABSTRACT BOUNDARY PAGE
# =========================================================

def get_abstract_boundary_index(
    lines,
):
    """
    Locate the first Introduction heading
    after the Abstract.
    """

    abstract_seen = False

    for index, line in enumerate(
        lines
    ):

        normalized = normalize_heading(
            line["text"]
        )

        if normalized == "Abstract":

            abstract_seen = True

            continue

        if (
            abstract_seen
            and normalized == "Introduction"
        ):

            return index

    return None


# =========================================================
# STRUCTURED SECTION EXTRACTION
# =========================================================

def split_pdf_into_sections(
    document,
):
    """
    Main PDF-aware section parser.

    Uses actual PDF layout information instead
    of simply splitting every matching word.
    """

    lines = extract_structured_lines(
        document
    )

    if not lines:

        return []

    body_font_size = (
        estimate_body_font_size(
            lines
        )
    )

    candidates = []

    for index, line in enumerate(
        lines
    ):

        normalized = is_heading_candidate(
            text=line["text"],
            font_size=line["font_size"],
            bold=line["bold"],
            body_font_size=body_font_size,
        )

        if normalized:

            candidates.append(
                {
                    "index": index,
                    "title": normalized,
                    "text": line["text"],
                    "page": line["page"],
                }
            )

    # Remove suspicious duplicate headings.
    filtered = []

    for candidate in candidates:

        if filtered:

            previous = filtered[-1]

            distance = (
                candidate["index"]
                - previous["index"]
            )

            if (
                distance <= 2
                and candidate["title"]
                == previous["title"]
            ):

                continue

        filtered.append(
            candidate
        )

    candidates = filtered

    # Build sections.
    sections = []

    current_title = "Paper Content"

    current_lines = []

    def save_current():

        nonlocal current_lines

        content = clean_text(
            "\n".join(
                current_lines
            )
        )

        if content:

            sections.append(
                {
                    "title": current_title,
                    "content": content,
                }
            )

        current_lines = []

    candidate_pointer = 0

    for index, line in enumerate(
        lines
    ):

        if (
            candidate_pointer
            < len(candidates)
        ):

            candidate = candidates[
                candidate_pointer
            ]

            if candidate[
                "index"
            ] == index:

                title = candidate[
                    "title"
                ]

                # References should consume
                # the remainder of the paper.
                if title == "References":

                    save_current()

                    current_title = (
                        "References"
                    )

                    candidate_pointer += 1

                    for remaining in lines[
                        index + 1:
                    ]:

                        current_lines.append(
                            remaining[
                                "text"
                            ]
                        )

                    break

                save_current()

                current_title = title

                candidate_pointer += 1

                continue

        current_lines.append(
            line["text"]
        )

    else:

        save_current()

    sections = [
        section
        for section in sections
        if clean_text(
            section["content"]
        )
    ]

    return sections


# =========================================================
# ABSTRACT SECTION REPAIR
# =========================================================

def replace_abstract_section(
    sections,
    abstract,
):
    """
    Make the separately extracted abstract authoritative.
    """

    if not abstract:

        return sections

    abstract = clean_text(
        abstract
    )

    for section in sections:

        if section["title"] == "Abstract":

            section["content"] = (
                abstract
            )

            return sections

    abstract_section = {
        "title": "Abstract",
        "content": abstract,
    }

    if (
        sections
        and sections[0]["title"]
        == "Paper Content"
    ):

        sections.insert(
            1,
            abstract_section,
        )

    else:

        sections.insert(
            0,
            abstract_section,
        )

    return sections


# =========================================================
# REMOVE DUPLICATE / MICRO SECTIONS
# =========================================================

def clean_sections(
    sections,
):
    """
    Remove obviously broken sections.
    """

    cleaned = []

    for section in sections:

        title = section[
            "title"
        ]

        content = clean_text(
            section[
                "content"
            ]
        )

        if not content:

            continue

        if cleaned:

            if (
                cleaned[-1]["title"]
                == title
            ):

                cleaned[-1][
                    "content"
                ] = clean_text(
                    cleaned[-1][
                        "content"
                    ]
                    + "\n"
                    + content
                )

                continue

        cleaned.append(
            {
                "title": title,
                "content": content,
            }
        )

    return cleaned


# =========================================================
# COMPLETE PDF EXTRACTION
# =========================================================

def extract_pdf_information(
    pdf_path: str,
):
    """
    Extract complete paper information.
    """

    document = fitz.open(
        pdf_path
    )

    try:

        metadata = (
            document.metadata
            or {}
        )

        title = extract_title(
            document,
            metadata,
        )

        authors = extract_authors(
            document,
            metadata,
        )

        year = extract_year(
            document,
            metadata,
        )

        abstract = extract_abstract(
            document
        )

        page_texts = []

        for page in document:

            page_texts.append(
                page.get_text()
            )

        full_text = clean_text(
            "\n".join(
                page_texts
            )
        )

        sections = split_pdf_into_sections(
            document
        )

        sections = replace_abstract_section(
            sections,
            abstract,
        )

        sections = clean_sections(
            sections
        )

        return {
            "title": title,
            "authors": authors,
            "year": year,
            "abstract": abstract,
            "full_text": full_text,
            "sections": sections,
        }

    finally:

        document.close()


# =========================================================
# SAVE SECTIONS TO DATABASE
# =========================================================

def save_sections(
    db: Session,
    paper: Paper,
    sections,
):
    """
    Replace existing paper sections.
    """

    db.query(
        PaperSection
    ).filter(
        PaperSection.paper_id
        == paper.id
    ).delete(
        synchronize_session=False
    )

    for index, section in enumerate(
        sections
    ):

        db.add(
            PaperSection(
                paper_id=paper.id,
                title=section[
                    "title"
                ],
                content=section[
                    "content"
                ],
                section_order=index,
            )
        )

    db.flush()


# =========================================================
# GET ALL PAPERS
# =========================================================

@router.get(
    "/",
    response_model=list[PaperResponse],
)
def get_papers(
    db: Session = Depends(get_db),
):

    papers = (
        db.query(Paper)
        .options(
            joinedload(
                Paper.sections
            )
        )
        .order_by(
            Paper.created_at.desc()
        )
        .all()
    )

    return papers


# =========================================================
# GET ONE PAPER
# =========================================================

@router.get(
    "/{paper_id}",
    response_model=PaperResponse,
)
def get_paper(
    paper_id: int,
    db: Session = Depends(get_db),
):

    paper = (
        db.query(Paper)
        .options(
            joinedload(
                Paper.sections
            )
        )
        .filter(
            Paper.id == paper_id
        )
        .first()
    )

    if not paper:

        raise HTTPException(
            status_code=404,
            detail="Paper not found.",
        )

    return paper


# =========================================================
# GET PAPER SECTIONS
# =========================================================

@router.get(
    "/{paper_id}/sections",
)
def get_paper_sections(
    paper_id: int,
    db: Session = Depends(get_db),
):

    paper = (
        db.query(Paper)
        .filter(
            Paper.id == paper_id
        )
        .first()
    )

    if not paper:

        raise HTTPException(
            status_code=404,
            detail="Paper not found.",
        )

    sections = (
        db.query(PaperSection)
        .filter(
            PaperSection.paper_id
            == paper_id
        )
        .order_by(
            PaperSection.section_order
        )
        .all()
    )

    return sections


# =========================================================
# CREATE PAPER MANUALLY
# =========================================================

@router.post(
    "/",
    response_model=PaperResponse,
    status_code=201,
)
def create_paper(
    paper_data: PaperCreate,
    db: Session = Depends(get_db),
):

    paper = Paper(
        title=paper_data.title,
        authors=paper_data.authors,
        year=paper_data.year,
        journal=paper_data.journal,
        abstract=paper_data.abstract,
        full_text=paper_data.full_text,
        file_path=paper_data.file_path,
        status=paper_data.status,
        progress=paper_data.progress,
        tags=paper_data.tags,
    )

    db.add(
        paper
    )

    db.commit()

    db.refresh(
        paper
    )

    if paper.full_text:

        fallback_sections = []

        normalized_lines = [
            line.strip()
            for line in paper.full_text.split(
                "\n"
            )
            if line.strip()
        ]

        current_title = "Paper Content"

        current_lines = []

        def save_manual():

            nonlocal current_lines

            content = clean_text(
                "\n".join(
                    current_lines
                )
            )

            if content:

                fallback_sections.append(
                    {
                        "title":
                            current_title,
                        "content":
                            content,
                    }
                )

            current_lines = []

        for line in normalized_lines:

            normalized = normalize_heading(
                line
            )

            if normalized:

                save_manual()

                current_title = (
                    normalized
                )

                continue

            current_lines.append(
                line
            )

        save_manual()

        fallback_sections = (
            replace_abstract_section(
                fallback_sections,
                paper.abstract,
            )
        )

        fallback_sections = clean_sections(
            fallback_sections
        )

        save_sections(
            db,
            paper,
            fallback_sections,
        )

        db.commit()

    paper = (
        db.query(Paper)
        .options(
            joinedload(
                Paper.sections
            )
        )
        .filter(
            Paper.id == paper.id
        )
        .first()
    )

    return paper


# =========================================================
# UPLOAD PDF
# =========================================================

@router.post(
    "/upload",
    response_model=PaperResponse,
    status_code=201,
)
async def upload_paper(
    file: UploadFile = File(...),
    title: str | None = Form(None),
    authors: str | None = Form(None),
    year: int | None = Form(None),
    journal: str | None = Form(None),
    db: Session = Depends(get_db),
):

    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail="No file was provided.",
        )

    filename = file.filename

    if not filename.lower().endswith(
        ".pdf"
    ):

        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported.",
        )

    timestamp = datetime.now().strftime(
        "%Y%m%d_%H%M%S"
    )

    safe_filename = re.sub(
        r"[^A-Za-z0-9._-]",
        "_",
        filename,
    )

            stored_filename = (
        f"{timestamp}_{safe_filename}"
    )

    try:

        contents = await file.read()

        # Upload the original PDF to Supabase Storage.
        file_url = upload_pdf_to_storage(
            stored_filename,
            contents,
        )

        # Extract directly from the uploaded PDF bytes.
        document = fitz.open(
            stream=contents,
            filetype="pdf",
        )

        try:
            metadata = (
                document.metadata
                or {}
            )

            extracted = {
                "title": extract_title(
                    document,
                    metadata,
                ),
                "authors": extract_authors(
                    document,
                    metadata,
                ),
                "year": extract_year(
                    document,
                    metadata,
                ),
                "abstract": extract_abstract(
                    document,
                ),
                "full_text": clean_text(
                    "\n".join(
                        page.get_text()
                        for page in document
                    )
                ),
                "sections": split_pdf_into_sections(
                    document,
                ),
            }

            extracted["sections"] = (
                replace_abstract_section(
                    extracted["sections"],
                    extracted["abstract"],
                )
            )

            extracted["sections"] = (
                clean_sections(
                    extracted["sections"],
                )
            )

        finally:
            document.close()   

        final_title = (
            title.strip()
            if title
            and not is_placeholder(
                title
            )
            else extracted[
                "title"
            ]
        )

        final_authors = (
            authors.strip()
            if authors
            and not is_placeholder(
                authors
            )
            else extracted[
                "authors"
            ]
        )

        final_year = (
            year
            if year
            else extracted[
                "year"
            ]
        )

        final_journal = (
            journal.strip()
            if journal
            and not is_placeholder(
                journal
            )
            else None
        )

        paper = Paper(
            title=final_title,
            authors=final_authors,
            year=final_year,
            journal=final_journal,
            abstract=extracted[
                "abstract"
            ],
            full_text=extracted[
                "full_text"
            ],
            file_path=file_url, 
            status="To Read",
            progress=0,
        )

        db.add(
            paper
        )

        db.commit()

        db.refresh(
            paper
        )

        save_sections(
            db,
            paper,
            extracted[
                "sections"
            ],
        )

        db.commit()

        paper = (
            db.query(Paper)
            .options(
                joinedload(
                    Paper.sections
                )
            )
            .filter(
                Paper.id
                == paper.id
            )
            .first()
        )

        print(
            "\n"
            + "=" * 60
        )

        print(
            "PAPER UPLOAD SUCCESSFUL"
        )

        print(
            "=" * 60
        )

        print(
            f"Title: {paper.title}"
        )

        print(
            f"Authors: {paper.authors}"
        )

        print(
            f"Year: {paper.year}"
        )

        print(
            "Abstract characters: "
            f"{len(paper.abstract or '')}"
        )

        print(
            "Full text characters: "
            f"{len(paper.full_text or '')}"
        )

        print(
            "Sections detected: "
            f"{len(paper.sections)}"
        )

        for section in paper.sections:

            print(
                f"  "
                f"{section.section_order + 1}. "
                f"{section.title}"
            )

        print(
            "=" * 60
            + "\n"
        )

        return paper

    except Exception as exc:

    db.rollback()

    try:
        delete_pdf_from_storage(
            locals().get("file_url")
        )
    except Exception:
        pass 

        raise HTTPException(
            status_code=500,
            detail=(
                "Could not process PDF: "
                f"{str(exc)}"
            ),
        )


# =========================================================
# PROCESS EXISTING PAPER
# =========================================================

@router.post(
    "/{paper_id}/process",
    response_model=PaperResponse,
)
def process_existing_paper(
    paper_id: int,
    db: Session = Depends(get_db),
):

    paper = (
        db.query(Paper)
        .filter(
            Paper.id == paper_id
        )
        .first()
    )

    if not paper:

        raise HTTPException(
            status_code=404,
            detail="Paper not found.",
        )

    # -----------------------------------------------------
    # Re-process original PDF.
    # -----------------------------------------------------

    if paper.file_path:

        pdf_path = Path(
            paper.file_path
        )

        if pdf_path.exists():

            try:

                extracted = (
                    extract_pdf_information(
                        str(pdf_path)
                    )
                )

                paper.title = (
                    extracted[
                        "title"
                    ]
                    or paper.title
                )

                paper.authors = (
                    extracted[
                        "authors"
                    ]
                    or paper.authors
                )

                paper.year = (
                    extracted[
                        "year"
                    ]
                    or paper.year
                )

                paper.abstract = (
                    extracted[
                        "abstract"
                    ]
                )

                paper.full_text = (
                    extracted[
                        "full_text"
                    ]
                )

                save_sections(
                    db,
                    paper,
                    extracted[
                        "sections"
                    ],
                )

                paper.updated_at = datetime.utcnow()

                db.commit()

                paper = (
                    db.query(Paper)
                    .options(
                        joinedload(
                            Paper.sections
                        )
                    )
                    .filter(
                        Paper.id
                        == paper_id
                    )
                    .first()
                )

                print(
                    "\n"
                    + "=" * 60
                )

                print(
                    "PAPER RE-PROCESSED"
                )

                print(
                    "=" * 60
                )

                print(
                    f"Paper ID: {paper.id}"
                )

                print(
                    f"Title: {paper.title}"
                )

                print(
                    "Abstract characters: "
                    f"{len(paper.abstract or '')}"
                )

                print(
                    "Sections detected: "
                    f"{len(paper.sections)}"
                )

                for section in paper.sections:

                    print(
                        f"  "
                        f"{section.section_order + 1}. "
                        f"{section.title}"
                    )

                print(
                    "=" * 60
                    + "\n"
                )

                return paper

            except Exception as exc:

                db.rollback()

                raise HTTPException(
                    status_code=500,
                    detail=(
                        "Could not re-extract PDF: "
                        f"{str(exc)}"
                    ),
                )

    # -----------------------------------------------------
    # Fallback: process stored full text.
    # -----------------------------------------------------

    if not paper.full_text:

        raise HTTPException(
            status_code=400,
            detail=(
                "This paper does not have "
                "an original PDF or extracted "
                "full text."
            ),
        )

    try:

        fallback_sections = []

        lines = [
            line.strip()
            for line in paper.full_text.split(
                "\n"
            )
            if line.strip()
        ]

        current_title = "Paper Content"

        current_lines = []

        def save_fallback():

            nonlocal current_lines

            content = clean_text(
                "\n".join(
                    current_lines
                )
            )

            if content:

                fallback_sections.append(
                    {
                        "title":
                            current_title,
                        "content":
                            content,
                    }
                )

            current_lines = []

        for line in lines:

            normalized = normalize_heading(
                line
            )

            if normalized:

                save_fallback()

                current_title = (
                    normalized
                )

                continue

            current_lines.append(
                line
            )

        save_fallback()

        fallback_sections = (
            replace_abstract_section(
                fallback_sections,
                paper.abstract,
            )
        )

        fallback_sections = clean_sections(
            fallback_sections
        )

        save_sections(
            db,
            paper,
            fallback_sections,
        )

        paper.updated_at = datetime.utcnow()

        db.commit()

        paper = (
            db.query(Paper)
            .options(
                joinedload(
                    Paper.sections
                )
            )
            .filter(
                Paper.id
                == paper_id
            )
            .first()
        )

        return paper

    except Exception as exc:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Could not process paper: "
                f"{str(exc)}"
            ),
        )


# =========================================================
# PERSONAL NOTES
# =========================================================

@router.get(
    "/{paper_id}/notes",
)
def get_paper_notes(
    paper_id: int,
    db: Session = Depends(get_db),
):

    paper = (
        db.query(Paper)
        .filter(
            Paper.id == paper_id
        )
        .first()
    )

    if not paper:

        raise HTTPException(
            status_code=404,
            detail="Paper not found.",
        )

    return {
        "paper_id": paper.id,
        "title": paper.title,
        "notes": paper.notes,
        "research_problem": paper.research_problem,
        "methodology_notes": paper.methodology_notes,
        "key_findings": paper.key_findings,
        "research_gap": paper.research_gap,
        "limitations": paper.limitations,
        "relevance": paper.relevance,
        "personal_thoughts": paper.personal_thoughts,
        "updated_at": paper.updated_at,
    }


@router.put(
    "/{paper_id}/notes",
)
def update_paper_notes(
    paper_id: int,
    notes_data: PaperNotesUpdate,
    db: Session = Depends(get_db),
):

    paper = (
        db.query(Paper)
        .filter(
            Paper.id == paper_id
        )
        .first()
    )

    if not paper:

        raise HTTPException(
            status_code=404,
            detail="Paper not found.",
        )

    paper.notes = notes_data.notes

    paper.research_problem = (
        notes_data.research_problem
    )

    paper.methodology_notes = (
        notes_data.methodology_notes
    )

    paper.key_findings = (
        notes_data.key_findings
    )

    paper.research_gap = (
        notes_data.research_gap
    )

    paper.limitations = (
        notes_data.limitations
    )

    paper.relevance = (
        notes_data.relevance
    )

    paper.personal_thoughts = (
        notes_data.personal_thoughts
    )

    paper.updated_at = datetime.utcnow()

    db.commit()

    db.refresh(
        paper
    )

    return {
        "message": "Paper notes saved successfully.",
        "paper_id": paper.id,
        "updated_at": paper.updated_at,
    }


# =========================================================
# PAPER TRACKER
# =========================================================

@router.get(
    "/{paper_id}/tracker",
)
def get_paper_tracker(
    paper_id: int,
    db: Session = Depends(get_db),
):

    paper = (
        db.query(Paper)
        .filter(
            Paper.id == paper_id
        )
        .first()
    )

    if not paper:

        raise HTTPException(
            status_code=404,
            detail="Paper not found.",
        )

    return {
        "paper_id": paper.id,
        "title": paper.title,
        "status": paper.status,
        "progress": paper.progress,
        "tags": paper.tags,
        "updated_at": paper.updated_at,
    }


@router.put(
    "/{paper_id}/tracker",
)
def update_paper_tracker(
    paper_id: int,
    tracker_data: PaperTrackerUpdate,
    db: Session = Depends(get_db),
):

    paper = (
        db.query(Paper)
        .filter(
            Paper.id == paper_id
        )
        .first()
    )

    if not paper:

        raise HTTPException(
            status_code=404,
            detail="Paper not found.",
        )

    if tracker_data.status is not None:

        paper.status = (
            tracker_data.status
        )

    if tracker_data.progress is not None:

        if not 0 <= tracker_data.progress <= 100:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Progress must be "
                    "between 0 and 100."
                ),
            )

        paper.progress = (
            tracker_data.progress
        )

    if tracker_data.tags is not None:

        paper.tags = (
            tracker_data.tags
        )

    paper.updated_at = datetime.utcnow()

    db.commit()

    db.refresh(
        paper
    )

    return {
        "message": "Paper tracker saved successfully.",
        "paper_id": paper.id,
        "status": paper.status,
        "progress": paper.progress,
        "tags": paper.tags,
        "updated_at": paper.updated_at,
    }


# =========================================================
# DELETE PAPER
# =========================================================

@router.delete(
    "/{paper_id}",
)
def delete_paper(
    paper_id: int,
    db: Session = Depends(get_db),
):

    paper = (
        db.query(Paper)
        .filter(
            Paper.id == paper_id
        )
        .first()
    )

    if not paper:

        raise HTTPException(
            status_code=404,
            detail="Paper not found.",
        )

    file_path = paper.file_path

    db.delete(
        paper
    )

    db.commit()

    # Delete stored PDF.
    if file_path:

        try:

            path = Path(
                file_path
            )

            if path.exists():

                path.unlink()

        except OSError:

            pass

    return {
        "message":
            "Paper deleted successfully.",
        "id":
            paper_id,
    }
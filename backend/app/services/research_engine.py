import re
from functools import lru_cache

from sentence_transformers import SentenceTransformer


# ============================================================
# EMBEDDING MODEL
# ============================================================

@lru_cache(maxsize=1)
def get_embedding_model():
    """
    Load the local embedding model once.

    The model runs locally and does not require an API key.
    """

    return SentenceTransformer("all-MiniLM-L6-v2")


# ============================================================
# TEXT NORMALIZATION
# ============================================================

def normalize_text(text: str | None) -> str:
    """
    Normalize text extracted from PDFs.
    """

    if not text:
        return ""

    text = text.replace("\x00", " ")
    text = text.replace("\n", " ")

    text = re.sub(r"\s+", " ", text)

    return text.strip()


def tokenize(text: str) -> list[str]:
    """
    Convert text into lowercase tokens.
    """

    return re.findall(
        r"\b[a-zA-Z0-9][a-zA-Z0-9\-]*\b",
        text.lower(),
    )


# ============================================================
# PDF ARTIFACT FILTERING
# ============================================================

def is_pdf_artifact(text: str) -> bool:
    """
    Detect common PDF extraction artifacts.

    Examples:
    - Figure captions
    - Table captions
    - Page numbers
    - Broken fragments
    - Mathematical fragments
    - Very short extracted pieces
    """

    if not text:
        return True

    text = normalize_text(text)

    if not text:
        return True

    words = text.split()

    # Very short fragments.
    if len(words) < 6:
        return True

    # Figure captions.
    if re.match(
        r"^(?:\d+\s+)?figure\s+\d+",
        text,
        re.IGNORECASE,
    ):
        return True

    if re.match(
        r"^fig(?:ure)?\.?\s*\d+",
        text,
        re.IGNORECASE,
    ):
        return True

    # Table captions.
    if re.match(
        r"^(?:\d+\s+)?table\s+\d+",
        text,
        re.IGNORECASE,
    ):
        return True

    # Page numbers.
    if re.fullmatch(
        r"\d+",
        text,
    ):
        return True

    # Common standalone artifacts.
    artifact_patterns = [
        r"^figure\s*$",
        r"^table\s*$",
        r"^appendix\s*$",
        r"^algorithm\s+\d+",
        r"^equation\s+\d+",
    ]

    for pattern in artifact_patterns:
        if re.match(
            pattern,
            text,
            re.IGNORECASE,
        ):
            return True

    # Detect text dominated by symbols/equations.
    alphabetic_words = [
        word
        for word in words
        if re.search(
            r"[A-Za-z]",
            word,
        )
    ]

    if len(words) >= 6:

        alphabetic_ratio = (
            len(alphabetic_words)
            / len(words)
        )

        if alphabetic_ratio < 0.45:
            return True

    return False


def clean_passage(text: str) -> str:
    """
    Clean a passage without changing its meaning.
    """

    text = normalize_text(text)

    # Remove simple trailing page numbers.
    text = re.sub(
        r"\s+\d{1,3}$",
        "",
        text,
    )

    return text.strip()


# ============================================================
# SECTION CLASSIFICATION
# ============================================================

def get_section_type(
    section_title: str,
) -> str:
    """
    Classify a section according to its research value.
    """

    title = (
        section_title or ""
    ).strip().lower()

    low_value_sections = {
        "references",
        "bibliography",
        "acknowledgements",
        "acknowledgments",
        "paper content",
    }

    medium_value_sections = {
        "appendix",
        "supplementary material",
        "supplementary",
        "supplement",
    }

    if title in low_value_sections:
        return "low_value"

    if title in medium_value_sections:
        return "medium_value"

    return "research_content"


def get_section_weight(
    section_title: str,
) -> float:
    """
    Assign a retrieval weight to a section.
    """

    section_type = get_section_type(
        section_title
    )

    if section_type == "low_value":
        return 0.15

    if section_type == "medium_value":
        return 0.70

    return 1.0


# ============================================================
# QUESTION TYPE
# ============================================================

def detect_question_type(
    question: str,
) -> str:
    """
    Detect the intent of the research question.
    """

    q = (
        question or ""
    ).lower().strip()

    if not q:
        return "general"

    # --------------------------------------------------------
    # MAIN IDEA
    # --------------------------------------------------------

    main_idea_patterns = [
        r"\bmain idea\b",
        r"\bmain contribution\b",
        r"\bkey contribution\b",
        r"\bcore idea\b",
        r"\bcentral idea\b",
        r"\bwhat is this paper about\b",
        r"\bwhat does this paper propose\b",
        r"\bwhat does the paper propose\b",
        r"\bwhat is the paper about\b",
        r"\bwhat is the purpose of this paper\b",
        r"\bwhat is the aim of this paper\b",
        r"\bwhat is the objective of this paper\b",
        r"\bsummarize this paper\b",
        r"\bsummarise this paper\b",
    ]

    if any(
        re.search(
            pattern,
            q,
        )
        for pattern in main_idea_patterns
    ):
        return "main_idea"

    # --------------------------------------------------------
    # WHY
    # --------------------------------------------------------

    if re.match(
        r"^(why|how come|what caused|what was the reason)",
        q,
    ):
        return "why"

    # --------------------------------------------------------
    # HOW
    # --------------------------------------------------------

    if re.match(
        r"^(how does|how do|how is|how are|how was|how were)",
        q,
    ):
        return "how"

    # --------------------------------------------------------
    # WHAT
    # --------------------------------------------------------

    if re.match(
        r"^(what is|what are|what was|what were|define)",
        q,
    ):
        return "what"

    # --------------------------------------------------------
    # WHICH
    # --------------------------------------------------------

    if re.match(
        r"^(which|what .*dataset|what .*model|what .*method)",
        q,
    ):
        return "which"

    # --------------------------------------------------------
    # YES / NO
    # --------------------------------------------------------

    if re.match(
        r"^(did|does|do|is|are|was|were|can|could|has|have)",
        q,
    ):
        return "yes_no"

    return "general"


# ============================================================
# QUESTION CONCEPTS
# ============================================================

def extract_question_concepts(
    question: str,
) -> list[str]:
    """
    Extract meaningful concepts from a question.
    """

    stop_words = {
        "what",
        "why",
        "when",
        "where",
        "which",
        "who",
        "how",
        "does",
        "did",
        "do",
        "is",
        "are",
        "was",
        "were",
        "can",
        "could",
        "has",
        "have",
        "the",
        "a",
        "an",
        "of",
        "to",
        "in",
        "on",
        "for",
        "and",
        "or",
        "with",
        "from",
        "they",
        "authors",
        "author",
        "their",
        "this",
        "that",
        "these",
        "those",
        "it",
        "its",
        "be",
        "been",
        "being",
        "paper",
    }

    tokens = tokenize(
        question
    )

    concepts = []

    for token in tokens:

        if token in stop_words:
            continue

        if len(token) < 3:
            continue

        concepts.append(token)

    return concepts


# ============================================================
# QUESTION-SPECIFIC SECTION BONUS
# ============================================================

def get_question_section_bonus(
    question_type: str,
    section_title: str,
) -> float:
    """
    Prioritize sections that naturally answer a question.
    """

    title = (
        section_title or ""
    ).strip().lower()

    # --------------------------------------------------------
    # MAIN IDEA
    # --------------------------------------------------------

    if question_type == "main_idea":

        if title == "abstract":
            return 0.35

        if title in {
            "introduction",
            "background",
            "related work",
        }:
            return 0.22

        if title in {
            "conclusion",
            "future work",
        }:
            return 0.18

        if title in {
            "methodology",
            "method",
            "approach",
            "model",
            "model architecture",
            "proposed method",
        }:
            return 0.08

    # --------------------------------------------------------
    # WHY
    # --------------------------------------------------------

    elif question_type == "why":

        if title in {
            "abstract",
            "introduction",
            "background",
            "related work",
        }:
            return 0.15

    # --------------------------------------------------------
    # HOW
    # --------------------------------------------------------

    elif question_type == "how":

        if title in {
            "methodology",
            "method",
            "approach",
            "model",
            "model architecture",
            "proposed method",
            "experimental setup",
        }:
            return 0.15

    # --------------------------------------------------------
    # WHAT / WHICH
    # --------------------------------------------------------

    elif question_type in {
        "what",
        "which",
    }:

        if title in {
            "abstract",
            "methodology",
            "method",
            "approach",
            "model",
            "model architecture",
            "results",
        }:
            return 0.08

    return 0.0


# ============================================================
# PASSAGE SPLITTING
# ============================================================

def split_into_passages(
    text: str,
    max_words: int = 120,
    overlap_words: int = 25,
) -> list[str]:
    """
    Split section text into retrieval passages.

    Paragraph boundaries are preferred. Long paragraphs
    are divided into overlapping windows.
    """

    if not text:
        return []

    normalized = normalize_text(
        text
    )

    if not normalized:
        return []

    raw_paragraphs = re.split(
        r"\n\s*\n",
        text.strip(),
    )

    paragraphs = []

    for paragraph in raw_paragraphs:

        paragraph = clean_passage(
            paragraph
        )

        if is_pdf_artifact(
            paragraph
        ):
            continue

        if len(
            paragraph.split()
        ) < 6:
            continue

        paragraphs.append(
            paragraph
        )

    # Fallback if paragraph boundaries
    # were lost during PDF extraction.
    if not paragraphs:
        paragraphs = [
            normalized
        ]

    passages = []

    for paragraph in paragraphs:

        words = paragraph.split()

        if len(words) <= max_words:

            passages.append(
                paragraph
            )

            continue

        start = 0

        while start < len(words):

            end = min(
                start + max_words,
                len(words),
            )

            passage = " ".join(
                words[start:end]
            )

            passage = clean_passage(
                passage
            )

            if (
                passage
                and not is_pdf_artifact(
                    passage
                )
            ):
                passages.append(
                    passage
                )

            if end >= len(words):
                break

            start = max(
                end - overlap_words,
                start + 1,
            )

    return passages


# ============================================================
# KEYWORD SCORE
# ============================================================

def keyword_score(
    query: str,
    passage: str,
) -> float:
    """
    Calculate lexical overlap between query and passage.
    """

    query_tokens = set(
        tokenize(query)
    )

    passage_tokens = set(
        tokenize(passage)
    )

    if not query_tokens:
        return 0.0

    overlap = (
        query_tokens
        & passage_tokens
    )

    return (
        len(overlap)
        / len(query_tokens)
    )


# ============================================================
# SEMANTIC SCORE
# ============================================================

def semantic_scores(
    query: str,
    passages: list[str],
) -> list[float]:
    """
    Calculate cosine similarity using the local
    sentence-transformer model.
    """

    if not passages:
        return []

    model = get_embedding_model()

    query_embedding = model.encode(
        query,
        normalize_embeddings=True,
    )

    passage_embeddings = model.encode(
        passages,
        normalize_embeddings=True,
    )

    scores = []

    for embedding in passage_embeddings:

        score = float(
            embedding
            @ query_embedding
        )

        scores.append(
            score
        )

    return scores


# ============================================================
# EVIDENCE ROLE DETECTION
# ============================================================

def detect_evidence_roles(
    sentence: str,
) -> list[str]:
    """
    Identify possible research roles in a sentence.
    """

    lower = sentence.lower()

    roles = []

    # --------------------------------------------------------
    # PROBLEM
    # --------------------------------------------------------

    problem_patterns = [
        "however",
        "limitation",
        "problem",
        "challenge",
        "constraint",
        "difficult",
        "difficulties",
        "precludes",
        "cannot",
        "unable",
        "lack of",
        "lack",
        "bottleneck",
        "expensive",
    ]

    if any(
        pattern in lower
        for pattern in problem_patterns
    ):
        roles.append(
            "problem"
        )

    # --------------------------------------------------------
    # CAUSE / MOTIVATION
    # --------------------------------------------------------

    cause_patterns = [
        "because",
        "therefore",
        "thus",
        "hence",
        "motivated by",
        "due to",
        "to address",
        "to overcome",
        "in order to",
        "allowing",
        "enabling",
        "which allows",
        "which enables",
    ]

    if any(
        pattern in lower
        for pattern in cause_patterns
    ):
        roles.append(
            "cause"
        )

    # --------------------------------------------------------
    # METHOD / CONTRIBUTION
    # --------------------------------------------------------

    method_patterns = [
        "we propose",
        "we introduce",
        "we present",
        "we develop",
        "we use",
        "we employ",
        "our model",
        "our approach",
        "our method",
        "we design",
        "we formulate",
        "the proposed",
        "we demonstrate",
    ]

    if any(
        pattern in lower
        for pattern in method_patterns
    ):
        roles.append(
            "method"
        )

    # --------------------------------------------------------
    # BENEFIT
    # --------------------------------------------------------

    benefit_patterns = [
        "improve",
        "improved",
        "improves",
        "improvement",
        "better",
        "superior",
        "faster",
        "parallelizable",
        "reduce",
        "reduced",
        "reduces",
        "significantly less",
        "state of the art",
    ]

    if any(
        pattern in lower
        for pattern in benefit_patterns
    ):
        roles.append(
            "benefit"
        )

    # --------------------------------------------------------
    # RESULT
    # --------------------------------------------------------

    result_patterns = [
        "our results",
        "results show",
        "experiments show",
        "we show",
        "achieves",
        "achieved",
        "obtained",
        "outperforms",
        "score of",
        "accuracy",
        "f1",
        "auc",
        "bleu",
    ]

    if any(
        pattern in lower
        for pattern in result_patterns
    ):
        roles.append(
            "result"
        )

    return roles


# ============================================================
# SENTENCE SPLITTING
# ============================================================

def split_sentences(
    text: str,
) -> list[str]:
    """
    Split a passage into clean sentences.
    """

    if not text:
        return []

    text = normalize_text(
        text
    )

    abbreviations = [
        "e.g.",
        "i.e.",
        "etc.",
        "Fig.",
        "Figs.",
        "Eq.",
        "Eqs.",
        "Dr.",
        "Mr.",
        "Ms.",
        "vs.",
        "et al.",
    ]

    protected = text

    for abbreviation in abbreviations:

        protected = protected.replace(
            abbreviation,
            abbreviation.replace(
                ".",
                "<DOT>",
            ),
        )

    parts = re.split(
        r"(?<=[.!?])\s+(?=[A-Z0-9])",
        protected,
    )

    sentences = []

    for part in parts:

        part = part.replace(
            "<DOT>",
            ".",
        )

        part = clean_passage(
            part
        )

        if is_pdf_artifact(
            part
        ):
            continue

        if len(
            part.split()
        ) < 6:
            continue

        sentences.append(
            part
        )

    return sentences


# ============================================================
# SECTION-AWARE HYBRID SEARCH
# ============================================================

def search_sections(
    query: str,
    sections: list[dict],
    top_k: int = 5,
):
    """
    Search the paper using:

    - semantic similarity
    - keyword overlap
    - section importance
    - question-specific section preference
    - PDF artifact filtering
    """

    question_type = detect_question_type(
        query
    )

    all_passages = []

    for section in sections:

        section_title = section.get(
            "title",
            "Unknown",
        )

        content = section.get(
            "content",
            "",
        )

        section_passages = (
            split_into_passages(
                content
            )
        )

        section_type = (
            get_section_type(
                section_title
            )
        )

        section_weight = (
            get_section_weight(
                section_title
            )
        )

        question_bonus = (
            get_question_section_bonus(
                question_type,
                section_title,
            )
        )

        for passage in section_passages:

            all_passages.append(
                {
                    "section_id": section.get(
                        "id"
                    ),
                    "section": section_title,
                    "section_type": section_type,
                    "section_weight": section_weight,
                    "question_bonus": question_bonus,
                    "text": passage,
                }
            )

    if not all_passages:
        return []

    passage_texts = [
        item["text"]
        for item in all_passages
    ]

    semantic = semantic_scores(
        query,
        passage_texts,
    )

    results = []

    for index, item in enumerate(
        all_passages
    ):

        semantic_score = (
            semantic[index]
        )

        lexical_score = (
            keyword_score(
                query,
                item["text"],
            )
        )

        base_score = (
            semantic_score * 0.72
            + lexical_score * 0.18
            + item["question_bonus"]
        )

        final_score = (
            base_score
            * item["section_weight"]
        )

        results.append(
            {
                "section_id": item[
                    "section_id"
                ],
                "section": item[
                    "section"
                ],
                "section_type": item[
                    "section_type"
                ],
                "text": item[
                    "text"
                ],
                "score": round(
                    final_score,
                    4,
                ),
                "semantic_score": round(
                    semantic_score,
                    4,
                ),
                "keyword_score": round(
                    lexical_score,
                    4,
                ),
            }
        )

    results.sort(
        key=lambda item: item["score"],
        reverse=True,
    )

    return results[:top_k]


# ============================================================
# SEARCH RESPONSE
# ============================================================

def build_search_response(
    query: str,
    paper_title: str,
    results: list[dict],
):
    """
    Build the structured search response.
    """

    return {
        "paper_title": paper_title,
        "query": query,
        "question_type": (
            detect_question_type(
                query
            )
        ),
        "search_type": (
            "section_aware_hybrid_semantic"
        ),
        "result_count": len(
            results
        ),
        "results": results,
    }


# ============================================================
# ANSWER SENTENCE SCORING
# ============================================================

def score_sentence_for_answer(
    sentence: str,
    question: str,
    question_type: str,
    concepts: list[str],
    semantic_score: float,
    section_title: str,
):
    """
    Rank a sentence as possible answer evidence.
    """

    lower = sentence.lower()

    roles = detect_evidence_roles(
        sentence
    )

    concept_hits = 0

    for concept in concepts:

        if concept in lower:
            concept_hits += 1

    concept_score = (
        concept_hits
        / max(
            len(concepts),
            1,
        )
    )

    role_bonus = 0.0

    # --------------------------------------------------------
    # MAIN IDEA
    # --------------------------------------------------------

    if question_type == "main_idea":

        explicit_proposal_patterns = [
            r"\bwe propose\b",
            r"\bwe introduce\b",
            r"\bwe present\b",
            r"\bwe develop\b",
            r"\bwe design\b",
            r"\bwe formulate\b",
            r"\bour approach\b",
            r"\bour model\b",
            r"\bour method\b",
            r"\bthe proposed\b",
        ]

        explicit_proposal = any(
            re.search(
                pattern,
                lower,
            )
            for pattern in explicit_proposal_patterns
        )

        if explicit_proposal:
            role_bonus += 0.35

        if "method" in roles:
            role_bonus += 0.12

        if "benefit" in roles:
            role_bonus += 0.10

        if "result" in roles:
            role_bonus += 0.06

        if "problem" in roles:
            role_bonus += 0.02

    # --------------------------------------------------------
    # WHY
    # --------------------------------------------------------

    elif question_type == "why":

        if "cause" in roles:
            role_bonus += 0.16

        if "problem" in roles:
            role_bonus += 0.12

        if "benefit" in roles:
            role_bonus += 0.08

        if (
            "method" in roles
            and "cause" not in roles
            and "problem" not in roles
        ):
            role_bonus -= 0.05

    # --------------------------------------------------------
    # HOW
    # --------------------------------------------------------

    elif question_type == "how":

        if "method" in roles:
            role_bonus += 0.14

        if "cause" in roles:
            role_bonus += 0.06

    # --------------------------------------------------------
    # WHAT / WHICH
    # --------------------------------------------------------

    elif question_type in {
        "what",
        "which",
    }:

        if "method" in roles:
            role_bonus += 0.08

        if "result" in roles:
            role_bonus += 0.06

    # --------------------------------------------------------
    # SECTION BONUS
    # --------------------------------------------------------

    section_bonus = (
        get_question_section_bonus(
            question_type,
            section_title,
        )
    )

    final_score = (
        semantic_score * 0.62
        + concept_score * 0.18
        + role_bonus
        + section_bonus
    )

    return (
        final_score,
        roles,
    )


# ============================================================
# ANSWER SENTENCE RETRIEVAL
# ============================================================

def retrieve_answer_sentences(
    question: str,
    sections: list[dict],
    top_k_passages: int = 8,
):
    """
    Retrieve candidate answer sentences.

    Main-idea questions use a dedicated contribution-first
    strategy.

    Other questions use normal hybrid retrieval.
    """

    question_type = detect_question_type(
        question
    )

    concepts = extract_question_concepts(
        question
    )

    # ========================================================
    # MAIN IDEA — DEDICATED STRATEGY
    # ========================================================

    if question_type == "main_idea":

        priority_sections = [
            "abstract",
            "introduction",
            "conclusion",
            "background",
            "related work",
        ]

        contribution_patterns = [
            r"\bwe propose\b",
            r"\bwe introduce\b",
            r"\bwe present\b",
            r"\bwe develop\b",
            r"\bwe design\b",
            r"\bwe formulate\b",
            r"\bour approach\b",
            r"\bour model\b",
            r"\bour method\b",
            r"\bthe proposed\b",
        ]

        candidates = []

        for section in sections:

            section_title = (
                section.get(
                    "title",
                    "",
                )
                or ""
            ).strip().lower()

            if (
                section_title
                not in priority_sections
            ):
                continue

            content = section.get(
                "content",
                "",
            )

            sentences = split_sentences(
                content
            )

            if not sentences:
                continue

            sentence_semantic = (
                semantic_scores(
                    question,
                    sentences,
                )
            )

            for index, sentence in enumerate(
                sentences
            ):

                lower = sentence.lower()

                roles = detect_evidence_roles(
                    sentence
                )

                explicit_proposal = any(
                    re.search(
                        pattern,
                        lower,
                    )
                    for pattern in contribution_patterns
                )

                score = (
                    sentence_semantic[index]
                    * 0.35
                )

                # Explicit contribution gets
                # strong priority.
                if explicit_proposal:
                    score += 0.70

                # Section priority.
                if section_title == "abstract":
                    score += 0.35

                elif section_title == "introduction":
                    score += 0.25

                elif section_title == "conclusion":
                    score += 0.20

                elif section_title in {
                    "background",
                    "related work",
                }:
                    score += 0.05

                # Supporting evidence.
                if "benefit" in roles:
                    score += 0.15

                if "result" in roles:
                    score += 0.08

                candidates.append(
                    {
                        "section_id": section.get(
                            "id"
                        ),
                        "section": section.get(
                            "title",
                            "Unknown",
                        ),
                        "text": sentence,
                        "score": score,
                        "roles": roles,
                        "semantic_score": (
                            sentence_semantic[index]
                        ),
                    }
                )

        candidates.sort(
            key=lambda item: item["score"],
            reverse=True,
        )

        return candidates

    # ========================================================
    # NORMAL QUESTIONS
    # ========================================================

    passages = search_sections(
        query=question,
        sections=sections,
        top_k=top_k_passages,
    )

    candidates = []

    for passage in passages:

        sentences = split_sentences(
            passage["text"]
        )

        if not sentences:
            continue

        sentence_semantic = (
            semantic_scores(
                question,
                sentences,
            )
        )

        for index, sentence in enumerate(
            sentences
        ):

            score, roles = (
                score_sentence_for_answer(
                    sentence=sentence,
                    question=question,
                    question_type=question_type,
                    concepts=concepts,
                    semantic_score=sentence_semantic[
                        index
                    ],
                    section_title=passage[
                        "section"
                    ],
                )
            )

            candidates.append(
                {
                    "section_id": passage[
                        "section_id"
                    ],
                    "section": passage[
                        "section"
                    ],
                    "text": sentence,
                    "score": score,
                    "roles": roles,
                    "semantic_score": (
                        sentence_semantic[
                            index
                        ]
                    ),
                }
            )

    candidates.sort(
        key=lambda item: item["score"],
        reverse=True,
    )

    return candidates


# ============================================================
# ANSWER SENTENCE SELECTION
# ============================================================

def select_answer_sentences(
    candidates: list[dict],
    question: str,
    max_sentences: int = 3,
):
    """
    Select the final evidence sentences.

    Main idea:
        1. Explicit contribution
        2. Benefit
        3. Result

    Other question types use role-aware selection.
    """

    if not candidates:
        return []

    question_type = detect_question_type(
        question
    )

    selected = []

    used_text = set()

    # ========================================================
    # MAIN IDEA
    # ========================================================

    if question_type == "main_idea":

        proposal_patterns = [
            r"\bwe propose\b",
            r"\bwe introduce\b",
            r"\bwe present\b",
            r"\bwe develop\b",
            r"\bwe design\b",
            r"\bwe formulate\b",
            r"\bour approach\b",
            r"\bour model\b",
            r"\bour method\b",
            r"\bthe proposed\b",
        ]

        # ----------------------------------------------------
        # 1. Explicit proposal / contribution
        # ----------------------------------------------------

        for candidate in candidates:

            text = (
                candidate["text"]
                .lower()
                .strip()
            )

            if text in used_text:
                continue

            if any(
                re.search(
                    pattern,
                    text,
                )
                for pattern in proposal_patterns
            ):

                selected.append(
                    candidate
                )

                used_text.add(
                    text
                )

                break

        # ----------------------------------------------------
        # 2. Supporting benefit
        # ----------------------------------------------------

        if len(selected) < max_sentences:

            for candidate in candidates:

                text = (
                    candidate["text"]
                    .lower()
                    .strip()
                )

                if text in used_text:
                    continue

                if "benefit" in candidate[
                    "roles"
                ]:

                    selected.append(
                        candidate
                    )

                    used_text.add(
                        text
                    )

                    break

        # ----------------------------------------------------
        # 3. Supporting result
        # ----------------------------------------------------

        if len(selected) < max_sentences:

            for candidate in candidates:

                text = (
                    candidate["text"]
                    .lower()
                    .strip()
                )

                if text in used_text:
                    continue

                if "result" in candidate[
                    "roles"
                ]:

                    selected.append(
                        candidate
                    )

                    used_text.add(
                        text
                    )

                    break

    # ========================================================
    # WHY
    # ========================================================

    elif question_type == "why":

        preferred_roles = {
            "cause",
            "problem",
            "benefit",
        }

        for candidate in candidates:

            text = (
                candidate["text"]
                .lower()
                .strip()
            )

            if text in used_text:
                continue

            if not (
                set(
                    candidate["roles"]
                )
                & preferred_roles
            ):
                continue

            selected.append(
                candidate
            )

            used_text.add(
                text
            )

            if len(selected) >= max_sentences:
                break

    # ========================================================
    # HOW
    # ========================================================

    elif question_type == "how":

        preferred_roles = {
            "method",
            "cause",
        }

        for candidate in candidates:

            text = (
                candidate["text"]
                .lower()
                .strip()
            )

            if text in used_text:
                continue

            if not (
                set(
                    candidate["roles"]
                )
                & preferred_roles
            ):
                continue

            selected.append(
                candidate
            )

            used_text.add(
                text
            )

            if len(selected) >= max_sentences:
                break

    # ========================================================
    # GENERAL FALLBACK
    # ========================================================

    if len(selected) < max_sentences:

        for candidate in candidates:

            text = (
                candidate["text"]
                .lower()
                .strip()
            )

            if text in used_text:
                continue

            selected.append(
                candidate
            )

            used_text.add(
                text
            )

            if len(selected) >= max_sentences:
                break

    return selected


# ============================================================
# CONFIDENCE
# ============================================================

def calculate_confidence(
    selected: list[dict],
):
    """
    Calculate retrieval confidence.

    This is NOT a probability that the answer is correct.
    """

    if not selected:
        return 0.0

    scores = [
        item["score"]
        for item in selected
    ]

    average = (
        sum(scores)
        / len(scores)
    )

    confidence = max(
        0.0,
        min(
            average,
            1.0,
        ),
    )

    return round(
        confidence,
        3,
    )


# ============================================================
# ANSWER QUESTION
# ============================================================

def answer_question(
    question: str,
    sections: list[dict],
    top_k_passages: int = 8,
    max_answer_sentences: int = 3,
):
    """
    Answer a research question using evidence extracted
    directly from the paper.

    This is an extractive answer engine.

    It does NOT generate new facts.
    """

    question = (
        question or ""
    ).strip()

    # --------------------------------------------------------
    # Empty question
    # --------------------------------------------------------

    if not question:

        return {
            "answer": "",
            "answer_type": "extractive",
            "confidence": 0.0,
            "question_type": "general",
            "evidence": [],
            "retrieved_passages": 0,
        }

    question_type = (
        detect_question_type(
            question
        )
    )

    # --------------------------------------------------------
    # Retrieve candidate sentences
    # --------------------------------------------------------

    candidates = (
        retrieve_answer_sentences(
            question=question,
            sections=sections,
            top_k_passages=top_k_passages,
        )
    )

    # --------------------------------------------------------
    # Select final evidence
    # --------------------------------------------------------

    selected = (
        select_answer_sentences(
            candidates=candidates,
            question=question,
            max_sentences=max_answer_sentences,
        )
    )

    # --------------------------------------------------------
    # No evidence
    # --------------------------------------------------------

    if not selected:

        return {
            "answer": (
                "No sufficiently relevant "
                "evidence was found in the paper."
            ),
            "answer_type": "extractive",
            "confidence": 0.0,
            "question_type": question_type,
            "evidence": [],
            "retrieved_passages": 0,
        }

    # --------------------------------------------------------
    # Construct answer
    # --------------------------------------------------------

    answer = " ".join(
        item["text"]
        for item in selected
    )

    # --------------------------------------------------------
    # Preserve source traceability
    # --------------------------------------------------------

    evidence = []

    for item in selected:

        evidence.append(
            {
                "section_id": item[
                    "section_id"
                ],
                "section": item[
                    "section"
                ],
                "text": item[
                    "text"
                ],
                "score": round(
                    item["score"],
                    4,
                ),
                "roles": item[
                    "roles"
                ],
            }
        )

    # --------------------------------------------------------
    # Final response
    # --------------------------------------------------------

    return {
        "answer": answer,
        "answer_type": "extractive",
        "confidence": calculate_confidence(
            selected
        ),
        "question_type": question_type,
        "evidence": evidence,
        "retrieved_passages": len(
            candidates
        ),
    }
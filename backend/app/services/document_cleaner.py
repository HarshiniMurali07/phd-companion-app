import re


# ============================================================
# DOCUMENT CLEANING
# ============================================================

def clean_pdf_text(text: str) -> str:
    """
    Clean common PDF extraction artefacts while
    preserving the actual research content.
    """

    if not text:
        return ""

    # --------------------------------------------------------
    # Normalize line endings
    # --------------------------------------------------------

    text = text.replace("\r\n", "\n")
    text = text.replace("\r", "\n")

    # --------------------------------------------------------
    # Remove soft hyphens
    # --------------------------------------------------------

    text = text.replace("\u00ad", "")

    # --------------------------------------------------------
    # Repair words broken across lines
    #
    # Example:
    # paral-
    # lelization
    #
    # becomes:
    # parallelization
    # --------------------------------------------------------

    text = re.sub(
        r"([A-Za-z]{2,})-\s*\n\s*([A-Za-z]{2,})",
        r"\1\2",
        text,
    )

    # --------------------------------------------------------
    # Remove arXiv metadata
    #
    # Example:
    # arXiv:1706.03762v7 [cs.CL] 2 Aug 2023
    # --------------------------------------------------------

    text = re.sub(
        r"arXiv:\S+\s+\[[^\]]+\]\s+\d{1,2}\s+\w+\s+\d{4}",
        " ",
        text,
        flags=re.IGNORECASE,
    )

    # --------------------------------------------------------
    # Remove common conference header
    #
    # Example:
    # 31st Conference on Neural Information Processing
    # Systems (NIPS 2017), Long Beach, CA, USA.
    # --------------------------------------------------------

    text = re.sub(
        r"\d{1,2}(?:st|nd|rd|th)\s+"
        r"Conference on Neural Information Processing "
        r"Systems.*?"
        r"(?:USA|US)\.",
        " ",
        text,
        flags=re.IGNORECASE,
    )

    # --------------------------------------------------------
    # Remove standalone page numbers
    # --------------------------------------------------------

    text = re.sub(
        r"\n\s*\d{1,3}\s*\n",
        "\n",
        text,
    )

    # --------------------------------------------------------
    # Remove common figure/table labels
    #
    # Example:
    # Figure 1:
    # Table 2:
    # --------------------------------------------------------

    text = re.sub(
        r"\n\s*(Figure|Fig\.|Table)\s+\d+\s*:\s*\n",
        "\n",
        text,
        flags=re.IGNORECASE,
    )

    # --------------------------------------------------------
    # Remove spaces before newlines
    # --------------------------------------------------------

    text = re.sub(
        r"[ \t]+\n",
        "\n",
        text,
    )

    # --------------------------------------------------------
    # Remove spaces immediately after newlines
    # --------------------------------------------------------

    text = re.sub(
        r"\n[ \t]+",
        "\n",
        text,
    )

    # --------------------------------------------------------
    # Collapse excessive blank lines
    # --------------------------------------------------------

    text = re.sub(
        r"\n{3,}",
        "\n\n",
        text,
    )

    return text.strip()


# ============================================================
# LINE CLEANING
# ============================================================

def clean_lines(text: str) -> list[str]:
    """
    Clean individual lines after PDF extraction.
    """

    cleaned = []

    for line in text.splitlines():

        line = line.strip()

        # Skip empty lines
        if not line:
            continue

        # Skip isolated page numbers
        if re.fullmatch(
            r"\d{1,3}",
            line,
        ):
            continue

        # Skip arXiv metadata lines
        if re.search(
            r"arXiv:\S+",
            line,
            flags=re.IGNORECASE,
        ):
            continue

        cleaned.append(line)

    return cleaned


# ============================================================
# PARAGRAPH EXTRACTION
# ============================================================

def extract_paragraphs(text: str) -> list[str]:
    """
    Convert cleaned PDF text into readable paragraphs.
    """

    text = clean_pdf_text(text)

    # Split on blank lines
    blocks = re.split(
        r"\n\s*\n",
        text,
    )

    paragraphs = []

    for block in blocks:

        block = block.strip()

        if not block:
            continue

        lines = clean_lines(block)

        if not lines:
            continue

        # Join wrapped PDF lines
        paragraph = " ".join(lines)

        # Normalize whitespace
        paragraph = re.sub(
            r"\s+",
            " ",
            paragraph,
        ).strip()

        # Ignore extremely short fragments
        if len(paragraph) < 30:
            continue

        paragraphs.append(paragraph)

    return paragraphs


# ============================================================
# SENTENCE EXTRACTION
# ============================================================

def extract_sentences(text: str) -> list[str]:
    """
    Convert PDF text into individual sentences.
    """

    paragraphs = extract_paragraphs(text)

    sentences = []

    for paragraph in paragraphs:

        protected = paragraph

        # ----------------------------------------------------
        # Protect common abbreviations from sentence splitting
        # ----------------------------------------------------

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
        ]

        for abbreviation in abbreviations:

            protected = protected.replace(
                abbreviation,
                abbreviation.replace(
                    ".",
                    "<DOT>",
                ),
            )

        # ----------------------------------------------------
        # Split sentences
        # ----------------------------------------------------

        parts = re.split(
            r"(?<=[.!?])\s+(?=[A-Z0-9])",
            protected,
        )

        for part in parts:

            # Restore periods
            part = part.replace(
                "<DOT>",
                ".",
            )

            # Normalize whitespace
            part = re.sub(
                r"\s+",
                " ",
                part,
            ).strip()

            # Ignore tiny fragments
            if len(part.split()) < 8:
                continue

            sentences.append(part)

    return sentences
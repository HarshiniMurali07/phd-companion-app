from app.database import SessionLocal
from app.models import PaperSection

from app.services.document_cleaner import (
    clean_pdf_text,
    extract_paragraphs,
    extract_sentences,
)


db = SessionLocal()

section = (
    db.query(PaperSection)
    .filter(
        PaperSection.paper_id == 1
    )
    .first()
)

if not section:
    print("Section not found.")
    db.close()
    raise SystemExit


print("\n")
print("=" * 80)
print("ORIGINAL TEXT")
print("=" * 80)

print(
    section.content[:3000]
)


print("\n")
print("=" * 80)
print("CLEANED TEXT")
print("=" * 80)

cleaned = clean_pdf_text(
    section.content
)

print(
    cleaned[:3000]
)


print("\n")
print("=" * 80)
print("PARAGRAPHS")
print("=" * 80)

paragraphs = extract_paragraphs(
    section.content
)

for index, paragraph in enumerate(
    paragraphs[:5],
    start=1,
):

    print(
        f"\nPARAGRAPH {index}\n"
    )

    print(
        paragraph
    )


print("\n")
print("=" * 80)
print("SENTENCES")
print("=" * 80)

sentences = extract_sentences(
    section.content
)

for index, sentence in enumerate(
    sentences[:10],
    start=1,
):

    print(
        f"\nSENTENCE {index}\n"
    )

    print(
        sentence
    )


db.close() 
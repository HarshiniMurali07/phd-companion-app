from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Paper, PaperSection
from app.services.research_engine import (
    search_sections,
    build_search_response,
    answer_question,
)


router = APIRouter(
    prefix="/api/research",
    tags=["Research Copilot"],
)


class ResearchQuestion(BaseModel):
    paper_id: int
    question: str


# =========================================================
# SEARCH PAPER
# =========================================================

@router.get("/paper/{paper_id}/search")
def search_paper(
    paper_id: int,
    q: str,
    db: Session = Depends(get_db),
):
    """
    Search the sections of a specific paper.
    """

    paper = (
        db.query(Paper)
        .filter(Paper.id == paper_id)
        .first()
    )

    if not paper:
        raise HTTPException(
            status_code=404,
            detail="Paper not found",
        )

    sections = (
        db.query(PaperSection)
        .filter(PaperSection.paper_id == paper_id)
        .order_by(PaperSection.section_order)
        .all()
    )

    if not sections:
        raise HTTPException(
            status_code=404,
            detail="No sections found for this paper",
        )

    section_data = [
        {
            "id": section.id,
            "title": section.title,
            "content": section.content,
            "section_order": section.section_order,
        }
        for section in sections
    ]

    results = search_sections(
        query=q,
        sections=section_data,
    )

    return build_search_response(
        query=q,
        paper_title=paper.title,
        results=results,
    )


# =========================================================
# ASK RESEARCH QUESTION
# =========================================================

@router.post("/ask")
def ask_research_question(
    request: ResearchQuestion,
    db: Session = Depends(get_db),
):
    """
    Ask a research question about a specific paper.

    The answer is generated from evidence retrieved
    directly from the paper.
    """

    paper = (
        db.query(Paper)
        .filter(Paper.id == request.paper_id)
        .first()
    )

    if not paper:
        raise HTTPException(
            status_code=404,
            detail="Paper not found",
        )

    sections = (
        db.query(PaperSection)
        .filter(
            PaperSection.paper_id == request.paper_id
        )
        .order_by(PaperSection.section_order)
        .all()
    )

    if not sections:
        raise HTTPException(
            status_code=404,
            detail="No sections found for this paper",
        )

    section_data = [
        {
            "id": section.id,
            "title": section.title,
            "content": section.content,
            "section_order": section.section_order,
        }
        for section in sections
    ]

    # -----------------------------------------------------
    # Retrieve relevant passages
    # -----------------------------------------------------

    search_results = search_sections(
        query=request.question,
        sections=section_data,
    )

    # -----------------------------------------------------
    # Build search response
    # -----------------------------------------------------

    search_response = build_search_response(
        query=request.question,
        paper_title=paper.title,
        results=search_results,
    )

    # -----------------------------------------------------
    # Generate extractive answer
    # -----------------------------------------------------

    answer = answer_question(
        question=request.question,
        sections=section_data,
    )

    return {
        "paper_id": request.paper_id,
        "question": request.question,
        "paper_title": paper.title,
        "answer": answer,
        "search": search_response,
        "sources": search_results,
    } 
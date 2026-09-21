from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy.orm import (
    Session,
    joinedload,
)

from ..database import get_db
from ..models import (
    Paper,
    ResearchGap,
)
from ..schemas import (
    ResearchGapCreate,
    ResearchGapUpdate,
    ResearchGapResponse,
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/gaps",
    tags=["research gaps"],
)


# ============================================================
# ALLOWED VALUES
# ============================================================

ALLOWED_STATUSES = {
    "Open",
    "Exploring",
    "Investigating",
    "Addressed",
    "Parked",
}

ALLOWED_CATEGORIES = {
    "Methodological",
    "Dataset",
    "Evaluation",
    "Generalisability",
    "Interpretability",
    "Theoretical",
    "Practical",
    "Other",
}


# ============================================================
# SERIALIZER
# ============================================================

def serialize_gap(
    gap: ResearchGap,
) -> ResearchGapResponse:

    return ResearchGapResponse(
        id=gap.id,
        title=gap.title,
        description=gap.description,
        category=gap.category,
        status=gap.status,
        source_paper_id=gap.source_paper_id,
        why_it_matters=gap.why_it_matters,
        next_step=gap.next_step,
        created_at=gap.created_at,
        updated_at=gap.updated_at,
        source_title=(
            gap.source_paper.title
            if gap.source_paper
            else None
        ),
    )


# ============================================================
# VALIDATION
# ============================================================

def validate_category(category: str):
    if category not in ALLOWED_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid category. "
                f"Allowed categories: "
                f"{', '.join(sorted(ALLOWED_CATEGORIES))}"
            ),
        )


def validate_status(status: str):
    if status not in ALLOWED_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid status. "
                f"Allowed statuses: "
                f"{', '.join(sorted(ALLOWED_STATUSES))}"
            ),
        )


def validate_source_paper(
    source_paper_id: int | None,
    db: Session,
):

    if source_paper_id is None:
        return

    paper = (
        db.query(Paper)
        .filter(
            Paper.id == source_paper_id
        )
        .first()
    )

    if not paper:
        raise HTTPException(
            status_code=404,
            detail="Source paper not found.",
        )


# ============================================================
# CREATE
# ============================================================

@router.post(
    "/",
    response_model=ResearchGapResponse,
)
def create_gap(
    payload: ResearchGapCreate,
    db: Session = Depends(get_db),
):

    title = payload.title.strip()
    description = payload.description.strip()

    if not title:
        raise HTTPException(
            status_code=400,
            detail="Research gap title is required.",
        )

    if not description:
        raise HTTPException(
            status_code=400,
            detail="Research gap description is required.",
        )

    validate_category(
        payload.category
    )

    validate_status(
        payload.status
    )

    validate_source_paper(
        payload.source_paper_id,
        db,
    )

    gap = ResearchGap(
        title=title,
        description=description,
        category=payload.category,
        status=payload.status,
        source_paper_id=payload.source_paper_id,
        why_it_matters=(
            payload.why_it_matters.strip()
            if payload.why_it_matters
            else None
        ),
        next_step=(
            payload.next_step.strip()
            if payload.next_step
            else None
        ),
    )

    db.add(gap)
    db.commit()
    db.refresh(gap)

    gap = (
        db.query(ResearchGap)
        .options(
            joinedload(
                ResearchGap.source_paper
            )
        )
        .filter(
            ResearchGap.id == gap.id
        )
        .first()
    )

    return serialize_gap(gap)


# ============================================================
# LIST
# ============================================================

@router.get(
    "/",
    response_model=list[ResearchGapResponse],
)
def list_gaps(
    status: str | None = None,
    category: str | None = None,
    db: Session = Depends(get_db),
):

    query = (
        db.query(ResearchGap)
        .options(
            joinedload(
                ResearchGap.source_paper
            )
        )
    )

    if status:
        validate_status(status)

        query = query.filter(
            ResearchGap.status == status
        )

    if category:
        validate_category(category)

        query = query.filter(
            ResearchGap.category == category
        )

    gaps = (
        query
        .order_by(
            ResearchGap.updated_at.desc()
        )
        .all()
    )

    return [
        serialize_gap(gap)
        for gap in gaps
    ]


# ============================================================
# GET ONE
# ============================================================

@router.get(
    "/{gap_id}",
    response_model=ResearchGapResponse,
)
def get_gap(
    gap_id: int,
    db: Session = Depends(get_db),
):

    gap = (
        db.query(ResearchGap)
        .options(
            joinedload(
                ResearchGap.source_paper
            )
        )
        .filter(
            ResearchGap.id == gap_id
        )
        .first()
    )

    if not gap:
        raise HTTPException(
            status_code=404,
            detail="Research gap not found.",
        )

    return serialize_gap(gap)


# ============================================================
# UPDATE
# ============================================================

@router.put(
    "/{gap_id}",
    response_model=ResearchGapResponse,
)
def update_gap(
    gap_id: int,
    payload: ResearchGapUpdate,
    db: Session = Depends(get_db),
):

    gap = (
        db.query(ResearchGap)
        .filter(
            ResearchGap.id == gap_id
        )
        .first()
    )

    if not gap:
        raise HTTPException(
            status_code=404,
            detail="Research gap not found.",
        )

    if payload.title is not None:

        title = payload.title.strip()

        if not title:
            raise HTTPException(
                status_code=400,
                detail="Title cannot be empty.",
            )

        gap.title = title

    if payload.description is not None:

        description = (
            payload.description.strip()
        )

        if not description:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Description cannot be empty."
                ),
            )

        gap.description = description

    if payload.category is not None:

        validate_category(
            payload.category
        )

        gap.category = payload.category

    if payload.status is not None:

        validate_status(
            payload.status
        )

        gap.status = payload.status

    if payload.source_paper_id is not None:

        validate_source_paper(
            payload.source_paper_id,
            db,
        )

        gap.source_paper_id = (
            payload.source_paper_id
        )

    if payload.why_it_matters is not None:

        gap.why_it_matters = (
            payload.why_it_matters.strip()
            or None
        )

    if payload.next_step is not None:

        gap.next_step = (
            payload.next_step.strip()
            or None
        )

    db.commit()
    db.refresh(gap)

    gap = (
        db.query(ResearchGap)
        .options(
            joinedload(
                ResearchGap.source_paper
            )
        )
        .filter(
            ResearchGap.id == gap.id
        )
        .first()
    )

    return serialize_gap(gap)


# ============================================================
# DELETE
# ============================================================

@router.delete(
    "/{gap_id}",
)
def delete_gap(
    gap_id: int,
    db: Session = Depends(get_db),
):

    gap = (
        db.query(ResearchGap)
        .filter(
            ResearchGap.id == gap_id
        )
        .first()
    )

    if not gap:
        raise HTTPException(
            status_code=404,
            detail="Research gap not found.",
        )

    db.delete(gap)
    db.commit()

    return {
        "message": "Research gap deleted successfully."
    }
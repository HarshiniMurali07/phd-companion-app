from datetime import datetime

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Paper, PaperDataset
from ..schemas import (
    PaperDatasetCreate,
    PaperDatasetResponse,
    PaperDatasetUpdate,
)


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/api/datasets",
    tags=["datasets"],
)


ALLOWED_DISEASES = [
    "diabetes",
    "hypertension",
    "cvd",
    "ckd",
    "anaemia",
    "other",
]


# =========================================================
# HELPERS
# =========================================================

def clean_diseases(value: str | None) -> str | None:
    """
    Keep only known disease keys, without duplicates,
    in a fixed order.
    """

    if value is None:
        return None

    chosen = {
        part.strip().lower()
        for part in value.split(",")
        if part.strip()
    }

    return ",".join(
        key
        for key in ALLOWED_DISEASES
        if key in chosen
    )


def clean_text(value: str | None) -> str | None:
    if value is None:
        return None

    value = value.strip()

    return value or None


def to_response(
    dataset: PaperDataset,
    paper: Paper | None = None,
) -> dict:
    paper = paper or dataset.paper

    return {
        "id": dataset.id,
        "paper_id": dataset.paper_id,
        "name": dataset.name,
        "country": dataset.country,
        "sample_size": dataset.sample_size,
        "population": dataset.population,
        "diseases": dataset.diseases,
        "imaging": dataset.imaging,
        "label_definition": dataset.label_definition,
        "external_validation": dataset.external_validation,
        "access": dataset.access,
        "access_note": dataset.access_note,
        "notes": dataset.notes,
        "created_at": dataset.created_at,
        "updated_at": dataset.updated_at,
        "paper_title": paper.title if paper else None,
        "paper_year": paper.year if paper else None,
    }


def get_dataset_or_404(
    db: Session,
    dataset_id: int,
) -> PaperDataset:
    dataset = (
        db.query(PaperDataset)
        .filter(PaperDataset.id == dataset_id)
        .first()
    )

    if not dataset:
        raise HTTPException(
            status_code=404,
            detail="Dataset entry not found.",
        )

    return dataset


# =========================================================
# ALL DATASETS (for the Dataset Matrix page)
# =========================================================

@router.get(
    "/",
    response_model=list[PaperDatasetResponse],
)
def get_all_datasets(
    db: Session = Depends(get_db),
):
    rows = (
        db.query(PaperDataset, Paper)
        .join(Paper, Paper.id == PaperDataset.paper_id)
        .order_by(PaperDataset.name.asc())
        .all()
    )

    return [
        to_response(dataset, paper)
        for dataset, paper in rows
    ]


# =========================================================
# DATASETS OF ONE PAPER
# =========================================================

@router.get(
    "/paper/{paper_id}",
    response_model=list[PaperDatasetResponse],
)
def get_paper_datasets(
    paper_id: int,
    db: Session = Depends(get_db),
):
    paper = (
        db.query(Paper)
        .filter(Paper.id == paper_id)
        .first()
    )

    if not paper:
        raise HTTPException(
            status_code=404,
            detail="Paper not found.",
        )

    datasets = (
        db.query(PaperDataset)
        .filter(PaperDataset.paper_id == paper_id)
        .order_by(PaperDataset.created_at.asc())
        .all()
    )

    return [
        to_response(dataset, paper)
        for dataset in datasets
    ]


# =========================================================
# ADD A DATASET TO A PAPER
# =========================================================

@router.post(
    "/paper/{paper_id}",
    response_model=PaperDatasetResponse,
    status_code=201,
)
def create_paper_dataset(
    paper_id: int,
    data: PaperDatasetCreate,
    db: Session = Depends(get_db),
):
    paper = (
        db.query(Paper)
        .filter(Paper.id == paper_id)
        .first()
    )

    if not paper:
        raise HTTPException(
            status_code=404,
            detail="Paper not found.",
        )

    name = (data.name or "").strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Dataset name is required.",
        )

    dataset = PaperDataset(
        paper_id=paper_id,
        name=name,
        country=clean_text(data.country),
        sample_size=clean_text(data.sample_size),
        population=clean_text(data.population),
        diseases=clean_diseases(data.diseases),
        imaging=clean_text(data.imaging),
        label_definition=clean_text(data.label_definition),
        external_validation=clean_text(data.external_validation),
        access=clean_text(data.access),
        access_note=clean_text(data.access_note),
        notes=clean_text(data.notes),
    )

    db.add(dataset)
    db.commit()
    db.refresh(dataset)

    return to_response(dataset, paper)


# =========================================================
# UPDATE A DATASET ENTRY
# =========================================================

@router.put(
    "/{dataset_id}",
    response_model=PaperDatasetResponse,
)
def update_dataset(
    dataset_id: int,
    data: PaperDatasetUpdate,
    db: Session = Depends(get_db),
):
    dataset = get_dataset_or_404(db, dataset_id)

    fields = data.model_dump(exclude_unset=True)

    if "name" in fields:
        name = (fields["name"] or "").strip()

        if not name:
            raise HTTPException(
                status_code=400,
                detail="Dataset name is required.",
            )

        dataset.name = name

    if "diseases" in fields:
        dataset.diseases = clean_diseases(fields["diseases"])

    for key in (
        "country",
        "sample_size",
        "population",
        "imaging",
        "label_definition",
        "external_validation",
        "access",
        "access_note",
        "notes",
    ):
        if key in fields:
            setattr(dataset, key, clean_text(fields[key]))

    dataset.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(dataset)

    return to_response(dataset)


# =========================================================
# DELETE A DATASET ENTRY
# =========================================================

@router.delete("/{dataset_id}")
def delete_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
):
    dataset = get_dataset_or_404(db, dataset_id)

    db.delete(dataset)
    db.commit()

    return {
        "message": "Dataset entry deleted successfully.",
        "id": dataset_id,
    }

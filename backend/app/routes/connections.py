from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)
from sqlalchemy.orm import Session

from app.database import get_db

from app.models import (
    Paper,
    PaperConnection,
)

from app.schemas import (
    PaperConnectionCreate,
)


router = APIRouter(
    prefix="/api/connections",
    tags=["Paper Connections"],
)


# =========================================================
# ALLOWED RELATION TYPES
# =========================================================

ALLOWED_RELATIONS = {
    "supports",
    "extends",
    "contradicts",
    "related to",
    "uses method from",
    "compares with",
}


# =========================================================
# CREATE CONNECTION
# =========================================================

@router.post(
    "/",
    status_code=201,
)
def create_connection(
    connection_data: PaperConnectionCreate,
    db: Session = Depends(get_db),
):
    if (
        connection_data.source_paper_id
        == connection_data.target_paper_id
    ):
        raise HTTPException(
            status_code=400,
            detail="A paper cannot be connected to itself.",
        )

    relation_type = (
        connection_data.relation_type
        .strip()
        .lower()
    )

    if relation_type not in ALLOWED_RELATIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid relation type. "
                f"Allowed values: "
                f"{', '.join(sorted(ALLOWED_RELATIONS))}"
            ),
        )

    source_paper = (
        db.query(Paper)
        .filter(
            Paper.id
            == connection_data.source_paper_id
        )
        .first()
    )

    target_paper = (
        db.query(Paper)
        .filter(
            Paper.id
            == connection_data.target_paper_id
        )
        .first()
    )

    if not source_paper:
        raise HTTPException(
            status_code=404,
            detail="Source paper not found.",
        )

    if not target_paper:
        raise HTTPException(
            status_code=404,
            detail="Target paper not found.",
        )

    existing = (
        db.query(PaperConnection)
        .filter(
            PaperConnection.source_paper_id
            == connection_data.source_paper_id,
            PaperConnection.target_paper_id
            == connection_data.target_paper_id,
            PaperConnection.relation_type
            == relation_type,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="This paper connection already exists.",
        )

    connection = PaperConnection(
        source_paper_id=(
            connection_data.source_paper_id
        ),
        target_paper_id=(
            connection_data.target_paper_id
        ),
        relation_type=relation_type,
        note=connection_data.note,
    )

    db.add(connection)

    db.commit()

    db.refresh(connection)

    return {
        "id": connection.id,
        "source_paper_id": (
            connection.source_paper_id
        ),
        "target_paper_id": (
            connection.target_paper_id
        ),
        "relation_type": (
            connection.relation_type
        ),
        "note": connection.note,
        "created_at": connection.created_at,
        "source_title": source_paper.title,
        "target_title": target_paper.title,
    }


# =========================================================
# GET ALL CONNECTIONS
# =========================================================

@router.get("/")
def get_connections(
    db: Session = Depends(get_db),
):
    connections = (
        db.query(PaperConnection)
        .order_by(
            PaperConnection.created_at.desc()
        )
        .all()
    )

    response = []

    for connection in connections:
        source = (
            db.query(Paper)
            .filter(
                Paper.id
                == connection.source_paper_id
            )
            .first()
        )

        target = (
            db.query(Paper)
            .filter(
                Paper.id
                == connection.target_paper_id
            )
            .first()
        )

        if not source or not target:
            continue

        response.append(
            {
                "id": connection.id,
                "source_paper_id": (
                    connection.source_paper_id
                ),
                "target_paper_id": (
                    connection.target_paper_id
                ),
                "relation_type": (
                    connection.relation_type
                ),
                "note": connection.note,
                "created_at": connection.created_at,
                "source_title": source.title,
                "target_title": target.title,
            }
        )

    return response


# =========================================================
# GET CONNECTIONS FOR ONE PAPER
# =========================================================

@router.get(
    "/paper/{paper_id}"
)
def get_paper_connections(
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

    connections = (
        db.query(PaperConnection)
        .filter(
            (
                PaperConnection.source_paper_id
                == paper_id
            )
            |
            (
                PaperConnection.target_paper_id
                == paper_id
            )
        )
        .order_by(
            PaperConnection.created_at.desc()
        )
        .all()
    )

    response = []

    for connection in connections:
        source = (
            db.query(Paper)
            .filter(
                Paper.id
                == connection.source_paper_id
            )
            .first()
        )

        target = (
            db.query(Paper)
            .filter(
                Paper.id
                == connection.target_paper_id
            )
            .first()
        )

        if not source or not target:
            continue

        response.append(
            {
                "id": connection.id,
                "source_paper_id": (
                    connection.source_paper_id
                ),
                "target_paper_id": (
                    connection.target_paper_id
                ),
                "relation_type": (
                    connection.relation_type
                ),
                "note": connection.note,
                "created_at": connection.created_at,
                "source_title": source.title,
                "target_title": target.title,
            }
        )

    return response


# =========================================================
# DELETE CONNECTION
# =========================================================

@router.delete(
    "/{connection_id}"
)
def delete_connection(
    connection_id: int,
    db: Session = Depends(get_db),
):
    connection = (
        db.query(PaperConnection)
        .filter(
            PaperConnection.id
            == connection_id
        )
        .first()
    )

    if not connection:
        raise HTTPException(
            status_code=404,
            detail="Paper connection not found.",
        )

    db.delete(connection)

    db.commit()

    return {
        "message": "Paper connection deleted.",
        "connection_id": connection_id,
    }
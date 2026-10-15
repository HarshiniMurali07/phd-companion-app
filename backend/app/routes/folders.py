from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Folder, Paper, PaperFolder
from ..schemas import (
    FolderCreate,
    FolderResponse,
    FolderUpdate,
)


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/api/folders",
    tags=["folders"],
)


# =========================================================
# HELPERS
# =========================================================

def folder_to_response(folder: Folder) -> dict:
    return {
        "id": folder.id,
        "name": folder.name,
        "color": folder.color,
        "created_at": folder.created_at,
        "paper_ids": [
            link.paper_id
            for link in folder.paper_links
        ],
    }


def get_folder_or_404(
    db: Session,
    folder_id: int,
) -> Folder:
    folder = (
        db.query(Folder)
        .options(joinedload(Folder.paper_links))
        .filter(Folder.id == folder_id)
        .first()
    )

    if not folder:
        raise HTTPException(
            status_code=404,
            detail="Folder not found.",
        )

    return folder


def name_exists(
    db: Session,
    name: str,
    exclude_id: int | None = None,
) -> bool:
    query = db.query(Folder).filter(
        func.lower(Folder.name) == name.lower()
    )

    if exclude_id is not None:
        query = query.filter(Folder.id != exclude_id)

    return query.first() is not None


# =========================================================
# LIST FOLDERS
# =========================================================

@router.get(
    "/",
    response_model=list[FolderResponse],
)
def get_folders(
    db: Session = Depends(get_db),
):
    folders = (
        db.query(Folder)
        .options(joinedload(Folder.paper_links))
        .order_by(Folder.created_at.asc())
        .all()
    )

    return [
        folder_to_response(folder)
        for folder in folders
    ]


# =========================================================
# CREATE FOLDER
# =========================================================

@router.post(
    "/",
    response_model=FolderResponse,
    status_code=201,
)
def create_folder(
    data: FolderCreate,
    db: Session = Depends(get_db),
):
    name = data.name.strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Folder name cannot be empty.",
        )

    if name_exists(db, name):
        raise HTTPException(
            status_code=409,
            detail="A folder with this name already exists.",
        )

    folder = Folder(
        name=name,
        color=data.color or "#6366f1",
    )

    db.add(folder)
    db.commit()
    db.refresh(folder)

    return folder_to_response(folder)


# =========================================================
# RENAME / RECOLOUR FOLDER
# =========================================================

@router.put(
    "/{folder_id}",
    response_model=FolderResponse,
)
def update_folder(
    folder_id: int,
    data: FolderUpdate,
    db: Session = Depends(get_db),
):
    folder = get_folder_or_404(db, folder_id)

    if data.name is not None:
        name = data.name.strip()

        if not name:
            raise HTTPException(
                status_code=400,
                detail="Folder name cannot be empty.",
            )

        if name_exists(db, name, exclude_id=folder.id):
            raise HTTPException(
                status_code=409,
                detail="A folder with this name already exists.",
            )

        folder.name = name

    if data.color is not None:
        folder.color = data.color

    db.commit()
    db.refresh(folder)

    return folder_to_response(folder)


# =========================================================
# DELETE FOLDER (papers are NOT deleted)
# =========================================================

@router.delete("/{folder_id}")
def delete_folder(
    folder_id: int,
    db: Session = Depends(get_db),
):
    folder = get_folder_or_404(db, folder_id)

    db.delete(folder)
    db.commit()

    return {
        "message": "Folder deleted successfully.",
        "id": folder_id,
    }


# =========================================================
# ADD PAPER TO FOLDER
# =========================================================

@router.post(
    "/{folder_id}/papers/{paper_id}",
    response_model=FolderResponse,
)
def add_paper_to_folder(
    folder_id: int,
    paper_id: int,
    db: Session = Depends(get_db),
):
    folder = get_folder_or_404(db, folder_id)

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

    already_there = (
        db.query(PaperFolder)
        .filter(
            PaperFolder.folder_id == folder_id,
            PaperFolder.paper_id == paper_id,
        )
        .first()
    )

    if not already_there:
        db.add(
            PaperFolder(
                folder_id=folder_id,
                paper_id=paper_id,
            )
        )
        db.commit()

    folder = get_folder_or_404(db, folder_id)

    return folder_to_response(folder)


# =========================================================
# REMOVE PAPER FROM FOLDER
# =========================================================

@router.delete(
    "/{folder_id}/papers/{paper_id}",
    response_model=FolderResponse,
)
def remove_paper_from_folder(
    folder_id: int,
    paper_id: int,
    db: Session = Depends(get_db),
):
    folder = get_folder_or_404(db, folder_id)

    (
        db.query(PaperFolder)
        .filter(
            PaperFolder.folder_id == folder_id,
            PaperFolder.paper_id == paper_id,
        )
        .delete(synchronize_session=False)
    )

    db.commit()

    folder = get_folder_or_404(db, folder_id)

    return folder_to_response(folder)

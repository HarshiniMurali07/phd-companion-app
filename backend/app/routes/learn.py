from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    LearningTopic,
    LearningNote,
    LearningResource,
    LearningQuiz,
)
from app.schemas import (
    LearningTopicCreate,
    LearningTopicUpdate,
    LearningTopicResponse,
    LearningNoteCreate,
    LearningNoteUpdate,
    LearningNoteResponse,
    LearningResourceCreate,
    LearningResourceUpdate,
    LearningResourceResponse,
    LearningQuizCreate,
    LearningQuizUpdate,
    LearningQuizResponse,
)


router = APIRouter(
    prefix="/api/learn",
    tags=["Learn"],
)


ALLOWED_TOPIC_STATUSES = {
    "Not Started",
    "In Progress",
    "Completed",
}

ALLOWED_RESOURCE_TYPES = {
    "Paper",
    "Book",
    "Video",
    "Website",
    "Course",
    "PDF",
    "Other",
}

ALLOWED_DIFFICULTIES = {
    "Easy",
    "Medium",
    "Hard",
}


# ============================================================
# TOPICS
# ============================================================

@router.post(
    "/topics",
    response_model=LearningTopicResponse,
)
def create_topic(
    payload: LearningTopicCreate,
    db: Session = Depends(get_db),
):
    if payload.status not in ALLOWED_TOPIC_STATUSES:
        raise HTTPException(
            status_code=400,
            detail="Invalid topic status.",
        )

    topic = LearningTopic(
        title=payload.title.strip(),
        category=payload.category.strip(),
        description=payload.description,
        status=payload.status,
    )

    db.add(topic)
    db.commit()
    db.refresh(topic)

    return topic


@router.get(
    "/topics",
    response_model=list[LearningTopicResponse],
)
def get_topics(
    db: Session = Depends(get_db),
):
    return (
        db.query(LearningTopic)
        .order_by(LearningTopic.updated_at.desc())
        .all()
    )


@router.get(
    "/topics/{topic_id}",
    response_model=LearningTopicResponse,
)
def get_topic(
    topic_id: int,
    db: Session = Depends(get_db),
):
    topic = (
        db.query(LearningTopic)
        .filter(LearningTopic.id == topic_id)
        .first()
    )

    if not topic:
        raise HTTPException(
            status_code=404,
            detail="Learning topic not found.",
        )

    return topic


@router.put(
    "/topics/{topic_id}",
    response_model=LearningTopicResponse,
)
def update_topic(
    topic_id: int,
    payload: LearningTopicUpdate,
    db: Session = Depends(get_db),
):
    topic = (
        db.query(LearningTopic)
        .filter(LearningTopic.id == topic_id)
        .first()
    )

    if not topic:
        raise HTTPException(
            status_code=404,
            detail="Learning topic not found.",
        )

    update_data = payload.model_dump(
        exclude_unset=True
    )

    if "status" in update_data:
        if update_data["status"] not in ALLOWED_TOPIC_STATUSES:
            raise HTTPException(
                status_code=400,
                detail="Invalid topic status.",
            )

    if "title" in update_data:
        if not update_data["title"].strip():
            raise HTTPException(
                status_code=400,
                detail="Topic title cannot be empty.",
            )

        update_data["title"] = update_data["title"].strip()

    if "category" in update_data:
        if update_data["category"]:
            update_data["category"] = (
                update_data["category"].strip()
            )

    for field, value in update_data.items():
        setattr(topic, field, value)

    db.commit()
    db.refresh(topic)

    return topic


@router.delete(
    "/topics/{topic_id}",
)
def delete_topic(
    topic_id: int,
    db: Session = Depends(get_db),
):
    topic = (
        db.query(LearningTopic)
        .filter(LearningTopic.id == topic_id)
        .first()
    )

    if not topic:
        raise HTTPException(
            status_code=404,
            detail="Learning topic not found.",
        )

    db.delete(topic)
    db.commit()

    return {
        "message": "Learning topic deleted successfully."
    }


# ============================================================
# NOTES
# ============================================================

@router.get(
    "/topics/{topic_id}/notes",
    response_model=list[LearningNoteResponse],
)
def get_notes(
    topic_id: int,
    db: Session = Depends(get_db),
):
    topic = (
        db.query(LearningTopic)
        .filter(LearningTopic.id == topic_id)
        .first()
    )

    if not topic:
        raise HTTPException(
            status_code=404,
            detail="Learning topic not found.",
        )

    return (
        db.query(LearningNote)
        .filter(LearningNote.topic_id == topic_id)
        .order_by(LearningNote.section_order.asc())
        .all()
    )


@router.post(
    "/topics/{topic_id}/notes",
    response_model=LearningNoteResponse,
)
def create_note(
    topic_id: int,
    payload: LearningNoteCreate,
    db: Session = Depends(get_db),
):
    topic = (
        db.query(LearningTopic)
        .filter(LearningTopic.id == topic_id)
        .first()
    )

    if not topic:
        raise HTTPException(
            status_code=404,
            detail="Learning topic not found.",
        )

    if not payload.section.strip():
        raise HTTPException(
            status_code=400,
            detail="Note section cannot be empty.",
        )

    if not payload.content.strip():
        raise HTTPException(
            status_code=400,
            detail="Note content cannot be empty.",
        )

    note = LearningNote(
        topic_id=topic_id,
        section=payload.section.strip(),
        content=payload.content,
        section_order=payload.section_order,
    )

    db.add(note)
    db.commit()
    db.refresh(note)

    return note


@router.put(
    "/notes/{note_id}",
    response_model=LearningNoteResponse,
)
def update_note(
    note_id: int,
    payload: LearningNoteUpdate,
    db: Session = Depends(get_db),
):
    note = (
        db.query(LearningNote)
        .filter(LearningNote.id == note_id)
        .first()
    )

    if not note:
        raise HTTPException(
            status_code=404,
            detail="Learning note not found.",
        )

    update_data = payload.model_dump(
        exclude_unset=True
    )

    if "section" in update_data:
        if not update_data["section"].strip():
            raise HTTPException(
                status_code=400,
                detail="Note section cannot be empty.",
            )

        update_data["section"] = (
            update_data["section"].strip()
        )

    if "content" in update_data:
        if not update_data["content"].strip():
            raise HTTPException(
                status_code=400,
                detail="Note content cannot be empty.",
            )

    for field, value in update_data.items():
        setattr(note, field, value)

    db.commit()
    db.refresh(note)

    return note


@router.delete(
    "/notes/{note_id}",
)
def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
):
    note = (
        db.query(LearningNote)
        .filter(LearningNote.id == note_id)
        .first()
    )

    if not note:
        raise HTTPException(
            status_code=404,
            detail="Learning note not found.",
        )

    db.delete(note)
    db.commit()

    return {
        "message": "Learning note deleted successfully."
    }


# ============================================================
# RESOURCES
# ============================================================

@router.get(
    "/topics/{topic_id}/resources",
    response_model=list[LearningResourceResponse],
)
def get_resources(
    topic_id: int,
    db: Session = Depends(get_db),
):
    topic = (
        db.query(LearningTopic)
        .filter(LearningTopic.id == topic_id)
        .first()
    )

    if not topic:
        raise HTTPException(
            status_code=404,
            detail="Learning topic not found.",
        )

    return (
        db.query(LearningResource)
        .filter(
            LearningResource.topic_id == topic_id
        )
        .order_by(
            LearningResource.created_at.desc()
        )
        .all()
    )


@router.post(
    "/topics/{topic_id}/resources",
    response_model=LearningResourceResponse,
)
def create_resource(
    topic_id: int,
    payload: LearningResourceCreate,
    db: Session = Depends(get_db),
):
    topic = (
        db.query(LearningTopic)
        .filter(LearningTopic.id == topic_id)
        .first()
    )

    if not topic:
        raise HTTPException(
            status_code=404,
            detail="Learning topic not found.",
        )

    if payload.resource_type not in ALLOWED_RESOURCE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid resource type.",
        )

    if not payload.title.strip():
        raise HTTPException(
            status_code=400,
            detail="Resource title cannot be empty.",
        )

    resource = LearningResource(
        topic_id=topic_id,
        title=payload.title.strip(),
        url=payload.url,
        resource_type=payload.resource_type,
        notes=payload.notes,
    )

    db.add(resource)
    db.commit()
    db.refresh(resource)

    return resource


@router.put(
    "/resources/{resource_id}",
    response_model=LearningResourceResponse,
)
def update_resource(
    resource_id: int,
    payload: LearningResourceUpdate,
    db: Session = Depends(get_db),
):
    resource = (
        db.query(LearningResource)
        .filter(
            LearningResource.id == resource_id
        )
        .first()
    )

    if not resource:
        raise HTTPException(
            status_code=404,
            detail="Learning resource not found.",
        )

    update_data = payload.model_dump(
        exclude_unset=True
    )

    if "resource_type" in update_data:
        if (
            update_data["resource_type"]
            not in ALLOWED_RESOURCE_TYPES
        ):
            raise HTTPException(
                status_code=400,
                detail="Invalid resource type.",
            )

    if "title" in update_data:
        if not update_data["title"].strip():
            raise HTTPException(
                status_code=400,
                detail="Resource title cannot be empty.",
            )

        update_data["title"] = (
            update_data["title"].strip()
        )

    for field, value in update_data.items():
        setattr(resource, field, value)

    db.commit()
    db.refresh(resource)

    return resource


@router.delete(
    "/resources/{resource_id}",
)
def delete_resource(
    resource_id: int,
    db: Session = Depends(get_db),
):
    resource = (
        db.query(LearningResource)
        .filter(
            LearningResource.id == resource_id
        )
        .first()
    )

    if not resource:
        raise HTTPException(
            status_code=404,
            detail="Learning resource not found.",
        )

    db.delete(resource)
    db.commit()

    return {
        "message": "Learning resource deleted successfully."
    }


# ============================================================
# QUIZ
# ============================================================

@router.get(
    "/topics/{topic_id}/quizzes",
    response_model=list[LearningQuizResponse],
)
def get_quizzes(
    topic_id: int,
    db: Session = Depends(get_db),
):
    topic = (
        db.query(LearningTopic)
        .filter(LearningTopic.id == topic_id)
        .first()
    )

    if not topic:
        raise HTTPException(
            status_code=404,
            detail="Learning topic not found.",
        )

    return (
        db.query(LearningQuiz)
        .filter(
            LearningQuiz.topic_id == topic_id
        )
        .order_by(
            LearningQuiz.created_at.asc()
        )
        .all()
    )


@router.post(
    "/topics/{topic_id}/quizzes",
    response_model=LearningQuizResponse,
)
def create_quiz(
    topic_id: int,
    payload: LearningQuizCreate,
    db: Session = Depends(get_db),
):
    topic = (
        db.query(LearningTopic)
        .filter(LearningTopic.id == topic_id)
        .first()
    )

    if not topic:
        raise HTTPException(
            status_code=404,
            detail="Learning topic not found.",
        )

    if not payload.question.strip():
        raise HTTPException(
            status_code=400,
            detail="Quiz question cannot be empty.",
        )

    if not payload.answer.strip():
        raise HTTPException(
            status_code=400,
            detail="Quiz answer cannot be empty.",
        )

    if payload.difficulty not in ALLOWED_DIFFICULTIES:
        raise HTTPException(
            status_code=400,
            detail="Invalid quiz difficulty.",
        )

    quiz = LearningQuiz(
        topic_id=topic_id,
        question=payload.question,
        answer=payload.answer,
        difficulty=payload.difficulty,
    )

    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    return quiz


@router.put(
    "/quizzes/{quiz_id}",
    response_model=LearningQuizResponse,
)
def update_quiz(
    quiz_id: int,
    payload: LearningQuizUpdate,
    db: Session = Depends(get_db),
):
    quiz = (
        db.query(LearningQuiz)
        .filter(LearningQuiz.id == quiz_id)
        .first()
    )

    if not quiz:
        raise HTTPException(
            status_code=404,
            detail="Learning quiz not found.",
        )

    update_data = payload.model_dump(
        exclude_unset=True
    )

    if "question" in update_data:
        if not update_data["question"].strip():
            raise HTTPException(
                status_code=400,
                detail="Quiz question cannot be empty.",
            )

    if "answer" in update_data:
        if not update_data["answer"].strip():
            raise HTTPException(
                status_code=400,
                detail="Quiz answer cannot be empty.",
            )

    if "difficulty" in update_data:
        if (
            update_data["difficulty"]
            not in ALLOWED_DIFFICULTIES
        ):
            raise HTTPException(
                status_code=400,
                detail="Invalid quiz difficulty.",
            )

    for field, value in update_data.items():
        setattr(quiz, field, value)

    db.commit()
    db.refresh(quiz)

    return quiz


@router.delete(
    "/quizzes/{quiz_id}",
)
def delete_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
):
    quiz = (
        db.query(LearningQuiz)
        .filter(
            LearningQuiz.id == quiz_id
        )
        .first()
    )

    if not quiz:
        raise HTTPException(
            status_code=404,
            detail="Learning quiz not found.",
        )

    db.delete(quiz)
    db.commit()

    return {
        "message": "Learning quiz deleted successfully."
    }
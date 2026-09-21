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
    Experiment,
)
from ..schemas import (
    ExperimentCreate,
    ExperimentUpdate,
    ExperimentResponse,
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/experiments",
    tags=["experiments"],
)


# ============================================================
# ALLOWED VALUES
# ============================================================

ALLOWED_STATUSES = {
    "Planned",
    "Running",
    "Completed",
    "Paused",
    "Failed",
}

ALLOWED_TYPES = {
    "Baseline",
    "Ablation",
    "Comparison",
    "Prototype",
    "Evaluation",
    "Validation",
    "Other",
}


# ============================================================
# SERIALIZER
# ============================================================

def serialize_experiment(
    experiment: Experiment,
) -> ExperimentResponse:

    return ExperimentResponse(
        id=experiment.id,
        name=experiment.name,
        objective=experiment.objective,
        hypothesis=experiment.hypothesis,
        experiment_type=experiment.experiment_type,
        status=experiment.status,
        dataset=experiment.dataset,
        model=experiment.model,
        metric_name=experiment.metric_name,
        metric_value=experiment.metric_value,
        results=experiment.results,
        conclusion=experiment.conclusion,
        next_step=experiment.next_step,
        source_paper_id=experiment.source_paper_id,
        created_at=experiment.created_at,
        updated_at=experiment.updated_at,
        source_title=(
            experiment.source_paper.title
            if experiment.source_paper
            else None
        ),
    )


# ============================================================
# VALIDATION
# ============================================================

def validate_status(status: str):
    if status not in ALLOWED_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid experiment status. "
                "Allowed values: "
                + ", ".join(
                    sorted(ALLOWED_STATUSES)
                )
            ),
        )


def validate_type(experiment_type: str):
    if experiment_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid experiment type. "
                "Allowed values: "
                + ", ".join(
                    sorted(ALLOWED_TYPES)
                )
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
    response_model=ExperimentResponse,
)
def create_experiment(
    payload: ExperimentCreate,
    db: Session = Depends(get_db),
):

    name = payload.name.strip()
    objective = payload.objective.strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Experiment name is required.",
        )

    if not objective:
        raise HTTPException(
            status_code=400,
            detail="Experiment objective is required.",
        )

    validate_status(
        payload.status
    )

    validate_type(
        payload.experiment_type
    )

    validate_source_paper(
        payload.source_paper_id,
        db,
    )

    experiment = Experiment(
        name=name,
        objective=objective,
        hypothesis=(
            payload.hypothesis.strip()
            if payload.hypothesis
            else None
        ),
        experiment_type=(
            payload.experiment_type
        ),
        status=payload.status,
        dataset=(
            payload.dataset.strip()
            if payload.dataset
            else None
        ),
        model=(
            payload.model.strip()
            if payload.model
            else None
        ),
        metric_name=(
            payload.metric_name.strip()
            if payload.metric_name
            else None
        ),
        metric_value=(
            payload.metric_value.strip()
            if payload.metric_value
            else None
        ),
        results=(
            payload.results.strip()
            if payload.results
            else None
        ),
        conclusion=(
            payload.conclusion.strip()
            if payload.conclusion
            else None
        ),
        next_step=(
            payload.next_step.strip()
            if payload.next_step
            else None
        ),
        source_paper_id=(
            payload.source_paper_id
        ),
    )

    db.add(experiment)
    db.commit()
    db.refresh(experiment)

    experiment = (
        db.query(Experiment)
        .options(
            joinedload(
                Experiment.source_paper
            )
        )
        .filter(
            Experiment.id == experiment.id
        )
        .first()
    )

    return serialize_experiment(
        experiment
    )


# ============================================================
# LIST
# ============================================================

@router.get(
    "/",
    response_model=list[ExperimentResponse],
)
def list_experiments(
    status: str | None = None,
    experiment_type: str | None = None,
    db: Session = Depends(get_db),
):

    query = (
        db.query(Experiment)
        .options(
            joinedload(
                Experiment.source_paper
            )
        )
    )

    if status:
        validate_status(status)

        query = query.filter(
            Experiment.status == status
        )

    if experiment_type:
        validate_type(
            experiment_type
        )

        query = query.filter(
            Experiment.experiment_type
            == experiment_type
        )

    experiments = (
        query
        .order_by(
            Experiment.updated_at.desc()
        )
        .all()
    )

    return [
        serialize_experiment(
            experiment
        )
        for experiment in experiments
    ]


# ============================================================
# GET ONE
# ============================================================

@router.get(
    "/{experiment_id}",
    response_model=ExperimentResponse,
)
def get_experiment(
    experiment_id: int,
    db: Session = Depends(get_db),
):

    experiment = (
        db.query(Experiment)
        .options(
            joinedload(
                Experiment.source_paper
            )
        )
        .filter(
            Experiment.id == experiment_id
        )
        .first()
    )

    if not experiment:
        raise HTTPException(
            status_code=404,
            detail="Experiment not found.",
        )

    return serialize_experiment(
        experiment
    )


# ============================================================
# UPDATE
# ============================================================

@router.put(
    "/{experiment_id}",
    response_model=ExperimentResponse,
)
def update_experiment(
    experiment_id: int,
    payload: ExperimentUpdate,
    db: Session = Depends(get_db),
):

    experiment = (
        db.query(Experiment)
        .filter(
            Experiment.id == experiment_id
        )
        .first()
    )

    if not experiment:
        raise HTTPException(
            status_code=404,
            detail="Experiment not found.",
        )

    if payload.name is not None:

        name = payload.name.strip()

        if not name:
            raise HTTPException(
                status_code=400,
                detail="Experiment name cannot be empty.",
            )

        experiment.name = name

    if payload.objective is not None:

        objective = (
            payload.objective.strip()
        )

        if not objective:
            raise HTTPException(
                status_code=400,
                detail="Experiment objective cannot be empty.",
            )

        experiment.objective = objective

    if payload.hypothesis is not None:

        experiment.hypothesis = (
            payload.hypothesis.strip()
            or None
        )

    if payload.experiment_type is not None:

        validate_type(
            payload.experiment_type
        )

        experiment.experiment_type = (
            payload.experiment_type
        )

    if payload.status is not None:

        validate_status(
            payload.status
        )

        experiment.status = (
            payload.status
        )

    if payload.dataset is not None:

        experiment.dataset = (
            payload.dataset.strip()
            or None
        )

    if payload.model is not None:

        experiment.model = (
            payload.model.strip()
            or None
        )

    if payload.metric_name is not None:

        experiment.metric_name = (
            payload.metric_name.strip()
            or None
        )

    if payload.metric_value is not None:

        experiment.metric_value = (
            payload.metric_value.strip()
            or None
        )

    if payload.results is not None:

        experiment.results = (
            payload.results.strip()
            or None
        )

    if payload.conclusion is not None:

        experiment.conclusion = (
            payload.conclusion.strip()
            or None
        )

    if payload.next_step is not None:

        experiment.next_step = (
            payload.next_step.strip()
            or None
        )

    if payload.source_paper_id is not None:

        validate_source_paper(
            payload.source_paper_id,
            db,
        )

        experiment.source_paper_id = (
            payload.source_paper_id
        )

    db.commit()
    db.refresh(experiment)

    experiment = (
        db.query(Experiment)
        .options(
            joinedload(
                Experiment.source_paper
            )
        )
        .filter(
            Experiment.id == experiment.id
        )
        .first()
    )

    return serialize_experiment(
        experiment
    )


# ============================================================
# DELETE
# ============================================================

@router.delete(
    "/{experiment_id}",
)
def delete_experiment(
    experiment_id: int,
    db: Session = Depends(get_db),
):

    experiment = (
        db.query(Experiment)
        .filter(
            Experiment.id == experiment_id
        )
        .first()
    )

    if not experiment:
        raise HTTPException(
            status_code=404,
            detail="Experiment not found.",
        )

    db.delete(experiment)
    db.commit()

    return {
        "message": "Experiment deleted successfully."
    }
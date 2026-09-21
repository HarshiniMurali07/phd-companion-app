from datetime import datetime

from pydantic import BaseModel, ConfigDict


# =========================================================
# PAPER SECTION
# =========================================================

class PaperSectionResponse(BaseModel):
    id: int
    title: str
    section_order: int
    content: str | None = None

    model_config = ConfigDict(
        from_attributes=True
    )


# =========================================================
# PAPER
# =========================================================

class PaperCreate(BaseModel):
    title: str
    authors: str | None = None
    year: int | None = None
    journal: str | None = None
    abstract: str | None = None
    full_text: str | None = None
    file_path: str | None = None

    status: str = "To Read"

    progress: int = 0

    tags: str | None = None


class PaperNotesUpdate(BaseModel):
    notes: str | None = None
    research_problem: str | None = None
    methodology_notes: str | None = None
    key_findings: str | None = None
    research_gap: str | None = None
    limitations: str | None = None
    relevance: str | None = None
    personal_thoughts: str | None = None


class PaperTrackerUpdate(BaseModel):
    status: str | None = None
    progress: int | None = None
    tags: str | None = None


class PaperResponse(PaperCreate):
    id: int

    created_at: datetime

    updated_at: datetime | None = None

    notes: str | None = None
    research_problem: str | None = None
    methodology_notes: str | None = None
    key_findings: str | None = None
    research_gap: str | None = None
    limitations: str | None = None
    relevance: str | None = None
    personal_thoughts: str | None = None

    sections: list[PaperSectionResponse] = []

    model_config = ConfigDict(
        from_attributes=True
    )


# =========================================================
# PAPER CONNECTION
# =========================================================

class PaperConnectionCreate(BaseModel):
    source_paper_id: int
    target_paper_id: int
    relation_type: str
    note: str | None = None


class PaperConnectionResponse(BaseModel):
    id: int

    source_paper_id: int
    target_paper_id: int

    relation_type: str

    note: str | None = None

    created_at: datetime

    source_title: str
    target_title: str

    model_config = ConfigDict(
        from_attributes=True
    )


# =========================================================
# RESEARCH GAPS
# =========================================================

class ResearchGapCreate(BaseModel):
    title: str
    description: str
    category: str = "Other"
    status: str = "Open"
    source_paper_id: int | None = None
    why_it_matters: str | None = None
    next_step: str | None = None


class ResearchGapUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    category: str | None = None
    status: str | None = None
    source_paper_id: int | None = None
    why_it_matters: str | None = None
    next_step: str | None = None


class ResearchGapResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    status: str
    source_paper_id: int | None = None
    why_it_matters: str | None = None
    next_step: str | None = None
    created_at: datetime
    updated_at: datetime
    source_title: str | None = None

    model_config = ConfigDict(
        from_attributes=True
    )


# =========================================================
# EXPERIMENTS
# =========================================================

class ExperimentCreate(BaseModel):
    name: str
    objective: str
    hypothesis: str | None = None
    experiment_type: str = "Other"
    status: str = "Planned"
    dataset: str | None = None
    model: str | None = None
    metric_name: str | None = None
    metric_value: str | None = None
    results: str | None = None
    conclusion: str | None = None
    next_step: str | None = None
    source_paper_id: int | None = None


class ExperimentUpdate(BaseModel):
    name: str | None = None
    objective: str | None = None
    hypothesis: str | None = None
    experiment_type: str | None = None
    status: str | None = None
    dataset: str | None = None
    model: str | None = None
    metric_name: str | None = None
    metric_value: str | None = None
    results: str | None = None
    conclusion: str | None = None
    next_step: str | None = None
    source_paper_id: int | None = None


class ExperimentResponse(BaseModel):
    id: int
    name: str
    objective: str
    hypothesis: str | None = None
    experiment_type: str
    status: str
    dataset: str | None = None
    model: str | None = None
    metric_name: str | None = None
    metric_value: str | None = None
    results: str | None = None
    conclusion: str | None = None
    next_step: str | None = None
    source_paper_id: int | None = None
    created_at: datetime
    updated_at: datetime
    source_title: str | None = None

    model_config = ConfigDict(
        from_attributes=True
    )


# =========================================================
# LEARN - TOPICS
# =========================================================

class LearningTopicCreate(BaseModel):
    title: str
    category: str = "Other"
    description: str | None = None
    status: str = "Not Started"


class LearningTopicUpdate(BaseModel):
    title: str | None = None
    category: str | None = None
    description: str | None = None
    status: str | None = None


class LearningTopicResponse(BaseModel):
    id: int
    title: str
    category: str
    description: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime

    notes: list["LearningNoteResponse"] = []
    resources: list["LearningResourceResponse"] = []
    quizzes: list["LearningQuizResponse"] = []

    model_config = ConfigDict(
        from_attributes=True
    )


# =========================================================
# LEARN - NOTES
# =========================================================

class LearningNoteCreate(BaseModel):
    section: str
    content: str
    section_order: int = 0


class LearningNoteUpdate(BaseModel):
    section: str | None = None
    content: str | None = None
    section_order: int | None = None


class LearningNoteResponse(BaseModel):
    id: int
    topic_id: int
    section: str
    content: str
    section_order: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


# =========================================================
# LEARN - RESOURCES
# =========================================================

class LearningResourceCreate(BaseModel):
    title: str
    url: str | None = None
    resource_type: str = "Other"
    notes: str | None = None


class LearningResourceUpdate(BaseModel):
    title: str | None = None
    url: str | None = None
    resource_type: str | None = None
    notes: str | None = None


class LearningResourceResponse(BaseModel):
    id: int
    topic_id: int
    title: str
    url: str | None = None
    resource_type: str
    notes: str | None = None
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


# =========================================================
# LEARN - QUIZZES
# =========================================================

class LearningQuizCreate(BaseModel):
    question: str
    answer: str
    difficulty: str = "Medium"


class LearningQuizUpdate(BaseModel):
    question: str | None = None
    answer: str | None = None
    difficulty: str | None = None


class LearningQuizResponse(BaseModel):
    id: int
    topic_id: int
    question: str
    answer: str
    difficulty: str
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )
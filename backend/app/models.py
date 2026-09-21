from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)

from sqlalchemy.orm import relationship

from .database import Base


# =========================================================
# PAPER
# =========================================================

class Paper(Base):
    __tablename__ = "papers"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    title = Column(
        String(500),
        nullable=False,
    )

    authors = Column(
        Text,
        nullable=True,
    )

    year = Column(
        Integer,
        nullable=True,
    )

    journal = Column(
        String(300),
        nullable=True,
    )

    abstract = Column(
        Text,
        nullable=True,
    )

    full_text = Column(
        Text,
        nullable=True,
    )

    file_path = Column(
        String(1000),
        nullable=True,
    )

    status = Column(
        String(50),
        default="To Read",
    )

    progress = Column(
        Integer,
        default=0,
    )

    tags = Column(
        Text,
        nullable=True,
    )

    # -----------------------------------------------------
    # PERSONAL NOTES
    # -----------------------------------------------------

    notes = Column(
        Text,
        nullable=True,
    )

    research_problem = Column(
        Text,
        nullable=True,
    )

    methodology_notes = Column(
        Text,
        nullable=True,
    )

    key_findings = Column(
        Text,
        nullable=True,
    )

    research_gap = Column(
        Text,
        nullable=True,
    )

    limitations = Column(
        Text,
        nullable=True,
    )

    relevance = Column(
        Text,
        nullable=True,
    )

    personal_thoughts = Column(
        Text,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    # -----------------------------------------------------
    # EXTRACTED SECTIONS
    # -----------------------------------------------------

    sections = relationship(
        "PaperSection",
        back_populates="paper",
        cascade="all, delete-orphan",
        order_by="PaperSection.section_order",
    )


# =========================================================
# PAPER SECTION
# =========================================================

class PaperSection(Base):
    __tablename__ = "paper_sections"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    paper_id = Column(
        Integer,
        ForeignKey(
            "papers.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    title = Column(
        String(300),
        nullable=False,
    )

    section_order = Column(
        Integer,
        nullable=False,
        default=0,
    )

    content = Column(
        Text,
        nullable=True,
    )

    paper = relationship(
        "Paper",
        back_populates="sections",
    )


# =========================================================
# PAPER CONNECTION
# =========================================================

class PaperConnection(Base):
    __tablename__ = "paper_connections"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    source_paper_id = Column(
        Integer,
        ForeignKey(
            "papers.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    target_paper_id = Column(
        Integer,
        ForeignKey(
            "papers.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    relation_type = Column(
        String(100),
        nullable=False,
    )

    note = Column(
        Text,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    source_paper = relationship(
        "Paper",
        foreign_keys=[source_paper_id],
    )

    target_paper = relationship(
        "Paper",
        foreign_keys=[target_paper_id],
    )


# =========================================================
# RESEARCH GAPS
# =========================================================

class ResearchGap(Base):
    __tablename__ = "research_gaps"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    title = Column(
        String(255),
        nullable=False,
    )

    description = Column(
        Text,
        nullable=False,
    )

    category = Column(
        String(100),
        nullable=False,
        default="Other",
    )

    status = Column(
        String(100),
        nullable=False,
        default="Open",
    )

    source_paper_id = Column(
        Integer,
        ForeignKey(
            "papers.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    why_it_matters = Column(
        Text,
        nullable=True,
    )

    next_step = Column(
        Text,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    source_paper = relationship(
        "Paper",
        foreign_keys=[source_paper_id],
    )


# =========================================================
# EXPERIMENTS
# =========================================================

class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String(255),
        nullable=False,
    )

    objective = Column(
        Text,
        nullable=False,
    )

    hypothesis = Column(
        Text,
        nullable=True,
    )

    experiment_type = Column(
        String(100),
        nullable=False,
        default="Other",
    )

    status = Column(
        String(100),
        nullable=False,
        default="Planned",
    )

    dataset = Column(
        String(255),
        nullable=True,
    )

    model = Column(
        String(255),
        nullable=True,
    )

    metric_name = Column(
        String(100),
        nullable=True,
    )

    metric_value = Column(
        String(100),
        nullable=True,
    )

    results = Column(
        Text,
        nullable=True,
    )

    conclusion = Column(
        Text,
        nullable=True,
    )

    next_step = Column(
        Text,
        nullable=True,
    )

    source_paper_id = Column(
        Integer,
        ForeignKey(
            "papers.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    source_paper = relationship(
        "Paper",
        foreign_keys=[source_paper_id],
    )


# =========================================================
# LEARNING TOPICS
# =========================================================

class LearningTopic(Base):
    __tablename__ = "learning_topics"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    title = Column(
        String(255),
        nullable=False,
    )

    category = Column(
        String(100),
        nullable=False,
        default="Other",
    )

    description = Column(
        Text,
        nullable=True,
    )

    status = Column(
        String(100),
        nullable=False,
        default="Not Started",
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    notes = relationship(
        "LearningNote",
        back_populates="topic",
        cascade="all, delete-orphan",
        order_by="LearningNote.section_order",
    )

    resources = relationship(
        "LearningResource",
        back_populates="topic",
        cascade="all, delete-orphan",
        order_by="LearningResource.created_at",
    )

    quizzes = relationship(
        "LearningQuiz",
        back_populates="topic",
        cascade="all, delete-orphan",
        order_by="LearningQuiz.created_at",
    )


# =========================================================
# LEARNING NOTES
# =========================================================

class LearningNote(Base):
    __tablename__ = "learning_notes"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    topic_id = Column(
        Integer,
        ForeignKey(
            "learning_topics.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    section = Column(
        String(100),
        nullable=False,
    )

    content = Column(
        Text,
        nullable=False,
    )

    section_order = Column(
        Integer,
        nullable=False,
        default=0,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    topic = relationship(
        "LearningTopic",
        back_populates="notes",
    )


# =========================================================
# LEARNING RESOURCES
# =========================================================

class LearningResource(Base):
    __tablename__ = "learning_resources"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    topic_id = Column(
        Integer,
        ForeignKey(
            "learning_topics.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    title = Column(
        String(255),
        nullable=False,
    )

    url = Column(
        Text,
        nullable=True,
    )

    resource_type = Column(
        String(100),
        nullable=False,
        default="Other",
    )

    notes = Column(
        Text,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    topic = relationship(
        "LearningTopic",
        back_populates="resources",
    )


# =========================================================
# LEARNING QUIZZES
# =========================================================

class LearningQuiz(Base):
    __tablename__ = "learning_quizzes"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    topic_id = Column(
        Integer,
        ForeignKey(
            "learning_topics.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    question = Column(
        Text,
        nullable=False,
    )

    answer = Column(
        Text,
        nullable=False,
    )

    difficulty = Column(
        String(50),
        nullable=False,
        default="Medium",
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    topic = relationship(
        "LearningTopic",
        back_populates="quizzes",
    )
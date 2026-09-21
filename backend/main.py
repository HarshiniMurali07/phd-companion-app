from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import (
    Base,
    engine,
)

from app import models

from app.routes import (
    papers,
    research,
    connections,
    gaps,
    experiments,
    learn,
)


# =========================================================
# DATABASE
# =========================================================

Base.metadata.create_all(
    bind=engine
)


# =========================================================
# APP
# =========================================================

app = FastAPI(
    title="PhD Companion API",
    description=(
        "Backend API for the PhD Companion "
        "research and learning application."
    ),
    version="1.0.0",
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# ROUTES
# =========================================================

app.include_router(
    papers.router
)

app.include_router(
    research.router
)

app.include_router(
    connections.router
)
app.include_router(
    gaps.router
)
app.include_router(
    experiments.router
)

app.include_router(
    learn.router
)

# =========================================================
# ROOT
# =========================================================
 
@app.get("/")
def root():
    return {
        "message": "PhD Companion API is running",
        "status": "success",
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "PhD Companion API",
    }
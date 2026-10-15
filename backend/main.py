import os

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.database import (
    Base,
    engine,
)

from app import models
from app.security import verify_api_key

from app.routes import (
    papers,
    research,
    connections,
    gaps,
    experiments,
    learn,
    folders,
    datasets,
)


# =========================================================
# DATABASE
# =========================================================

# Only needed when you add a NEW table: set RUN_CREATE_ALL=1 in Vercel once.
if os.getenv("RUN_CREATE_ALL") == "1":
    Base.metadata.create_all(bind=engine)


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
        "http://localhost:5174",
        "https://phd-companion-app.vercel.app",
        "https://phd-companion-74mwdwypy-harshinimurali07.vercel.app",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# ROUTES (all protected by the API key)
# =========================================================

protected = [Depends(verify_api_key)]

app.include_router(papers.router, dependencies=protected)
app.include_router(research.router, dependencies=protected)
app.include_router(connections.router, dependencies=protected)
app.include_router(gaps.router, dependencies=protected)
app.include_router(experiments.router, dependencies=protected)
app.include_router(learn.router, dependencies=protected)
app.include_router(folders.router, dependencies=protected)
app.include_router(datasets.router, dependencies=protected)


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

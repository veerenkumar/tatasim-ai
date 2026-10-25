"""
Main FastAPI Application Entrypoint for TataSim AI.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.api.endpoints import router as api_router
from app.services.seeder import init_db_and_seed

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema and seed preset scenarios on startup
    init_db_and_seed()
    yield

app = FastAPI(
    title="TataSim AI — What-If Business Simulator",
    description="Operational decision-support and scenario simulation platform for Tata Motors Limited.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration restricted to frontend origins
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

@app.get("/")
def root():
    return {
        "app": "TataSim AI — What-If Business Simulator",
        "company": "Tata Motors Limited (Illustrative Simulation)",
        "docs_url": "/docs",
        "api_health": "/api/health"
    }

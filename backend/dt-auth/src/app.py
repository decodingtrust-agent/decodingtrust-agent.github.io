from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routes import auth_router

app = FastAPI(
    title="DecodingTrust Agent Auth API",
    description="Authentication service for DecodingTrust Agent Suite",
    version="1.0.0",
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://decodingtrust-agent.github.io",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "DecodingTrust Agent Auth API", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}

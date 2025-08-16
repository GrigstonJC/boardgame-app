from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Boardgame App API",
    description="API for remote boardgame playing",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "Welcome to the Boardgame App!",
        "status": "running",
        "version": "1.0.0",
    }

@app.get("/api/info")
async def get_app_info():
    return {
        "app_name": "Boardgame App",
        "description": "Play boardgames with friends remotely",
        "authentication": "Google OAuth required for game access",
    }

@app.get("/api/protected")
async def protected_endpoint():
    # TODO: Add authentication check here
    return {
        "message": "This will be protected by authentication",
        "data": "Secret game data goes here",
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

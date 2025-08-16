import os
import secrets
from datetime import datetime
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

load_dotenv()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
SECRET_KEY = os.getenv("SECRET_KEY")
ALLOWED_EMAILS = os.getenv("ALLOWED_EMAILS", "").split(",")

if not all([GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SECRET_KEY]):
    raise ValueError("Missing required environment variables. Check your .env file.")


OAUTH_REDIRECT_URI = "http://localhost:8000/auth/callback"
SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
]

user_sessions = {}


app = FastAPI(
    title="Boardgame App API",
    description="API for remote boardgame playing with Google OAuth",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def verify_google_token(token: str) -> dict:
    """Verify Google ID token and return user info"""
    try:
        idinfo = id_token.verify_oauth2_token(
            token, 
            google_requests.Request(), 
            GOOGLE_CLIENT_ID,
        )
        
        user_email = idinfo.get("email")
        if user_email not in ALLOWED_EMAILS:
            raise HTTPException(
                status_code=403, 
                detail=f"Email {user_email} is not authorized",
            )
        
        return idinfo

    except ValueError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

def get_current_user(request: Request) -> dict:
    """Get current authenticated user"""
    authorization = request.headers.get("Authorization")
    if authorization:
        try:
            scheme, token = authorization.split()
            if scheme.lower() == "bearer":
                return verify_google_token(token)
        except (ValueError, HTTPException):
            pass
    
    session_id = request.cookies.get("session_id")
    if session_id and session_id in user_sessions:
        session_data = user_sessions[session_id]
        
        try:
            google_token = session_data.get("google_token")
            if google_token:
                return verify_google_token(google_token)
        except HTTPException:
            del user_sessions[session_id]
    
    raise HTTPException(status_code=401, detail="Not authenticated")


@app.get("/")
async def root():
    return {
        "message": "Welcome to the Boardgame App!",
        "status": "running",
        "version": "1.0.0",
        "authentication": "Google OAuth enabled",
    }

@app.get("/api/info")
async def get_app_info():
    return {
        "app_name": "Boardgame App",
        "description": "Play boardgames with friends remotely",
        "authentication": "Google OAuth required for game access",
        "allowed_emails": len(ALLOWED_EMAILS),
    }

@app.get("/auth/login")
async def login():
    """Initiate Google OAuth login"""
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [OAUTH_REDIRECT_URI],
            },
        },
        scopes=SCOPES,
    )
    flow.redirect_uri = OAUTH_REDIRECT_URI
    
    authorization_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
    )
    
    return {
        "authorization_url": authorization_url,
        "state": state,
    }

@app.get("/auth/callback")
async def auth_callback(request: Request):
    """Handle Google OAuth callback"""
    code = request.query_params.get("code")
    
    if not code:
        raise HTTPException(status_code=400, detail="Authorization code not provided")
    
    try:
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [OAUTH_REDIRECT_URI],
                },
            },
            scopes=SCOPES,
        )
        flow.redirect_uri = OAUTH_REDIRECT_URI
        
        flow.fetch_token(code=code)
        credentials = flow.credentials
        
        user_info = verify_google_token(credentials.id_token)
        
        session_id = secrets.token_urlsafe(32)
        user_sessions[session_id] = {
            "email": user_info["email"],
            "name": user_info["name"],
            "picture": user_info.get("picture"),
            "google_token": credentials.id_token,
            "authenticated_at": datetime.utcnow().isoformat(),
        }
        
        frontend_url = (
            f"http://localhost:5173/auth/success?token="
            f"{credentials.id_token}&session={session_id}"
        )
        return RedirectResponse(url=frontend_url)
        
    except Exception as e:
        print(f"OAuth error: {e}")
        raise HTTPException(status_code=400, detail=f"Authentication failed: {str(e)}")

@app.get("/auth/user")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user information"""
    return {
        "email": current_user["email"],
        "name": current_user["name"],
        "picture": current_user.get("picture"),
        "authenticated": True,
        "token_issuer": "Google",
    }

@app.post("/auth/logout")
async def logout(request: Request):
    """Logout user"""
    session_id = request.cookies.get("session_id")
    if session_id and session_id in user_sessions:
        del user_sessions[session_id]
    
    return {"message": "Logged out successfully"}

@app.get("/api/protected")
async def protected_endpoint(current_user: dict = Depends(get_current_user)):
    return {
        "message": f"Hello {current_user['name']}! You have access to the game.",
        "data": "This is secret game data that only authenticated users can see",
        "user_email": current_user["email"],
        "game_access": True,
        "auth_method": "Google OAuth2",
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "auth_configured": bool(GOOGLE_CLIENT_ID),
        "auth_method": "Google OAuth2 ID Tokens",
    }

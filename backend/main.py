from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .login import database
from . import routes

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    database.init_db()

app.include_router(routes.router)

@app.get("/")
def read_root():
    return {"message": "Sistema de Autenticación Facial"}
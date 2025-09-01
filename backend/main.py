#import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .login import database
from . import routes
from . import dengue_routes  # Usamos la importación relativa correcta

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

# Incluye ambos routers en tu aplicación.
# Cada uno manejará un conjunto de rutas diferente.
app.include_router(routes.router)
app.include_router(dengue_routes.dengue_router)

@app.get("/")
def read_root():
    return {"message": "Sistema de Autenticación Facial y Predicción de Dengue"}
from fastapi import APIRouter, HTTPException, Depends
from .login import database, face_utils, auth, models
from .login.schemas import RegisterRequest, LoginRequest, LoginResponse, MetricsResponse, AdminSetupRequest
from typing import List
import traceback

router = APIRouter()

@router.post("/setup-admin")
async def setup_admin(request: AdminSetupRequest):
    """Configura el embedding del admin por primera vez"""
    try:
        print(f"=== ADMIN SETUP DEBUG ===")
        print(f"Received embedding with {len(request.embedding)} elements")
        print(f"First 5 elements: {request.embedding[:5]}")
        print(f"Embedding type: {type(request.embedding[0])}")

        if not request.embedding:
            print("ERROR: Empty embedding received")
            raise HTTPException(status_code=400, detail="Embedding vacío")

        if len(request.embedding) != 128:
            print(f"ERROR: Invalid embedding size: {len(request.embedding)}")
            raise HTTPException(status_code=400, detail=f"Tamaño de embedding incorrecto: {len(request.embedding)}, se esperaba 128")

        invalid_values = [i for i, val in enumerate(request.embedding) if not isinstance(val, (int, float)) or not (-10 <= val <= 10)]
        if invalid_values:
            print(f"ERROR: Invalid values at indices: {invalid_values[:10]}")
            raise HTTPException(status_code=400, detail="Embedding contiene valores inválidos")

        print("Embedding validation passed, normalizing...")
        normalized_embedding = face_utils.normalize_embedding(request.embedding)
        print(f"Normalized embedding length: {len(normalized_embedding)}")
        print(f"Normalized first 5: {normalized_embedding[:5]}")

        if not face_utils.validate_embedding_size(normalized_embedding):
            print("ERROR: Normalized embedding size validation failed")
            raise HTTPException(status_code=400, detail="Tamaño de embedding normalizado inválido")

        print("Updating admin embedding in database...")
        success = database.update_admin_embedding("admin", normalized_embedding)
        print(f"Database update result: {success}")

        if not success:
            print("ERROR: Failed to update admin embedding in database")
            raise HTTPException(status_code=400, detail="Error configurando administrador en base de datos")

        print("Loading model data...")
        models.model.load_data()
        print("Training model...")
        train_result = models.model.train()
        print(f"Training result: {train_result}")

        print("Creating access token...")
        token = auth.create_access_token({"sub": "admin"})
        print("Admin setup completed successfully")

        return {"message": "Administrador configurado exitosamente", "token": token}

    except HTTPException as he:
        print(f"HTTP Exception: {he.detail}")
        raise he
    except Exception as e:
        print(f"Unexpected error in admin setup: {str(e)}")
        print(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    try:
        print(f"Login attempt with embedding length: {len(request.embedding)}")
        
        if len(request.embedding) != 128:
            raise HTTPException(status_code=400, detail=f"Tamaño de embedding incorrecto: {len(request.embedding)}")

        normalized_embedding = face_utils.normalize_embedding(request.embedding)

        if not face_utils.validate_embedding_size(normalized_embedding):
            raise HTTPException(status_code=400, detail="Tamaño de embedding inválido")

        print("Loading model data before prediction...")
        models.model.load_data()
        
        if len(models.model.embeddings) > 0:
            print("Training model...")
            models.model.train()
        else:
            print("No embeddings loaded, cannot proceed with login")
            raise HTTPException(status_code=401, detail="Sistema no inicializado correctamente")

        user_name = models.model.predict(normalized_embedding)

        if not user_name:
            raise HTTPException(status_code=401, detail="Autenticación fallida")

        token = auth.create_access_token({"sub": user_name})
        return {"token": token, "nombre": user_name}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {str(e)}")
        print(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.post("/register")
async def register(request: RegisterRequest, token: str = Depends(auth.get_current_user)):
    try:
        print(f"Registration attempt for {request.nombre} with embedding length: {len(request.embedding)}")

        if not auth.is_admin(token):
            raise HTTPException(status_code=403, detail="Se requieren privilegios de administrador")

        if len(request.embedding) != 128:
            raise HTTPException(status_code=400, detail=f"Tamaño de embedding incorrecto: {len(request.embedding)}")

        normalized_embedding = face_utils.normalize_embedding(request.embedding)

        if not face_utils.validate_embedding_size(normalized_embedding):
            raise HTTPException(status_code=400, detail="Tamaño de embedding inválido")

        success = database.save_user(request.nombre, normalized_embedding)

        if not success:
            raise HTTPException(status_code=400, detail="El usuario ya existe o error en base de datos")

        models.model.load_data()
        models.model.train()

        return {"message": "Usuario registrado exitosamente"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Registration error: {str(e)}")
        print(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.get("/check-admin")
async def check_admin():
    """Verifica si el admin ya está configurado"""
    try:
        print("Checking admin status...")
        admin_user = database.get_user_by_name("admin")
        if admin_user:
            print(f"Admin user found: {admin_user.nombre}")
            admin_embedding = [0.0] * 128
            current_embedding = eval(admin_user.embedding) if isinstance(admin_user.embedding, str) else admin_user.embedding
            is_configured = current_embedding != admin_embedding
            print(f"Admin configured: {is_configured}")
            return {"admin_configured": is_configured}

        print("No admin user found")
        return {"admin_configured": False}

    except Exception as e:
        print(f"Check admin error: {str(e)}")
        return {"admin_configured": False}

@router.get("/metrics", response_model=MetricsResponse)
async def get_metrics():
    try:
        users = database.get_all_users()
        user_count = len(users)
        users_by_day = []

        for user in users:
            users_by_day.append({
                "date": user.created_at.strftime("%Y-%m-%d") if user.created_at else "desconocido",
                "count": 1
            })

        return {
            "accuracy": 0.95,
            "users_by_day": users_by_day
        }

    except Exception as e:
        print(f"Metrics error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")
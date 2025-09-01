from fastapi import APIRouter, HTTPException
from .login import database, face_utils, models
from .login.schemas import RegisterRequest, LoginRequest, LoginResponse, MetricsResponse, AdminSetupRequest
import traceback

router = APIRouter()

@router.post("/setup-admin")
async def setup_admin(request: AdminSetupRequest):
    """Configura el embedding del admin por primera vez"""
    try:
        print(f"=== ADMIN SETUP DEBUG ===")
        print(f"Received embedding with {len(request.embedding)} elements")

        if not request.embedding:
            raise HTTPException(status_code=400, detail="Embedding vacío")

        if len(request.embedding) != 128:
            raise HTTPException(status_code=400, detail=f"Tamaño de embedding incorrecto: {len(request.embedding)}, se esperaba 128")

        normalized_embedding = face_utils.normalize_embedding(request.embedding)

        if not face_utils.validate_embedding_size(normalized_embedding):
            raise HTTPException(status_code=400, detail="Tamaño de embedding normalizado inválido")

        success = database.update_admin_embedding("admin", normalized_embedding)
        if not success:
            raise HTTPException(status_code=400, detail="Error configurando administrador en base de datos")

        models.model.load_data()
        models.model.train()

        return {"message": "Administrador configurado exitosamente"}

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Unexpected error in admin setup: {str(e)}")
        print(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    try:
        if len(request.embedding) != 128:
            raise HTTPException(status_code=400, detail=f"Tamaño de embedding incorrecto: {len(request.embedding)}")

        normalized_embedding = face_utils.normalize_embedding(request.embedding)

        if not face_utils.validate_embedding_size(normalized_embedding):
            raise HTTPException(status_code=400, detail="Tamaño de embedding inválido")

        models.model.load_data()
        if len(models.model.embeddings) > 0:
            models.model.train()
        else:
            raise HTTPException(status_code=401, detail="Sistema no inicializado correctamente")

        user_name = models.model.predict(normalized_embedding)

        if not user_name:
            raise HTTPException(status_code=401, detail="Autenticación fallida")

        return {"token": "FAKE_TOKEN", "nombre": user_name}  # ajusta si usas JWT

    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.post("/register")
async def register(request: RegisterRequest):
    """Registro público de usuarios (no requiere token)"""
    try:
        print(f"Registration attempt for {request.nombre} with embedding length: {len(request.embedding)}")

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
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/check-admin")
async def check_admin():
    """Verifica si el admin ya está configurado"""
    try:
        admin_user = database.get_user_by_name("admin")
        if admin_user:
            admin_embedding = [0.0] * 128
            current_embedding = eval(admin_user.embedding) if isinstance(admin_user.embedding, str) else admin_user.embedding
            is_configured = current_embedding != admin_embedding
            return {"admin_configured": is_configured}

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

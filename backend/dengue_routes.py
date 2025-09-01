import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any

# Importa las funciones y modelos desde la ubicación correcta
from .models import dengue_prediction

# Crea un nuevo router para los endpoints de predicción
dengue_router = APIRouter()

# Variables globales para los modelos y el DataFrame.
models = {}
df = None

async def load_and_train_models():
    """
    Carga los datos y entrena los modelos al iniciar el servidor.
    """
    global models, df
    try:
        data_file_path = os.path.join(os.path.dirname(__file__), 'data', 'dengue_data.csv')
        print(f"Intentando cargar el archivo de datos desde: {data_file_path}")
        df = dengue_prediction.load_data(data_file_path)
        if df is None:
            raise RuntimeError("No se pudo cargar el archivo CSV. Asegúrate de que esté en 'backend/data/dengue_data.csv'.")
        
        print("Entrenando modelos...")
        models["severity"] = dengue_prediction.train_severity_model(df)
        models["outbreak"] = dengue_prediction.train_outbreak_model(df)
        models["trend"] = dengue_prediction.train_trend_model(df)
        print("Modelos listos para las predicciones.")
    except Exception as e:
        print(f"Error al cargar o entrenar los modelos: {e}")

# Define el modelo de datos para la solicitud POST
class PredictionRequest(BaseModel):
    prediction_type: str
    input_data: Dict[str, Any]

@dengue_router.post("/dengue/predict")
async def get_dengue_prediction(request_data: PredictionRequest):
    """
    Recibe la petición del frontend y retorna la predicción solicitada.
    """
    global models
    # Carga los modelos si no han sido cargados
    if not models:
        await load_and_train_models()
        if not models:
            raise HTTPException(status_code=500, detail="Los modelos no se pudieron cargar. Por favor, revisa el log del servidor.")
            
    prediction_type = request_data.prediction_type
    input_data = request_data.input_data
    
    try:
        if prediction_type == "severity":
            result = dengue_prediction.predict_diagnosis_severity(models["severity"], input_data, df)
        elif prediction_type == "outbreak":
            result = dengue_prediction.predict_outbreak_risk(models["outbreak"], input_data, df)
        elif prediction_type == "trend":
            result = dengue_prediction.predict_case_count(models["trend"], input_data)
        else:
            raise HTTPException(status_code=400, detail="Tipo de predicción no válido.")
        
        return {"prediction": result}
    
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Faltan datos de entrada requeridos: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en el servidor: {str(e)}")

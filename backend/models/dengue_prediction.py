import pandas as pd
import numpy as np
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import tensorflow.keras as keras

# Diccionario global para almacenar los LabelEncoders y el OneHotEncoder
label_encoders = {}
one_hot_encoder = None
diagnosticos_clases = []

def load_data(path):
    """
    Carga y preprocesa el archivo CSV.
    Realiza la codificación de variables categóricas.
    """
    global label_encoders, diagnosticos_clases
    try:
        df = pd.read_csv(path, sep=';')
    except FileNotFoundError:
        print(f"Error: No se encontró el archivo '{os.path.basename(path)}' en la ruta '{os.path.dirname(path)}'.")
        return None
    
    # Copia la columna 'diagnostic' para usarla como etiquetas
    df['diagnostic_label'] = df['diagnostic']
    
    # Codifica las variables categóricas con LabelEncoder
    for col in ['departamento', 'provincia', 'distrito', 'enfermedad', 'tipo_dx', 'diresa', 'tipo_edad', 'sexo']:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        label_encoders[col] = le
    
    # Codifica la columna 'diagnostic' para la clasificación multiclase
    le_diagnostic = LabelEncoder()
    df['diagnostic_label'] = le_diagnostic.fit_transform(df['diagnostic_label'].astype(str))
    diagnosticos_clases = le_diagnostic.classes_
    label_encoders['diagnostic_label'] = le_diagnostic
    
    return df

# --- PREDICCIÓN 1: SEVERIDAD DEL DIAGNÓSTICO (CLASIFICACIÓN MULTICLASE) ---
def train_severity_model(df):
    """
    Entrena un modelo para predecir la severidad del diagnóstico.
    """
    global one_hot_encoder
    y = pd.get_dummies(df['diagnostic_label'])
    
    X = df.drop(['diagnostic', 'diagnostic_label'], axis=1)
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
    
    model = keras.Sequential([
        keras.layers.Input(shape=(X.shape[1],)),
        keras.layers.Dense(128, activation='relu'),
        keras.layers.Dense(64, activation='relu'),
        keras.layers.Dense(y.shape[1], activation='softmax')
    ])
    
    model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
    model.fit(X_train, y_train, epochs=10, batch_size=32, verbose=0, validation_data=(X_test, y_test))
    return model

def predict_diagnosis_severity(model, input_data, df):
    """
    Hace una predicción de la severidad del diagnóstico.
    """
    try:
        input_df = pd.DataFrame([input_data])
        for col in input_df.columns:
            if col in label_encoders and col in ['departamento', 'provincia', 'distrito', 'enfermedad', 'tipo_dx', 'diresa', 'tipo_edad', 'sexo']:
                input_df[col] = label_encoders[col].transform(input_df[col].astype(str))

        columnas_entrenamiento = df.drop(['diagnostic', 'diagnostic_label'], axis=1).columns
        input_df = input_df.reindex(columns=columnas_entrenamiento, fill_value=0)
        
        prediccion_probabilidades = model.predict(input_df, verbose=0)
        prediccion_clase_index = prediccion_probabilidades.argmax(axis=1)[0]
        clase_predicha = diagnosticos_clases[prediccion_clase_index]
        
        return f"Clase predicha: {clase_predicha} (con una probabilidad de {prediccion_probabilidades[0][prediccion_clase_index]*100:.2f}%)"
    except Exception as e:
        return f"Error en la predicción: {str(e)}"

# --- PREDICCIÓN 2: RIESGO DE BROTE (CLASIFICACIÓN BINARIA) ---
def train_outbreak_model(df):
    """
    Entrena un modelo para predecir si un caso es positivo o negativo.
    """
    X = df.drop(['diagnostic', 'diagnostic_label'], axis=1)
    # Define la etiqueta: es un caso positivo (>0) o no
    y = (df['diagnostic'] > 0).astype(int)
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
    
    model = keras.Sequential([
        keras.layers.Input(shape=(X.shape[1],)),
        keras.layers.Dense(64, activation='relu'),
        keras.layers.Dense(32, activation='relu'),
        keras.layers.Dense(1, activation='sigmoid') # Capa final con activación sigmoide para clasificación binaria
    ])
    
    model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    model.fit(X_train, y_train, epochs=10, batch_size=32, verbose=0, validation_data=(X_test, y_test))
    return model

def predict_outbreak_risk(model, input_data, df):
    """
    Hace una predicción del riesgo de brote (positivo o negativo).
    """
    try:
        input_df = pd.DataFrame([input_data])
        for col in input_df.columns:
            if col in label_encoders and col in ['departamento', 'provincia', 'distrito', 'enfermedad', 'tipo_dx', 'diresa', 'tipo_edad', 'sexo']:
                input_df[col] = label_encoders[col].transform(input_df[col].astype(str))
        
        columnas_entrenamiento = df.drop(['diagnostic', 'diagnostic_label'], axis=1).columns
        input_df = input_df.reindex(columns=columnas_entrenamiento, fill_value=0)
        
        prediccion = model.predict(input_df, verbose=0)[0][0]
        
        return f"El resultado de la predicción es: {'Positive' if prediccion > 0.5 else 'Negative'} (Probabilidad: {prediccion*100:.2f}%)"
    except Exception as e:
        return f"Error en la predicción: {str(e)}"

# --- PREDICCIÓN 3: ANÁLISIS DE TENDENCIAS A CORTO PLAZO (REGRESIÓN) ---
def train_trend_model(df):
    """
    Entrena un modelo para predecir el número de casos.
    """
    # Agrupa por semana y distrito para contar los casos
    df_trend = df.groupby(['distrito', 'semana']).size().reset_index(name='casos')
    df_trend['distrito'] = label_encoders['distrito'].transform(df_trend['distrito'].astype(str))
    
    # Define X e Y para la regresión
    X = df_trend[['distrito', 'semana']]
    y = df_trend['casos']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
    
    model = keras.Sequential([
        keras.layers.Input(shape=(X.shape[1],)),
        keras.layers.Dense(64, activation='relu'),
        keras.layers.Dense(32, activation='relu'),
        keras.layers.Dense(1, activation='relu') # Capa final con activación relu para regresión
    ])
    
    model.compile(optimizer='adam', loss='mean_squared_error')
    model.fit(X_train, y_train, epochs=10, batch_size=32, verbose=0, validation_data=(X_test, y_test))
    return model

def predict_case_count(model, input_data):
    """
    Hace una predicción del número de casos.
    """
    try:
        distrito_codificado = label_encoders['distrito'].transform([input_data['distrito']])[0]
        input_df = pd.DataFrame([{'distrito': distrito_codificado, 'semana': input_data['semana']}])
        
        prediccion = model.predict(input_df, verbose=0)[0][0]
        return f"Se esperan {int(round(prediccion))} casos en el distrito '{input_data['distrito']}' en la semana {input_data['semana']}."
    except Exception as e:
        return f"Error en la predicción: {str(e)}"

# --- Código principal que ejecuta las predicciones ---
if __name__ == "__main__":
    # La ruta del archivo para pruebas locales
    data_file_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'dengue_data.csv')
    
    df = load_data(data_file_path)
    if df is None:
        print("Error: No se encontró el archivo 'dengue_data.csv' en la carpeta 'data'.")
    else:
        print("Entrenando modelos...")
        modelo_severidad = train_severity_model(df)
        modelo_brote = train_outbreak_model(df)
        modelo_tendencia = train_trend_model(df)
        print("Modelos listos para recibir peticiones.")
        
        # Aquí puedes probar cada predicción individualmente
        # NOTA: Asegúrate de que los campos de entrada sean los correctos
        # para cada tipo de predicción.

        # Ejemplo de datos para la predicción de severidad/riesgo
        datos_entrada_caso = {
            'departamento': 'LIMA',
            'provincia': 'LIMA',
            'distrito': 'ATE',
            'enfermedad': 'DENGUE SIN SIGNOS DE ALARMA',
            'ano': 2023,
            'semana': 35,
            'tipo_dx': 'CASO DESCARTADO',
            'diresa': 'LIMA',
            'ubigeo': 150103,
            'edad': 28,
            'tipo_edad': 'AÑOS',
            'sexo': 'FEMENINO'
        }

        # Ejemplo de datos para la predicción de tendencia
        datos_entrada_tendencia = {
            'distrito': 'ATE',
            'semana': 36
        }

        # --- Prueba de las 3 predicciones ---
        print("\n--- Resultado de la Predicción de Severidad ---")
        resultado_severidad = predict_diagnosis_severity(modelo_severidad, datos_entrada_caso, df)
        print(resultado_severidad)

        print("\n--- Resultado de la Predicción de Riesgo ---")
        resultado_riesgo = predict_outbreak_risk(modelo_brote, datos_entrada_caso, df)
        print(resultado_riesgo)

        print("\n--- Resultado de la Predicción de Tendencia ---")
        resultado_tendencia = predict_case_count(modelo_tendencia, datos_entrada_tendencia)
        print(resultado_tendencia)
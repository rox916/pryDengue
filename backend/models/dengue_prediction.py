import pandas as pd
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

# Diccionario global para almacenar los LabelEncoders de cada columna
label_encoders = {}

def load_data(path):
    global label_encoders
    df = pd.read_csv(path, sep=';')
    # Preprocess: Encode categoricals
    for col in ['departamento', 'provincia', 'distrito', 'enfermedad', 'tipo_dx', 'diresa', 'tipo_edad', 'sexo']:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        label_encoders[col] = le  # Guardar el encoder para cada columna
    return df

def train_model(df):
    X = df.drop('diagnostic', axis=1)  # Features
    y = df['diagnostic'] > 0  # Binary: positivo
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
    
    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(X.shape[1],)),
        tf.keras.layers.Dense(64, activation='relu'),
        tf.keras.layers.Dense(32, activation='relu'),
        tf.keras.layers.Dense(1, activation='sigmoid')
    ])
    model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    model.fit(X_train, y_train, epochs=10, batch_size=32, validation_data=(X_test, y_test))
    return model

def predict_disease(model, input_data, df):
    try:
        # Convert input to DataFrame
        input_df = pd.DataFrame([input_data])
        # Encode categoricals using saved LabelEncoders
        for col in ['departamento', 'provincia', 'distrito', 'enfermedad', 'tipo_dx', 'diresa', 'tipo_edad', 'sexo']:
            if col not in input_data:
                return f"Error: Falta la columna {col} en los datos de entrada"
            if col in label_encoders:
                try:
                    input_df[col] = label_encoders[col].transform(input_df[col].astype(str))
                except ValueError as e:
                    return f"Error: Valor desconocido en {col}: {str(e)}"
            else:
                return f"Error: No se encontró el encoder para la columna {col}"
        # Ensure all columns match training data
        input_df = input_df[df.drop('diagnostic', axis=1).columns]
        pred = model.predict(input_df)[0][0]
        return 'Positive' if pred > 0.5 else 'Negative'
    except Exception as e:
        return f"Error en la predicción: {str(e)}"
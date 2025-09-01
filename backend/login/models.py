import numpy as np
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
import joblib
import json
from typing import List, Optional
from .database import get_all_users
from .face_utils import cosine_similarity

class FacialAuthModel:
    def __init__(self):
        self.model = Pipeline([
            ('scaler', StandardScaler()),
            ('svc', SVC(probability=True, kernel='linear', C=1.0))
        ])
        self.labels = []
        self.embeddings = []
        self.threshold = 0.6

    def load_data(self):
        users = get_all_users()
        self.labels = []
        self.embeddings = []

        for user in users:
            try:
                embedding = json.loads(user.embedding) if isinstance(user.embedding, str) else user.embedding
                if embedding and len(embedding) >= 128:
                    valid_embedding = [float(x) for x in embedding[:128]]
                    if not any(np.isnan(valid_embedding)) and not any(np.isinf(valid_embedding)):
                        if not all(x == 0.0 for x in valid_embedding):
                            self.embeddings.append(valid_embedding)
                            self.labels.append(user.nombre)
                            print(f"Loaded user: {user.nombre} with valid embedding")
                        else:
                            print(f"Skipping user {user.nombre}: default embedding (all zeros)")
                    else:
                        print(f"Invalid embedding for user {user.nombre}: contains NaN or Inf")
                else:
                    print(f"Invalid embedding size for user {user.nombre}: {len(embedding) if embedding else 0}")
            except Exception as e:
                print(f"Error loading user {user.nombre}: {e}")

        print(f"Total valid embeddings loaded: {len(self.embeddings)}")

    def train(self):
        if len(self.embeddings) == 0:
            print("No embeddings to train with")
            return False

        if len(self.embeddings) == 1:
            print("Only one user detected - using direct comparison mode")
            return True

        if len(self.embeddings) < 2:
            print("Need at least 2 users to train the model")
            return False

        try:
            X = np.array(self.embeddings, dtype=np.float32)
            y = np.array(self.labels)

            if len(np.unique(y)) < 2:
                print("Need at least 2 different users to train")
                return False

            self.model.fit(X, y)
            print(f"Model trained successfully with {len(X)} samples and {len(np.unique(y))} classes")
            return True

        except Exception as e:
            print(f"Error training model: {e}")
            return False

    def predict(self, embedding: List[float]) -> Optional[str]:
        if len(self.embeddings) == 0:
            print("No data available")
            return None

        try:
            if len(embedding) < 128:
                print(f"Embedding too short: {len(embedding)}")
                return None

            input_embedding = embedding[:128]
            if any(np.isnan(input_embedding)) or any(np.isinf(input_embedding)):
                print("Invalid embedding: contains NaN or Inf")
                return None

            if len(self.embeddings) == 1:
                similarity = cosine_similarity(input_embedding, self.embeddings[0])
                print(f"Direct comparison similarity: {similarity}")
                
                if similarity >= self.threshold:
                    print(f"Predicted user: {self.labels[0]} with similarity {similarity}")
                    return self.labels[0]
                else:
                    print(f"Similarity too low: {similarity} < {self.threshold}")
                    return None

            if not hasattr(self.model, 'classes_'):
                print("Model not trained")
                return None

            X = np.array(input_embedding, dtype=np.float32).reshape(1, -1)
            
            proba = self.model.predict_proba(X)[0]
            max_proba = np.max(proba)
            print(f"Prediction probability: {max_proba}")

            if max_proba < self.threshold:
                print(f"Probability too low: {max_proba} < {self.threshold}")
                return None

            predicted_user = self.model.predict(X)[0]
            print(f"Predicted user: {predicted_user} with probability {max_proba}")
            return predicted_user

        except Exception as e:
            print(f"Error in prediction: {e}")
            return None

    def save_model(self, path: str = 'facial_model.pkl'):
        try:
            joblib.dump(self.model, path)
            return True
        except Exception as e:
            print(f"Error saving model: {e}")
            return False

    def load_model(self, path: str = 'facial_model.pkl'):
        try:
            self.model = joblib.load(path)
            return True
        except Exception as e:
            print(f"Error loading model: {e}")
            return False

model = FacialAuthModel()
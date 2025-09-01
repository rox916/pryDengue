import sqlite3
import json
import numpy as np
from typing import List, Optional
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import func

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False, unique=True)
    embedding = Column(Text, nullable=False)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())

SQLALCHEMY_DATABASE_URL = "sqlite:///./facial_auth.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)
    create_default_admin()

def create_default_admin():
    """Crea un administrador por defecto si no existe ningún admin"""
    db = SessionLocal()
    try:
        admin_exists = db.query(User).filter(User.is_admin == True).first()
        
        if not admin_exists:
            default_embedding = [0.0] * 128
            admin_user = User(
                nombre="admin",
                embedding=json.dumps(default_embedding),
                is_admin=True
            )
            db.add(admin_user)
            db.commit()
            print("Admin por defecto creado: usuario 'admin'")
    except Exception as e:
        print(f"Error creando admin por defecto: {e}")
        db.rollback()
    finally:
        db.close()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def save_user(nombre: str, embedding: List[float], is_admin: bool = False):
    from sqlalchemy.orm import Session
    db = SessionLocal()
    try:
        existing_user = db.query(User).filter(User.nombre == nombre).first()
        if existing_user:
            return False
        
        if not embedding or len(embedding) < 128:
            print(f"Invalid embedding for user {nombre}")
            return False
        
        valid_embedding = []
        for i in range(128):
            if i < len(embedding):
                val = float(embedding[i])
                if np.isnan(val) or np.isinf(val):
                    val = 0.0
                valid_embedding.append(val)
            else:
                valid_embedding.append(0.0)
        
        user = User(
            nombre=nombre,
            embedding=json.dumps(valid_embedding),
            is_admin=is_admin
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"User {nombre} saved successfully with valid embedding")
        return True
    except Exception as e:
        print(f"Error saving user {nombre}: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def get_user_by_name(name: str):
    from sqlalchemy.orm import Session
    db = SessionLocal()
    try:
        return db.query(User).filter(User.nombre == name).first()
    finally:
        db.close()

def get_all_users():
    from sqlalchemy.orm import Session
    db = SessionLocal()
    try:
        return db.query(User).all()
    finally:
        db.close()

def get_user_count():
    from sqlalchemy.orm import Session
    db = SessionLocal()
    try:
        return db.query(User).count()
    finally:
        db.close()

def update_admin_embedding(nombre: str, embedding: List[float]):
    """Actualiza el embedding del admin"""
    from sqlalchemy.orm import Session
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.nombre == nombre, User.is_admin == True).first()
        if user:
            if not embedding or len(embedding) < 128:
                print(f"Invalid embedding for admin update")
                return False
            
            valid_embedding = []
            for i in range(128):
                if i < len(embedding):
                    val = float(embedding[i])
                    if np.isnan(val) or np.isinf(val):
                        val = 0.0
                    valid_embedding.append(val)
                else:
                    valid_embedding.append(0.0)
            
            user.embedding = json.dumps(valid_embedding)
            db.commit()
            print(f"Admin embedding updated successfully")
            return True
        
        print("Admin user not found")
        return False
    except Exception as e:
        print(f"Error updating admin embedding: {e}")
        db.rollback()
        return False
    finally:
        db.close()
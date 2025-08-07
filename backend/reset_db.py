"""
Script pour réinitialiser la base de données
"""
from app.database import Base, engine


def reset_database():
    """Drop toutes les tables et les recrée"""
    print("Suppression de toutes les tables...")
    Base.metadata.drop_all(bind=engine)
    
    print("Création de toutes les tables...")
    Base.metadata.create_all(bind=engine)
    
    print("Base de données réinitialisée avec succès!")

if __name__ == "__main__":
    reset_database()
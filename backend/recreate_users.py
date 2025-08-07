"""
Script pour recréer les utilisateurs avec des mots de passe correctement hachés
"""
from sqlalchemy.orm import sessionmaker
from app.database import engine
from app.models.user import User
from app.utils.auth import hash_password

def recreate_users():
    """
    Supprime et recrée les utilisateurs avec des mots de passe correctement hachés
    """
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        # Supprimer les utilisateurs existants
        db.query(User).delete()
        db.commit()
        print("🗑️  Utilisateurs existants supprimés")
        
        # Créer les nouveaux utilisateurs avec des mots de passe hachés
        users_data = [
            {
                "name": "Lelouche Amted",
                "email": "leloucheamted@gmail.com",
                "password": "123456",
                "is_admin": True
            },
            {
                "name": "Cabraule Ketchanga", 
                "email": "cabrauleketchanga@gmail.com",
                "password": "123456",
                "is_admin": False
            },
            {
                "name": "Test User",
                "email": "user1@example.com", 
                "password": "123456",
                "is_admin": False
            }
        ]
        
        created_users = []
        for user_data in users_data:
            user = User(
                name=user_data["name"],
                email=user_data["email"],
                hashed_password=hash_password(user_data["password"]),
                is_admin=user_data["is_admin"]
            )
            created_users.append(user)
        
        db.add_all(created_users)
        db.commit()
        
        print("✅ Utilisateurs recréés avec succès!")
        print("\n📝 Vous pouvez maintenant vous connecter avec:")
        for user_data in users_data:
            role = "Admin" if user_data["is_admin"] else "User"
            print(f"   - {user_data['email']} / {user_data['password']} ({role})")
            
    except Exception as e:
        db.rollback()
        print(f"❌ Erreur lors de la recréation: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    recreate_users()
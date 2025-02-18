from database import engine, SessionLocal
import models
from auth import get_password_hash

def init_db():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    admin = db.query(models.User).filter(models.User.username == "superadmin").first()
    if not admin:
        branch = models.Branch(
            name="Main Branch",
            address="Main Address"
        )
        db.add(branch)
        db.commit()
        
        superadmin = models.User(
            username="superadmin",
            email="superadmin@example.com",
            hashed_password=get_password_hash("12345"),  
            role=models.UserRole.SUPERADMIN,
            branch_id=branch.id
        )
        db.add(superadmin)
        db.commit()
        print("Superadmin yaratildi!")
        
        Admin = models.User(
            username="admin7",
            email="admin@gmail.com",
            hashed_password=get_password_hash("123456"),
            role=models.UserRole.ADMIN,
            branch_id=branch.id
        )
        db.add(Admin)
        db.commit()
        print("Admin yaratildi!")

    db.close()

if __name__ == "__main__":
    init_db()
    print("Database yaratildi!")

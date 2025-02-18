from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import SessionLocal, engine
import models, schemas, auth
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from jose import JWTError, jwt

app = FastAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
async def get_current_user(
    token: str = Depends(auth.oauth2_scheme),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

@app.post("/token")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/users/", response_model=schemas.User)
async def create_user(
    user: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if user.role == models.UserRole.SUPERADMIN and current_user.role != models.UserRole.SUPERADMIN:
        raise HTTPException(status_code=403, detail="Only superadmin can create superadmin")
    if user.role == models.UserRole.ADMIN and current_user.role not in [models.UserRole.SUPERADMIN]:
        raise HTTPException(status_code=403, detail="Only superadmin can create admin")
    if current_user.role == models.UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Teachers cannot create users")
    
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=auth.get_password_hash(user.password),
        role=user.role,
        branch_id=user.branch_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/users/", response_model=List[schemas.User])
async def read_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role == models.UserRole.SUPERADMIN:
        users = db.query(models.User).all()
    elif current_user.role == models.UserRole.ADMIN:
        users = db.query(models.User).filter(models.User.branch_id == current_user.branch_id).all()
    elif current_user.role == models.UserRole.TEACHER:
        student_users = db.query(models.User).\
            join(models.Student).\
            join(models.Group).\
            filter(models.Group.teacher_id == current_user.id).all()
        return student_users
    else:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return users

@app.get("/groups/")
async def read_groups(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role == models.UserRole.SUPERADMIN:
        groups = db.query(models.Group).all()
    elif current_user.role == models.UserRole.ADMIN:
        groups = db.query(models.Group).filter(models.Group.branch_id == current_user.branch_id).all()
    elif current_user.role == models.UserRole.TEACHER:
        groups = db.query(models.Group).filter(models.Group.teacher_id == current_user.id).all()
    else:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return groups

@app.post("/students/", response_model=schemas.Student)
async def create_student(
    student: schemas.StudentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(
            status_code=403, 
            detail="Only Admin can create students. Superadmin and Teachers are not authorized to create students"
        )
    
    group = db.query(models.Group).filter(models.Group.id == student.group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if group.branch_id != current_user.branch_id:
        raise HTTPException(
            status_code=403, 
            detail="You can only add students to groups in your branch"
        )
    user = models.User(
        username=student.username,
        hashed_password=auth.get_password_hash(student.password),
        role="Student",
        branch_id=current_user.branch_id
    )
    db.add(user)
    db.commit()
    db_student = models.Student(
        user_id=user.id,
        group_id=student.group_id
    )
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

@app.put("/students/{student_id}")
async def update_student(
    student_id: int,
    student_update: schemas.StudentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    if current_user.role == models.UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Teachers cannot update students")
    
    for field, value in student_update.dict(exclude_unset=True).items():
        setattr(db_student, field, value)
    
    db.commit()
    return {"message": "Student updated successfully"}
@app.post("/groups/", response_model=schemas.Group)
async def create_group(
    group: schemas.GroupCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.SUPERADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized to create groups")
    
    db_group = models.Group(
        name=group.name,
        branch_id=current_user.branch_id,
        teacher_id=group.teacher_id
    )
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    return db_group

@app.get("/groups/{group_id}/students")
async def read_group_students(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if current_user.role == models.UserRole.TEACHER and group.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    students = db.query(models.Student).filter(models.Student.group_id == group_id).all()
    return students

@app.put("/groups/{group_id}")
async def update_group(
    group_id: int,
    group_update: schemas.GroupUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.SUPERADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized to update groups")
    
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    for field, value in group_update.dict(exclude_unset=True).items():
        setattr(group, field, value)
    
    db.commit()
    return {"message": "Group updated successfully"}
@app.post("/branches/", response_model=schemas.Branch)
async def create_branch(
    branch: schemas.BranchCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.SUPERADMIN:
        raise HTTPException(status_code=403, detail="Only superadmin can create branches")
    
    db_branch = models.Branch(**branch.dict())
    db.add(db_branch)
    db.commit()
    db.refresh(db_branch)
    return db_branch

@app.get("/branches/", response_model=List[schemas.Branch])
async def read_branches(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role == models.UserRole.SUPERADMIN:
        branches = db.query(models.Branch).all()
    else:
        branches = db.query(models.Branch)\
            .filter(models.Branch.id == current_user.branch_id)\
            .all()
    return branches

@app.get("/branches/{branch_id}/stats")
async def get_branch_stats(
    branch_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in [models.UserRole.SUPERADMIN, models.UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if current_user.role == models.UserRole.ADMIN and current_user.branch_id != branch_id:
        raise HTTPException(status_code=403, detail="Can only view own branch stats")
    
    teachers_count = db.query(models.User)\
        .filter(models.User.branch_id == branch_id)\
        .filter(models.User.role == "Teacher")\
        .count()
    
    students_count = db.query(models.Student)\
        .join(models.User)\
        .filter(models.User.branch_id == branch_id)\
        .count()
    
    groups_count = db.query(models.Group)\
        .filter(models.Group.branch_id == branch_id)\
        .count()
    
    return {
        "teachers_count": teachers_count,
        "students_count": students_count,
        "groups_count": groups_count
    }
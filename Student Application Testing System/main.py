from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import List

app = FastAPI()

students_db = [
    {"id": 1, "name": "Ali Valiyev", "email": "ali@example.com", "tests_taken": [101, 102]},
    {"id": 2, "name": "Vali Karimov", "email": "vali@example.com", "tests_taken": [103]},
    {"id": 3, "name": "Madina Usmonova", "email": "madina@example.com", "tests_taken": []},
    {"id": 4, "name": "Sarvar Bekmurodov", "email": "sarvar@example.com", "tests_taken": [101]},
    {"id": 5, "name": "Dilnoza Akbarova", "email": "dilnoza@example.com", "tests_taken": [102, 103]}
]

tests_db = [
    {"id": 101, "name": "Matematika Test", "max_score": 100},
    {"id": 102, "name": "Fizika Test", "max_score": 100},
    {"id": 103, "name": "Ingliz Tili Test", "max_score": 100},
    {"id": 104, "name": "Tarix Test", "max_score": 100},
    {"id": 105, "name": "Dasturlash Test", "max_score": 100}
]

results_db = [
    {"student_id": 1, "test_id": 101, "score": 85},
    {"student_id": 1, "test_id": 102, "score": 90},
    {"student_id": 2, "test_id": 103, "score": 75},
    {"student_id": 4, "test_id": 101, "score": 95},
    {"student_id": 5, "test_id": 103, "score": 80}
]


class Student(BaseModel):
    id: int = Field(..., description="Unique identifier for the student")
    name: str = Field(..., min_length=2, max_length=50, description="Student fullname")
    email: str = Field(..., description="Student email address")
    tests_taken: List[int] = Field(default_factory=list)

class Test(BaseModel):
    id: int = Field(..., description="Unique identifier for the test")
    name: str = Field(..., min_length=2, max_length=100, description="Name of the test")
    max_score: int = Field(..., description="Maximum possible score")

class TestResult(BaseModel):
    student_id: int = Field(..., description="ID of the student taking the test")
    test_id: int = Field(..., description="ID of the test taken")
    score: int = Field(..., description="Score obtained in the test")

class ResponseMessage(BaseModel):
    message: str


@app.post("/students/", response_model=ResponseMessage)
def create_student(student: Student):
    if any(s["id"] == student.id for s in students_db):
        return {"message": "Student mavjud"}
    students_db.append(student.dict())
    return {"message": "Student yaratildi"}

@app.get("/students/{student_id}/")
def get_student(student_id: int):
    student = next((s for s in students_db if s["id"] == student_id), None)
    if not student:
        return {"message": "Student topilmadi"}
    return student


@app.get("/students/")
def get_all_students():
    return students_db

@app.post("/tests/", response_model=ResponseMessage)
def create_test(test: Test):
    if any(t["id"] == test.id for t in tests_db):
        return {"message": "Test mavjud"}
    tests_db.append(test.dict())
    return {"message": "Test yaratildi"}


@app.get("/tests/{test_id}/")
def get_test(test_id: int):
    test = next((t for t in tests_db if t["id"] == test_id), None)
    if not test:
        return {"message": "Test topilmadi"}
    return test

@app.get("/tests/")
def get_all_tests():
    return tests_db

@app.post("/results/", response_model=ResponseMessage)
def submit_test_result(result: TestResult):
    if not any(s["id"] == result.student_id for s in students_db):
        return {"message": "Student topilmadi"}
    if not any(t["id"] == result.test_id for t in tests_db):
        return {"message": "Test topilmadi"}
    
    results_db.append(result.dict())
    
    for s in students_db:
        if s["id"] == result.student_id:
            s["tests_taken"].append(result.test_id)
    
    return {"message": "Test natijasi topshirildi"}

@app.get("/results/student/{student_id}/")
def get_student_results(student_id: int):
    return [r for r in results_db if r["student_id"] == student_id]

@app.get("/results/test/{test_id}/")
def get_test_results(test_id: int):
    return [r for r in results_db if r["test_id"] == test_id]

@app.get("/results/test/{test_id}/average")
def get_average_score(test_id: int):
    scores = [r["score"] for r in results_db if r["test_id"] == test_id]
    if not scores:
        return {"message": "Bu test natijalari topilmadi"}
    return {"average_score": sum(scores) / len(scores)}

@app.get("/results/test/{test_id}/highest")
def get_highest_score(test_id: int):
    scores = [r["score"] for r in results_db if r["test_id"] == test_id]
    if not scores:
        return {"message": "Bu test natijalari topilmadi"}
    return {"highest_score": max(scores)}

@app.delete("/students/{student_id}/", response_model=ResponseMessage)
def delete_student(student_id: int):
    global students_db, results_db
    students_db = [s for s in students_db if s["id"] != student_id]
    results_db = [r for r in results_db if r["student_id"] != student_id]
    return {"message": "Student o‘chirildi"}

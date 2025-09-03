from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()
class TestData(BaseModel):
    name: str
@router.post("")
async def test(data: TestData):
    return {"message": f" Otrzymałem {data.name}"}  
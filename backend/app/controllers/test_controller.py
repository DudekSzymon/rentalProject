from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()
class TestData(BaseModel):
    name: str
@router.get("")
async def test(data: TestData):
    return {"message": " Otrzymałem {data.name}"}
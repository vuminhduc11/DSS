from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.data_service import process_upload_file

router = APIRouter()

@router.post("/upload")
async def upload_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        contents = await file.read()
        count = process_upload_file(contents, file.filename, db)
        return {"message": f"Successfully processed {count} transactions", "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

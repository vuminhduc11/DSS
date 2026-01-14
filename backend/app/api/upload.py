from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.data_service import process_upload_file, preview_upload_file

router = APIRouter()

from fastapi import Form, Body
import json

from app.api.auth import RoleChecker

@router.post("/upload/preview")
async def preview_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(RoleChecker(["admin", "retail_system"]))
):
    try:
        contents = await file.read()
        result = preview_upload_file(contents, file.filename)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/upload/process")
async def process_file(
    file: UploadFile = File(...), 
    mapping: str = Form(...), # JSON string
    db: Session = Depends(get_db),
    current_user: dict = Depends(RoleChecker(["admin", "retail_system"]))
):
    try:
        contents = await file.read()
        mapping_dict = json.loads(mapping)
        count = process_upload_file(contents, file.filename, db, mapping_dict)
        return {"message": f"Successfully processed {count} transactions", "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

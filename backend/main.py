import os
import json
import uuid
import mimetypes
from pathlib import Path
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

app = FastAPI(title="CloudVault API", version="1.0.0")

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
DATA_FILE = BASE_DIR / "metadata.json"

UPLOAD_DIR.mkdir(exist_ok=True)

def load_metadata() -> list:
    if not DATA_FILE.exists():
        # Boshlang'ich namuna ma'lumotlar bilan boyitish
        initial_data = [
            {
                "id": "sample-1",
                "name": "Q3_Moliyaviy_Hisobot_2026.pdf",
                "stored_name": "sample-1.pdf",
                "size": 2450000,
                "category": "document",
                "extension": "pdf",
                "created_at": "2026-11-18 14:30",
                "starred": True,
                "folder": "Hujjatlar"
            },
            {
                "id": "sample-2",
                "name": "Arxitektura_Dizayn_Maketi.png",
                "stored_name": "sample-2.png",
                "size": 5800000,
                "category": "image",
                "extension": "png",
                "created_at": "2026-11-19 11:15",
                "starred": False,
                "folder": "Dizayn"
            },
            {
                "id": "sample-3",
                "name": "FastAPI_Docker_Setup.py",
                "stored_name": "sample-3.py",
                "size": 42000,
                "category": "code",
                "extension": "py",
                "created_at": "2026-11-20 09:40",
                "starred": True,
                "folder": "Dasturlash"
            }
        ]
        save_metadata(initial_data)
        return initial_data
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def save_metadata(data: list):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def detect_category(filename: str) -> str:
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    if ext in ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"]:
        return "image"
    elif ext in ["mp4", "mkv", "mov", "avi", "webm"]:
        return "video"
    elif ext in ["mp3", "wav", "ogg", "flac", "m4a"]:
        return "audio"
    elif ext in ["pdf", "docx", "doc", "xlsx", "xls", "pptx", "txt"]:
        return "document"
    elif ext in ["py", "js", "ts", "tsx", "jsx", "html", "css", "json", "java", "cpp", "c", "go", "rs", "sql"]:
        return "code"
    elif ext in ["zip", "rar", "7z", "tar", "gz"]:
        return "archive"
    return "other"

@app.get("/api/health")
def health():
    return {"status": "ok", "engine": "FastAPI Python 3.12", "service": "CloudVault"}

@app.get("/api/files")
def list_files(
    category: Optional[str] = None,
    folder: Optional[str] = None,
    starred: Optional[bool] = None,
    search: Optional[str] = None
):
    files = load_metadata()
    if category and category != "all":
        files = [f for f in files if f.get("category") == category]
    if folder and folder != "all":
        files = [f for f in files if f.get("folder") == folder]
    if starred is not None:
        files = [f for f in files if f.get("starred") == starred]
    if search:
        s = search.lower()
        files = [f for f in files if s in f.get("name", "").lower() or s in f.get("folder", "").lower()]
    return files

@app.post("/api/upload")
async def upload_files(
    files: List[UploadFile] = File(...),
    folder: str = Form("Bosh sahifa")
):
    metadata = load_metadata()
    uploaded = []

    for file in files:
        file_id = str(uuid.uuid4())
        ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
        stored_name = f"{file_id}.{ext}" if ext else file_id
        dest_path = UPLOAD_DIR / stored_name

        content = await file.read()
        with open(dest_path, "wb") as f:
            f.write(content)

        file_item = {
            "id": file_id,
            "name": file.filename,
            "stored_name": stored_name,
            "size": len(content),
            "category": detect_category(file.filename),
            "extension": ext,
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "starred": False,
            "folder": folder or "Bosh sahifa"
        }
        metadata.insert(0, file_item)
        uploaded.append(file_item)

    save_metadata(metadata)
    return {"message": "Files uploaded successfully", "files": uploaded}

@app.get("/api/files/{file_id}/download")
def download_file(file_id: str):
    metadata = load_metadata()
    item = next((f for f in metadata if f["id"] == file_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="File not found")
    
    file_path = UPLOAD_DIR / item["stored_name"]
    if not file_path.exists():
        # Demo fayl bo'lsa xotiradan matn qaytarish
        return JSONResponse({"error": "Demo fayl diskda mavjud emas, yangi fayl yuklab sinab ko'ring!"}, status_code=404)
        
    return FileResponse(
        path=file_path,
        filename=item["name"],
        media_type="application/octet-stream"
    )

@app.get("/api/files/{file_id}/preview")
def preview_file(file_id: str):
    metadata = load_metadata()
    item = next((f for f in metadata if f["id"] == file_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="File not found")
        
    file_path = UPLOAD_DIR / item["stored_name"]
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not on disk")
        
    mime, _ = mimetypes.guess_type(item["name"])
    return FileResponse(path=file_path, media_type=mime or "application/octet-stream")

@app.delete("/api/files/{file_id}")
def delete_file(file_id: str):
    metadata = load_metadata()
    item = next((f for f in metadata if f["id"] == file_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="File not found")
        
    file_path = UPLOAD_DIR / item.get("stored_name", "")
    if file_path.exists():
        try:
            os.remove(file_path)
        except Exception:
            pass

    metadata = [f for f in metadata if f["id"] != file_id]
    save_metadata(metadata)
    return {"message": "File deleted", "id": file_id}

@app.patch("/api/files/{file_id}/star")
def toggle_star(file_id: str):
    metadata = load_metadata()
    item = next((f for f in metadata if f["id"] == file_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="File not found")
    item["starred"] = not item.get("starred", False)
    save_metadata(metadata)
    return {"starred": item["starred"], "id": file_id}

@app.get("/api/storage/stats")
def storage_stats():
    metadata = load_metadata()
    total_bytes = sum(f.get("size", 0) for f in metadata)
    
    categories = {}
    for f in metadata:
        cat = f.get("category", "other")
        categories[cat] = categories.get(cat, 0) + f.get("size", 0)
        
    # Max kvota: 15 GB
    quota_bytes = 15 * 1024 * 1024 * 1024
    percent = round((total_bytes / quota_bytes) * 100, 2)
    
    return {
        "used_bytes": total_bytes,
        "quota_bytes": quota_bytes,
        "percent": percent,
        "total_files": len(metadata),
        "breakdown": categories
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

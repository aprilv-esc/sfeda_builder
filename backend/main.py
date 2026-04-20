from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import shutil
import uuid
import zipfile
import json
from pathlib import Path
import re
from PIL import Image, ImageDraw, ImageFont
from typing import List, Dict, Any
from contextlib import asynccontextmanager

# --- Lazy Initialization Helpers ---
projects_db = {}
STORAGE_DIR = Path("/app/storage") if os.path.exists("/app") else Path("storage")
DB_FILE = STORAGE_DIR / "projects.json"
TEMPLATES_DIR = Path(__file__).parent / "templates"

# Lazy template holders
SFE_STYLE = None
SFE_CONTROL = None
SFE_JQUERY = None
SFE_TRACKING = None

def init_resources():
    """Ensure storage directory and DB exist without blocking startup."""
    global projects_db
    try:
        if not STORAGE_DIR.exists():
            STORAGE_DIR.mkdir(parents=True, exist_ok=True)
        
        if not projects_db and DB_FILE.exists() and DB_FILE.stat().st_size > 0:
            with open(DB_FILE, "r") as f:
                content = f.read().strip()
                if content:
                    projects_db = json.loads(content)
                    # Sanitize: Ensure hotspots and required fields exist
                    for pid, data in projects_db.items():
                        if 'pages' in data:
                            for page in data['pages']:
                                if 'hotspots' not in page: page['hotspots'] = []
                                for key in ['video_top', 'video_left', 'video_width', 'video_height']:
                                    if key not in page: page[key] = 0
    except Exception as e:
        print(f"Lazy Init Warning: {e}")

def save_db():
    try:
        init_resources()
        serializable_db = {}
        for pid, data in projects_db.items():
            serializable_db[pid] = data.copy()
            if 'pages' in serializable_db[pid]:
                serializable_db[pid]['pages'] = json.loads(json.dumps(data['pages']))
        
        with open(DB_FILE, "w") as f:
            json.dump(serializable_db, f, indent=4)
    except Exception as e:
        print(f"Error saving DB: {e}")

def load_template(path, default=""):
    t_path = TEMPLATES_DIR / path
    if t_path.exists():
        try:
            with open(t_path, "r", encoding="utf-8", errors="replace") as f:
                return f.read()
        except Exception:
            pass
    return default

def ensure_templates():
    global SFE_STYLE, SFE_CONTROL, SFE_JQUERY, SFE_TRACKING
    if SFE_STYLE is None:
        SFE_STYLE = load_template("css/style.css")
        SFE_CONTROL = load_template("js/control.js")
        SFE_JQUERY = load_template("js/jquery.min.js")
        SFE_TRACKING = load_template("js/tracking.js")

# --- FastAPI Setup ---

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pass instantly for Railway health checks
    yield

app = FastAPI(title="Detailing Aid Converter API", lifespan=lifespan)

# CORS MUST BE FIRST AND WIDE
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True, 
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Root endpoint (Instant 200)
@app.get("/")
def read_root():
    return {
        "status": "ok", 
        "version": "1.0.7-recovery", 
        "message": "DA Converter API is running with Full Recovery configuration."
    }

# --- Functional Endpoints ---

@app.get("/projects")
async def list_projects():
    init_resources()
    summary = []
    for pid, data in projects_db.items():
        summary.append({
            "id": pid,
            "original_file": data.get("original_file"),
            "type": data.get("type"),
            "page_count": len(data.get("pages", [])),
            "timestamp": data.get("timestamp")
        })
    summary.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
    return summary

@app.get("/project/{project_id}")
async def get_project(project_id: str):
    init_resources()
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
    return projects_db[project_id]

@app.delete("/project/{project_id}")
async def delete_project(project_id: str):
    init_resources()
    if project_id in projects_db:
        project_dir = STORAGE_DIR / project_id
        if project_dir.exists():
            shutil.rmtree(project_dir)
        del projects_db[project_id]
        save_db()
        return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="Project not found")

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    import fitz
    init_resources()
    ensure_templates()
    
    project_id = str(uuid.uuid4())
    project_dir = STORAGE_DIR / project_id
    project_dir.mkdir(parents=True, exist_ok=True)
    
    file_path = project_dir / file.filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    pages = []
    used_names = {"index.html"}
    
    if file.filename.lower().endswith(".pdf"):
        doc = fitz.open(str(file_path))
        images_dir = project_dir / "images"
        images_dir.mkdir(exist_ok=True)
        
        for i in range(len(doc)):
            page = doc.load_page(i)
            # Higher resolution for iPad
            mat = fitz.Matrix(2, 2)
            pix = page.get_pixmap(matrix=mat)
            image_name = f"slide_{i+1}.png"
            pix.save(str(images_dir / image_name))
            
            text = page.get_text()
            suggested_name = generate_filename(text, f"slide_{i+1}.html", used_names)
            pages.append({"id": f"slide_{i+1}", "html_name": suggested_name, "image_name": image_name})
            
    elif file.filename.lower().endswith(".zip"):
        from bs4 import BeautifulSoup
        with zipfile.ZipFile(file_path, "r") as zip_ref:
            zip_ref.extractall(project_dir / "extracted")
            
        extracted_dir = project_dir / "extracted"
        for root, dirs, files in os.walk(extracted_dir):
            for name in files:
                if name.endswith(".html"):
                    html_file = os.path.join(root, name)
                    with open(html_file, 'r', encoding='utf-8', errors='replace') as f:
                        soup = BeautifulSoup(f, 'html.parser')
                    
                    # Sanitize and extract title
                    title_text = soup.title.string if soup.title else (soup.h1.string if soup.h1 else name)
                    for a in soup.find_all('a'):
                        if a.get('href', '').startswith('http'): a['href'] = '#'
                    
                    with open(html_file, 'w', encoding='utf-8', errors='replace') as f:
                        f.write(str(soup))
                        
                    suggested_name = generate_filename(str(title_text), name, used_names)
                    pages.append({"id": name, "html_name": suggested_name, "image_name": ""})
    
    import datetime
    projects_db[project_id] = {
        "id": project_id,
        "pages": pages, 
        "original_file": file.filename, 
        "type": file.filename.split('.')[-1].lower(),
        "timestamp": datetime.datetime.now().isoformat()
    }
    save_db()
    return {"project_id": project_id, "pages": pages}

@app.post("/project/{project_id}/media/{slide_id}")
async def upload_slide_media(project_id: str, slide_id: str, file: UploadFile = File(...)):
    init_resources()
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
        
    project = projects_db[project_id]
    media_dir = STORAGE_DIR / project_id / "media"
    media_dir.mkdir(parents=True, exist_ok=True)
    
    file_path = media_dir / file.filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    for page in project['pages']:
        if page['id'] == slide_id:
            page['video_name'] = file.filename
            break
    save_db()
    return {"status": "success", "video_name": file.filename}

@app.post("/generate/{project_id}")
async def generate_project(project_id: str, body: Dict[str, Any]):
    init_resources()
    ensure_templates()
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
        
    project = projects_db[project_id]
    project_dir = STORAGE_DIR / project_id
    new_pages = body.get('pages', [])
    
    build_dir = project_dir / "build"
    if build_dir.exists(): shutil.rmtree(build_dir)
    build_dir.mkdir(exist_ok=True)
    (build_dir / "images").mkdir(exist_ok=True)
    (build_dir / "media").mkdir(exist_ok=True)
    
    rename_map = {p['id']: p.get('new_html_name', p.get('html_name')) for p in new_pages}
    
    for i, page in enumerate(project['pages']):
        new_html_name = rename_map.get(page['id'], page['html_name'])
        image_name = page['image_name']
        
        # Copy image
        if (project_dir / "images" / image_name).exists():
            shutil.copy(project_dir / "images" / image_name, build_dir / "images" / image_name)
            
        # Copy video if exists
        video_name = page.get('video_name', '')
        if video_name and (project_dir / "media" / video_name).exists():
            shutil.copy(project_dir / "media" / video_name, build_dir / "media" / video_name)
            
        # Get processed hotspots
        frontend_page = next((p for p in new_pages if p['id'] == page['id']), {})
        raw_hotspots = frontend_page.get('hotspots', [])
        processed_hotspots = []
        first_id = project['pages'][0]['id'] if project['pages'] else None
        
        for h in raw_hotspots:
            h_copy = h.copy()
            target = h_copy.get('target', '')
            if target == first_id: h_copy['target'] = "index.html"
            elif target in rename_map: h_copy['target'] = rename_map[target]
            
            if 'menuItems' in h_copy:
                for item in h_copy['menuItems']:
                    if item.get('target') == first_id: item['target'] = "index.html"
                    elif item.get('target') in rename_map: item['target'] = rename_map[item.get('target')]
            processed_hotspots.append(h_copy)
            
        prev_name = rename_map.get(project['pages'][i-1]['id']) if i > 0 else ""
        next_name = rename_map.get(project['pages'][i+1]['id']) if i < len(project['pages'])-1 else ""
        
        html = get_base_html(
            image_name, prev_name, next_name, video_name,
            frontend_page.get('video_top', 10), frontend_page.get('video_left', 10),
            frontend_page.get('video_width', 80), frontend_page.get('video_height', 80),
            processed_hotspots
        )
        with open(build_dir / new_html_name, "w") as f:
            f.write(html)
            
    shutil.make_archive(str(project_dir / "output"), 'zip', build_dir)
    projects_db[project_id]['pages'] = new_pages
    save_db()
    return {"download_url": f"/download/{project_id}"}

@app.get("/download/{project_id}")
async def download_project(project_id: str):
    init_resources()
    output_zip = STORAGE_DIR / project_id / "output.zip"
    if not output_zip.exists():
        raise HTTPException(status_code=404, detail="Archive not found")
    
    project = projects_db.get(project_id, {})
    original_name = project.get('original_file', 'project').rsplit('.', 1)[0]
    return FileResponse(output_zip, media_type="application/zip", filename=f"{original_name.replace(' ', '_')}.zip")

# --- Helper Logic ---

def generate_filename(text: str, default: str, used_names: set) -> str:
    if not text: return default
    cleaned = re.sub(r'[^A-Za-z0-9 ]+', '', text.split('\n')[0]).title().replace(' ', '')
    final = f"{cleaned[:25]}.html" if len(cleaned) > 2 else default
    counter = 2
    while final in used_names:
        final = f"{final.replace('.html','')}_{counter}.html"
        counter += 1
    used_names.add(final)
    return final

def get_base_html(img, prev, nxt, vid, vt, vl, vw, vh, hotspots):
    ensure_templates()
    video_html = f'<video id="slideVid" src="./media/{vid}" autoplay loop playsinline muted style="position: absolute; top: {vt}%; left: {vl}%; width: {vw}%; height: {vh}%; z-index: 50; display: none;"></video>' if vid else ""
    hotspot_html = ""
    menu_html = ""
    
    for idx, h in enumerate(hotspots):
        style = f"position: absolute; top: {h.get('top')}%; left: {h.get('left')}%; width: {h.get('width')}%; height: {h.get('height')}%; z-index: 60;"
        if h.get('type') == 'home': hotspot_html += f'<a href="index.html" style="{style}"></a>'
        elif h.get('type') == 'nav': hotspot_html += f'<a href="{h.get("target")}" style="{style}"></a>'
        elif h.get('type') == 'menu':
            mid = f"m{idx}"
            hotspot_html += f'<a href="javascript:void(0)" onclick="toggleMenu(\'{mid}\')" style="{style}"></a>'
            items = "".join([f'<li><a href="{i.get("target")}">{i.get("label")}</a></li>' for i in h.get('menuItems', [])])
            menu_html += f'<div id="{mid}" class="popup-menu-overlay" onclick="toggleMenu(\'{mid}\')"><div class="popup-menu-content" onclick="event.stopPropagation()"><ul>{items}</ul><button class="close-menu" onclick="toggleMenu(\'{mid}\')">Close</button></div></div>'

    return f"""<!DOCTYPE html><html><head><title>Slide</title><style>{SFE_STYLE}</style><script>{SFE_JQUERY}</script><script>{SFE_TRACKING}</script></head><body><div id="gameContainer"><div id="aspect-ratio-container"><div id="slideCover"><img src="./images/{img}" data-next-file="{nxt}" data-previous-file="{prev}"/>{video_html}{hotspot_html}</div><div class="sfe-safe-zone"></div></div>{menu_html}</div><script>{SFE_CONTROL}</script></body></html>"""

# Mount storage (Must exist)
if not STORAGE_DIR.exists(): STORAGE_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/storage", StaticFiles(directory=STORAGE_DIR), name="storage")

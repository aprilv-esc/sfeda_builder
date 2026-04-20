from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import shutil
import os
import uuid
import zipfile
import json
from pathlib import Path
import re
from PIL import Image, ImageDraw, ImageFont
from typing import List, Dict, Any

# Importers
import fitz  # PyMuPDF
from bs4 import BeautifulSoup

app = FastAPI(title="Detailing Aid Converter API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STORAGE_DIR = Path("storage")
STORAGE_DIR.mkdir(exist_ok=True)

# Mount the storage directory so we can serve generated images
app.mount("/storage", StaticFiles(directory=STORAGE_DIR), name="storage")

@app.get("/")
def read_root():
    return {"status": "ok", "message": "DA Converter API is running."}

# DB Persistence
DB_FILE = STORAGE_DIR / "projects.json"
projects_db = {}

def save_db():
    try:
        # Convert Path objects to strings for JSON serialization
        serializable_db = {}
        for pid, data in projects_db.items():
            serializable_db[pid] = data.copy()
            if 'pages' in serializable_db[pid]:
                # Deep copy to avoid mutating the original
                serializable_db[pid]['pages'] = json.loads(json.dumps(data['pages']))
        
        with open(DB_FILE, "w") as f:
            json.dump(serializable_db, f, indent=4)
    except Exception as e:
        print(f"Error saving DB: {e}")

def load_db():
    global projects_db
    if DB_FILE.exists():
        try:
            with open(DB_FILE, "r") as f:
                projects_db = json.load(f)
                # Sanitize: Ensure hotspots and required fields exist for all pages
                for pid, data in projects_db.items():
                    if 'pages' in data:
                        for page in data['pages']:
                            if 'hotspots' not in page:
                                page['hotspots'] = []
                            if 'video_top' not in page:
                                page['video_top'] = 0
                            if 'video_left' not in page:
                                page['video_left'] = 0
                            if 'video_width' not in page:
                                page['video_width'] = 0
                            if 'video_height' not in page:
                                page['video_height'] = 0
        except Exception as e:
            print(f"Error loading DB: {e}")
            projects_db = {}

# Initialize DB on start
load_db()

@app.get("/projects")
async def list_projects():
    summary = []
    for pid, data in projects_db.items():
        summary.append({
            "id": pid,
            "original_file": data.get("original_file"),
            "type": data.get("type"),
            "page_count": len(data.get("pages", [])),
            "timestamp": data.get("timestamp")
        })
    # Sort by timestamp descending
    summary.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
    return summary

@app.get("/project/{project_id}")
async def get_project(project_id: str):
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
    return projects_db[project_id]

@app.delete("/project/{project_id}")
async def delete_project(project_id: str):
    if project_id in projects_db:
        # Optionally delete files too
        project_dir = STORAGE_DIR / project_id
        if project_dir.exists():
            shutil.rmtree(project_dir)
        del projects_db[project_id]
        save_db()
        return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="Project not found")

def generate_filename(text: str, default: str, used_names: set) -> str:
    if not text:
        return default
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    # Filter out common footers/headers
    valid_lines = [line for line in lines if len(line) > 3 and not any(skip in line.lower() for skip in ['www.', '.com', 'confidential', '©', 'http'])]
    
    if not valid_lines:
        return default
        
    first_line = valid_lines[0]
    cleaned = re.sub(r'[^A-Za-z0-9 ]+', '', first_line).title().replace(' ', '')
    if len(cleaned) < 3:
        return default
        
    base_name = cleaned[:25]
    final_name = f"{base_name}.html"
    counter = 2
    while final_name in used_names:
        final_name = f"{base_name}_{counter}.html"
        counter += 1
        
    used_names.add(final_name)
    return final_name

def create_dummy_slide(title: str, text: str, dest_path: str):
    img = Image.new('RGB', (1024, 768), color=(240, 240, 240))
    d = ImageDraw.Draw(img)
    try:
        font_large = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 40)
        font_small = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 20)
    except IOError:
        font_large = ImageFont.load_default()
        font_small = font_large
        
    d.text((100, 100), title[:50] + ("..." if len(title) > 50 else ""), fill=(10,10,10), font=font_large)
    
    y = 180
    for line in text.split('\n')[:15]:
        d.text((100, y), line[:80] + ("..." if len(line) > 80 else ""), fill=(50,50,50), font=font_small)
        y += 30
        
    img.save(dest_path)

def get_base_html(image_filename, prev_filename="", next_filename="", video_filename="", v_top=10, v_left=10, v_width=80, v_height=80, hotspots=None, home_position='none'):
    prev_link = f'<a href="{prev_filename}" class="nav-btn nav-prev">&#10094;</a>' if prev_filename else ''
    next_link = f'<a href="{next_filename}" class="nav-btn nav-next">&#10095;</a>' if next_filename else ''
    home_link = f'<a href="index.html" class="home-btn" style="{"display:none" if home_position == "none" else ""}"><span>&#8962; Home</span></a>'
    
    video_embed = ""
    if video_filename:
        video_embed = f"""
            <div class="video-overlay" style="position: absolute; top: {v_top}%; left: {v_left}%; width: {v_width}%; height: {v_height}%; z-index: 50;">
                <video src="media/{video_filename}" controls autoplay loop playsinline></video>
            </div>
        """
    
    hotspot_html = ""
    menu_overlays = ""
    if hotspots:
        for idx, h in enumerate(hotspots):
            h_top, h_left, h_width, h_height = h.get('top', 0), h.get('left', 0), h.get('width', 0), h.get('height', 0)
            h_type = h.get('type')
            
            common_style = f"position: absolute; top: {h_top}%; left: {h_left}%; width: {h_width}%; height: {h_height}%; z-index: 60;"
            
            if h_type == 'home':
                hotspot_html += f'<a href="index.html" style="{common_style}"></a>'
            elif h_type == 'nav':
                target = h.get('target', '#')
                hotspot_html += f'<a href="{target}" style="{common_style}"></a>'
            elif h_type == 'menu':
                menu_id = f"custom-menu-{idx}"
                hotspot_html += f'<a href="javascript:void(0)" onclick="toggleMenu(\'{menu_id}\')" style="{common_style}"></a>'
                
                items_html = ""
                for item in h.get('menuItems', []):
                    items_html += f'<li><a href="{item.get("target", "#")}">{item.get("label", "Link")}</a></li>'
                
                menu_overlays += f"""
                <div id="{menu_id}" class="popup-menu-overlay" onclick="toggleMenu('{menu_id}')">
                    <div class="popup-menu-content" onclick="event.stopPropagation()">
                        <ul>{items_html}</ul>
                        <button class="close-menu" onclick="toggleMenu('{menu_id}')">Close</button>
                    </div>
                </div>
                """

    return f"""<!DOCTYPE html>
<html>
    <head>
        <title>Detailing Aid Slide</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="stylesheet" type="text/css" href="css/style.css" />
    </head>
    <body id="top">
        <main id="aspect-ratio-container" class="animate-fade">
            {home_link}
            {prev_link}
            {next_link}
            <div id="slideCover">
                <img class="slide-bg" src="images/{image_filename}" />
                {video_embed}
                {hotspot_html}
            </div>
            {menu_overlays}
        </main>
        <script type="text/javascript" language="javascript" src="js/control.js"></script>
    </body>
</html>"""

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    project_id = str(uuid.uuid4())
    project_dir = STORAGE_DIR / project_id
    project_dir.mkdir(parents=True, exist_ok=True)
    
    file_path = project_dir / file.filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    pages = []
    used_names = {"index.html"}  # Reserve index.html so it's never auto-suggested
    
    if file.filename.lower().endswith(".pdf"):
        # Convert PDF to images
        doc = fitz.open(str(file_path))
        images_dir = project_dir / "images"
        images_dir.mkdir(exist_ok=True)
        html_dir = project_dir / "slides"
        html_dir.mkdir(exist_ok=True)
        
        for i in range(len(doc)):
            page = doc.load_page(i)
            # Default PDF width may be small, increase resolution with matrix
            zoom = 2 # to get a higher PPI
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat)
            image_name = f"slide_{i+1}.png"
            pix.save(str(images_dir / image_name))
            
            # Extract text to generate a smart name
            text = page.get_text()
            suggested_name = generate_filename(text, f"slide_{i+1}.html", used_names)
            
            pages.append({"id": f"slide_{i+1}", "html_name": suggested_name, "image_name": image_name})
            
    elif file.filename.lower().endswith(".pptx"):
        raise HTTPException(
            status_code=400,
            detail="PPTX files are not supported. Please convert your PPTX to PDF first, then upload the PDF."
        )

    elif file.filename.lower().endswith(".zip"):
        # Sanitize HTML logic
        with zipfile.ZipFile(file_path, "r") as zip_ref:
            zip_ref.extractall(project_dir / "extracted")
        
        # Traverse and sanitize
        extracted_dir = project_dir / "extracted"
        for root, dirs, files in os.walk(extracted_dir):
            for name in files:
                if name.endswith(".html"):
                    html_file = os.path.join(root, name)
                    with open(html_file, 'r', encoding='utf-8') as f:
                        soup = BeautifulSoup(f, 'html.parser')
                        
                    # Sanitize Links and try to extract title for suggestion
                    title_text = ""
                    if soup.title and soup.title.string:
                        title_text = soup.title.string
                    elif soup.h1 and soup.h1.string:
                        title_text = soup.h1.string

                    for a in soup.find_all('a'):
                        href = a.get('href', '')
                        if href.startswith('http://') or href.startswith('https://'):
                            a['href'] = '#' # Or remove the link entirely
                            
                    # Remove body onload
                    if soup.body and soup.body.has_attr('onload'):
                        del soup.body['onload']
                        
                    # Remove <script> with src pointing to external
                    for script in soup.find_all('script'):
                        if script.get('src', '').startswith(('http://', 'https://')):
                            script.decompose()
                            
                    with open(html_file, 'w', encoding='utf-8') as f:
                        f.write(str(soup))
                        
                    suggested_name = generate_filename(title_text, name, used_names)
                    pages.append({"id": name, "html_name": suggested_name, "image_name": ""})
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format.")
        
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
    new_pages = body.get('pages', [])
    nav_arrows_position = body.get('nav_arrows_position', 'bottom')
    home_position = body.get('home_position', 'top')
    # User provides renamed pages: [{"id": "slide_1", "new_html_name": "ProductBenefits.html"}]
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
        
    project = projects_db[project_id]
    project_dir = STORAGE_DIR / project_id
    output_zip = project_dir / "output.zip"
    
    # We will zip files in a particular folder structure.
    # First create a build dir.
    build_dir = project_dir / "build"
    build_dir.mkdir(exist_ok=True)
    images_build_dir = build_dir / "images"
    images_build_dir.mkdir(exist_ok=True)
    css_dir = build_dir / "css"
    css_dir.mkdir(exist_ok=True)
    js_dir = build_dir / "js"
    js_dir.mkdir(exist_ok=True)
    media_build_dir = build_dir / "media"
    media_build_dir.mkdir(exist_ok=True)
    
    # Build nav arrow CSS (vertical position)
    # Parse home position
    home_pos_str = str(home_position or 'top-right').lower()
    home_side = 'right' if 'right' in home_pos_str else 'left'
    
    if 'top' in home_pos_str:
        home_y_val = "top: 2%;"
        home_transform = "none"
    elif 'middle' in home_pos_str:
        home_y_val = "top: 50%;"
        home_transform = "translateY(-50%)"
    elif 'bottom' in home_pos_str:
        home_y_val = "bottom: 2%;"
        home_transform = "none"
    else: # none
        home_y_val = "display: none;"
        home_transform = "none"
    
    home_v = f"{home_y_val} {home_side}: 2%; transform: {home_transform};"
    
    _arrow_v_map = {
        'top':    'top: 2%; transform: none;',
        'middle': 'top: 50%; transform: translateY(-50%);',
        'bottom': 'bottom: 2%; transform: none;',
        'none':   'top: 0; height: 100%; width: 15%; opacity: 0; transition: none;',
    }
    arrow_v = _arrow_v_map.get(nav_arrows_position, _arrow_v_map['bottom'])

    # Add dummy/template CSS and JS files
    with open(css_dir / "style.css", "w") as f:
        f.write(f"""/* Detailing Aid Styles */
body, html {{ margin: 0; padding: 0; width: 100%; height: 100%; background: #000; overflow: hidden; font-family: -apple-system, sans-serif; }}
#aspect-ratio-container {{ 
    position: relative; width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; background: #fff;
}}
#slideCover {{ position: relative; display: inline-block; max-width: 100%; max-height: 100%; }}
.slide-bg {{ max-width: 100vw; max-height: 100vh; display: block; }}

/* Navigation Buttons */
.nav-btn, .home-btn {{
    position: absolute;
    z-index: 100;
    text-decoration: none;
    color: white;
    font-size: 14px;
    font-weight: bold;
    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
    background: transparent;
    padding: 10px;
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.2s, opacity 0.2s;
}}
.home-btn:hover {{
    opacity: 0.8;
}}

/* Video Overlay */
.video-overlay {{
    display: flex;
    justify-content: center;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    border-radius: 12px;
    overflow: hidden;
    background: transparent;
}}
.video-overlay video {{
    width: 100%;
    height: 100%;
    object-fit: cover;
}}

/* Popup Menu Styles */
.popup-menu-overlay {{
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(8px);
    display: none;
    z-index: 2000;
    justify-content: center;
    align-items: center;
}}
.popup-menu-content {{
    background: rgba(255, 255, 255, 0.95);
    padding: 2rem;
    border-radius: 20px;
    width: 80%;
    max-width: 400px;
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
}}
.popup-menu-content ul {{
    list-style: none;
    padding: 0;
    margin: 0 0 1.5rem 0;
}}
.popup-menu-content li {{
    margin-bottom: 0.75rem;
}}
.popup-menu-content a {{
    display: block;
    padding: 1rem;
    background: #4F46E5;
    color: white;
    text-decoration: none;
    border-radius: 12px;
    text-align: center;
    font-weight: 600;
    transition: transform 0.2s;
}}
.popup-menu-content a:active {{
    transform: scale(0.95);
}}
.close-menu {{
    width: 100%;
    padding: 0.75rem;
    background: #E5E7EB;
    border: none;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
}}

.nav-btn:hover, .home-btn:hover {{ transform: scale(1.1); opacity: 0.8; }}

.nav-prev {{ left: 0; {arrow_v} }}
.nav-next {{ right: 0; {arrow_v} }}
.home-btn {{ {home_v} font-size: 1.5rem; font-weight: 500; }}
.nav-btn:not([style*="display: none"]) {{ font-size: 2.5rem; }}

/* Transitions */
@keyframes fadeInScale {{
    from {{ opacity: 0; transform: scale(0.97); }}
    to {{ opacity: 1; transform: scale(1); }}
}}
.animate-fade {{
    animation: fadeInScale 0.6s cubic-bezier(0.25, 1, 0.5, 1) both;
}}
""")
    with open(js_dir / "control.js", "w") as f:
        f.write("""
function toggleMenu(id) {
    var menu = document.getElementById(id);
    if (menu.style.display === 'flex') {
        menu.style.display = 'none';
    } else {
        menu.style.display = 'flex';
    }
}
""")
    with open(js_dir / "jquery.min.js", "w") as f:
        f.write("// jQuery min")
        
    project_type = project.get('type', '').lower()
    if project_type in ['pdf']:
        # Rename logic and building HTML
        # Convert new_pages list to a map dict
        rename_map = {p['id']: p.get('new_html_name', p.get('html_name')) for p in new_pages}
        frontend_state_map = {p['id']: p for p in new_pages}
        
        for i, page in enumerate(project['pages']):
            new_html_name = rename_map.get(page['id'], page['html_name'])
            image_name = page['image_name']
            
            # Use real image if it exists
            src_image = project_dir / "images" / image_name
            if src_image.exists():
                shutil.copy(src_image, images_build_dir / image_name)
            
            # Previous file name
            prev_html_name = ""
            if i - 1 >= 0:
                prev_id = project['pages'][i-1]['id']
                prev_html_name = rename_map.get(prev_id, project['pages'][i-1]['html_name'])
                
            # Next file name
            next_html_name = ""
            if i + 1 < len(project['pages']):
                next_id = project['pages'][i+1]['id']
                next_html_name = rename_map.get(next_id, project['pages'][i+1]['html_name'])
                
            video_name = page.get('video_name', '')
            if video_name:
                src_video = project_dir / "media" / video_name
                if src_video.exists():
                    shutil.copy(src_video, media_build_dir / video_name)
                    
            # Grab dimensions and interaction hotspots from the frontend state payload
            frontend_page = frontend_state_map.get(page['id'], {})
            v_top = frontend_page.get('video_top', 10)
            v_left = frontend_page.get('video_left', 10)
            v_width = frontend_page.get('video_width', 80)
            v_height = frontend_page.get('video_height', 80)
            hotspots = frontend_page.get('hotspots', [])

            html_content = get_base_html(image_name, prev_html_name, next_html_name, video_name, v_top, v_left, v_width, v_height, hotspots, home_position)
            
            with open(build_dir / new_html_name, "w") as f:
                f.write(html_content)
                
    elif project_type in ['zip']:
        # For ZIP, rename files in the extracted directory
        # This is a bit more complex (refs need rewriting).
        # We will just copy the extracted items and rename the requested files.
        extracted_dir = project_dir / "extracted"
        shutil.copytree(extracted_dir, build_dir, dirs_exist_ok=True)
        rename_map = {p['id']: p.get('new_html_name', p.get('html_name')) for p in new_pages}
        
        for root, dirs, files in os.walk(build_dir):
            for name in files:
                if name in rename_map and rename_map[name] != name:
                    os.rename(os.path.join(root, name), os.path.join(root, rename_map[name]))
                    
        # Update references in all HTML using BS4. This is a naive implementation but works for simple simulation.
        for root, dirs, files in os.walk(build_dir):
            for name in files:
                if name.endswith(".html"):
                    html_file = os.path.join(root, name)
                    with open(html_file, 'r', encoding='utf-8') as f:
                        soup = BeautifulSoup(f, 'html.parser')
                    for a in soup.find_all('a'):
                        href = a.get('href', '')
                        if href in rename_map:
                            a['href'] = rename_map[href]
                    with open(html_file, 'w', encoding='utf-8') as f:
                        f.write(str(soup))

    # ZIP it up
    shutil.make_archive(str(project_dir / "output"), 'zip', build_dir)
    
    # Persist the updated hotspots/state
    projects_db[project_id]['pages'] = new_pages
    projects_db[project_id]['nav_arrows_position'] = nav_arrows_position
    projects_db[project_id]['home_position'] = home_position
    save_db()

    return {"download_url": f"/download/{project_id}"}


@app.get("/download/{project_id}")
async def download_project(project_id: str):
    project_dir = STORAGE_DIR / project_id
    output_zip = project_dir / "output.zip"
    if not output_zip.exists():
        raise HTTPException(status_code=404, detail="Archive not found.")
        
    project = projects_db.get(project_id)
    if project and project.get('original_file'):
        # Strip extension, add .zip, and replace spaces with underscores
        base_name = project['original_file'].rsplit('.', 1)[0]
        base_name = base_name.replace(' ', '_')
        download_name = f"{base_name}.zip"
    else:
        download_name = f"conversion_{project_id}.zip"
        
    return FileResponse(output_zip, media_type="application/zip", filename=download_name)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

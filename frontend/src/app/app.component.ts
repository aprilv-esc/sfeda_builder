import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

declare var introJs: any;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Detailing Aid Converter';
  
  fileToUpload: File | null = null;
  isUploading = false;
  uploadError = '';
  
  projectId: string | null = null;
  pages: any[] = [];
  
  isGenerating = false;
  downloadUrl: string | null = null;
  activeModalPage: any = null;

  // Global nav positioning settings
  navArrowsPosition: string = 'bottom';  // 'top' | 'middle' | 'bottom'
  homePosition: string = 'top-right';    // 'top-left' | 'top-right'
  
  API_BASE = (window as any).__ENV_API_BASE__ || 'http://localhost:8000';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Show tour if first time
    if (!localStorage.getItem('tour_seen')) {
      setTimeout(() => this.startTour(), 1000);
      localStorage.setItem('tour_seen', 'true');
    }
  }

  startTour() {
    introJs().setOptions({
      disableInteraction: false,
      steps: [
        {
          title: 'Welcome!',
          intro: 'Welcome to the Detailing Aid Converter! This tool helps you convert PPTX/PDF to SFE-compatible HTML.'
        },
        {
          element: document.querySelector('#step1-upload'),
          title: 'Upload',
          intro: 'First, select and upload your PPTX, PDF, or HTML ZIP file here.'
        },
        {
          element: document.querySelector('#tour-help'),
          title: 'Need Help?',
          intro: 'You can restart this tour anytime by clicking this button.'
        }
      ]
    }).start();
  }
  
  tourPages() {
    introJs().setOptions({
      disableInteraction: false,
      steps: [
        {
          element: document.querySelector('#step2-rename'),
          title: 'Step 2: Rename',
          intro: 'Here you can see the parsed pages. You can click on the text box and give each file a descriptive name.'
        },
        {
          element: document.querySelector('#step3-generate'),
          title: 'Step 3: Generate',
          intro: 'Once ready, click here to package and download your converted Detailing Aid ZIP!'
        }
      ]
    }).start();
  }

  onFileChange(event: any) {
    if (event.target.files.length > 0) {
      this.fileToUpload = event.target.files[0];
    }
  }

  uploadFile() {
    if (!this.fileToUpload) return;
    
    this.isUploading = true;
    this.uploadError = '';
    
    const formData = new FormData();
    formData.append('file', this.fileToUpload);
    
    this.http.post<any>(`${this.API_BASE}/upload`, formData).subscribe({
      next: (res) => {
        this.projectId = res.project_id;
        // set default new names
        this.pages = res.pages.map((p: any, index: number) => ({
          ...p,
          new_html_name: index === 0 ? 'index.html' : p.html_name
        }));
        this.isUploading = false;
        
        // Let the user interact immediately. We won't auto-start tour 2 to prevent blocking their clicks.
        // If they need help they can click the tour button.
      },
      error: (err) => {
        this.uploadError = 'Upload failed. ' + (err.error?.detail || err.message);
        this.isUploading = false;
      }
    });
  }

  generateZip() {
    if (!this.projectId) return;
    
    this.isGenerating = true;

    const payload = {
      pages: this.pages,
      nav_arrows_position: this.navArrowsPosition,
      home_position: this.homePosition
    };
    
    this.http.post<any>(`${this.API_BASE}/generate/${this.projectId}`, payload).subscribe({
      next: (res) => {
        this.downloadUrl = `${this.API_BASE}${res.download_url}`;
        this.isGenerating = false;
      },
      error: (err) => {
        alert('Generation failed');
        this.isGenerating = false;
      }
    });
  }

  downloadFinal() {
    if (this.downloadUrl) {
      window.open(this.downloadUrl, '_blank');
    }
  }

  resetApp() {
    this.projectId = null;
    this.fileToUpload = null;
    this.pages = [];
    this.downloadUrl = null;
    this.isGenerating = false;
    this.uploadError = '';
    this.activeModalPage = null;
    
    // reset file input visually if needed
    const fileInput: any = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';
  }
  
  previewAid() {
    if (this.pages.length > 0 && this.projectId) {
       const firstPageName = this.pages[0].new_html_name;
       const url = `${this.API_BASE}/storage/${this.projectId}/build/${firstPageName}`;
       window.open(url, '_blank');
    }
  }

  uploadSlideMedia(event: any, page: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert("Please upload a valid matching video format.");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    
    page.isUploadingMedia = true;

    this.http.post<any>(`${this.API_BASE}/project/${this.projectId}/media/${page.id}`, formData).subscribe({
      next: (res) => {
        page.video_name = res.video_name;
        page.isUploadingMedia = false;
        
        // Initialize default positioning (perfectly centered 80%)
        if (!page.video_top) page.video_top = 10;
        if (!page.video_left) page.video_left = 10;
        if (!page.video_width) page.video_width = 80;
        if (!page.video_height) page.video_height = 80;
      },
      error: (err) => {
        alert('Failed to attach video: ' + err.message);
        page.isUploadingMedia = false;
      }
    });
  }

  onMouseDown(event: MouseEvent, page: any) {
    if (!page.video_name) return;
    
    // Prevent default drag
    event.preventDefault();
    page.isDrawing = true;
    
    const container = event.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();
    
    // Calculate percentages
    page._startX = ((event.clientX - rect.left) / rect.width) * 100;
    page._startY = ((event.clientY - rect.top) / rect.height) * 100;
    
    // Reset visually
    page.video_left = Math.max(0, Math.min(100, page._startX));
    page.video_top = Math.max(0, Math.min(100, page._startY));
    page.video_width = 0;
    page.video_height = 0;
  }

  onMouseMove(event: MouseEvent, page: any) {
    if (!page.isDrawing || !page.video_name) return;
    event.preventDefault();

    const container = event.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();
    
    const currentX = ((event.clientX - rect.left) / rect.width) * 100;
    const currentY = ((event.clientY - rect.top) / rect.height) * 100;
    
    // Calculate width and height natively permitting opposite dragging
    let left = Math.min(page._startX, currentX);
    let top = Math.min(page._startY, currentY);
    let width = Math.abs(currentX - page._startX);
    let height = Math.abs(currentY - page._startY);
    
    // Boundary lock constraints
    if (left < 0) { width += left; left = 0; }
    if (top < 0) { height += top; top = 0; }
    if (left + width > 100) width = 100 - left;
    if (top + height > 100) height = 100 - top;
    
    page.video_left = parseFloat(left.toFixed(1));
    page.video_top = parseFloat(top.toFixed(1));
    page.video_width = parseFloat(width.toFixed(1));
    page.video_height = parseFloat(height.toFixed(1));
  }

  onMouseUp(page: any) {
    if (page.isDrawing) page.isDrawing = false;
  }

  openModal(page: any) {
    this.activeModalPage = page;
    // Disable background scrolling to avoid messiness
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.activeModalPage = null;
    // Remount background scrolling
    document.body.style.overflow = '';
  }
}

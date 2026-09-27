/**
 * Md. Aatir Usmani - Corporate Personal Portfolio Engine
 * - Scroll-synced 3D background animation with physics lerping
 * - Dynamic section-based video opacity masking
 * - Dark Mode Toggle with persistence
 * - Interactive Certificate Filtering & Modal Viewers
 * - Mobile Navigation Drawer & Active Nav Tracking
 */

(function () {
  'use strict';

  // Configuration
  const TOTAL_FRAMES = 240;
  const FRAME_DIR = 'frames';
  const LERP_FACTOR = 0.085;
  const CONCURRENCY_LIMIT = 8;

  // DOM Elements - Canvas & Video Veil
  const canvas = document.getElementById('animation-canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const canvasWrapper = document.getElementById('canvas-wrapper');
  const videoVeil = document.getElementById('video-veil');
  const loader = document.getElementById('loader');
  const loaderBar = document.getElementById('loader-bar');
  const loaderText = document.getElementById('loader-text');
  const scrubProgress = document.getElementById('scrub-progress');

  // DOM Elements - Navigation & Theme
  const themeToggleBtn = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const mobileDrawer = document.getElementById('mobile-drawer');
  const drawerCloseBtn = document.getElementById('drawer-close-btn');
  const mobileLinks = document.querySelectorAll('.mobile-link');
  const navLinks = document.querySelectorAll('.nav-link');
  const backToTopBtn = document.getElementById('back-to-top');

  // DOM Elements - Modals
  const projectModal = document.getElementById('project-modal');
  const projectModalClose = document.getElementById('project-modal-close');
  const modalProjectRole = document.getElementById('modal-project-role');
  const modalProjectTitle = document.getElementById('modal-project-title');
  const modalProjectDesc = document.getElementById('modal-project-desc');
  const modalProjectSkills = document.getElementById('modal-project-skills');
  const modalProjectOutcome = document.getElementById('modal-project-outcome');

  const certModal = document.getElementById('cert-modal');
  const certModalClose = document.getElementById('cert-modal-close');
  const modalCertCat = document.getElementById('modal-cert-cat');
  const modalCertTitle = document.getElementById('modal-cert-title');
  const modalCertMeta = document.getElementById('modal-cert-meta');
  const modalCertDesc = document.getElementById('modal-cert-desc');
  const modalCertSkills = document.getElementById('modal-cert-skills');

  // File Viewer Modal
  const fileViewerModal = document.getElementById('file-viewer-modal');
  const fileViewerClose = document.getElementById('file-viewer-close');
  const fileViewerTitle = document.getElementById('file-viewer-title');
  const fileViewerBody = document.getElementById('file-viewer-body');
  const fileViewerDownload = document.getElementById('file-viewer-download');

  // Gallery Lightbox
  const galleryLightbox = document.getElementById('gallery-lightbox');
  const galleryLbClose = document.getElementById('gallery-lb-close');
  const galleryLbImg = document.getElementById('gallery-lb-img');
  const galleryLbCaption = document.getElementById('gallery-lb-caption');
  const galleryLbPrev = document.getElementById('gallery-lb-prev');
  const galleryLbNext = document.getElementById('gallery-lb-next');

  // DOM Elements - Interactive Grids
  const certFilterChips = document.querySelectorAll('.cert-filter-chip');
  const certCards = document.querySelectorAll('.cert-card');
  const projectCards = document.querySelectorAll('.project-card');

  // Animation State
  const images = new Array(TOTAL_FRAMES);
  let loadedCount = 0;
  let targetFrame = 0;
  let currentFrame = 0;
  let lastDrawnFrameIndex = -1;
  let lastLoadedImage = null;
  let isInitialFrameRendered = false;

  // Format frame path: frames/frame_000000.png ... frames/frame_000239.png
  function getFramePath(index) {
    const padded = String(index).padStart(6, '0');
    return `${FRAME_DIR}/frame_${padded}.png`;
  }

  // Draw warm studio gradient matching character background
  function drawBackground(w, h) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const grad = ctx.createLinearGradient(0, 0, 0, h);

    if (isDark) {
      grad.addColorStop(0, '#151312');
      grad.addColorStop(0.5, '#1e1b1a');
      grad.addColorStop(1, '#151312');
    } else {
      grad.addColorStop(0, '#F6E3D9');
      grad.addColorStop(0.45, '#F7E7DE');
      grad.addColorStop(1, '#FDF0E8');
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  // Responsive Canvas Sizing (Retina DPR support)
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;

    if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;
    }

    render(currentFrame, true);
  }

  // Render Frame onto Canvas with Cover Scaling
  function render(frameFloat, forceRedraw = false) {
    const frameIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(frameFloat)));
    if (!forceRedraw && frameIndex === lastDrawnFrameIndex) {
      return;
    }

    let img = images[frameIndex];
    if (!img || !img.complete || img.naturalWidth === 0) {
      img = findNearestLoadedImage(frameIndex);
    }
    if (!img || !img.complete || img.naturalWidth === 0) {
      img = lastLoadedImage;
    }
    if (!img || !img.complete || img.naturalWidth === 0) {
      return;
    }

    lastLoadedImage = img;
    lastDrawnFrameIndex = frameIndex;

    const cw = canvas.width;
    const ch = canvas.height;
    const nw = img.naturalWidth || 1920;
    const nh = img.naturalHeight || 1080;

    drawBackground(cw, ch);

    const scale = Math.max(cw / nw, ch / nh);
    const sw = nw * scale;
    const sh = nh * scale;
    const dx = (cw - sw) / 2;
    const dy = (ch - sh) / 2;

    ctx.drawImage(img, dx, dy, sw, sh);
  }

  // Nearest Cached Frame Fallback
  function findNearestLoadedImage(targetIdx) {
    for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
      const prev = targetIdx - offset;
      if (prev >= 0 && images[prev] && images[prev].complete && images[prev].naturalWidth > 0) {
        return images[prev];
      }
      const next = targetIdx + offset;
      if (next < TOTAL_FRAMES && images[next] && images[next].complete && images[next].naturalWidth > 0) {
        return images[next];
      }
    }
    return null;
  }

  // Synchronize Page Scroll with 3D Character Turnaround & Zoom
  function updateScroll() {
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.max(0, Math.min(1, scrollY / maxScroll));

    // Target frame seamlessly maps 0 to 239 across the full page
    targetFrame = progress * (TOTAL_FRAMES - 1);

    // Update right-side scrub progress bar
    if (scrubProgress) {
      scrubProgress.style.height = `${progress * 100}%`;
    }

    // Dynamic section-based video opacity control
    updateVideoOpacity(scrollY);

    // Active navigation link tracking
    updateActiveNavLink(scrollY);
  }

  // Adjust Background Video Visibility Based on Current Section Visibility
  function updateVideoOpacity(scrollY) {
    const sections = document.querySelectorAll('section[data-video-visibility]');
    const viewportMiddle = scrollY + window.innerHeight * 0.4;
    let currentVis = 'medium';

    sections.forEach((sec) => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      if (viewportMiddle >= top && viewportMiddle <= top + height) {
        currentVis = sec.getAttribute('data-video-visibility') || 'medium';
      }
    });

    if (canvasWrapper) {
      if (currentVis === 'high') {
        canvasWrapper.style.opacity = '0.78';
      } else if (currentVis === 'low') {
        canvasWrapper.style.opacity = '0.22';
      } else {
        canvasWrapper.style.opacity = '0.45';
      }
    }
  }

  // Active Navigation Link Tracker
  function updateActiveNavLink(scrollY) {
    const sectionIds = ['home', 'about', 'experience', 'skills', 'certifications', 'projects', 'capabilities', 'education', 'contact'];
    const triggerPoint = scrollY + 220;

    for (let i = sectionIds.length - 1; i >= 0; i--) {
      const el = document.getElementById(sectionIds[i]);
      if (el && el.offsetTop <= triggerPoint) {
        navLinks.forEach((link) => {
          const href = link.getAttribute('href').replace('#', '');
          if (href === sectionIds[i]) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
        break;
      }
    }
  }

  // Physics Animation Loop
  function animate() {
    const diff = targetFrame - currentFrame;
    if (Math.abs(diff) > 0.001) {
      currentFrame += diff * LERP_FACTOR;
      render(currentFrame);
    }
    requestAnimationFrame(animate);
  }

  // Image Frame Loader
  function loadFrame(index) {
    return new Promise((resolve) => {
      if (images[index] && images[index].complete) {
        resolve(images[index]);
        return;
      }

      const img = new Image();
      img.decoding = 'async';
      img.src = getFramePath(index);

      img.onload = () => {
        images[index] = img;
        loadedCount++;
        onFrameLoaded(index);
        resolve(img);
      };

      img.onerror = () => {
        loadedCount++;
        onFrameLoaded(index);
        resolve(null);
      };
    });
  }

  // Progress Feedback
  function onFrameLoaded(index) {
    if (!isInitialFrameRendered && (index === 0 || loadedCount === 1)) {
      isInitialFrameRendered = true;
      render(0, true);
    }

    const pct = Math.round((loadedCount / TOTAL_FRAMES) * 100);
    if (loaderBar) {
      loaderBar.style.width = `${pct}%`;
    }
    if (loaderText) {
      loaderText.textContent = `${pct}%`;
    }

    if (loadedCount >= TOTAL_FRAMES) {
      setTimeout(() => {
        if (loader) {
          loader.classList.add('fade-out');
        }
      }, 350);
    }
  }

  // Two-Phase Progressive Loader
  async function preloadAllFrames() {
    await loadFrame(0);

    const keyframes = [];
    const restFrames = [];
    for (let i = 1; i < TOTAL_FRAMES; i++) {
      if (i % 6 === 0) {
        keyframes.push(i);
      } else {
        restFrames.push(i);
      }
    }

    const priorityQueue = [...keyframes, ...restFrames];
    let cursor = 0;

    async function worker() {
      while (cursor < priorityQueue.length) {
        const nextIndex = priorityQueue[cursor++];
        await loadFrame(nextIndex);
      }
    }

    const pool = [];
    for (let w = 0; w < CONCURRENCY_LIMIT; w++) {
      pool.push(worker());
    }

    await Promise.all(pool);
  }

  // Theme Toggle (Light / Dark Mode with LocalStorage)
  function initTheme() {
    const savedTheme = localStorage.getItem('aatir_theme') || 'light';
    applyTheme(savedTheme);

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
      });
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('aatir_theme', theme);
    if (themeIcon) {
      themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
    render(currentFrame, true);
  }

  // Certificate Category Filter
  function initCertFilters() {
    certFilterChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        certFilterChips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');

        const filter = chip.getAttribute('data-cert-filter');

        certCards.forEach((card) => {
          const cat = card.getAttribute('data-category');
          if (filter === 'all' || cat === filter) {
            card.style.display = 'flex';
            setTimeout(() => {
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            }, 10);
          } else {
            card.style.opacity = '0';
            card.style.transform = 'translateY(10px)';
            setTimeout(() => {
              card.style.display = 'none';
            }, 250);
          }
        });
      });
    });
  }

  // Interactive Project & Certificate Modals
  function initModals() {
    // Project Cards click -> Project Modal
    projectCards.forEach((card) => {
      card.addEventListener('click', () => {
        const title = card.getAttribute('data-title') || '';
        const role = card.getAttribute('data-role') || '';
        const desc = card.getAttribute('data-desc') || '';
        const skills = card.getAttribute('data-skills') || '';
        const outcome = card.getAttribute('data-outcome') || '';

        modalProjectTitle.textContent = title;
        modalProjectRole.textContent = role;
        modalProjectDesc.textContent = desc;
        modalProjectSkills.textContent = skills;
        modalProjectOutcome.textContent = outcome;

        openModal(projectModal);
      });
    });

    // Certificate Cards: real cards open file viewer, others open cert modal
    certCards.forEach((card) => {
      const btn = card.querySelector('.btn-view-cert');
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const isReal = card.classList.contains('cert-card-real');

          if (isReal) {
            // Open file viewer modal
            const filePath = card.getAttribute('data-file') || '';
            const fileType = card.getAttribute('data-filetype') || 'pdf';
            const title = card.getAttribute('data-title') || 'Certificate';

            openFileViewer(filePath, fileType, title);
          } else {
            // Open standard cert description modal
            const title = card.getAttribute('data-title') || '';
            const issuer = card.getAttribute('data-issuer') || '';
            const date = card.getAttribute('data-date') || '';
            const desc = card.getAttribute('data-desc') || '';
            const skills = card.getAttribute('data-skills') || '';
            const cat = card.getAttribute('data-category') || '';

            modalCertTitle.textContent = title;
            modalCertMeta.textContent = `${issuer} • Issued: ${date}`;
            modalCertDesc.textContent = desc;
            modalCertSkills.textContent = skills;
            modalCertCat.textContent = cat.toUpperCase();

            openModal(certModal);
          }
        });
      }
    });

    function openModal(modal) {
      if (!modal) return;
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeModal(modal) {
      if (!modal) return;
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      // Only restore scroll if no other modal is open
      const anyOpen = document.querySelector('.modal-backdrop.active');
      if (!anyOpen) document.body.style.overflow = '';
    }

    // File Viewer open/close
    function openFileViewer(filePath, fileType, title) {
      if (!fileViewerModal || !fileViewerBody) return;
      fileViewerTitle.textContent = title;
      fileViewerDownload.href = filePath;
      fileViewerDownload.download = filePath.split('/').pop();

      // Clear previous content
      fileViewerBody.innerHTML = '';

      if (fileType === 'pdf') {
        const iframe = document.createElement('iframe');
        iframe.src = filePath;
        iframe.title = title;
        fileViewerBody.appendChild(iframe);
      } else {
        const img = document.createElement('img');
        img.src = filePath;
        img.alt = title;
        fileViewerBody.appendChild(img);
      }

      openModal(fileViewerModal);
    }

    if (fileViewerClose) {
      fileViewerClose.addEventListener('click', () => {
        closeModal(fileViewerModal);
        // Clear iframe/img to stop PDF loading
        if (fileViewerBody) fileViewerBody.innerHTML = '';
      });
    }

    if (fileViewerModal) {
      fileViewerModal.addEventListener('click', (e) => {
        if (e.target === fileViewerModal) {
          closeModal(fileViewerModal);
          if (fileViewerBody) fileViewerBody.innerHTML = '';
        }
      });
    }

    if (projectModalClose) {
      projectModalClose.addEventListener('click', () => closeModal(projectModal));
    }
    if (certModalClose) {
      certModalClose.addEventListener('click', () => closeModal(certModal));
    }

    // Click outside to close
    [projectModal, certModal].forEach((m) => {
      if (m) {
        m.addEventListener('click', (e) => {
          if (e.target === m) {
            closeModal(m);
          }
        });
      }
    });

    // Esc key close
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal(projectModal);
        closeModal(certModal);
        if (fileViewerModal) {
          closeModal(fileViewerModal);
          if (fileViewerBody) fileViewerBody.innerHTML = '';
        }
        closeGalleryLightbox();
      }
    });
  }

  // Mobile Drawer Navigation
  function initMobileMenu() {
    if (!hamburgerBtn || !mobileDrawer) return;

    hamburgerBtn.addEventListener('click', () => {
      mobileDrawer.classList.add('open');
    });

    if (drawerCloseBtn) {
      drawerCloseBtn.addEventListener('click', () => {
        mobileDrawer.classList.remove('open');
      });
    }

    mobileLinks.forEach((link) => {
      link.addEventListener('click', () => {
        mobileDrawer.classList.remove('open');
      });
    });
  }

  // Back to top button
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Event Listeners
  window.addEventListener('resize', resizeCanvas, { passive: true });
  window.addEventListener('scroll', updateScroll, { passive: true });

  // Gallery Lightbox
  function initGalleryLightbox() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    if (!galleryLightbox || !galleryItems.length) return;

    let currentGalleryIndex = 0;
    const galleryData = [];

    galleryItems.forEach((item, idx) => {
      const src = item.getAttribute('data-src') || '';
      const caption = item.getAttribute('data-caption') || '';
      galleryData.push({ src, caption });

      item.addEventListener('click', () => {
        currentGalleryIndex = idx;
        openGalleryLightbox(galleryData[idx].src, galleryData[idx].caption);
      });
    });

    function openGalleryLightbox(src, caption) {
      galleryLbImg.src = src;
      galleryLbCaption.textContent = caption;
      galleryLightbox.classList.add('active');
      galleryLightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function navigateGallery(delta) {
      currentGalleryIndex = (currentGalleryIndex + delta + galleryData.length) % galleryData.length;
      const { src, caption } = galleryData[currentGalleryIndex];
      galleryLbImg.style.opacity = '0';
      setTimeout(() => {
        galleryLbImg.src = src;
        galleryLbCaption.textContent = caption;
        galleryLbImg.style.opacity = '1';
      }, 150);
    }

    if (galleryLbClose) {
      galleryLbClose.addEventListener('click', closeGalleryLightbox);
    }
    if (galleryLbPrev) {
      galleryLbPrev.addEventListener('click', () => navigateGallery(-1));
    }
    if (galleryLbNext) {
      galleryLbNext.addEventListener('click', () => navigateGallery(1));
    }
    if (galleryLightbox) {
      galleryLightbox.addEventListener('click', (e) => {
        if (e.target === galleryLightbox) closeGalleryLightbox();
      });
    }

    // Keyboard arrow navigation
    window.addEventListener('keydown', (e) => {
      if (!galleryLightbox || !galleryLightbox.classList.contains('active')) return;
      if (e.key === 'ArrowLeft') navigateGallery(-1);
      if (e.key === 'ArrowRight') navigateGallery(1);
    });

    // Add fade transition to lightbox image
    if (galleryLbImg) {
      galleryLbImg.style.transition = 'opacity 0.15s ease';
    }
  }

  function closeGalleryLightbox() {
    if (!galleryLightbox) return;
    galleryLightbox.classList.remove('active');
    galleryLightbox.setAttribute('aria-hidden', 'true');
    const anyOpen = document.querySelector('.modal-backdrop.active');
    if (!anyOpen) document.body.style.overflow = '';
  }

  // Initialization
  function init() {
    initTheme();
    resizeCanvas();
    updateScroll();
    animate();
    preloadAllFrames();
    initCertFilters();
    initModals();
    initMobileMenu();
    initGalleryLightbox();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

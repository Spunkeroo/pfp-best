// Upload & Rating Logic for pfp.best

(function() {
  const uploadZone    = document.getElementById('upload-zone');
  const uploadInput   = document.getElementById('upload-input');
  const uploadContent = document.getElementById('upload-content');
  const uploadPreview = document.getElementById('upload-preview');
  const uploadForm    = document.getElementById('upload-form');
  const previewImg    = document.getElementById('preview-img');
  const fileName      = document.getElementById('file-name');
  const submitBtn     = document.getElementById('submit-pfp');

  let selectedFile     = null;
  let selectedCategory = 'pfp';
  let selectedChain    = null; // required — BTC, ETH, SOL, or art

  if (!uploadZone) return;

  // ── Validate file before doing anything else ─────────────────────────────
  function validateFile(file) {
    // Only allow safe image formats — no SVG, BMP, TIFF, etc.
    if (!Moderation.validateFileType(file)) {
      showToast('Only JPG, PNG, GIF, or WebP images are allowed.', 'error');
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be under 5MB', 'error');
      return false;
    }
    return true;
  }

  // ── Show upload preview ──────────────────────────────────────────────────
  function handleFile(file) {
    if (!validateFile(file)) return;

    selectedFile = file;

    const reader = new FileReader();
    reader.onload = e => {
      previewImg.src = e.target.result;
      if (fileName) fileName.textContent = file.name;
      uploadContent.style.display = 'none';
      uploadPreview.style.display = 'flex';
      uploadForm.classList.add('active');
    };
    reader.readAsDataURL(file);
  }

  // ── Reset to blank upload state ──────────────────────────────────────────
  function resetUpload() {
    selectedFile = null;
    selectedChain = null;
    uploadContent.style.display = 'block';
    uploadPreview.style.display = 'none';
    uploadForm.classList.remove('active');
    uploadInput.value = '';
    previewImg.src = '';
    document.querySelectorAll('.chain-btn').forEach(b => b.classList.remove('selected'));
    const err = document.getElementById('chain-error');
    if (err) err.style.display = 'none';
  }

  // ── Disable the upload zone for banned users ─────────────────────────────
  function disableUploadForBan() {
    uploadZone.style.opacity = '0.4';
    uploadZone.style.pointerEvents = 'none';
    uploadZone.style.cursor = 'not-allowed';
    const h3 = uploadZone.querySelector('h3');
    const p  = uploadZone.querySelector('p');
    const btn = uploadZone.querySelector('.upload-btn');
    if (h3) h3.textContent = 'Uploads suspended';
    if (p)  p.textContent  = 'Your account has been suspended for violating our content policy.';
    if (btn) btn.style.display = 'none';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Account suspended';
    }
  }

  // Check ban status on load
  isBanned().then(banned => {
    if (banned) disableUploadForBan();
  }).catch(() => {});

  // ── Drag & drop ──────────────────────────────────────────────────────────
  uploadZone.addEventListener('dragover', e => {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('drag-over');
  });

  uploadZone.addEventListener('drop', e => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFile(files[0]);
  });

  // ── Click to browse ──────────────────────────────────────────────────────
  uploadZone.addEventListener('click', (e) => {
    // Don't open file picker if preview is visible (user tapped preview area)
    if (uploadPreview.style.display === 'flex') return;
    uploadInput.click();
  });

  uploadInput.addEventListener('change', e => {
    if (e.target.files.length > 0) handleFile(e.target.files[0]);
  });

  // ── Paste from clipboard ─────────────────────────────────────────────────
  document.addEventListener('paste', e => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.kind === 'file' && Moderation.ALLOWED_TYPES.has(item.type.toLowerCase())) {
        const file = item.getAsFile();
        if (file) { handleFile(file); break; }
      }
    }
  });

  // ── Chain selection (required) ───────────────────────────────────────────
  const chainBtns = document.querySelectorAll('.chain-btn');
  chainBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      chainBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedChain = btn.dataset.chain;
      const err = document.getElementById('chain-error');
      if (err) err.style.display = 'none';
    });
  });

  // ── Style/category selection ─────────────────────────────────────────────
  const catPills = document.querySelectorAll('#category-pills .tag-pill');
  catPills.forEach(pill => {
    pill.addEventListener('click', () => {
      catPills.forEach(p => p.classList.remove('selected'));
      pill.classList.add('selected');
      selectedCategory = pill.dataset.category;
    });
  });

  // ── Change image button ──────────────────────────────────────────────────
  const changeBtn = document.getElementById('change-image');
  if (changeBtn) {
    changeBtn.addEventListener('click', e => {
      e.stopPropagation();
      resetUpload();
    });
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      if (!selectedFile) {
        showToast('Please select an image first', 'error');
        return;
      }

      // Chain is required
      if (!selectedChain) {
        const err = document.getElementById('chain-error');
        if (err) err.style.display = 'block';
        showToast('Select a blockchain or Art Only to continue', 'error');
        return;
      }

      // Re-validate the file (in case something changed)
      if (!validateFile(selectedFile)) return;

      submitBtn.disabled = true;

      try {
        // 1. Check if user is already banned (skip if Firebase unavailable)
        submitBtn.textContent = 'Checking…';
        try {
          const banned = await isBanned();
          if (banned) {
            disableUploadForBan();
            showToast('Your account has been suspended.', 'error');
            return;
          }
        } catch (_) { /* Firebase offline — continue */ }

        // 2. Run content moderation (only blocks on confirmed explicit content)
        submitBtn.textContent = 'Uploading…';
        const safety = await Moderation.checkImage(previewImg);

        if (!safety.safe && safety.reason !== 'moderation_unavailable') {
          // Only ban on confirmed explicit content, not on scan failures
          try { await banFingerprint(safety.reason || 'explicit_content'); } catch (_) {}
          disableUploadForBan();
          showToast('Image rejected: explicit content is not allowed.', 'error');
          resetUpload();
          return;
        }

        // 3. Upload
        submitBtn.textContent = 'Uploading…';

        const titleInput = document.getElementById('pfp-title');
        const title = titleInput ? titleInput.value.trim() : '';

        const { id, url } = await uploadImage(selectedFile);
        await createPfp({
          id,
          url,
          title: title || 'Untitled PFP',
          category: selectedCategory,
          chain: selectedChain,
          tags: [selectedCategory, selectedChain]
        });

        showToast('PFP uploaded! Now rate it yourself to start your score! ⭐', 'success');
        resetUpload();
        if (titleInput) titleInput.value = '';

        // Open the modal so the user can immediately rate their own PFP
        setTimeout(() => {
          openPfpModal(id);
        }, 600);

      } catch (err) {
        console.error('Upload error:', err);
        showToast('Upload failed. Please try again.', 'error');
      } finally {
        if (submitBtn && !submitBtn.textContent.includes('suspended')) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit PFP for Rating ⚡';
        }
      }
    });
  }
})();

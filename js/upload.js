// Upload & Rating Logic for pfp.best

(function() {
  const uploadZone = document.getElementById('upload-zone');
  const uploadInput = document.getElementById('upload-input');
  const uploadContent = document.getElementById('upload-content');
  const uploadPreview = document.getElementById('upload-preview');
  const uploadForm = document.getElementById('upload-form');
  const previewImg = document.getElementById('preview-img');
  const fileName = document.getElementById('file-name');
  const submitBtn = document.getElementById('submit-pfp');

  let selectedFile = null;
  let selectedCategory = 'other';

  if (!uploadZone) return;

  // Drag & drop events
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

  // Click to upload
  uploadZone.addEventListener('click', () => {
    uploadInput.click();
  });

  uploadInput.addEventListener('change', e => {
    if (e.target.files.length > 0) handleFile(e.target.files[0]);
  });

  // Paste image
  document.addEventListener('paste', e => {
    const items = e.clipboardData.items;
    for (let item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        handleFile(file);
        break;
      }
    }
  });

  function handleFile(file) {
    // Validate
    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be under 5MB', 'error');
      return;
    }

    selectedFile = file;

    // Show preview
    const reader = new FileReader();
    reader.onload = e => {
      previewImg.src = e.target.result;
      fileName.textContent = file.name;
      uploadContent.style.display = 'none';
      uploadPreview.style.display = 'flex';
      uploadForm.classList.add('active');
    };
    reader.readAsDataURL(file);
  }

  // Category tag selection
  document.querySelectorAll('.tag-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.tag-pill').forEach(p => p.classList.remove('selected'));
      pill.classList.add('selected');
      selectedCategory = pill.dataset.category;
    });
  });

  // Change image button
  const changeBtn = document.getElementById('change-image');
  if (changeBtn) {
    changeBtn.addEventListener('click', e => {
      e.stopPropagation();
      resetUpload();
    });
  }

  function resetUpload() {
    selectedFile = null;
    uploadContent.style.display = 'block';
    uploadPreview.style.display = 'none';
    uploadForm.classList.remove('active');
    uploadInput.value = '';
  }

  // Submit PFP
  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      if (!selectedFile) {
        showToast('Please select an image first', 'error');
        return;
      }

      const titleInput = document.getElementById('pfp-title');
      const title = titleInput ? titleInput.value.trim() : '';

      submitBtn.disabled = true;
      submitBtn.textContent = 'Uploading...';

      try {
        // Upload image
        const { id, url } = await uploadImage(selectedFile);

        // Create database entry
        await createPfp({
          id,
          url,
          title: title || 'Untitled PFP',
          category: selectedCategory,
          tags: [selectedCategory]
        });

        showToast('PFP uploaded! Let the ratings begin!', 'success');
        resetUpload();
        if (titleInput) titleInput.value = '';

        // Redirect to the PFP page
        setTimeout(() => {
          window.location.hash = `#pfp/${id}`;
        }, 500);
      } catch (err) {
        console.error('Upload failed:', err);
        showToast('Upload failed. Please try again.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit PFP for Rating';
      }
    });
  }
})();

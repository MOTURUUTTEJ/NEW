document.addEventListener('DOMContentLoaded', () => {
    const bucketSelect = document.getElementById('bucket-select');
    const filesTableBody = document.getElementById('files-list');
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const uploadStatus = document.getElementById('upload-status');
    const uploadProgressContainer = document.getElementById('upload-progress-container');
    const uploadProgressBar = document.getElementById('upload-progress');
    const refreshBtn = document.getElementById('refresh-btn');
    const createBucketBtn = document.getElementById('create-bucket-btn');

    let currentBucket = '';

    // Fetch and populate buckets
    function loadBuckets() {
        const currentVal = bucketSelect.value;
        bucketSelect.innerHTML = '<option value="" disabled selected>Select a bucket...</option>';
        fetch('/api/buckets')
            .then(response => response.json())
            .then(buckets => {
                if (buckets.error) {
                    console.error('Error fetching buckets:', buckets.error);
                    return;
                }
                buckets.forEach(bucket => {
                    const option = document.createElement('option');
                    option.value = bucket.Name;
                    option.textContent = bucket.Name;
                    bucketSelect.appendChild(option);
                });

                if (currentBucket && Array.from(bucketSelect.options).some(opt => opt.value === currentBucket)) {
                    bucketSelect.value = currentBucket;
                } else if (currentVal && Array.from(bucketSelect.options).some(opt => opt.value === currentVal)) {
                    bucketSelect.value = currentVal;
                    currentBucket = currentVal;
                }
            })
            .catch(err => console.error('Failed to load buckets', err));
    }

    loadBuckets();

    if (createBucketBtn) {
        createBucketBtn.addEventListener('click', () => {
            const newBucketName = prompt('Enter new bucket name (must be globally unique and follow S3 naming rules):');
            if (newBucketName && newBucketName.trim()) {
                createBucket(newBucketName.trim());
            }
        });
    }

    function createBucket(bucketName) {
        fetch('/api/buckets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ bucketName })
        })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    alert(`Error creating bucket: ${data.error}`);
                } else {
                    alert(`Bucket "${data.bucketName}" created successfully!`);
                    currentBucket = data.bucketName;
                    loadBuckets();
                    loadFiles(currentBucket);
                }
            })
            .catch(err => {
                console.error('Error:', err);
                alert('Failed to create bucket.');
            });
    }

    // Handle bucket selection
    bucketSelect.addEventListener('change', (e) => {
        currentBucket = e.target.value;
        loadFiles(currentBucket);
    });

    // Handle refresh
    refreshBtn.addEventListener('click', () => {
        if (currentBucket) {
            loadFiles(currentBucket);
        }
    });

    // Load files function
    function loadFiles(bucketName) {
        filesTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading files...</td></tr>';

        fetch(`/api/files/${bucketName}`)
            .then(response => response.json())
            .then(files => {
                filesTableBody.innerHTML = '';
                if (files.error) {
                    filesTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--danger);">Error: ${files.error}</td></tr>`;
                    return;
                }

                if (files.length === 0) {
                    filesTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No files found in this bucket.</td></tr>';
                    return;
                }

                files.forEach(file => {
                    const row = document.createElement('tr');
                    const size = formatBytes(file.Size);
                    const lastModified = new Date(file.LastModified).toLocaleString();

                    // Using data attributes for safe key handling
                    row.innerHTML = `
                        <td><i class="fas fa-file" style="margin-right: 8px; color: var(--text-secondary);"></i> ${escapeHtml(file.Key)}</td>
                        <td class="desktop-only">${size}</td>
                        <td class="desktop-only">${lastModified}</td>
                        <td>
                            <button class="download-btn icon-btn" data-key="${escapeHtml(file.Key)}" title="Download">
                                <i class="fas fa-download"></i>
                            </button>
                            <button class="open-btn icon-btn" data-key="${escapeHtml(file.Key)}" title="Open Direct Link" style="margin-left: 8px;">
                                <i class="fas fa-external-link-alt"></i>
                            </button>
                            <button class="delete-btn icon-btn" data-key="${escapeHtml(file.Key)}" title="Delete" style="margin-left: 8px;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    `;
                    filesTableBody.appendChild(row);
                });
            })
            .catch(err => {
                console.error('Error loading files:', err);
                filesTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color: var(--danger);">Failed to load files.</td></tr>';
            });
    }

    // Event Delegation for Download and Open
    filesTableBody.addEventListener('click', (e) => {
        const downloadBtn = e.target.closest('.download-btn');
        if (downloadBtn) {
            const key = downloadBtn.dataset.key;
            downloadFile(key);
        }

        const openBtn = e.target.closest('.open-btn');
        if (openBtn) {
            const key = openBtn.dataset.key;
            openFile(key);
        }

        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
            const key = deleteBtn.dataset.key;
            if (confirm(`Are you sure you want to delete "${key}"? This action cannot be undone.`)) {
                deleteFile(key);
            }
        }
    });

    function downloadFile(key) {
        if (!currentBucket) return;

        fetch(`/api/download/${currentBucket}/${encodeURIComponent(key)}`)
            .then(res => res.json())
            .then(data => {
                if (data.url) {
                    const link = document.createElement('a');
                    link.href = data.url;
                    link.setAttribute('download', key);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                } else {
                    alert('Failed to get download URL');
                }
            })
            .catch(err => console.error('Download error:', err));
    }

    function openFile(key) {
        if (!currentBucket) return;

        fetch(`/api/download/${currentBucket}/${encodeURIComponent(key)}`)
            .then(res => res.json())
            .then(data => {
                if (data.url) {
                    window.open(data.url, '_blank');
                } else {
                    alert('Failed to get file URL');
                }
            })
            .catch(err => console.error('Error opening file:', err));
    }

    function deleteFile(key) {
        if (!currentBucket) return;

        fetch(`/api/delete/${currentBucket}/${encodeURIComponent(key)}`, {
            method: 'DELETE'
        })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    alert(`Error deleting file: ${data.error}`);
                } else {
                    // Refresh the file list
                    loadFiles(currentBucket);
                }
            })
            .catch(err => {
                console.error('Error deleting file:', err);
                alert('Failed to delete file.');
            });
    }

    // Determine upload behavior
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleUpload(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleUpload(e.target.files[0]);
        }
    });

    function handleUpload(file) {
        if (!currentBucket) {
            alert('Please select a bucket first.');
            return;
        }

        uploadProgressContainer.classList.remove('hidden');
        uploadStatus.textContent = `Uploading ${file.name}...`;
        uploadProgressBar.style.width = '0%';

        const formData = new FormData();
        formData.append('file', file);

        // Simulate progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            if (progress > 90) progress = 90;
            uploadProgressBar.style.width = `${progress}%`;
        }, 100);

        // We use encodeURIComponent for the bucket name just in case, though usually unnecessary
        fetch(`/api/upload/${currentBucket}`, {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                clearInterval(interval);
                uploadProgressBar.style.width = '100%';
                if (data.error) {
                    uploadStatus.textContent = `Upload failed: ${data.error}`;
                    uploadStatus.style.color = 'var(--danger)';
                } else {
                    uploadStatus.textContent = 'Upload complete!';
                    uploadStatus.style.color = 'var(--success)';
                    loadFiles(currentBucket); // Refresh list
                    setTimeout(() => {
                        uploadProgressContainer.classList.add('hidden');
                        uploadStatus.style.color = 'var(--text-secondary)';
                        // Reset
                        uploadStatus.textContent = 'Uploading...';
                        uploadProgressBar.style.width = '0%';
                    }, 3000);
                }
            })
            .catch(err => {
                clearInterval(interval);
                console.error('Upload error:', err);
                uploadStatus.textContent = 'Upload failed.';
                uploadStatus.style.color = 'var(--danger)';
            });
    }

    function escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function (m) { return map[m]; });
    }

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
});

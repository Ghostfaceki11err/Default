// app.js
import { convertImage, convertDocxToPdf } from './converters.js';

// State Management
let selectedFile = null;
let conversionHistory = [];

// Element references
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const conversionForm = document.getElementById('conversion-form');
const fileNameDisplay = document.getElementById('file-name-display');
const fileSizeDisplay = document.getElementById('file-size-display');
const fileTypeBadge = document.getElementById('file-type-badge');
const formatSelect = document.getElementById('format-select');
const convertBtn = document.getElementById('convert-btn');
const cancelFileBtn = document.getElementById('cancel-file');
const processingView = document.getElementById('processing-view');
const progressText = document.getElementById('progress-text');
const progressBarFill = document.getElementById('progress-bar-fill');
const statusLabel = document.getElementById('status-label');
const themeToggle = document.getElementById('theme-toggle');
const sunIcon = document.getElementById('sun-icon');
const moonIcon = document.getElementById('moon-icon');
const clearHistoryBtn = document.getElementById('clear-history');
const historyContainer = document.getElementById('history-container');

// Supported formats mappings
const DOC_INPUT_EXTS = ['docx'];
const IMG_EXTS = ['png', 'jpg', 'jpeg', 'webp'];

// -------------------------------------------------------------
// 1. THEME CONTROLLER
// -------------------------------------------------------------
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcons(savedTheme);
}

function updateThemeIcons(theme) {
    if (theme === 'dark') {
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
    } else {
        moonIcon.classList.add('hidden');
        sunIcon.classList.remove('hidden');
    }
}

themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcons(newTheme);
});

// -------------------------------------------------------------
// 2. FILE SELECTION & ANALYSIS HANDLERS
// -------------------------------------------------------------
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function handleFileSelection(file) {
    if (!file) return;

    selectedFile = file;
    const ext = file.name.split('.').pop().toLowerCase();

    // UI representation configuration
    fileNameDisplay.textContent = file.name;
    fileSizeDisplay.textContent = formatBytes(file.size);
    
    // Clear dynamic badge styling
    fileTypeBadge.className = 'file-badge';
    fileTypeBadge.textContent = ext.toUpperCase();

    // Populate dropdown based on format compatibility
    formatSelect.innerHTML = '';
    let targetOptions = [];

    if (DOC_INPUT_EXTS.includes(ext)) {
        fileTypeBadge.classList.add('docx-theme');
        targetOptions = ['pdf'];
    } else if (IMG_EXTS.includes(ext)) {
        fileTypeBadge.classList.add('image-theme');
        // Let images convert to other image formats, excluding its own format
        targetOptions = ['png', 'jpg', 'webp'].filter(e => e !== ext && !(ext === 'jpeg' && e === 'jpg'));
    } else {
        fileTypeBadge.classList.add('default-theme');
        alert("Unsupported file. For documents, upload .docx. For images, upload .png, .jpg, or .webp.");
        selectedFile = null;
        return;
    }

    targetOptions.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt.toUpperCase();
        formatSelect.appendChild(option);
    });

    // UI swap
    dropZone.classList.add('hidden');
    conversionForm.classList.remove('hidden');
}

// Drag & Drop Listeners
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-active');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-active');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-active');
    if (e.dataTransfer.files.length > 0) {
        handleFileSelection(e.dataTransfer.files[0]);
    }
});

dropZone.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileSelection(e.target.files[0]);
    }
});

cancelFileBtn.addEventListener('click', () => {
    resetWorkspace();
});

function resetWorkspace() {
    selectedFile = null;
    fileInput.value = '';
    conversionForm.classList.add('hidden');
    dropZone.classList.remove('hidden');
    processingView.classList.add('hidden');
    convertBtn.disabled = false;
    cancelFileBtn.style.display = 'flex';
}

// -------------------------------------------------------------
// 3. TRANSCODING EXECUTION PIPELINE
// -------------------------------------------------------------
convertBtn.addEventListener('click', async () => {
    if (!selectedFile) return;

    const targetFormat = formatSelect.value;
    const sourceExt = selectedFile.name.split('.').pop().toLowerCase();

    // Block workspace manipulations during processing
    convertBtn.disabled = true;
    cancelFileBtn.style.display = 'none';
    processingView.classList.remove('hidden');

    try {
        let outputBlob = null;

        const updateProgress = (statusText, pct) => {
            statusLabel.textContent = statusText;
            progressText.textContent = `${pct}%`;
            progressBarFill.style.width = `${pct}%`;
        };

        updateProgress('Starting conversion...', 10);

        if (IMG_EXTS.includes(sourceExt)) {
            outputBlob = await convertImage(selectedFile, targetFormat);
            updateProgress('Image conversion finished!', 100);
        } else if (sourceExt === 'docx' && targetFormat === 'pdf') {
            outputBlob = await convertDocxToPdf(selectedFile, updateProgress);
        }

        if (outputBlob) {
            // Compile download action
            const cleanName = selectedFile.name.replace(/\.[^/.]+$/, "");
            const outName = `${cleanName}_converted.${targetFormat}`;
            
            const downloadUrl = URL.createObjectURL(outputBlob);
            
            const downloadLink = document.createElement('a');
            downloadLink.href = downloadUrl;
            downloadLink.download = outName;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            // Add item to history sidebar list
            addHistoryItem(selectedFile.name, outName, downloadUrl);
            
            setTimeout(() => {
                resetWorkspace();
            }, 1000);
        } else {
            throw new Error("Transcoder output returned empty data stream.");
        }

    } catch (err) {
        alert(`Transcoding failed: ${err.message}`);
        
        // Re-enable form
        convertBtn.disabled = false;
        cancelFileBtn.style.display = 'flex';
        processingView.classList.add('hidden');
    }
});

// -------------------------------------------------------------
// 4. SESSION HISTORY HANDLERS
// -------------------------------------------------------------
function addHistoryItem(originalName, convertedName, downloadUrl) {
    const emptyMsg = historyContainer.querySelector('.empty-history');
    if (emptyMsg) {
        emptyMsg.remove();
    }

    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
        <div class="item-info">
            <div class="item-title truncate" title="${convertedName}">${convertedName}</div>
            <div class="item-direction">Source: ${originalName}</div>
        </div>
        <a href="${downloadUrl}" download="${convertedName}" class="download-link">Get file</a>
    `;

    historyContainer.insertBefore(item, historyContainer.firstChild);
    conversionHistory.push({ originalName, convertedName, downloadUrl });
}

clearHistoryBtn.addEventListener('click', () => {
    historyContainer.innerHTML = `
        <div class="empty-history">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
            <p>No completed jobs in this session</p>
        </div>
    `;
    conversionHistory = [];
});

// 3D Card tilt dynamic lighting visual enhancement
document.querySelectorAll('.glass-card, .portal-dropzone').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
    });
});

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    initTheme();
});

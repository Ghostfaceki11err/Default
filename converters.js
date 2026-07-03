// converters.js
// Handles client-side conversions: Documents (Word to PDF) and Images

// Helper: Read a file as ArrayBuffer
function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

// Helper: Read a file as DataURL
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// -------------------------------------------------------------
// 1. IMAGE CONVERSION (PNG, JPG, WebP)
// -------------------------------------------------------------
export async function convertImage(file, targetFormat) {
    const dataUrl = await readFileAsDataURL(file);
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            let mimeType = `image/${targetFormat.toLowerCase()}`;
            if (targetFormat === 'jpg' || targetFormat === 'jpeg') {
                mimeType = 'image/jpeg';
            }

            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error("Image conversion failed."));
                }
            }, mimeType, 0.92); // 92% quality for JPEG/WebP
        };
        img.onerror = () => reject(new Error("Could not load image file."));
        img.src = dataUrl;
    });
}

// -------------------------------------------------------------
// 2. WORD (.docx) TO PDF (Mammoth.js -> HTML -> html2pdf.js)
// -------------------------------------------------------------
export async function convertDocxToPdf(file, progressCallback) {
    try {
        if (progressCallback) progressCallback('Parsing Word file...', 20);
        
        const arrayBuffer = await readFileAsArrayBuffer(file);
        
        // Convert docx to HTML using Mammoth
        const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
        const htmlContent = result.value;
        
        if (progressCallback) progressCallback('Preparing layout...', 50);

        // Create a temporary styled container to render the document beautifully
        const container = document.createElement('div');
        container.style.padding = '40px';
        container.style.fontFamily = '"Times New Roman", Times, serif';
        container.style.fontSize = '12pt';
        container.style.lineHeight = '1.6';
        container.style.color = '#333333';
        container.style.backgroundColor = '#ffffff';
        container.style.width = '700px'; // standard printable width
        container.style.margin = '0 auto';
        container.innerHTML = htmlContent;

        // Apply styled defaults to headings and paragraphs inside container
        container.querySelectorAll('h1').forEach(el => {
            el.style.fontSize = '20pt';
            el.style.marginBottom = '12px';
            el.style.color = '#111';
            el.style.borderBottom = '1px solid #eaeaea';
            el.style.paddingBottom = '6px';
        });
        container.querySelectorAll('h2').forEach(el => {
            el.style.fontSize = '16pt';
            el.style.marginTop = '20px';
            el.style.marginBottom = '8px';
            el.style.color = '#222';
        });
        container.querySelectorAll('p').forEach(el => {
            el.style.marginBottom = '12px';
        });
        container.querySelectorAll('table').forEach(el => {
            el.style.width = '100%';
            el.style.borderCollapse = 'collapse';
            el.style.margin = '15px 0';
        });
        container.querySelectorAll('td, th').forEach(el => {
            el.style.border = '1px solid #ddd';
            el.style.padding = '8px';
        });

        document.body.appendChild(container);

        if (progressCallback) progressCallback('Rendering PDF pages...', 75);

        // Configure PDF output options
        const opt = {
            margin:       [15, 15, 15, 15],
            filename:     file.name.replace(/\.[^/.]+$/, "") + ".pdf",
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Output as pdf blob
        const pdfBlob = await html2pdf().set(opt).from(container).outputPdf('blob');
        
        // Clean up temporary container
        document.body.removeChild(container);

        if (progressCallback) progressCallback('Finished conversion!', 100);
        return pdfBlob;

    } catch (error) {
        console.error(error);
        throw new Error("Failed to convert DOCX to PDF: " + error.message);
    }
}

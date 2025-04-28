// Function to replace __MSG_***__ placeholders in the HTML
function localizeHtmlPage() {
    // Localize elements with data-i18n attribute
    const i18nElements = document.querySelectorAll('[data-i18n]');
    i18nElements.forEach(element => {
        const messageKey = element.getAttribute('data-i18n');
        const message = chrome.i18n.getMessage(messageKey);
        if (message) {
            // Handle elements where innerHTML might be needed (like for spans inside titles)
            if (element.tagName === 'H2' && messageKey === 'heroTitle') {
                 element.innerHTML = message; // Allow HTML like <span>
            } else {
                 element.textContent = message;
            }
        } else {
            console.warn(`No message found for key: ${messageKey}`);
        }
    });

    // Localize specific elements not easily targeted by attribute (like title)
    const pageTitle = chrome.i18n.getMessage('popupTitle');
    if (pageTitle) {
        document.title = pageTitle;
    }

    // Localize button texts explicitly if needed (though data-i18n is preferred)
    // const copyButton = document.getElementById('copyButton');
    // if (copyButton) copyButton.textContent = chrome.i18n.getMessage('copyButtonText');
    // const downloadButton = document.getElementById('downloadButton');
    // if (downloadButton) downloadButton.textContent = chrome.i18n.getMessage('downloadButtonText');

    // Localize initial file name display
    const fileNameSpan = document.getElementById('fileName');
    if (fileNameSpan) {
        fileNameSpan.textContent = chrome.i18n.getMessage('initialFileName');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    localizeHtmlPage(); // Call localization function first

    const fileInput = document.getElementById('fileInput');
    const markdownOutput = document.getElementById('markdownOutput');
    const outputContainer = document.getElementById('outputContainer');
    const copyButton = document.getElementById('copyButton');
    const downloadButton = document.getElementById('downloadButton');
    const statusDiv = document.getElementById('status');

    let originalFileName = ''; // 用于下载文件名

    // Update file name display when a file is chosen
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        const fileNameSpan = document.getElementById('fileName');
        if (file) {
            fileNameSpan.textContent = file.name;
        } else {
            // If no file is chosen (e.g., selection cancelled), reset to default
            fileNameSpan.textContent = chrome.i18n.getMessage('initialFileName');
        }
        handleFileSelect(event); // Call the original handler
    });
    copyButton.addEventListener('click', copyMarkdown);
    downloadButton.addEventListener('click', downloadMarkdown);

    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        // 检查文件类型
        if (!file.name.toLowerCase().endsWith('.docx')) {
            // Use i18n for status message
            showStatus(chrome.i18n.getMessage('statusSelectFile'), true);
            resetUI();
            return;
        }

        originalFileName = file.name.replace(/\.docx$/i, ''); // 保存文件名（不含扩展名）
        showStatus('Converting...', false);
        outputContainer.style.display = 'none'; // 隐藏旧输出

        const reader = new FileReader();

        reader.onload = function(e) {
            const arrayBuffer = e.target.result;
            mammoth.convertToMarkdown({ arrayBuffer: arrayBuffer })
                .then(displayResult)
                .catch(handleError);
        };

        reader.onerror = function(e) {
            // Use i18n for status message
            handleError(chrome.i18n.getMessage('statusReadFileError'));
        };

        reader.readAsArrayBuffer(file);
    }

    function displayResult(result) {
        markdownOutput.value = result.value; // The generated Markdown
        // const messages = result.messages; // Any messages, such as warnings during conversion
        outputContainer.style.display = 'block';
        // Use i18n for status message
        showStatus(chrome.i18n.getMessage('statusSuccess'), false);
        copyButton.disabled = false;
        downloadButton.disabled = false;
    }

    function handleError(err) {
        console.error('Conversion Error:', err);
        // Use i18n for status message, checking if err is already localized
        let errorMessage = typeof err === 'string' ? err : (err.message || chrome.i18n.getMessage('statusUnknownError'));
        // If the error message isn't one of our predefined ones, wrap it
        if (errorMessage !== chrome.i18n.getMessage('statusReadFileError') && errorMessage !== chrome.i18n.getMessage('statusUnknownError')) {
             errorMessage = chrome.i18n.getMessage('statusConversionError', [errorMessage]); // Use placeholder
        }
        showStatus(errorMessage, true);
        resetUI();
    }

    function copyMarkdown() {
        if (!markdownOutput.value) return;
        navigator.clipboard.writeText(markdownOutput.value)
            .then(() => {
                // Use i18n for status message
                showStatus(chrome.i18n.getMessage('statusCopySuccess'), false);
            })
            .catch(err => {
                console.error('Copy Error:', err);
                // Use i18n for status message
                showStatus(chrome.i18n.getMessage('statusCopyError'), true);
            });
    }

    function downloadMarkdown() {
        if (!markdownOutput.value) return;

        const blob = new Blob([markdownOutput.value], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${originalFileName || 'converted'}.md`; // 使用原始文件名
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        // Use i18n for status message
        showStatus(chrome.i18n.getMessage('statusDownloadStarted'), false);
    }

    function showStatus(message, isError = false) {
        statusDiv.textContent = message;
        statusDiv.className = isError ? 'error' : '';
        // Optional: Clear status after a few seconds
        // setTimeout(() => { statusDiv.textContent = ''; statusDiv.className = ''; }, 3000);
    }

    function resetUI() {
        outputContainer.style.display = 'none';
        markdownOutput.value = '';
        copyButton.disabled = true;
        downloadButton.disabled = true;
        originalFileName = '';
        // 不重置 fileInput 的值，以便用户看到他们选择的文件
        // fileInput.value = ''; // 取消这行注释可以在出错时清空文件选择
    }

    // 初始化按钮状态
    copyButton.disabled = true;
    downloadButton.disabled = true;
});
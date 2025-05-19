// Global declarations for DOM elements and other key variables
let videoFileInput, canvas, ctx, darknessThresholdSlider, thresholdValueSpan;
let fontFamilySelect, textScaleSlider, scaleValueSpan;
let videoBlurSlider, blurValueSpan;
let invertMaskButton;
let themeToggleButton;
let debugMaskToggleButton; // Changed from debugMaskCheckbox
let rewindButton, playPauseButton, forwardButton; // New playback buttons
let softnessSlider, softnessValueSpan; // New slider for softness
let guiContent;
let sectionHeaders; // For collapsible sections
let toggleSoftnessModeButton; // Button to toggle soft reveal

let video, offscreenCanvas, offscreenCtx;
// let blurredOffscreenCanvas, blurredOffscreenCtx; // Canvas for pre-blurred video -- Will be replaced
let sourcePaddedCanvas, sourcePaddedCtx; // New: For video with clamped edge padding
let finalBlurredPaddedCanvas, finalBlurredPaddedCtx; // New: For the blurred version of sourcePaddedCanvas

let codeLines = [];
let lastTime = 0;

// New globals for video display positioning
let videoDisplayWidth = 0;
let videoDisplayHeight = 0;
let videoDrawX = 0;
let videoDrawY = 0;

let videoSectionContainer; // New: reference to the video container div

const PREFERRED_WIDTH = 1280;
const PREFERRED_HEIGHT = 720;
const numCodeLines = 100;
const BASE_CODE_LINE_HEIGHT = 14; // Base values, will be scaled
const BASE_CODE_FONT_SIZE = 12;   // Base values, will be scaled
const BLUR_PADDING = 120; // New: Padding around video for edge clamping blur. Increased from 40.

let currentFontFamily = "'Consolas', Monaco, 'Andale Mono', 'Ubuntu Mono', monospace"; // Default font
let currentTextScale = 1.0;
let scaledCodeFontSize = BASE_CODE_FONT_SIZE;
let scaledCodeLineHeight = BASE_CODE_LINE_HEIGHT;
let codeFont = `${scaledCodeFontSize}px ${currentFontFamily}`;
let currentVideoBlur = 14; // Default blur, matches slider
let revealInDarkAreas = true; // true = reveal in dark, false = reveal in light
let isDebugMaskActive = false; // State for the debug mask toggle button
let currentSoftnessLevel = 68; // Default softness, matches slider (0-150)
let isHardSoftnessThresholdActive = false; // false = soft reveal, true = hard threshold

function updateFontAndScale() {
    scaledCodeFontSize = Math.round(BASE_CODE_FONT_SIZE * currentTextScale);
    scaledCodeLineHeight = Math.round(BASE_CODE_LINE_HEIGHT * currentTextScale);
    // Ensure minimum size to prevent issues
    if (scaledCodeFontSize < 5) scaledCodeFontSize = 5;
    if (scaledCodeLineHeight < 7) scaledCodeLineHeight = 7;
    codeFont = `${scaledCodeFontSize}px ${currentFontFamily}`;
    if(scaleValueSpan) scaleValueSpan.textContent = currentTextScale.toFixed(1);
}

// --- Utility function to handle resizing and positioning ---
function resizeCanvasAndVideoLayout() {
    if (!video || !canvas || !videoSectionContainer) return;

    // Desktop layout: canvas takes size of its container, video fits within.
    // Mobile layout: video container's height is set by aspect ratio padding, canvas fills it.

    const isMobileLayout = window.innerWidth <= 800; // Matches CSS media query

    if (video.videoWidth > 0 && video.videoHeight > 0) {
        if (isMobileLayout) {
            const videoAspectRatio = video.videoHeight / video.videoWidth;
            videoSectionContainer.style.paddingBottom = (videoAspectRatio * 100) + '%';
            // Canvas is styled to be position:absolute and 100% width/height of videoSectionContainer
            // So, canvas dimensions will match videoSectionContainer client dimensions
            canvas.width = videoSectionContainer.clientWidth;
            canvas.height = videoSectionContainer.clientHeight; 
        } else {
            // Desktop: Reset any padding-bottom from mobile view
            videoSectionContainer.style.paddingBottom = '0';
            canvas.width = videoSectionContainer.clientWidth;
            canvas.height = videoSectionContainer.clientHeight;
        }
        
        // Common logic for scaling video within the canvas (applies to both layouts)
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const videoTrueAspectRatio = video.videoWidth / video.videoHeight;

        if ((canvasWidth / videoTrueAspectRatio) <= canvasHeight) {
            videoDisplayWidth = canvasWidth;
            videoDisplayHeight = canvasWidth / videoTrueAspectRatio;
        } else {
            videoDisplayHeight = canvasHeight;
            videoDisplayWidth = canvasHeight * videoTrueAspectRatio;
        }
        videoDisplayWidth = Math.floor(videoDisplayWidth);
        videoDisplayHeight = Math.floor(videoDisplayHeight);

        videoDrawX = (canvasWidth - videoDisplayWidth) / 2;
        videoDrawY = (canvasHeight - videoDisplayHeight) / 2;

        offscreenCanvas.width = videoDisplayWidth;
        offscreenCanvas.height = videoDisplayHeight;

        if (videoDisplayWidth > 0 && videoDisplayHeight > 0) {
            sourcePaddedCanvas.width = videoDisplayWidth + 2 * BLUR_PADDING;
            sourcePaddedCanvas.height = videoDisplayHeight + 2 * BLUR_PADDING;
            finalBlurredPaddedCanvas.width = sourcePaddedCanvas.width;
            finalBlurredPaddedCanvas.height = sourcePaddedCanvas.height;
        } else { 
            sourcePaddedCanvas.width = canvasWidth; 
            sourcePaddedCanvas.height = canvasHeight;
            finalBlurredPaddedCanvas.width = canvasWidth;
            finalBlurredPaddedCanvas.height = canvasHeight;
        }

    } else { // Video metadata not loaded yet
        if (isMobileLayout) {
            // Set a default aspect ratio for placeholder before video loads on mobile (e.g., 16:9)
            videoSectionContainer.style.paddingBottom = '56.25%'; // Default to 16:9 
        } else {
            videoSectionContainer.style.paddingBottom = '0';
        }
        canvas.width = videoSectionContainer.clientWidth;
        canvas.height = videoSectionContainer.clientHeight;
        
        // Fallback for video drawing dimensions if video not loaded
        videoDisplayWidth = canvas.width;
        videoDisplayHeight = canvas.height;
        videoDrawX = 0;
        videoDrawY = 0;
        
        offscreenCanvas.width = canvas.width;
        offscreenCanvas.height = canvas.height;
        sourcePaddedCanvas.width = canvas.width;
        sourcePaddedCanvas.height = canvas.height;
        finalBlurredPaddedCanvas.width = canvas.width;
        finalBlurredPaddedCanvas.height = canvas.height;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM element variables now that the DOM is fully loaded
    videoFileInput = document.getElementById('videoFile');
    canvas = document.getElementById('animationCanvas');
    darknessThresholdSlider = document.getElementById('darknessThreshold');
    thresholdValueSpan = document.getElementById('thresholdValue');
    debugMaskToggleButton = document.getElementById('debugMaskToggleButton'); // Updated ID
    fontFamilySelect = document.getElementById('fontFamily');
    textScaleSlider = document.getElementById('textScale');
    scaleValueSpan = document.getElementById('scaleValue');
    videoBlurSlider = document.getElementById('videoBlurAmount');
    blurValueSpan = document.getElementById('blurValue');
    invertMaskButton = document.getElementById('invertMaskButton');
    themeToggleButton = document.getElementById('themeToggleButton');
    guiContent = document.querySelector('.gui-content');
    sectionHeaders = document.querySelectorAll('.gui-section-header');
    rewindButton = document.getElementById('rewindButton');
    playPauseButton = document.getElementById('playPauseButton');
    forwardButton = document.getElementById('forwardButton');
    softnessSlider = document.getElementById('softnessSlider');
    softnessValueSpan = document.getElementById('softnessValue');
    videoSectionContainer = document.getElementById('video-section-container');
    toggleSoftnessModeButton = document.getElementById('toggleSoftnessModeButton'); // Get the new button

    // Critical check: If any essential elements are not found, halt and log error.
    if (!videoFileInput || !canvas || !darknessThresholdSlider || !thresholdValueSpan || !fontFamilySelect || !textScaleSlider || !scaleValueSpan || !videoBlurSlider || !blurValueSpan || !invertMaskButton || !themeToggleButton || !guiContent || !sectionHeaders || !debugMaskToggleButton || !rewindButton || !playPauseButton || !forwardButton || !softnessSlider || !softnessValueSpan || !videoSectionContainer || !toggleSoftnessModeButton) {
        console.error("CRITICAL ERROR: One or more essential HTML elements not found. Please check IDs and classes in index.html.");
        if (!debugMaskToggleButton) console.error("debugMaskToggleButton is missing");
        if (!rewindButton) console.error("rewindButton is missing");
        if (!playPauseButton) console.error("playPauseButton is missing");
        if (!forwardButton) console.error("forwardButton is missing");
        if (!softnessSlider) console.error("softnessSlider is missing");
        if (!softnessValueSpan) console.error("softnessValueSpan is missing");
        if (!videoSectionContainer) console.error("videoSectionContainer is missing");
        if (!toggleSoftnessModeButton) console.error("toggleSoftnessModeButton is missing");
        return; // Stop further execution if elements are missing
    }

    ctx = canvas.getContext('2d');
    video = document.createElement('video');
    offscreenCanvas = document.createElement('canvas');
    offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
    
    // Initialize new canvases for padded/clamped blur
    sourcePaddedCanvas = document.createElement('canvas');
    sourcePaddedCtx = sourcePaddedCanvas.getContext('2d');
    finalBlurredPaddedCanvas = document.createElement('canvas'); 
    finalBlurredPaddedCtx = finalBlurredPaddedCanvas.getContext('2d');

    videoFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            video.src = url;
            video.loop = true;
            video.muted = true;
            video.play().then(() => {
                console.log("Video playback started");
                resizeCanvasAndVideoLayout(); // Call resize function here
                codeLines = generatePseudoCode();
                lastTime = 0;
                requestAnimationFrame(drawFrame);
            }).catch(e => {
                console.error("Error playing video:", e);
                alert("Error playing video. Ensure your browser allows autoplay or try a different video format.");
            });
        }
    });

    if (darknessThresholdSlider && thresholdValueSpan) {
        darknessThresholdSlider.addEventListener('input', () => {
            thresholdValueSpan.textContent = darknessThresholdSlider.value;
        });
        // Initialize display
        thresholdValueSpan.textContent = darknessThresholdSlider.value;
    }

    // Font Family Selector Logic
    if (fontFamilySelect) {
        currentFontFamily = fontFamilySelect.value; // Initialize with the default selected option
        updateFontAndScale(); // Initial font string update
        fontFamilySelect.addEventListener('change', (event) => {
            currentFontFamily = event.target.value;
            updateFontAndScale();
        });
    }

    // Text Scale Slider Logic
    if (textScaleSlider && scaleValueSpan) {
        currentTextScale = parseFloat(textScaleSlider.value);
        updateFontAndScale(); // Initial update
        textScaleSlider.addEventListener('input', (event) => {
            currentTextScale = parseFloat(event.target.value);
            updateFontAndScale();
        });
    }

    // Video Blur Slider Logic
    if (videoBlurSlider && blurValueSpan) {
        currentVideoBlur = parseInt(videoBlurSlider.value);
        blurValueSpan.textContent = currentVideoBlur;
        videoBlurSlider.addEventListener('input', (event) => {
            currentVideoBlur = parseInt(event.target.value);
            blurValueSpan.textContent = currentVideoBlur;
        });
    }

    // Invert Mask Button Logic
    if (invertMaskButton) {
        invertMaskButton.addEventListener('click', () => {
            revealInDarkAreas = !revealInDarkAreas;
            if (revealInDarkAreas) {
                invertMaskButton.textContent = "Reveal in Light Areas";
            } else {
                invertMaskButton.textContent = "Reveal in Dark Areas";
            }
        });
    }

    // Theme Toggle Button Logic
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            // Update icon based on theme (optional)
            if (document.body.classList.contains('dark-mode')) {
                themeToggleButton.textContent = '🌙'; // Moon for dark mode
            } else {
                themeToggleButton.textContent = '☀️'; // Sun for light mode
            }
            // Optional: Save theme preference to localStorage
            // localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
        });
        // Optional: Load theme preference from localStorage
        // const savedTheme = localStorage.getItem('theme');
        // if (savedTheme === 'dark') {
        //     document.body.classList.add('dark-mode');
        //     themeToggleButton.textContent = '🌙';
        // } else {
        //     themeToggleButton.textContent = '☀️';
        // }
    }

    // Collapsible Sections Logic
    if (sectionHeaders) {
        sectionHeaders.forEach(header => {
            header.addEventListener('click', () => {
                header.classList.toggle('collapsed');
                const content = header.nextElementSibling;
                if (content && content.classList.contains('gui-section-content')) {
                    content.classList.toggle('collapsed');
                }
            });
            // Optional: Start some sections collapsed by default
            // if(header.textContent === "Visual Effects") { // Example
            //     header.classList.add('collapsed');
            //     const content = header.nextElementSibling;
            //     if (content) content.classList.add('collapsed');
            // }
        });
    }

    // Debug Mask Toggle Button Logic
    if (debugMaskToggleButton) {
        debugMaskToggleButton.addEventListener('click', () => {
            isDebugMaskActive = !isDebugMaskActive;
            debugMaskToggleButton.classList.toggle('active', isDebugMaskActive);
            debugMaskToggleButton.textContent = isDebugMaskActive ? "Hide Mask Debug" : "Show Mask Debug";
        });
    }

    // Softness Slider Logic
    if (softnessSlider && softnessValueSpan) {
        currentSoftnessLevel = parseInt(softnessSlider.value);
        softnessValueSpan.textContent = currentSoftnessLevel;
        softnessSlider.addEventListener('input', () => {
            currentSoftnessLevel = parseInt(softnessSlider.value);
            softnessValueSpan.textContent = currentSoftnessLevel;
        });
    }

    // Toggle Softness Mode Button Logic
    if (toggleSoftnessModeButton) {
        toggleSoftnessModeButton.addEventListener('click', () => {
            isHardSoftnessThresholdActive = !isHardSoftnessThresholdActive;
            if (isHardSoftnessThresholdActive) {
                toggleSoftnessModeButton.textContent = "Use Soft Reveal";
            } else {
                toggleSoftnessModeButton.textContent = "Use Hard Threshold";
            }
        });
    }

    // Playback Controls Logic
    if (video && rewindButton && playPauseButton && forwardButton) {
        rewindButton.addEventListener('click', () => {
            if (!video.src) return;
            video.currentTime = Math.max(0, video.currentTime - 10);
        });

        playPauseButton.addEventListener('click', () => {
            if (!video.src) return;
            if (video.paused || video.ended) {
                video.play();
            } else {
                video.pause();
            }
        });

        forwardButton.addEventListener('click', () => {
            if (!video.src) return;
            video.currentTime = Math.min(video.duration, video.currentTime + 15);
        });

        // Update play/pause button icon based on video state
        video.addEventListener('play', () => { playPauseButton.textContent = '⏸️'; });
        video.addEventListener('pause', () => { playPauseButton.textContent = '▶️'; });
        video.addEventListener('ended', () => { playPauseButton.textContent = '▶️'; }); // Reset to play when ended
    }

    window.addEventListener('resize', resizeCanvasAndVideoLayout); // Add resize listener
    // Initial call in case video is already loaded or for placeholder state
    // resizeCanvasAndVideoLayout(); // Might be better to call only after video loads
});

function generatePseudoCode() {
    const keywords = ['def', 'class', 'import', 'return', 'for', 'while', 'if', 'else', 'elif', 'try', 'except', 'finally', 'with', 'yield', 'lambda', 'async', 'await'];
    const builtins = ['print', 'len', 'range', 'open', 'str', 'int', 'float', 'list', 'dict', 'set', 'True', 'False', 'None'];
    const operators = ['=', '+', '-', '*', '/', '%', '**', '==', '!=', '<', '>', '<=', '>=', 'and', 'or', 'not', 'in', 'is'];
    const variableNames = ['data', 'result', 'index', 'count', 'value', 'item', 'response', 'status', 'config', 'user_input', 'frame', 'context'];
    const indent = '    ';
    let currentIndent = 0;
    const lines = [];
    for (let i = 0; i < numCodeLines; i++) {
        let line = indent.repeat(currentIndent);
        const r = Math.random();
        if (r < 0.3 && currentIndent > 0 && Math.random() < 0.5) {
            currentIndent--;
            line = indent.repeat(currentIndent);
        }
        const tokenCount = Math.floor(Math.random() * 25) + 15;
        for (let j = 0; j < tokenCount; j++) {
            const tokenType = Math.random();
            if (tokenType < 0.3) {
                line += keywords[Math.floor(Math.random() * keywords.length)] + ' ';
            } else if (tokenType < 0.5) {
                line += variableNames[Math.floor(Math.random() * variableNames.length)];
                if (Math.random() < 0.7) line += operators[Math.floor(Math.random() * operators.length)] + ' ';
                else line += ' ';
            } else if (tokenType < 0.7) {
                line += builtins[Math.floor(Math.random() * builtins.length)] + (Math.random() < 0.3 ? '()' : '') + ' ';
            } else {
                line += `'${Math.random().toString(36).substring(2, 8)}' `;
            }
        }
        if (line.endsWith(': ')) {
            currentIndent = Math.min(currentIndent + 1, 4);
        }
        lines.push(line.trimRight());
    }
    return lines;
}

function drawFrame(timestamp) {
    if (!video || video.paused || video.ended || !ctx || videoDisplayWidth === 0 || videoDisplayHeight === 0 || canvas.width === 0 || canvas.height === 0) {
        if (video && !video.ended) requestAnimationFrame(drawFrame);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw current video frame to offscreenCanvas (unpadded, unblurred)
    if (offscreenCtx) { // Check if context exists
        offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
        offscreenCtx.drawImage(video, 0, 0, videoDisplayWidth, videoDisplayHeight);
    }

    // 2. Handle blurring
    if (currentVideoBlur === 0) {
        // No blur: Draw offscreenCanvas directly to main canvas, clipped
        ctx.save();
        ctx.beginPath();
        ctx.rect(videoDrawX, videoDrawY, videoDisplayWidth, videoDisplayHeight);
        ctx.clip();
        if (offscreenCanvas.width > 0 && offscreenCanvas.height > 0) {
             ctx.drawImage(offscreenCanvas, 0, 0, videoDisplayWidth, videoDisplayHeight, videoDrawX, videoDrawY, videoDisplayWidth, videoDisplayHeight);
        }
        ctx.restore();
    } else if (sourcePaddedCtx && finalBlurredPaddedCtx && sourcePaddedCanvas.width > 0 && sourcePaddedCanvas.height > 0 && offscreenCanvas.width > 0 && offscreenCanvas.height > 0) {
        // Blur with edge clamping:
        sourcePaddedCtx.clearRect(0, 0, sourcePaddedCanvas.width, sourcePaddedCanvas.height);

        // Draw video to center of sourcePaddedCanvas
        sourcePaddedCtx.drawImage(offscreenCanvas, 0, 0, videoDisplayWidth, videoDisplayHeight, BLUR_PADDING, BLUR_PADDING, videoDisplayWidth, videoDisplayHeight);

        // Clamp/Stretch edge pixels
        // Top border
        sourcePaddedCtx.drawImage(offscreenCanvas, 0, 0, videoDisplayWidth, 1, BLUR_PADDING, 0, videoDisplayWidth, BLUR_PADDING);
        // Bottom border
        sourcePaddedCtx.drawImage(offscreenCanvas, 0, videoDisplayHeight - 1, videoDisplayWidth, 1, BLUR_PADDING, videoDisplayHeight + BLUR_PADDING, videoDisplayWidth, BLUR_PADDING);
        // Left border
        sourcePaddedCtx.drawImage(offscreenCanvas, 0, 0, 1, videoDisplayHeight, 0, BLUR_PADDING, BLUR_PADDING, videoDisplayHeight);
        // Right border
        sourcePaddedCtx.drawImage(offscreenCanvas, videoDisplayWidth - 1, 0, 1, videoDisplayHeight, videoDisplayWidth + BLUR_PADDING, BLUR_PADDING, BLUR_PADDING, videoDisplayHeight);
        // Corners
        // Top-left
        sourcePaddedCtx.drawImage(offscreenCanvas, 0, 0, 1, 1, 0, 0, BLUR_PADDING, BLUR_PADDING);
        // Top-right
        sourcePaddedCtx.drawImage(offscreenCanvas, videoDisplayWidth - 1, 0, 1, 1, videoDisplayWidth + BLUR_PADDING, 0, BLUR_PADDING, BLUR_PADDING);
        // Bottom-left
        sourcePaddedCtx.drawImage(offscreenCanvas, 0, videoDisplayHeight - 1, 1, 1, 0, videoDisplayHeight + BLUR_PADDING, BLUR_PADDING, BLUR_PADDING);
        // Bottom-right
        sourcePaddedCtx.drawImage(offscreenCanvas, videoDisplayWidth - 1, videoDisplayHeight - 1, 1, 1, videoDisplayWidth + BLUR_PADDING, videoDisplayHeight + BLUR_PADDING, BLUR_PADDING, BLUR_PADDING);

        // Apply blur to sourcePaddedCanvas and draw to finalBlurredPaddedCanvas
        finalBlurredPaddedCtx.filter = `blur(${currentVideoBlur}px)`;
        finalBlurredPaddedCtx.clearRect(0, 0, finalBlurredPaddedCanvas.width, finalBlurredPaddedCanvas.height);
        finalBlurredPaddedCtx.drawImage(sourcePaddedCanvas, 0, 0);
        finalBlurredPaddedCtx.filter = 'none';

        // Draw the central part of finalBlurredPaddedCanvas to main canvas, clipped
        ctx.save();
        ctx.beginPath();
        ctx.rect(videoDrawX, videoDrawY, videoDisplayWidth, videoDisplayHeight);
        ctx.clip();
        if (finalBlurredPaddedCanvas.width > 0 && finalBlurredPaddedCanvas.height > 0) {
            ctx.drawImage(finalBlurredPaddedCanvas, BLUR_PADDING, BLUR_PADDING, videoDisplayWidth, videoDisplayHeight, videoDrawX, videoDrawY, videoDisplayWidth, videoDisplayHeight);
        }
        ctx.restore();
    } else {
        // Fallback if canvases aren't ready for blur (e.g. initial load): draw unblurred
        ctx.save();
        ctx.beginPath();
        ctx.rect(videoDrawX, videoDrawY, videoDisplayWidth, videoDisplayHeight);
        ctx.clip();
        if (offscreenCanvas.width > 0 && offscreenCanvas.height > 0) {
            ctx.drawImage(offscreenCanvas, 0, 0, videoDisplayWidth, videoDisplayHeight, videoDrawX, videoDrawY, videoDisplayWidth, videoDisplayHeight);
        }
        ctx.restore();
    }

    // 3. Get pixel data for text reveal (from unblurred offscreenCanvas)
    const imageData = (offscreenCtx && offscreenCanvas.width > 0 && offscreenCanvas.height > 0) ? 
                      offscreenCtx.getImageData(0, 0, videoDisplayWidth, videoDisplayHeight) : 
                      null;
    const data = imageData ? imageData.data : null;

    // 4. Draw Debug Mask (if active)
    if (isDebugMaskActive && data && videoDisplayWidth > 0 && videoDisplayHeight > 0) {
        ctx.save();
        let debugCanvas = document.createElement('canvas');
        debugCanvas.width = videoDisplayWidth; // Use videoDisplayWidth for debug canvas
        debugCanvas.height = videoDisplayHeight; // Use videoDisplayHeight
        let debugCtx = debugCanvas.getContext('2d');
        let debugImageData = debugCtx.createImageData(videoDisplayWidth, videoDisplayHeight);
        let debugData = debugImageData.data;
        const currentThreshold = parseInt(darknessThresholdSlider.value);
        // The data for loop for debug mask is based on offscreenCanvas/imageData which matches videoDisplayWidth/Height
        for (let i = 0; i < data.length; i += 4) { 
            const r_vid = data[i];
            const g_vid = data[i + 1];
            const b_vid = data[i + 2];
            const luminance = 0.2126 * r_vid + 0.7152 * g_vid + 0.0722 * b_vid;
            let conditionMet = false;
            if (revealInDarkAreas) {
                conditionMet = luminance <= currentThreshold;
            } else {
                conditionMet = luminance > currentThreshold;
            }
            if (conditionMet) {
                debugData[i] = 255; debugData[i + 1] = 255; debugData[i + 2] = 0; debugData[i + 3] = 100;
            } else {
                debugData[i + 3] = 0;
            }
        }
        debugCtx.putImageData(debugImageData, 0, 0);
        ctx.globalAlpha = 0.5;
        ctx.drawImage(debugCanvas, videoDrawX, videoDrawY, videoDisplayWidth, videoDisplayHeight);
        ctx.globalAlpha = 1.0;
        ctx.restore();
    }

    // 5. Draw Code Text
    if (data) { // Only draw text if we have luminance data
        ctx.font = codeFont;
        ctx.fillStyle = '#FFFFFF'; // Set text color to white
        // Code drawing loop remains largely the same, but character positions (charDrawPosX, currentYLinePos)
        // are on the main canvas. The check `isOverVideo` correctly uses videoDrawX/Y/Width/Height.
        const charWidth = scaledCodeFontSize * 0.6;
        const charHeight = scaledCodeFontSize;

        for (let i = 0; i < numCodeLines; i++) {
            const currentYLinePos = (i * scaledCodeLineHeight) + scaledCodeLineHeight;
            // Check against main canvas height (which is video section height)
            if (currentYLinePos < 0 || currentYLinePos > canvas.height + scaledCodeLineHeight) continue;

            for (let charIndex = 0; charIndex < codeLines[i].length; charIndex++) {
                const char = codeLines[i][charIndex];
                const charDrawPosX = charIndex * charWidth;
                
                // Check against main canvas width (which is video section width)
                if (charDrawPosX + charWidth < 0 || charDrawPosX > canvas.width) continue;

                const charCenterX = charDrawPosX + charWidth / 2;
                const charCenterY = currentYLinePos - charHeight / 2;
                let charAlpha = 0;

                const isOverVideo = charCenterX >= videoDrawX && charCenterX < videoDrawX + videoDisplayWidth &&
                                    charCenterY >= videoDrawY && charCenterY < videoDrawY + videoDisplayHeight;

                if (isOverVideo) {
                    // Sample from offscreenCanvas which is videoDisplayWidth/Height
                    const sampleX = Math.floor(((charCenterX - videoDrawX) / videoDisplayWidth) * offscreenCanvas.width);
                    const sampleY = Math.floor(((charCenterY - videoDrawY) / videoDisplayHeight) * offscreenCanvas.height);

                    if (sampleX >= 0 && sampleX < offscreenCanvas.width && sampleY >= 0 && sampleY < offscreenCanvas.height) {
                        const pixelIndex = (sampleY * offscreenCanvas.width + sampleX) * 4;
                        const r_vid = data[pixelIndex];
                        const g_vid = data[pixelIndex + 1];
                        const b_vid = data[pixelIndex + 2];
                        const luminance = 0.2126 * r_vid + 0.7152 * g_vid + 0.0722 * b_vid;
                        const currentThreshold = parseInt(darknessThresholdSlider.value);

                        if (isHardSoftnessThresholdActive) {
                            // Hard threshold logic
                            if (revealInDarkAreas) {
                                if (luminance <= currentThreshold) charAlpha = 1;
                                else charAlpha = 0;
                            } else {
                                if (luminance > currentThreshold) charAlpha = 1;
                                else charAlpha = 0;
                            }
                        } else {
                            // Soft reveal calculation logic
                            let baseAlpha = 0;
                            if (revealInDarkAreas) {
                                if (luminance <= currentThreshold && currentThreshold > 0) {
                                    baseAlpha = (currentThreshold - luminance) / currentThreshold;
                                } else if (luminance <= currentThreshold && currentThreshold === 0) {
                                    baseAlpha = (luminance === 0) ? 1 : 0;
                                }
                            } else { 
                                if (luminance > currentThreshold && (255 - currentThreshold) > 0) {
                                    baseAlpha = (luminance - currentThreshold) / (255 - currentThreshold);
                                } else if (luminance > currentThreshold && (255 - currentThreshold) === 0) {
                                    baseAlpha = (luminance === 255) ? 1 : 0;
                                }
                            }
                            baseAlpha = Math.max(0, Math.min(1, baseAlpha));
                            
                            let exponent = Math.max(0.1, 4.0 - (currentSoftnessLevel / 150.0) * 3.9);
                            
                            charAlpha = Math.pow(baseAlpha, exponent);
                            charAlpha = Math.max(0, Math.min(1, charAlpha)); 
                        }
                    }
                }
                
                if (charAlpha > 0) {
                    ctx.globalAlpha = charAlpha; // Apply calculated alpha for softness
                    ctx.fillText(char, charDrawPosX, currentYLinePos);
                    ctx.globalAlpha = 1.0; // Reset globalAlpha for other drawing operations
                }
            }
        }
    }
    requestAnimationFrame(drawFrame);
} 
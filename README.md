Dynamic Code Reveal Over User Video
This web application creates a striking "Dynamic Code Reveal" animation. It uses a user-imported video as a dynamic, blurred background. Scrolling or static code-like text is then revealed based on the video's luminance, creating an effect where the code appears through the brighter (or darker) parts of the video.
The project features a modern, responsive, iOS-inspired graphical user interface (GUI) for controlling various aspects of the animation.
Key Features:
Dynamic Text Reveal: Code text is revealed or hidden based on the luminance of the underlying video pixels.
User Video Import: Easily upload your own video to serve as the animation's background and luminance source.
Blurred Video Background: The uploaded video is used as a heavily blurred, animated backdrop.
Sophisticated GUI:
Video Upload: Simple interface for selecting local video files.
Luminance Control: Adjust the threshold for text reveal and invert the mask (reveal in light or dark areas).
Softness Control: Toggle between a hard cut-off or a soft, feathered reveal for the text, with adjustable softness.
Text Styling: Select font families and scale the code text.
Blur Control: Adjust the amount of Gaussian blur applied to the background video. The blur is edge-clamped to maintain sharp video boundaries.
Playback Controls: Rewind, Play/Pause, and Fast-Forward the video.
Debug View: Toggle a visual representation of the luminance mask.
Theme Toggle: Switch between Light and Dark UI modes.
Responsive Design: The layout adapts for optimal viewing on desktop, tablet, and mobile devices.
Performance: Uses HTML5 Canvas for efficient real-time video processing and rendering.
How It Works:
The application continuously analyzes video frames on an offscreen canvas to determine luminance values. This data is then used to modulate the alpha (opacity) of individual characters of generated pseudo-code, which are drawn onto the main canvas. The background video is processed separately to create a padded, edge-clamped blur effect, ensuring sharp video edges even with significant blur.
Built with HTML5 Canvas, CSS3 (featuring custom properties, flexbox, and responsive design), and modern JavaScript (ES6+).
Optional additions you might consider:
A "Live Demo" link if you host it on GitHub Pages or elsewhere.
A "To-Do" or "Future Enhancements" section if you plan to add more features (like custom code input, presets, code flicker, etc.).
A "Screenshots" section with a couple of appealing images of the app in action.

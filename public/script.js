async function fetchVideos() {
    try {
        const response = await fetch("http://localhost:4001/videos");
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const videos = await response.json();
        const videoList = document.getElementById("videoList");
        videoList.innerHTML = ""; // Clear old content

        if (!videos.length) {
            videoList.innerHTML = "<p>No videos found.</p>";
            return;
        }

        videos.forEach(video => {
            // ✅ Only process .mp4 files
            if (!video.filename.endsWith(".mp4")) return;

            const videoElement = document.createElement("video");
            videoElement.src = `http://localhost:4001/video/${video.filename}`; // Corrected URL
            videoElement.controls = true;
            videoElement.width = 320;

            const videoContainer = document.createElement("div");
            videoContainer.appendChild(document.createTextNode(video.filename));
            videoContainer.appendChild(videoElement);
            videoList.appendChild(videoContainer);
        });
    } catch (error) {
        console.error("Error fetching videos:", error);
    }
}

window.onload = fetchVideos; // Call function when page loads

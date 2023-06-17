const processedThumbnails = []
const failedThumbnails = []

// Fetch YouTube video thumbnails and apply image overlay
function fetchAndModifyThumbnails() {
    const thumbnailElements = document.querySelectorAll('#thumbnail');
    thumbnailElements.forEach((thumbnailElement) => {
        try {
            const videoURL = thumbnailElement.href
            const videoId = getVideoIdFromUrl(videoURL);
            if (!processedThumbnails.includes(videoId) && videoURL !== "") {
                fetchThumbnail(videoId)
                    .then((thumbnailUrl) => {
                        const overlayImageUrl = getRandomImageFromDirectory();

                        // Save the thumbnail image
                        saveImageLocally(thumbnailUrl, `thumbnail_${videoId}.jpg`);

                        const overlayImage = new Image();
                        overlayImage.crossOrigin = 'anonymous';
                        overlayImage.src = overlayImageUrl;

                        overlayImage.onload = () => {
                            const canvas = document.createElement('canvas');
                            canvas.width = overlayImage.width;
                            canvas.height = overlayImage.height;

                            const context = canvas.getContext('2d');
                            context.drawImage(overlayImage, 0, 0);
                            context.globalCompositeOperation = 'source-in';

                            const thumbnailImage = new Image();
                            thumbnailImage.crossOrigin = 'anonymous';
                            thumbnailImage.src = thumbnailUrl;

                            thumbnailImage.onload = () => {
                                context.drawImage(thumbnailImage, 0, 0);

                                const modifiedThumbnailUrl = canvas.toDataURL();
                                thumbnailElement.querySelector('img').src = modifiedThumbnailUrl;
                            };
                        };
                    })
                    .catch((error) => {
                        console.error('Error fetching thumbnail:', error);
                    });
            }
        } catch (error) {
            if (!failedThumbnails.includes(thumbnailElement)) {
                console.log(error)
                console.log((thumbnailElement.href || "<empty string>") + " is not a valid URL, retrying.");
                failedThumbnails.push(thumbnailElement)
            }
        }
    });
}

// Get video ID from YouTube video URL
function getVideoIdFromUrl(url) {
    const urlParams = new URLSearchParams(new URL(url).search);
    return urlParams.get('v');
}

// Fetch thumbnail URL using YouTube Data API
function fetchThumbnail(videoId) {
    const apiKey = 'AIzaSyCLvkzKtkqX-p-XuPlW8oI6Y9z1wNqzkG8';
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;
    console.log(apiUrl)
    processedThumbnails.push(videoId) // Adds video to the list of processed thumbnails
    return fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            const thumbnailUrl = data.items[0].snippet.thumbnails.default.url;
            console.log('Thumbnail URL:', thumbnailUrl);
        })
        .catch(error => {
            console.error('Error fetching video details: ' + apiUrl, error);
        });
}



// Get a random image URL from a directory
function getRandomImageFromDirectory() {
    const images = ['1.png', '2.png', '3.png'];
    const randomIndex = Math.floor(Math.random() * images.length);
    return browser.extension.getURL('images/' + images[randomIndex]);
}

// Save image locally
async function saveImageLocally(imageUrl, filename) {
    try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error saving image:', error);
    }
}


setInterval(function () {
    fetchAndModifyThumbnails();
}, 1000);

console.log("File Loaded Successfully");
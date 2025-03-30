import html2canvas from 'html2canvas';

// Function to generate a preview image from the calendar
export const generateCalendarPreview = async (calendarRef, events) => {
  if (!calendarRef.current || events.length === 0) {
    return null;
  }

  try {
    // Render the calendar to a canvas
    const canvas = await html2canvas(calendarRef.current, {
      backgroundColor: '#FFFFFF',
      scale: 1,
      logging: false,
      width: 1200,
      height: 630,
      windowWidth: 1200,
      windowHeight: 630,
    });

    // Convert canvas to data URL
    const dataUrl = canvas.toDataURL('image/png');
    return dataUrl;
  } catch (error) {
    console.error('Error generating preview image:', error);
    return null;
  }
};

// Function to update meta tags with the new preview image
export const updateMetaTags = (imageDataUrl) => {
  if (!imageDataUrl) return;

  // Get the meta tags
  const ogImageMeta = document.getElementById('og-image');
  const twitterImageMeta = document.getElementById('twitter-image');

  // Update the meta tags to use the data URL
  if (ogImageMeta) {
    ogImageMeta.setAttribute('content', imageDataUrl);
  }

  if (twitterImageMeta) {
    twitterImageMeta.setAttribute('content', imageDataUrl);
  }
};

// Create an actual image file and save for sharing (more compatible with some platforms)
export const savePreviewImage = async (dataUrl) => {
  if (!dataUrl) return;

  // Convert data URL to Blob
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  // Save the blob as 'preview.png' in the public folder
  // This is just a placeholder - in a real app, this would be uploaded to a server
  // or other storage solution, as client-side JavaScript cannot directly save files to the server
  
  // For demonstration, we create a temporary URL
  const url = URL.createObjectURL(blob);
  
  // Update meta tags to use this URL
  const ogImageMeta = document.getElementById('og-image');
  const twitterImageMeta = document.getElementById('twitter-image');
  
  if (ogImageMeta) {
    ogImageMeta.setAttribute('content', url);
  }
  if (twitterImageMeta) {
    twitterImageMeta.setAttribute('content', url);
  }
  
  // Return the URL for potential other uses
  return url;
};
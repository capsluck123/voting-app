// Cloudinary upload utility for candidate images
// cloud name: dwn9zbpcj, unsigned upload preset: votingapp

export async function uploadToCloudinary(file) {
  const url = 'https://api.cloudinary.com/v1_1/dwn9zbpcj/image/upload';
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'votingapp');

  const response = await fetch(url, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error('Failed to upload image to Cloudinary');
  }

  const data = await response.json();
  return data.secure_url; // Use this URL to display the image
}

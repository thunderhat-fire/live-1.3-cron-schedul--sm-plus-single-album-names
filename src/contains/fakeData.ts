// Avatar images
export const avatarImgs = Array.from({ length: 10 }, (_, i) => `/images/avatars/Image-${i + 1}.png`);

// Default avatar for when no image is provided
export const defaultAvatar = "/images/avatars/default-avatar.png";

// Helper functions for random data (used in blog/comments)
export const _getPersonNameRd = () => "John Doe";
export const _getTagNameRd = () => "Music";
export const _getImgRd = () => "/images/placeholder-image.jpg";

// Blog images
export const imgHigtQualitys = Array.from({ length: 6 }, () => "/images/placeholder-blog.jpg");
export const featuredImgs = Array.from({ length: 6 }, () => "/images/placeholder-featured.jpg");

// Placeholder images for various components
export const placeholderImage = "/images/placeholder-vinyl.png";
export const defaultBlogImage = "/images/placeholder-blog.jpg";
export const defaultLargeImage = "/images/placeholder-large.jpg"; 
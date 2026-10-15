/**
 * Injects Cloudinary transformations for automatic format (WebP/AVIF),
 * perceptual quality compression, and responsive width limits.
 *
 * @param {string} url - Original Cloudinary image URL
 * @param {Object} options - Optimization options
 * @param {number|string} [options.width] - Maximum image width in pixels
 * @param {string} [options.quality='auto'] - Cloudinary quality level (e.g. 'auto', 'auto:eco', 'auto:good')
 * @param {string} [options.format='auto'] - Output format (e.g. 'auto', 'webp')
 * @returns {string} Optimized image URL or original URL if not Cloudinary
 */
export const optimizeImage = (url, options = {}) => {
  if (!url || typeof url !== "string") {
    return url || "";
  }

  // Pass through local or non-Cloudinary images
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }

  // Avoid duplicate injection if already optimized
  if (url.includes("/upload/f_") || url.includes("/upload/q_")) {
    return url;
  }

  const { width, quality = "auto", format = "auto" } = options;
  const transforms = [];

  if (format) {
    transforms.push(`f_${format}`);
  }
  if (quality) {
    transforms.push(`q_${quality}`);
  }
  if (width) {
    transforms.push(`w_${width},c_limit`);
  }

  const transformString = transforms.join(",");
  return url.replace("/upload/", `/upload/${transformString}/`);
};

export default optimizeImage;

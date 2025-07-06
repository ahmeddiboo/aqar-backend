const cloudinary = require("../config/cloudinary");
const { Readable } = require("stream");
const AppError = require("./appError");

/**
 * Upload a buffer to Cloudinary
 * @param {Buffer} buffer - The file buffer to upload
 * @param {String} folder - The folder to upload to (e.g., 'properties')
 * @param {String} publicId - Optional custom public ID for the file
 * @returns {Promise} - Promise with Cloudinary upload result
 */
exports.uploadBuffer = async (buffer, folder = "aqar-kam", publicId = null) => {
  try {
    return new Promise((resolve, reject) => {
      // Create a readable stream from the buffer
      const stream = Readable.from([buffer]);

      // Create upload stream to Cloudinary
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: "auto",
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload stream error:", error);
            return reject(
              new AppError(
                `فشل في رفع الصور: ${error.message || "خطأ غير معروف"}`,
                500
              )
            );
          }
          resolve(result);
        }
      );

      // Pipe the buffer stream to Cloudinary upload stream
      stream.pipe(uploadStream);
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new AppError(
      `فشل في رفع الصور: ${error.message || "خطأ غير معروف"}`,
      500
    );
  }
};

/**
 * Delete an image from Cloudinary
 * @param {String} publicId - The public ID of the image to delete
 * @returns {Promise} - Promise with Cloudinary deletion result
 */
exports.deleteImage = async (publicId) => {
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw new AppError("حدث خطأ أثناء حذف الصورة", 500);
  }
};

/**
 * Get public ID from Cloudinary URL
 * @param {String} url - Cloudinary URL
 * @returns {String|null} - Public ID or null if not a Cloudinary URL
 */
exports.getPublicIdFromUrl = (url) => {
  if (!url || typeof url !== "string") return null;

  try {
    // Check if it's a Cloudinary URL
    if (!url.includes("cloudinary.com")) return null;

    // Extract the public ID from URL
    // Format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/public_id
    const urlParts = url.split("/");
    const uploadIndex = urlParts.findIndex((part) => part === "upload");

    if (uploadIndex === -1) return null;

    // Join all parts after "upload" except the file extension
    const publicIdWithVersion = urlParts.slice(uploadIndex + 1).join("/");

    // Remove version if present (v1234567890/)
    const publicId = publicIdWithVersion.replace(/^v\d+\//, "");

    // Remove file extension if present
    return publicId.replace(/\.[^/.]+$/, "");
  } catch (error) {
    console.error("Error extracting public ID:", error);
    return null;
  }
};

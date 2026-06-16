const cloudinary = require('cloudinary').v2;
const stream = require('stream');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET_KEY,
});

// ✅ Cloudinary upload from memory (buffer)
const cloudUpload = async (file) => {
  try {
    return await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto' },
        (error, result) => {
          if (error) return reject(error);
          return resolve(result);
        }
      );

      const bufferStream = new stream.PassThrough();
      bufferStream.end(file.buffer);
      bufferStream.pipe(uploadStream);
    });
  } catch (error) {
    console.error("Cloud upload error:", error);
    throw new Error('Failed to upload image to cloud');
  }
};

// ✅ Cloudinary delete
const cloudRemove = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Cloud delete error:", error);
    throw new Error('Failed to delete image from cloud');
  }
};

module.exports = { cloudUpload, cloudRemove };

import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('CRITICAL WARNING: Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are missing or incomplete in environment configuration!');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = (
  fileBuffer: Buffer,
  folder: string = 'lms-salary-slips',
  originalname?: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Check if configuration exists before initiating stream to fail fast
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return reject(new Error('Cloudinary credentials are not configured in environment variables.'));
    }

    let resource_type: 'image' | 'raw' | 'auto' = 'auto';
    const options: any = { folder };

    if (originalname) {
      const ext = originalname.split('.').pop()?.toLowerCase();
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff'];
      if (ext && imageExtensions.includes(ext)) {
        resource_type = 'image';
      } else {
        resource_type = 'raw';
        // For raw files, specify public_id with the file extension to preserve it
        const sanitizedName = originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        options.public_id = `${Date.now()}-${sanitizedName}`;
      }
    }
    options.resource_type = resource_type;

    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          return reject(error);
        }
        if (!result) {
          return reject(new Error('Cloudinary upload returned empty result'));
        }
        resolve(result.secure_url);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import 'dotenv/config';

const readCloudinaryConfig = () => {
  const config = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
    api_key: process.env.CLOUDINARY_API_KEY?.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
  };

  if (config.api_key && config.api_secret && !/^\d+$/.test(config.api_key) && /^\d+$/.test(config.api_secret)) {
    console.warn('Cloudinary API key and secret appear to be swapped. Using corrected order.');
    return {
      ...config,
      api_key: config.api_secret,
      api_secret: config.api_key,
    };
  }

  return config;
};

const cloudinaryConfig = readCloudinaryConfig();

const getCloudinaryConfigErrors = () => {
  const errors = [];

  if (!cloudinaryConfig.cloud_name) {
    errors.push('CLOUDINARY_CLOUD_NAME is missing');
  }

  if (!cloudinaryConfig.api_key) {
    errors.push('CLOUDINARY_API_KEY is missing');
  } else if (!/^\d+$/.test(cloudinaryConfig.api_key)) {
    errors.push('CLOUDINARY_API_KEY must be the numeric API key from Cloudinary');
  }

  if (!cloudinaryConfig.api_secret) {
    errors.push('CLOUDINARY_API_SECRET is missing');
  }

  return errors;
};

const cloudinaryConfigErrors = getCloudinaryConfigErrors();

cloudinary.config({
  cloud_name: cloudinaryConfig.cloud_name,
  api_key: cloudinaryConfig.api_key,
  api_secret: cloudinaryConfig.api_secret,
});

const unavailableUpload = {
  single: () => (req, res) => {
    res.status(503).json({
      error: 'Cloudinary is not configured correctly',
      details: cloudinaryConfigErrors,
    });
  },
};

const storage =
  cloudinaryConfigErrors.length === 0
    ? new CloudinaryStorage({
        cloudinary,
        params: {
          folder: 'medilite_records',
          allowed_formats: ['jpg', 'png', 'pdf', 'txt'],
          resource_type: 'auto',
        },
      })
    : null;

export const getCloudinaryStatus = () => ({
  configured: cloudinaryConfigErrors.length === 0,
  errors: cloudinaryConfigErrors,
  cloudName: cloudinaryConfig.cloud_name || null,
  apiKeyLooksValid: Boolean(cloudinaryConfig.api_key && /^\d+$/.test(cloudinaryConfig.api_key)),
});

export const handleCloudinaryUploadError = (error, req, res, next) => {
  if (!error) {
    next();
    return;
  }

  const message = error.message || 'Cloudinary upload failed';

  if (message.toLowerCase().includes('cloud_name') || message.toLowerCase().includes('api_key')) {
    res.status(503).json({
      error: 'Cloudinary credentials are invalid',
      details: message,
    });
    return;
  }

  res.status(500).json({ error: message });
};

export const upload = storage ? multer({ storage }) : unavailableUpload;
export default cloudinary;

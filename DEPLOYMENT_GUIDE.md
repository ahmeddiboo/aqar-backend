# عقار كام Backend Deployment Guide

## Railway Deployment Setup

### 1. Environment Variables

Ensure these environment variables are set in your Railway project:

```
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>
JWT_SECRET=<your-secret-jwt-key>
NODE_ENV=production

# Cloudinary (for image uploads) - CRITICAL FOR IMAGE FUNCTIONALITY
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
```

### 2. Verify Cloudinary Configuration

Make sure your Cloudinary account:

- Is properly set up and active
- Has sufficient upload credits available
- Has the correct permissions set

### 3. Deployment Process

1. Commit your changes:

```bash
git add .
git commit -m "Fix Cloudinary upload in project controller"
```

2. Push to your repository (if using GitHub integration with Railway):

```bash
git push origin main
```

3. Or deploy directly to Railway:

```bash
railway up
```

### 4. Verify Deployment

1. Check your Railway logs for any errors after deployment
2. Test creating a project with image uploads
3. Verify that images are appearing in your Cloudinary dashboard

### 5. Troubleshooting

If you continue to experience issues:

1. Check Railway logs for detailed error messages
2. Verify that all environment variables are correctly set
3. Try uploading a smaller image to eliminate size restrictions
4. Test Cloudinary connectivity using the test-cloudinary-simple.js script:

```bash
node test-cloudinary-simple.js
```

### 6. Data Validation

The form data you shared appears to be valid, but make sure:

- All required fields are filled
- Image files are valid and not corrupted
- File sizes don't exceed Cloudinary limits (10MB per file by default)

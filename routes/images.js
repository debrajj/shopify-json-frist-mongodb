const express = require('express');
const router = express.Router();
const multer = require('multer');
const mongoose = require('mongoose');
const Image = require('../models/Image');

// Use memory storage for multer
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Dashboard page
router.get('/', async (req, res) => {
  try {
    const images = await Image.find().sort({ uploadedAt: -1 });
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Image Dashboard</title>
        <style>
          body { font-family: Arial; max-width: 1200px; margin: 0 auto; padding: 20px; }
          h1 { color: #5c6ac4; }
          .upload-form { background: #f4f6f8; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
          .images-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; }
          .image-card { border: 1px solid #ddd; border-radius: 8px; padding: 10px; background: white; }
          .image-card img { width: 100%; height: 150px; object-fit: cover; border-radius: 4px; }
          .image-info { margin-top: 10px; font-size: 12px; color: #666; }
          button { background: #5c6ac4; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
          button:hover { background: #4c5ab4; }
          input[type="file"] { margin: 10px 0; }
        </style>
      </head>
      <body>
        <h1>📸 Image Upload Dashboard</h1>
        
        <div class="upload-form">
          <h2>Upload New Image</h2>
          <form action="/dashboard/upload" method="POST" enctype="multipart/form-data">
            <input type="file" name="image" accept="image/*" required>
            <button type="submit">Upload Image</button>
          </form>
        </div>

        <h2>Uploaded Images (${images.length})</h2>
        <div class="images-grid">
          ${images.map(img => `
            <div class="image-card">
              <img src="/api/images/${img._id}" alt="${img.originalName}">
              <div class="image-info">
                <strong>${img.originalName}</strong><br>
                Size: ${(img.size / 1024).toFixed(2)} KB<br>
                Uploaded: ${new Date(img.uploadedAt).toLocaleDateString()}
              </div>
            </div>
          `).join('')}
        </div>

        <br><br>
        <p><strong>API Endpoint:</strong> <code>GET /api/images</code> - Returns all image data</p>
        <p><a href="/api/images" target="_blank">View API Response</a></p>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).send('Error loading dashboard');
  }
});

// Upload image
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded');
    }

    // Create GridFS bucket using mongoose's mongodb
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'images'
    });

    // Create upload stream
    const filename = `${Date.now()}-${req.file.originalname}`;
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: req.file.mimetype
    });

    // Write file buffer to GridFS
    uploadStream.end(req.file.buffer);

    uploadStream.on('finish', async () => {
      // Save image metadata to MongoDB
      const image = new Image({
        filename: filename,
        originalName: req.file.originalname,
        contentType: req.file.mimetype,
        size: req.file.size,
        gridfsId: uploadStream.id,
        shop: process.env.SHOPIFY_SHOP_DOMAIN
      });

      await image.save();
      res.redirect('/dashboard');
    });

    uploadStream.on('error', (error) => {
      console.error('Upload stream error:', error);
      res.status(500).send('Upload failed');
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).send('Upload failed');
  }
});

module.exports = router;

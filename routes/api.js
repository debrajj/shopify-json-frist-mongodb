const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Image = require('../models/Image');

// Get all images metadata
router.get('/images', async (req, res) => {
  try {
    const images = await Image.find().sort({ uploadedAt: -1 });
    
    const imageData = images.map(img => ({
      id: img._id,
      filename: img.filename,
      originalName: img.originalName,
      contentType: img.contentType,
      size: img.size,
      uploadedAt: img.uploadedAt,
      url: `${process.env.HOST}/api/images/${img._id}`,
      shop: img.shop
    }));

    res.json({
      success: true,
      count: imageData.length,
      images: imageData
    });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch images' });
  }
});

// Get single image file
router.get('/images/:id', async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const db = mongoose.connection.db;
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'images' });
    
    const downloadStream = bucket.openDownloadStream(image.gridfsId);
    
    res.set('Content-Type', image.contentType);
    res.set('Content-Disposition', `inline; filename="${image.originalName}"`);
    
    downloadStream.pipe(res);
    
    downloadStream.on('error', (error) => {
      console.error('Stream error:', error);
      res.status(404).json({ error: 'File not found' });
    });
  } catch (error) {
    console.error('Image fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch image' });
  }
});

module.exports = router;

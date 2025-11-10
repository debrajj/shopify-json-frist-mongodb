require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const imageRoutes = require('./routes/images');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

// MongoDB connection with caching for serverless
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }
  
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
};

// Connect to MongoDB
connectDB().catch(err => console.error('Initial DB connection failed:', err));

// Routes
app.use('/auth', authRoutes);
app.use('/dashboard', imageRoutes);
app.use('/api', apiRoutes);

// Home route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/install.html');
});

// Only start server if not in Vercel environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on ${process.env.HOST || `http://localhost:${PORT}`}`);
  });
}

// Export for Vercel
module.exports = app;

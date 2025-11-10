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

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/auth', authRoutes);
app.use('/dashboard', imageRoutes);
app.use('/api', apiRoutes);

// Home route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/install.html');
});

app.listen(PORT, () => {
  console.log(`Server running on ${process.env.HOST}`);
});

// Export for Vercel
module.exports = app;

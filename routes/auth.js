const express = require('express');
const router = express.Router();
const shopify = require('../config/shopify');

// Start OAuth flow
router.get('/shopify', async (req, res) => {
  const shop = req.query.shop || process.env.SHOPIFY_SHOP_DOMAIN;
  
  if (!shop) {
    return res.status(400).send('Missing shop parameter');
  }

  try {
    const authRoute = await shopify.auth.begin({
      shop: shopify.utils.sanitizeShop(shop, true),
      callbackPath: '/auth/callback',
      isOnline: false,
      rawRequest: req,
      rawResponse: res,
    });

    res.redirect(authRoute);
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).send('Authentication failed');
  }
});

// OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const callback = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: res,
    });

    const { session } = callback;
    
    // Store session/token (in production, use a proper session store)
    res.cookie('shopify_session', JSON.stringify(session), { 
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 
    });

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).send('Authentication callback failed');
  }
});

module.exports = router;

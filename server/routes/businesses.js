import express from 'express';
import QRCode from 'qrcode';
import pool from '../config/db.js';
import auth from '../middleware/auth.js';

const router = express.Router();

const getFrontendBaseUrl = () => {
  if (process.env.FRONTEND_BASE_URL) {
    return process.env.FRONTEND_BASE_URL.replace(/\/$/, '');
  }

  return 'http://localhost:5173';
};

router.get('/me/qr-code', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT slug FROM businesses WHERE id = $1',
      [req.businessId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const { slug } = result.rows[0];
    const publicUrl = `${getFrontendBaseUrl()}/b/${slug}`;
    const qrCodeDataUrl = await QRCode.toDataURL(publicUrl);

    return res.json({ url: publicUrl, qrCodeDataUrl });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const businessResult = await pool.query(
      `SELECT id, name, slug, tagline, logo
       FROM businesses
       WHERE slug = $1 AND is_approved = true AND is_verified = true`,
      [slug]
    );

    if (businessResult.rows.length === 0) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const business = businessResult.rows[0];

    const socialsResult = await pool.query(
      `SELECT platform, url, icon
       FROM social_links
       WHERE business_id = $1 AND url != ''
       ORDER BY display_order`,
      [business.id]
    );

    business.socials = socialsResult.rows;

    return res.json(business);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;

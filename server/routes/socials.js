import express from 'express';
import pool from '../config/db.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.put('/', auth, async (req, res) => {
  const { socials } = req.body;

  if (!Array.isArray(socials)) {
    return res.status(400).json({ message: 'Socials payload must be an array.' });
  }

  try {
    for (const social of socials) {
      await pool.query(
        `UPDATE social_links
         SET url = $1
         WHERE business_id = $2 AND platform = $3`,
        [social.url || '', req.businessId, social.platform]
      );
    }

    const result = await pool.query(
      'SELECT platform, url, icon FROM social_links WHERE business_id = $1 ORDER BY display_order',
      [req.businessId]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;

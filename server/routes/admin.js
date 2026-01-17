import express from 'express';
import pool from '../config/db.js';
import auth from '../middleware/auth.js';
import adminOnly from '../middleware/admin.js';

const router = express.Router();

router.get('/businesses', auth, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, slug, email, created_at, is_verified, is_approved
       FROM businesses
       ORDER BY created_at DESC`
    );

    return res.json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.put('/businesses/:id/approve', auth, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { isApproved } = req.body;

  if (typeof isApproved !== 'boolean') {
    return res.status(400).json({ message: 'isApproved must be a boolean.' });
  }

  try {
    const result = await pool.query(
      `UPDATE businesses
       SET is_approved = $1
       WHERE id = $2
       RETURNING id, name, slug, email, is_verified, is_approved`,
      [isApproved, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Business not found' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;

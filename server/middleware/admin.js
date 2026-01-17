import pool from '../config/db.js';

const adminOnly = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT is_admin FROM businesses WHERE id = $1',
      [req.businessId]
    );

    if (result.rows.length === 0 || !result.rows[0].is_admin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    return next();
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export default adminOnly;

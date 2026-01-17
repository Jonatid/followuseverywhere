import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import pool from '../config/db.js';
import auth from '../middleware/auth.js';
import { sendEmail } from '../utils/email.js';

const router = express.Router();

const createToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

const generateTokenValue = () => crypto.randomBytes(32).toString('hex');

const getBackendBaseUrl = () => {
  if (process.env.BACKEND_BASE_URL) {
    return process.env.BACKEND_BASE_URL.replace(/\/$/, '');
  }

  const port = process.env.PORT || 5000;
  return `http://localhost:${port}`;
};

const getFrontendBaseUrl = () => {
  if (process.env.FRONTEND_BASE_URL) {
    return process.env.FRONTEND_BASE_URL.replace(/\/$/, '');
  }

  return 'http://localhost:5173';
};

router.post(
  '/signup',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('name').notEmpty(),
    body('slug').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, slug, tagline, email, password } = req.body;

    try {
      const existingBusiness = await pool.query(
        'SELECT 1 FROM businesses WHERE email = $1 OR slug = $2',
        [email, slug]
      );

      if (existingBusiness.rows.length > 0) {
        return res.status(400).json({
          message: 'Business with this email or slug already exists',
        });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      const logo = name.substring(0, 2).toUpperCase();

      const result = await pool.query(
        `INSERT INTO businesses (name, slug, tagline, logo, email, password_hash)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, name, slug, tagline, logo, email, is_verified, is_approved, is_admin`,
        [name, slug, tagline || '', logo, email, passwordHash]
      );

      const business = result.rows[0];

      const platforms = [
        'Instagram',
        'TikTok',
        'YouTube',
        'Facebook',
        'X',
        'LinkedIn',
        'Website',
      ];
      const icons = ['📷', '🎵', '▶️', '👍', '✖️', '💼', '🌐'];

      for (let i = 0; i < platforms.length; i += 1) {
        await pool.query(
          `INSERT INTO social_links (business_id, platform, url, icon, display_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [business.id, platforms[i], '', icons[i], i]
        );
      }

      const verificationToken = generateTokenValue();
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

      await pool.query(
        `INSERT INTO email_verification_tokens (business_id, token, expires_at)
         VALUES ($1, $2, $3)`,
        [business.id, verificationToken, expiresAt]
      );

      const verificationLink = `${getBackendBaseUrl()}/api/auth/verify-email?token=${verificationToken}`;

      await sendEmail({
        to: email,
        subject: 'Verify your Follow Us Everywhere account',
        text: `Verify your account by visiting: ${verificationLink}`,
        html: `
          <p>Welcome to Follow Us Everywhere!</p>
          <p>Verify your account by clicking the link below:</p>
          <p><a href="${verificationLink}">${verificationLink}</a></p>
        `,
      });

      const token = createToken({
        businessId: business.id,
        isAdmin: business.is_admin,
      });

      return res.json({ token, business });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

router.post(
  '/login',
  [body('email').isEmail(), body('password').exists()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const result = await pool.query(
        'SELECT * FROM businesses WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const business = result.rows[0];

      if (!business.is_verified) {
        return res.status(403).json({
          message: 'Please verify your email before logging in.',
        });
      }

      if (!business.is_approved) {
        return res.status(403).json({
          message: 'Your account is pending approval.',
        });
      }

      const isMatch = await bcrypt.compare(password, business.password_hash);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const socialsResult = await pool.query(
        'SELECT platform, url, icon FROM social_links WHERE business_id = $1 ORDER BY display_order',
        [business.id]
      );

      const token = createToken({
        businessId: business.id,
        isAdmin: business.is_admin,
      });

      const { password_hash, ...businessData } = business;
      businessData.socials = socialsResult.rows;

      return res.json({ token, business: businessData });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

router.get('/me', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, slug, tagline, logo, email, is_verified, is_approved, is_admin
       FROM businesses
       WHERE id = $1`,
      [req.businessId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const business = result.rows[0];

    const socialsResult = await pool.query(
      'SELECT id, platform, url, icon FROM social_links WHERE business_id = $1 ORDER BY display_order',
      [req.businessId]
    );

    business.socials = socialsResult.rows;

    return res.json(business);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.get('/verify-email', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: 'Verification token is required.' });
  }

  try {
    const result = await pool.query(
      `SELECT business_id, expires_at
       FROM email_verification_tokens
       WHERE token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired token.' });
    }

    const tokenRow = result.rows[0];

    if (new Date(tokenRow.expires_at) < new Date()) {
      await pool.query(
        'DELETE FROM email_verification_tokens WHERE token = $1',
        [token]
      );
      return res.status(400).json({ message: 'Invalid or expired token.' });
    }

    await pool.query('UPDATE businesses SET is_verified = true WHERE id = $1', [
      tokenRow.business_id,
    ]);
    await pool.query('DELETE FROM email_verification_tokens WHERE token = $1', [
      token,
    ]);

    return res.json({ message: 'Email verified successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post(
  '/request-password-reset',
  [body('email').isEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    try {
      const result = await pool.query(
        'SELECT id FROM businesses WHERE email = $1',
        [email]
      );

      if (result.rows.length > 0) {
        const businessId = result.rows[0].id;
        const resetToken = generateTokenValue();
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

        await pool.query(
          `INSERT INTO password_reset_tokens (business_id, token, expires_at)
           VALUES ($1, $2, $3)`,
          [businessId, resetToken, expiresAt]
        );

        const resetLink = `${getFrontendBaseUrl()}/reset-password?token=${resetToken}`;

        await sendEmail({
          to: email,
          subject: 'Reset your Follow Us Everywhere password',
          text: `Reset your password: ${resetLink}`,
          html: `
            <p>You requested a password reset.</p>
            <p>Reset your password by clicking the link below:</p>
            <p><a href="${resetLink}">${resetLink}</a></p>
          `,
        });
      }

      return res.json({
        message: 'If an account exists, a reset link has been sent.',
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

router.post(
  '/reset-password',
  [body('token').notEmpty(), body('newPassword').isLength({ min: 6 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, newPassword } = req.body;

    try {
      const result = await pool.query(
        `SELECT business_id, expires_at
         FROM password_reset_tokens
         WHERE token = $1`,
        [token]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({ message: 'Invalid or expired token.' });
      }

      const resetRow = result.rows[0];

      if (new Date(resetRow.expires_at) < new Date()) {
        await pool.query('DELETE FROM password_reset_tokens WHERE token = $1', [
          token,
        ]);
        return res.status(400).json({ message: 'Invalid or expired token.' });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);

      await pool.query('UPDATE businesses SET password_hash = $1 WHERE id = $2', [
        passwordHash,
        resetRow.business_id,
      ]);
      await pool.query('DELETE FROM password_reset_tokens WHERE token = $1', [
        token,
      ]);

      return res.json({ message: 'Password reset successfully.' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router;

import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
  const tokenHeader = req.header('Authorization');
  const token = tokenHeader?.startsWith('Bearer ')
    ? tokenHeader.replace('Bearer ', '')
    : null;

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.businessId = decoded.businessId;
    req.isAdmin = Boolean(decoded.isAdmin);
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Token is not valid' });
  }
};

export default auth;

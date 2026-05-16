export const doctorOnly = (req, res, next) => {
  if (req.user && req.user.role === 'DOCTOR') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Doctors only.' });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'SYSTEM_ADMIN')) {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Admins only.' });
  }
};

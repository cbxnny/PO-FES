const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // get jwt token

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'beUoA}j}}[N?ZL7V+_Wm:4gGD8%d%)wL{qYul]o.gY_K&qnP|}N/gGQ6ufP[mO/aC5jJ<raf#S3M{:h%@;$CfJ', (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }

    // Add decoded user 
    req.user = decoded;
    next();
  });
};

module.exports = authenticateToken;

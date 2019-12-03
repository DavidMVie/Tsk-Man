const jwt = require('jsonwebtoken');

const User = require('../models/user');

const auth = async (req, res, next) => {
  try {
    const token = req.cookies['authToken'];
    const decode = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({_id: decode._id, 'tokens.token': token});
    if(!user) {
      res.status(401).send({loggedIn: false});
    }
    req.user = user;
    req.token = token;
    next();
  } catch (e) {
    res.status(401).send({loggedIn: false});
  }
}

module.exports = auth;
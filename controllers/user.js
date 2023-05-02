require('dotenv').config();

const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { log } = require('mercedlogger');
const User = require('../models/user');

const router = Router();

const { SALT_TOKEN, SALT_PWD } = process.env;

// eslint-disable-next-line consistent-return
const verify = (token, salt) => {
  try {
    const tokenData = jwt.verify(token, salt);
    return tokenData;
  } catch (error) {
    log.red('error', error);
  }
};

const getAuthorizedUser = async (token) => {
  const decoded = verify(token, SALT_TOKEN);
  const userResponse = await User.findOne({ username: decoded?.username });
  return userResponse?.username;
};

router.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (user) {
      const result = req.body.password === user.password;
      if (result) {
        const token = await jwt.sign({ username: user.username }, SALT_TOKEN);
        res.status(200).json({ token, username: user.username });
      } else {
        res.status(400).json({ error: "password doesn't match" });
      }
    } else {
      res.status(400).json({ error: "User doesn't exist" });
    }
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.post('/signup', async (req, res) => {
  try {
    const token = String(req?.get('Authorization')?.replace('Bearer ', ''));
    const authorizedUserName = await getAuthorizedUser(token);
    if (!authorizedUserName) {
      res.status(403).send({ message: 'You are not allowed to create user' });
    }
    const {
      username, password,
    } = req.body;
    if (!username || !password) {
      res.status(400).end();
    }
    const hashedPassword = await bcrypt.hash(password, SALT_PWD);
    const userData = new User({
      username,
      password: hashedPassword,
    });
    const response = await userData.save();
    if (!response?.username) {
      res.status(400).send({ error: true, message: 'Cant create user' });
    }
    const newUserToken = await jwt.sign({ username: userData.username }, SALT_TOKEN);
    res.status(200).send({ user: response, newUserToken });
  } catch (err) {
    res.status(400).send({ error: true, message: err.message });
  }
});

router.get('/me', async (req, res) => {
  const defaultReturnObject = { authenticated: false, username: null };
  try {
    const token = String(req?.get('Authorization').replace('Bearer ', ''));
    const username = await getAuthorizedUser(token);
    if (!username) {
      res.status(200).json(defaultReturnObject);
      return;
    }
    res.status(200).json({ authenticated: true, username });
  } catch (err) {
    res.status(200).json(defaultReturnObject);
  }
});

module.exports = router;

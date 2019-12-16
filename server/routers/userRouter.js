const express = require('express');
const { check, validationResult, sanitizeQuery } = require('express-validator');

const auth = require('../middleware/auth');
const User = require('../models/user');
const Task = require('../models/task')

const router = new express.Router(); 

/* Check User Status - Part Of Page Initialization check to see if logged in
============================================================================ */
router.get('/status',sanitizeQuery('completed').escape(), auth, async (req, res) => {
  let completed = req.query.completed || false;
  try {
    await req.user.populate({
      path: 'tasks', // the name of the virtual
      match: {completed}
    }).execPopulate();
    // the user object when spread into the res.send was returning loads of mongoose/mongo extra bloat,  deleted by using toObject to convert to reg js obj,  and also deleted password and tokens as there's no good reason to send them down in the response.
    const user = req.user.toObject()
    delete user.password;
    delete user.tokens;
    console.log('req.user.tasks', req.user.tasks)
    console.log('user ', req.user)
    res.send({...user, tasks: req.user.tasks})
  } catch (e) {
    res.status(400).send({
      loggedIn: false,
      msg: e.message})
  }
})

/* Create A New User
===================== */
router.post('/users', [
  check('username')
    .not().isEmpty({ignore_whitespace: true})
    .withMessage('Username is a required field (server)')
    .isLength({ min: 2 })
    .withMessage('Username must be a minimum of 2 chars')
    .trim()
    .escape(),
  check('email')
    .isEmail()
    .withMessage('This is an invalid email, please check and try again!')
    .not().isEmpty({ ignore_whitespace: true })
    .withMessage('Email is a required field (server)')
    .normalizeEmail(),
  check('password')
    .not().isEmpty({ignore_whitespace: true})
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be a minimum of 6 chars')
    .custom((value, {req, loc, path}) => {
      if(value !== req.body.confirmPassword) {
        throw new Error('Passwords don\'t match');
      }else {
        return value;
      }
    }),
  check('confirmPassword')
    .not().isEmpty({ignore_whitespace: true})
    .withMessage('Confirming password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be a minimum of 6 chars')
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() })
  }

   delete req.body.confirmPassword; // No longer needed once confirmed the passwords passed validation..
   
   try {
     const user = new User(req.body)
     // get the user a token 
     const token = await user.getAuthToken();
     res.cookie('authToken', token, {httpOnly: true});
     await user.save();
     res.redirect('/status')
   } catch (e) {
     res.status(400).send(e.message);
   }
});


/* Sign User Out
================== */
router.get('/users/logout', auth, async (req, res) => {
  
  // Filter their current token from their tokens array
  req.user.tokens = req.user.tokens.filter((token) => {
    return token.token != req.token;
  })

  try {
    await req.user.save();
    res.clearCookie('authToken')
    res.send({msg: 'Signed Out!'})
  } catch (e) {
    console.log(e.message);
  }

})


/* Log User In
=============== */
router.post('/users/signin', [
  check('email')
    .isEmail()
    .withMessage('This is an invalid email, please check and try again!')
    .not().isEmpty({ ignore_whitespace: true })
    .withMessage('Email is a required field (server)')
    .normalizeEmail(),
  check('password')
    .not().isEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be a minimum of 6 chars')
], async (req, res) => {

    const errors  = validationResult(req)
    if(!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() })
    }
    try {
      let user = await User.findByCredentials(req.body.email, req.body.password);
      // get them a token 
      const token = await user.getAuthToken();
      // add the token to their array
      await user.save();
      res.cookie('authToken', token, {httpOnly: true})
      // Get the users tasks 
      await user.populate('tasks').execPopulate();
      const newUser = user.toObject()
      res.redirect('/status')
    } catch (e) {
      res.status(401).json({errors: [{msg: 'Log in failed. Please check your details and try again..'}]});
    }
});


/* Setting User Preferences 
=========================== */
router.patch('/users/prefs',[
  check('tasksPerPage')
    .not().isEmpty()
    .isNumeric()
    .withMessage('Tasks Per Page must be a numeric value > 0 and < 20')
    .isLength({min: 1, max: 20})
    .withMessage('The minimum tasks per page is 1, the maximum allowed is 20')
], auth, async(req, res) => {
  const errors = validationResult(req);
  if(!errors.isEmpty) {
    return res.status(422).json({errors: errors.array()})
  }
  try {
    console.log(req.user)
    req.user.preferences.tasksPerPage = req.body.tasksPerPage;
    await req.user.save()
    res.send()
  } catch (e) {
    res.status(400).send(e.message);
  }
});


module.exports = router;
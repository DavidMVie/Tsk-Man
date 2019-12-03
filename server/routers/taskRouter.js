const express = require('express');
const { check, validationResult } = require('express-validator');

const auth = require('../middleware/auth');
const Task = require('../models/task');
const tasksService = require('../services/tasks-service');


const router = new express.Router();

/*  Add New Task
================== */
router.post('/tasks', [
  check('description')
    .not().isEmpty()
    .withMessage('Please fill in the "description" field')
    .trim()
    .escape(),
  check('dueDate')
    .trim()
    .escape(),
  check('notes')
    .trim()
    .escape()

], auth, async (req, res) => {

  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() })
  }

  try {
    const task =  await tasksService.addTask(req.body, req.user);
    res.status(201).send(task)
  } catch (error) {
    console.log(error.message)
    res.status(400).send({errors: [{msg: 'Unable to add task'}]})
  }
});


/* Delete All Tasks
===================== */
router.delete('/tasks/all', auth, async(req, res) => {
  try {
     await Task.deleteMany({owner: req.user._id});
     res.send({msg: 'All Tasks Deleted!'})
  } catch (e) {
    res.status(400).send(e.message)
  }
})


/* Delete A Task
================== */
router.delete('/tasks/:id', auth, async (req, res) => {
  try {
    await Task.findOneAndDelete({_id: req.params.id, owner: req.user._id})
    res.send({msg: 'Task Deleted'})
  } catch (e) {
    res.status(400).send(e.message)
  }
})




module.exports = router;
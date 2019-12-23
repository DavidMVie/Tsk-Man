const express = require('express');
const { check, validationResult, sanitizeParam } = require('express-validator');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Task = require('../models/task');
const tasksService = require('../services/tasks-service');
const moment = require('moment')


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
    res.status(400).send({errors: [{msg: 'Unable to add task'}]})
  }
});


/* Delete All Tasks
===================== */
router.delete('/tasks/all', auth, async(req, res) => {
  try {
     await Task.deleteMany({owner: req.user._id});
     req.user.preferences.customSort = [];
     await req.user.save();
     res.send({msg: 'All Tasks Deleted!'})
  } catch (e) {
    res.status(400).send(e.message)
  }
})


/* Delete A Task
================== */
router.delete('/tasks/:id', sanitizeParam('id').escape(), auth, async (req, res) => {
  try {
    await Task.findOneAndDelete({_id: req.params.id, owner: req.user._id})
    res.send({msg: 'Task Deleted'})
  } catch (e) {
    res.status(400).send(e.message)
  }
})

/* Change Task Title
====================== */
router.patch('/tasks/:id', [
  check('change')
  .not().isEmpty({ignore_whitespace: true})
  .withMessage('Must define which task element is being changed..')
  .escape()
  .trim(),
  check('title')
  .not().isEmpty({ignore_whitespace: true})
  .withMessage('New value to change to is missing?')
  .escape()
  .trim()
], sanitizeParam('id').escape(), auth, async (req, res) => {

  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    console.log(errors)
    return res.status(422).json({ errors: errors.array() })
  }
  console.log('req.params ', req.params)
  console.log('req.body ', req.body)
  // find the task 
  const task = await Task.findOne({_id: req.params.id, owner: req.user._id});
  task.description = req.body.title;
  await task.save();
  res.send(task)
})

/* Change Task Due Date
======================== */
router.patch('/tasks/:id/changeDueDate', [
  check('date')
  .not().isEmpty()
  .withMessage('Date is required')
  .toDate()
], sanitizeParam('id').escape(), auth, async(req, res) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()) {
    return res.status(422).json({errors: errors.array()});
  }
  console.log('req.params ', req.params);
  console.log('req.body ', req.body)

  // get te task 
  try {
    const task = await Task.findOne({_id: req.params.id, owner: req.user._id})
    if(!task) {
      throw new Error('Unable to find task')
    }
    task.dueDate = req.body.date;
    await task.save();
    res.send(task)
  } catch (e) {
    res.status(400).send(e.message);
  }
})



/* NOTE RELATED
=================
================= */


/* Add New Note To Existing Task 
================================= */
router.post('/tasks/note',[
  check('taskId')
    .not().isEmpty({ignore_whitespace: true})
    .withMessage('Id must be present')
    .trim()
    .escape(),
  check('noteTxt')
    .escape()
    .not().isEmpty({ignore_whitespace: true})
    .withMessage('Note must have a description')
    .trim()
], auth, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() })
  }
  console.log(req.body);
  try {
    const task = await Task.findOne({_id: req.body.taskId, owner: req.user._id});
    if(!task) {
      return res.status(404).send({msg: 'Unable to find task'});
    }
    const note = {
      _id: mongoose.Types.ObjectId(), // manually generate id so you can send it back in response as it turns out I couldn't find a good way to access the id after insertion 
      title: req.body.noteTxt,
      added: moment().valueOf()
    }
    task.notes.push(note)
    const taskRes = await task.save();
    res.send({task: taskRes, note_id: note._id})
  } catch (e) {
    console.log(e.message)
    res.status(400).send(e.message);
  }

})


/* Note Completed (or to be un completed) 
========================================= */
router.post('/tasks/:id/completed', [
  check('completed')
    .isBoolean()
    .withMessage('completed must be true or false')
    .escape()
], sanitizeParam('id').escape(), auth, async (req, res) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()) {
    res.status(422).json({errors: errors.array()})
  }

  console.log(req.params);
  console.log(req.body)
  try {
    const task = await Task.findOne({_id: req.params.id, owner: req.user._id});
    if(!task) {
      return res.status(404).send()
    }
    task.completed = req.body.completed;
    await task.save();
    res.send();
     
  } catch (e) {
    res.status(400).send(e.message)
  }

})

/* Delete A Note  
================ */
router.delete('/tasks/note/:noteId/:taskId', sanitizeParam('noteId').escape(),sanitizeParam('taskId').escape(), auth, async (req, res) => {  
  try {
    const task = await Task.findOne({_id: req.params.taskId, owner: req.user._id})
    const result = task.notes.id(req.params.noteId).remove();
    await task.save();
    res.send(result)
  } catch (e) {
    res.status(400).send(e.message);
  }
  // parent.children.id(_id).remove();
})

module.exports = router;
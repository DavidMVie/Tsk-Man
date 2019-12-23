const Task  = require('../models/task');
const User  = require('../models/user');
const moment = require('moment')

const addTask = async (taskObj, user) => {
  try {
    const notes = taskObj.notes === "" ? [] : {title: taskObj.notes, added: moment().valueOf()}  // set to empty array if nothing passed 
    const dueDate = taskObj.dueDate === "" ? null : taskObj.dueDate
  
    const task = new Task({
      description: taskObj.description,
      dueDate,
      notes,
      owner: user._id
    });

    console.log('the user ', user)
    console.log('The Task ', task)
    user.preferences.customSort.push(task._id);
    await task.save();
    await user.save();
    return task;

  } catch (e) {
     throw new Error(e.message)
  }

}

// Get Users Tasks
const getTasks = async (user) => {
  const results = await user.populate({
    path: 'tasks',
    match: {completed: false}  // for now hard coded to incomplete tasks.
  }).execPopulate();

  return results.tasks

}




module.exports = {
  addTask,
  getTasks
}
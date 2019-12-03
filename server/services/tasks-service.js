const Task  = require('../models/task');
const User  = require('../models/user');

const addTask = async (taskObj, user) => {

  const notes = taskObj.notes === "" ? [] : taskObj.notes;  // set to empty array if nothing passed 
  const dueDate = taskObj.dueDate === "" ? null : taskObj.dueDate

  try {      
    const task = new Task({
      description: taskObj.description,
      dueDate,
      notes,
      owner: user._id
    });

    await task.save();
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
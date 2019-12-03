const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  description: {
    type: String,
    trim: true,
    minlength: 1,
    required: true,
    maxlength: 200
  },
  completed: {
    type: Boolean,
    required: true,
    default: false
  },
  completedDate: {
    type: Date
  },
  dueDate: {
    type: Date
  },
  notes: [{
    type: String
  }],  
  changeHistory: [{
    desc: {
      type: String
    },
    changeDate: {
      type: Date
    }
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {timestamps: true});


const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
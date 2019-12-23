const addTaskTemplate = require('../../templates/task-bar/addTaskTemplate.hbs');

import {modal, centerEl, validateForm, displayErrorOutput, serverComm} from '../../utilities/funk'

import { renderTasks } from '../task-items/taskList'

const addTaskComponent = (user) => {
  
  /* Onclick of Add Task Modal Icon
  ================================== */
  document.querySelector('#openAddTaskModal').addEventListener('click', (e) => {
    modal();
    // inject the handlebars template (html form) into the modals content element
    document.querySelector('#modalContent').innerHTML = addTaskTemplate();
    // Create an element to display errors/success message re validation of form
    const newTaskUl = document.querySelector('.create-new-task-ul');
    centerEl(document.querySelector('#modal'), {y: -10});

    // When the Add Task modal form is submitted
    document.querySelector('.create-new-task').addEventListener('submit', (e) => {
      e.preventDefault();
      const formObj = {
        description: e.target.elements.description.value,
        dueDate: e.target.elements.dueDate.value,
        notes: e.target.elements.notes.value
      }
      addTask(formObj)
        .then((response) => {
          if(response.status === 201) {
            return response.json()
          }
          throw new Error('Unable to add task.')
        })
        .then((task) => {
          console.log(task)
          user.tasks.push(task);
          user.preferences.customSort.push(task._id);
          newTaskUl.innerHTML = '<li class="task-success"> New Task Added!</li>';
          setTimeout(function() {
            if(newTaskUl) {
              newTaskUl.innerHTML = '';
            }
          }, 1000)
          e.target.elements.description.value = '';
          e.target.elements.dueDate.value = '';
          e.target.elements.notes.value = '';
          renderTasks(user)
        })
        .catch((e) => {
          newTaskUl.innerHTML = `<li>${e.message}</li>`
        })
    })
  })


  /* Adding A Task
  ================= */
  const addTask = (formObj) => {
    const errorsObj = validateForm(formObj, 'newTask');
    console.log('formObj ', formObj)
    if(errorsObj && errorsObj.errors.length > 0) {
      document.querySelector('.errors-list').innerHTML = '';  // Clear the output
      return displayErrorOutput(errorsObj);
    }

    return serverComm('/tasks', 'POST', undefined, formObj);
  }
}

export {addTaskComponent};
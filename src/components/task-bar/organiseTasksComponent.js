const organiseTasksTemplate = require('../../templates/task-bar/organiseTasksTemplate.hbs')
import { modal, centerEl, serverComm } from "../../utilities/funk";
import { tasksComponent, renderTasks } from '../task-items/taskList'


const organiseTasksComponent = (user) => {
  document.querySelector('#openTaskOrganiserModal').addEventListener('click', (e) => {
    modal();
    centerEl(document.querySelector('#modal'), {y: -10});
    const contentDiv = document.querySelector('#modalContent');
    contentDiv.innerHTML = organiseTasksTemplate(user);  // render hbs template
    // set the selected option based off of the user object preferences.sortyBy prop
    document.querySelector(`option[value="${user.preferences.sortBy}"]`).setAttribute('selected', true)


    // Task Organiser Event Handlers - tasksPerPage & sortBy

    // Change the TasksPerPage
    document.querySelector('#tasksPerPage').addEventListener('change', (e) => {
      const tasksPerPage = e.target.value * 1 // Convert string to number;
      if(tasksPerPage < 1 || tasksPerPage > 20) {
        return // !!REVIEW!! build this into a message to tell the user
      }
      // Update the client side user object
      user.preferencs.tasksPerPage = tasksPerPage;
      tasksComponent(user) // don't need renderTasks as sort is not affected and therfore the sort funcs don't need to run.
      // Update the server
      serverComm('/users/prefs', "PATCH", undefined, {tasksPerPage})
        .then((jsonRes) => {
          if(!jsonRes.status !== 200) {
            throw new Error('Unable to change Tasks Per Page setting.')
          }
        })
        .catch((e) => {
          console.log(e.message);
        })
    })

    // Sort the Tasks
    document.querySelector('select#sortTasks').addEventListener('change', (e) => {
      const options = e.target.querySelectorAll('option');
      options.forEach((option) => {
        if(option.hasAttribute('selected')) {
          option.removeAttribute('selected')
        }
      })
      document.querySelector(`option[value=${e.target.value}]`).setAttribute('selected', true);
      // Update the client side user object
      user.preferences.sortBy = e.target.value;
      // Update the server
      serverComm('/users/sortTasks', "PATCH", undefined, {"sortBy": e.target.value})
      // perform the sort on the tasks array
      renderTasks(user);
    })

  }) // end taskOrganiser task bar icon click listener
}


export {organiseTasksComponent}
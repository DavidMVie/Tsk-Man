const wipeOutTemplate = require('../../templates/task-bar/wipeOutTemplate.hbs')

import {modal, serverComm} from '../../utilities/funk';
import { tasksComponent } from '../task-items/taskList'

const wipeOutComponent = (user) => {


    /* Onclick Of Wipeout All Tasks Icon
  ===================================== */
  document.querySelector('#wipeTasks').addEventListener('click', (e) => {
    e.preventDefault();
    modal({y: 10})
    document.getElementById('modalContent').innerHTML = wipeOutTemplate();

    document.querySelector('.delete-all').addEventListener('click', (e) => {
      e.preventDefault();
      if(document.querySelector('#wipeout').value === 'wipeout' ) {
        user.tasks = [];
        user.preferences.customSort = [];
        serverComm('/tasks/all', 'DELETE')
         .then((response) => {
           if(response.status === 200) {
             return response.json()
           }
           throw new Error('An error occurred, please try again later.')
         })
         .then((msg) => {
           document.querySelector('#modal').remove();
           document.querySelector('#overlay').remove();
           tasksComponent(user);  // Re-render the empty tasks component 
           console.log('wipedOut user ', user)
         })
         .catch((e) => console.log(e.message))
      }
    })

  })

}

export {wipeOutComponent}
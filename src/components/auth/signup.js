const signUpTemplate = require('../../templates/auth/signUpTemplate.hbs');

import { validateForm, displayErrorOutput, serverComm } from '../../utilities/funk';
import { renderTasks } from '../task-items/taskList';
import { signInComponent} from './signin';

/* SIGN UP  VIEW COMPONENT
============================ */
const signUpComponent = () => {
  document.getElementById('app-content').innerHTML = signUpTemplate();

  // Form Submission Event Handler
  const form = document.querySelector('.signup-form');
  const errorsList = document.querySelector('ul.errors-list')

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formObj = {
      username: e.target.elements.username.value,
      email: e.target.elements.email.value,
      password: e.target.elements.password.value,
      confirmPassword: e.target.elements.confirmPassword.value
    }

    errorsList.innerHTML = '';

    // Client Side Validation
    const errorsObj = validateForm(formObj, 'signup');

    if(errorsObj) {
      return displayErrorOutput(errorsObj)
    }

    try { // Post Validated Form Object Server Side
      serverComm('/users', "POST", undefined, formObj)
        .then((data) => {
          if(data.errors) {
            return displayErrorOutput(data)
          }
          return data.json()
        })
        .then((user) => {
          user.tasks = [] // just signed up so no tasks.
          renderTasks(user); 
        })
        .catch((e) => {
          throw new Error(e)
        })
    } catch(e) {
      console.log(e.message)
    }

  })


  //Event Handler for Switching to Sign In Page
  document.querySelector('#signInLink').addEventListener('click', (e) => {
    e.preventDefault(); 
    signInComponent()
  })
}

export {signUpComponent}
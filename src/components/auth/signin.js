const signInTemplate = require('../../templates/auth/signInTemplate.hbs');
import {signUpComponent} from './signup';
import { validateForm, displayErrorOutput, serverComm } from '../../utilities/funk';
import { renderTasks } from '../task-items/taskList';
import { renderTaskBar } from '../task-bar/renderTaskBar';


/* SIGN IN VIEW COMPONENT
========================== */
const signInComponent = () => {
  document.getElementById('app-content').innerHTML = signInTemplate();

  // Form Submission Event Handler
  const form = document.querySelector('.signin-form');
  const errorsList = document.querySelector('ul.errors-list');

  form.addEventListener('submit', (e) => {

    e.preventDefault();

    const formObj = {
      email: e.target.elements.email.value,
      password: e.target.elements.password.value
    }

    errorsList.innerHTML = '';

    // Client Side Validation
    const errorsObj = validateForm(formObj, 'signin');

    if(errorsObj) {
      return displayErrorOutput(errorsObj)
    }

    serverComm('/users/signin', "POST", undefined, formObj)
      .then((jsonResponse) => {
        return jsonResponse.json();
      })
      .then((data) => {
        if(data.errors) {
          return displayErrorOutput(data)
        }
        renderTaskBar(data)
        renderTasks(data);
      })
      .catch((e) => console.log(e.message))

  })

  //Event Handler for Switching to Sign Up Page
  document.querySelector('#signUpLink').addEventListener('click', (e) => {
    e.preventDefault(); 
    signUpComponent()
  })
}

export { signInComponent }
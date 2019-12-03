// Handlebars Templates
const signInTemplate = require('./templates/signInTemplate.hbs');
const signUpTemplate = require('./templates/signUpTemplate.hbs');
const tasksTemplate = require('./templates/tasksTemplate.hbs');
const addTaskTemplate = require('./templates/addTaskTemplate.hbs');
const taskBarTemplate = require('./templates/taskBarTemplate.hbs');

// Utility Functions 
import { serverComm, displayErrorOutput, validateForm, modal, centerEl, toggleCustomToolTip } from './funk';

// On Page Load decided which view template should be rendered.
const initialize = (response) => {
  const content = document.getElementById('content');

  if(response.loggedIn === false) {
     return signInComponent() 
  }
  
  tasksComponent(response); 
}

/* SIGN IN VIEW COMPONENT
========================== */
const signInComponent = () => {
  content.innerHTML = signInTemplate();

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
        console.log('Check out this parsed jsw data ', data)
        if(data.errors) {
          return displayErrorOutput(data)
        }
        console.log(data)
        tasksComponent(data);
      })
      .catch((e) => {
        console.log(e.message);
      })

  })

  //Event Handler for Switching to Sign Up Page
  document.querySelector('#signUpLink').addEventListener('click', (e) => {
    e.preventDefault(); 
    signUpComponent()
  })
}

/* SIGN UP  VIEW COMPONENT
============================ */
const signUpComponent = () => {
  content.innerHTML = signUpTemplate();


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
            tasksComponent([]); // empty as new member - no existing tasks.
        })
    } catch (e) {
      console.log(e.message);
    }

  })


  //Event Handler for Switching to Sign In Page
  document.querySelector('#signInLink').addEventListener('click', (e) => {
    e.preventDefault(); 
    signInComponent()
  })
}


/*  TASK COMPONENT VIEW 
====================================  */
const tasksComponent = (user) => {

  content.innerHTML = tasksTemplate(user);

  /* Insert the Task Toolbar */ 
  document.querySelector('#task-tool-bar').innerHTML = taskBarTemplate(user)

  /* EVENT FOR USER CLICKING AVATAR ICON */
  document.querySelector('#task-tool-bar .fa-user-circle').onclick = () => {
    toggleCustomToolTip(document.querySelector('#task-tool-bar .fa-user-circle'), 'userMenu', 'left')
  };

  /* Add A Task Event Listener - ( Opens Add Task Modal )
  ======================================================== */
  document.querySelector('#openAddTaskModal').addEventListener('click', (e) => {
   modal()
   document.querySelector('#modalContent').innerHTML = addTaskTemplate();
   centerEl(document.querySelector('#modal'),{y:-80})
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
        console.log(response.status)
       if(response.status === 201) {
        return response.json()
       }
       throw new Error('Unable to add task')
     })
      .then((task) => {
        user.tasks.push(task);
        document.querySelector('.create-new-task ul').innerHTML = '<li class="task-success">New Task Added!</li>';
        setTimeout(function() {
          document.querySelector('.create-new-task ul').innerHTML = '';
        }, 2000)
        e.target.elements.description.value = '';
        e.target.elements.dueDate.value = '';
        e.target.elements.notes.value = '';
        tasksComponent(user)        
      })
      .catch((e) => {
        document.querySelector('.create-new-task ul').innerHTML = `<li>${e.message}</li>`
      })
   })
  })

  const addTask = (formObj) => {
    const errorsObj = validateForm(formObj, 'newTask');

    if(errorsObj && errorsObj.errors.length > 0) {
      document.querySelector('.errors-list').innerHTML = '';  // Clear the output
      return displayErrorOutput(errorsObj);
    }

    return serverComm('/tasks', 'POST', undefined, formObj);
  }


  /* DELETE A TASK 
  ================== */
  const deleteTaskListeners = document.querySelectorAll('.delete-task')
  
  deleteTaskListeners.forEach((listener) => {
    listener.addEventListener('click', (e) => {
      e.preventDefault();
      const taskId = e.target.closest(".task-list-item").dataset.id;
      deleteTask(taskId)
        .then((response) => {
          if(response.status === 200) {
            tasksComponent(user) // rerender the component to refresh list 
          }else {
            throw new Error('Unable to delete task :(')
          }
        })
        .catch((e) => {
          console.log(e.message)
        })
    });
  })

  const deleteTask = (id) => {
    user.tasks = user.tasks.filter((task) => {
      return task._id != id
    })
    console.log('foreach tasks new tasks list ', user.tasks)
    return serverComm(`/tasks/${id}`, 'DELETE');    
  }


  /* Wipe Out All Tasks
  ======================= */
  document.querySelector('#wipeTasks').addEventListener('click', (e) => {
    e.preventDefault();
    user.tasks = [];
    serverComm('/tasks/all', 'DELETE')
     .then((response) => {
       if(response.status === 200) {
         return response.json()
       }
       throw new Error('An error occurred, please try again later.')
     })
     .then((msg) => {
       console.log(msg)
       tasksComponent(user);  // Re-render the empty tasks component 
     })
     .catch((e) => {
       console.log(e.message);
     })
  })

} // End of TaskComponent 


/* Sign Out  Click Event Listener 
================================== */
const signOut = () => {
  serverComm('/users/logout', "GET")
    .then((jsonResponse) => {
      return jsonResponse.json();
    })
    .then((data) => {
      console.log(data);
      signInComponent();
    })
    .catch((e) => {
      console.log(e.message);
    })
}
export {initialize as default, signOut}



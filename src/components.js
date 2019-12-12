"use strict"
// Handlebars Templates
const signInTemplate = require('./templates/signInTemplate.hbs');
const signUpTemplate = require('./templates/signUpTemplate.hbs');
const tasksTemplate = require('./templates/tasksTemplate.hbs');
const addTaskTemplate = require('./templates/addTaskTemplate.hbs');
const taskBarTemplate = require('./templates/taskBarTemplate.hbs');
const wipeOutTemplate  = require('./templates/wipeOutTemplate.hbs')
const paginationTemplate = require('./templates/paginationTemplate.hbs')

// Utility Functions 
let moment = require('moment');
import { serverComm, displayErrorOutput, validateForm, modal, centerEl, toggleCustomToolTip } from './funk';

// On Page Load decided which view template should be rendered.
const initialize = (response) => {
  const content = document.getElementById('content');

  if(response.loggedIn === false) {
     return signInComponent() // give them the sign in template.
  }
  // if logged in, give them their tasks
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

  // Hard coded for now - this should be from db and attached to userObj returned on initial session start
  const userPreferences = {  
    tasksPerPage: 8
  }
  user.preferences = userPreferences;  // for now set this manually onthe userObj 


  // Dealing with pagination numbers to dislay, defaults to page 1 on initial page load
  if(!user.onPage) {
    user.onPage = 1;
  }

  user.tasks4Page = getPageTasks(user); // function to paginate, get the tasks for page the user wants and add them to the user obj.

  content.innerHTML = tasksTemplate(user);  // Template - Render the view with userObject as context




  console.log('YOUR SIRZ ' , user)

  /* INSERT & MANAGE THE TASK TOOLBAR
  ====================================    
  ==================================== */ 
  document.querySelector('#task-tool-bar').innerHTML = taskBarTemplate(user)  // REFACTOR - needs to be outwith task component so it's not reloaded every time a task is modified - only task list needs re-rendered then.

  /* Task ToolBar Events 
  ======================= */

  /* Onclick of Avatar Icon
  ======================================= */
  document.querySelector('#task-tool-bar .fa-user-circle').onclick = () => {
    toggleCustomToolTip(document.querySelector('#task-tool-bar .fa-user-circle'), 'userMenu', 'left')
  };


  /* Onclick of Add Task Modal
  ============================= */
  document.querySelector('#openAddTaskModal').addEventListener('click', (e) => {
   modal()
   document.querySelector('#modalContent').innerHTML = addTaskTemplate();
   const newTaskUL = document.querySelector('.create-new-task ul')
   centerEl(document.querySelector('#modal'),{y: -10})
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
       throw new Error('Unable to add task')
     })
      .then((task) => {
        user.tasks.push(task);
        newTaskUL.innerHTML = '<li class="task-success">New Task Added!</li>';
        setTimeout(function() {
          if(newTaskUL){
            newTaskUL.innerHTML = '';
          }
        }, 1000)
        e.target.elements.description.value = '';
        e.target.elements.dueDate.value = '';
        e.target.elements.notes.value = '';
        tasksComponent(user)        
      })
      .catch((e) => {
        newTaskUL.innerHTML = `<li>${e.message}</li>`
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


  /* Onclick Of Wipeout All Tasks
  ================================ */
  document.querySelector('#wipeTasks').addEventListener('click', (e) => {
    e.preventDefault();
    modal({y: 10})
    document.getElementById('modalContent').innerHTML = wipeOutTemplate();

    document.querySelector('.delete-all').addEventListener('click', (e) => {
      e.preventDefault();
      console.log(document.querySelector('#wipeout').value)
      if(document.querySelector('#wipeout').value === 'wipeout' ) {
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
           document.querySelector('#modal').remove();
           document.querySelector('#overlay').remove();
           tasksComponent(user);  // Re-render the empty tasks component 
         })
         .catch((e) => {
           console.log(e.message);
         })
      }
    })

  })


  /* INSERT PAGINATION BAR 
  =========================
  ========================= */
    document.querySelector('#links-bar').innerHTML = paginationTemplate(user);
    
    const pageLinks = document.querySelectorAll('.paginate-li');
    pageLinks[0].classList.add('current')
    pageLinks.forEach((link, index) => {
      link.addEventListener('click', (e) => {
        user.onPage = index + 1; // +1 to offset zero based array
        user.tasks4Page = getPageTasks(user);  // returns the tasks that should be displayed for the requested page

        const current = document.querySelector('.current') || null;  // Avoids a Reference error

        if(current) {
          current.classList.remove('current');   
        }
        link.classList.add('current');
        tasksComponent(user)
      })
    })



  /* MANAGE TASK LIST ITEMS EVENT HANDLERS 
  =========================================
  ========================================= */

  const taskListeners = document.querySelectorAll('.task-list-item')
  taskListeners.forEach((li) => {

    const taskId = li.dataset.id

    // Find the list-items associated Task
    // const task = user.tasks.find((task) => task._id === taskId);
    // if(!task) {
    //   throw new Error('no task exists for this list-item?')
    // }

    // check the content to see if any need marked as complete already
    

    /* OnMark Complete
    =================== */
    li.querySelector('#markComplete').addEventListener('change', (e) => {
      e.preventDefault();
      let completed = false
      if(e.target.checked) {
        completed = true;
        toggleMarkCompletedStyle(true, li);
        toggleMarkCompletedArray(true, li, user);

      }else {
        toggleMarkCompletedStyle(false, li);
        toggleMarkCompletedArray(false, li, user);
      }

      // update the server 
      serverComm(`/tasks/${li.dataset.id}/completed`, "POST", undefined, {completed} )
      .then((jsonRes) => {
        if(jsonRes.status !== 200) {
          throw new Error('Unable to update tasks complete status')
        }
      })
      .catch((e) => {
        console.log(e.message);
      })
    })

    /* OnEdit Notes 
    ================ */
    li.querySelector('.edit-notes').addEventListener('click', (e) => {

      const existingOpenNoteBox = document.querySelector('.open-note');
      const thisNoteBox = li.nextElementSibling;
      if(existingOpenNoteBox) {
        existingOpenNoteBox.classList.remove('open-note')
      }
      if(thisNoteBox !== existingOpenNoteBox) {
        thisNoteBox.classList.add('open-note')
        const noteLabel = thisNoteBox.querySelector('label');
        noteLabel.addEventListener('click', (e) => {
          e.preventDefault();
          let addNoteContainer = thisNoteBox.querySelector('.add-note-container');
          if(addNoteContainer.classList.contains('add-note-open')) {
            addNoteContainer.classList.remove('add-note-open');
            noteLabel.textContent = "Add Note"
          }else {
            addNoteContainer.classList.add('add-note-open')
            noteLabel.textContent = "Close Box"
          }
        })
      }

    })

    /* On Change Task Title 
    ======================== */
    li.querySelector('.task-desc').addEventListener('blur', (e) => {
      e.preventDefault(); 
      // Take new value and send it server side for storage but also change in the client side so that the change sticks on re-rendered templates that don't require page refresh
      const id = li.dataset.id;
      const newTaskTitle = e.target.textContent.trim();
      if(newTaskTitle != "") {
        serverComm(`/tasks/${id}`, 'PATCH', undefined, {change: "title", title: newTaskTitle})
          .then((jsonRes) => {
            if(jsonRes.status !== 200) {
              throw new Error('Unable to update new task title..')
            }
          })
          .catch((e) => {
            console.log(e.message)
          })

        // update client side in the users tasksArray
        console.log('our sir nutz ', user)
        let task = user.tasks.find((task) => task._id === id)
        if(!task) {
          throw new Error('No task exists with that Id?')
        }
        task.description = newTaskTitle;
      }
    })

    /* OnChange Due Date */
    li.querySelector('.change-due-date').addEventListener('click', (e) => {
      console.log('change due date clicked')
    })

    /* OnDelete A Task
    ==================== */ 
    li.querySelector('.delete-task').addEventListener('click', (e) => {
      e.preventDefault();
      const taskId = li.dataset.id;
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
     })

    /* On Add A New Note
    ==================== */  
     li.nextElementSibling.querySelector('.btn-add-note').addEventListener('click',(e) => {  
        
       let textareaValue = li.nextElementSibling.querySelector('textarea').value;
       const notesUl = li.nextElementSibling.querySelector('.notes-list');
        
       if(textareaValue.trim() === "") {
         return
       }
       manageNote('add', {notesUl, noteTxt: textareaValue, taskId} ,user)
       li.nextElementSibling.querySelector('textarea').value = ''; // reset textarea
     })

    /* On Delete A Note
    ==================== */ 
    // Loop over each remove link and add a click listener 
    const removeLinks =  li.nextElementSibling.querySelectorAll('.remove-note')
    removeLinks.forEach((removeLink) => {
      removeLink.addEventListener('click', (e) => {
        e.preventDefault();
        const domNoteLi = removeLink.closest('li')
        manageNote('delete', {domNoteLi, domTaskLi: li}, user)


      })
    })

  })
 

  const deleteTask = (id) => {
    user.tasks = user.tasks.filter((task) => {
      return task._id != id
    })
    console.log('foreach tasks new tasks list ', user.tasks)
    return serverComm(`/tasks/${id}`, 'DELETE');    
  }

} // End of TaskComponent 


/* ADD/DELETE NOTE 

  @PARAM    action    String    "delete" | "add" add or delete the note
  @PARAM    noteObj   Object     Keys depend on delete or add: 

  add: {
    notesUl        HTMLElementObj UL     the ul in which all this tasks notes are held
    noteTxt          String                The new notes text value
    taskId           MongoId               The ID of th task the note is for

  },
  delete: { 
            domNoteLi    HTMLElementObj   note list item
            domTaskLi    HTMLElementObj   Task DOM list item that contains note li
          }
  @PARAM    user     Obj        The main user object
  @RETURNS:  ...
*/
const manageNote = (action, noteObj, user) => {

  if(action === 'add') {
    const {notesUl, noteTxt, taskId} = noteObj //desctructure
    let noteLi = document.createElement('li');
    noteLi.className = 'notes-list-item';
    let htmlString = `<div class="note-added-date">Added ${moment().format('Do MMM YYYY')}</div>${noteObj.noteTxt} <a href="#" class="remove-note">...remove</a>`
    noteLi.innerHTML = htmlString;
    notesUl.appendChild(noteLi);
    // update the server
    serverComm('/tasks/note', "POST", undefined, {taskId, noteTxt})
      .then((jsonRes) => {
        if(jsonRes.status === 200) {
          return jsonRes.json();
        }
      })
      .then((resObj) => {  // response is an object with the newly updated task (ie containing the new note ) as well as the new notes id for adding as data-attribute to html
        // set the data-id attr
        noteLi.setAttribute('data-id', resObj.note_id);
        // update the users tasks array:
        console.log('what is that response ', resObj)
        spliceTaskArray(user, 'add', {newTaskObj: resObj.task})
        // Add the Event Handler for the remove button on the newly added note
        noteLi.querySelector('.remove-note').addEventListener('click', (e) => {
          e.preventDefault();
  
          const domTaskLi = noteLi.closest('li.notes-holder-li').previousElementSibling
          console.log('tom ask li ', domTaskLi)
          manageNote('delete', {domNoteLi: noteLi, domTaskLi}, user)
        })
      })
      .catch((e) => {
        console.log(e.message)
      })      
      return
  }

  if(action === 'delete') {
    // console.log('what is the domtaskli ', domTaskLi)
    const taskId = noteObj.domTaskLi.dataset.id;
    const noteId = noteObj.domNoteLi.dataset.id; 
  
    serverComm(`/tasks/note/${noteId}/${taskId}`, "DELETE")
      .then((jsonRes) => {
        if(jsonRes.status === 200) {
          return jsonRes.json()
        }
        throw new Error('Error Deleting Note');
      })
      .then((response) => {
        console.log('The Response', response);
      })
      .catch((e) => {
        console.log(e.message)
      })

    noteObj.domNoteLi.remove(); // remove note from dom 
    spliceTaskArray(user, 'delete', {taskId, noteId} );
  }
}


// Method for adding deleting editing the users tasks and tasks4Page arrays
/*
  @PARAM    user        Obj      main user object
  @PARAM    action      String   "Add | Delete | Update" a users task note
  @PARAM    configObj   Obj       see below

  configObj Delete note:   {
    taskId      MongoId     Id of task  that note to be removed lives on 
    noteId      MongoId     Id of note to be removed
  }

  configObj Add Note:    {
    newTaskObj   Obj         This is the response from server, which gave us back the saved Task instance with the note added. can just replace the whole task in the users tasks array,  with the one returned from the server
  }
*/
const spliceTaskArray = (user, action, configObj) => {
//taskId, noteId
  switch (action) {
    case "add" :
    const taskIndex = user.tasks.findIndex((task) => task._id === configObj.newTaskObj._id)
    if(taskIndex === -1) {
      throw new Error('Unable to find Task with that Id')
    }
    user.tasks.splice(taskIndex, 1, configObj.newTaskObj)
    console.log('add note user ', user)
    break;
    case "delete" : 
    const task = user.tasks.find((task) => task._id === configObj.taskId);
    if(!task) {
      throw new Error('No task with that Id');
    }
    const noteIndex = task.notes.findIndex((note) => note._id === configObj.noteId )  
    if(noteIndex === -1)  {
      throw new Error('No note with this id')
    }
    task.notes.splice(noteIndex, 1)
    break;
  } // End Switch
}


/* Add the styles to a task list item to show it as completed or remove them
@PARAM    completed   Boolean     if task is completed true should be passed in
@PARAM    li          HTMLElObj   The list item representing the task 
*/
const toggleMarkCompletedStyle = (completed, li) => {
    const taskDesc = li.querySelector('.task-desc');
    if(completed){
      // If the notes box is open close it first
      if(li.nextElementSibling.classList.contains('open-note')) {
        li.nextElementSibling.classList.remove('open-note')
      }
      li.classList.add('completed')
      taskDesc.removeAttribute('contentEditable');
      taskDesc.style.textDecoration="line-through";
      li.querySelector('.edit-notes').style.display = "none";
    }else {
      li.classList.remove('completed');
      taskDesc.setAttribute('contentEditable', 'true');
      taskDesc.style.textDecoration="none";
      li.querySelector('.edit-notes').style.display = "inline"
    }
}


const toggleMarkCompletedArray = (completed, li, user) => {
  if(completed) {
    const taskId = li.dataset.id;
    const taskIndex = user.tasks.findIndex( (task) => taskId === task._id)
  
    if(taskIndex === -1) {
      throw new Error('No task exists with that Id')
    }
    const task = user.tasks[taskIndex]
    task.completed = true;       
    user.tasks.splice(taskIndex, 1);
    user.tasks.push(task) // add it to the end of the array now
    console.log('tasks to end of tasks ', user)
  }else {
    // to be completed.
  }
}

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


/* PAGINATION - GET THE TASKS FOR PAGE REQUESTED 
================================================= */
const getPageTasks = (user) => {
  const pageNumber = user.onPage;
  const tasksPerPage = user.preferences.tasksPerPage

  const skip = (pageNumber - 1) * tasksPerPage;  // formula for implementing pagination

  return user.tasks.slice(skip, skip + tasksPerPage)
  
}



export {initialize as default, signOut}



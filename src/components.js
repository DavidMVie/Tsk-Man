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
const renderTasks = (user) => {
  if(user.loggedIn === false) {
     return signInComponent() // give the user the sign in template.
  }
    // Sort the tasks if user has preference set
    if(user.preferences.sortBy) {
      let sortBy = user.preferences.sortBy.split('_');
      let sortAsc = sortBy[1] === "Asc" ? true : false; // where Asc implies ascending order..
      user.tasks.sort(sortTasks(sortBy[0], sortAsc))
    } 
  // if logged in, give them their tasks
  tasksComponent(user); 
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
        if(data.errors) {
          return displayErrorOutput(data)
        }
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


/*  TASK COMPONENT VIEW 
====================================  */
const tasksComponent = (user) => {

 
  // Dealing with pagination numbers to dislay, defaults to page 1 on initial page load
  if(!user.onPage) {
    user.onPage = 1;
  }

  user.tasks4Page = getPageTasks(user); // function to paginate, get the tasks for page the user wants and add them to the user obj.

  content.innerHTML = tasksTemplate(user);  // Template - Render the view with userObject as context - note it wil be task4Page array that is looped ove rin the template 
  
 
  // This property won't be set on initial paga load which defaults to showing incomplete tasks, but will be set each time thereafter that the user toggles the filter between completed and incomplete tasks using the select drop down
  if(user.isShowing) {
    const comp = document.querySelector('#comp');
    const incomp = document.querySelector('#incomp')
    user.isShowing === 'Completed' ? comp.selected = true : incomp.selected = true
  }


  /* INSERT & MANAGE THE TASK TOOLBAR
  ====================================    
  ==================================== */ 
  document.querySelector('#task-tool-bar').innerHTML = taskBarTemplate(user)  // REFACTOR - needs to be outwith task component so it's not reloaded every time a task is modified - only task list needs re-rendered then.

  /* Task ToolBar Events 
  ======================= */

  /* Onclick of Avatar Image / Icon
  ======================================= */
  document.querySelector('#task-tool-bar .fa-user-circle').onclick = () => {
    toggleCustomToolTip(document.querySelector('#task-tool-bar .fa-user-circle'), 'userMenu', 'left')
  };


  /* Onclick of Add Task Modal Icon
  ================================== */
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
        renderTasks(user)        
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

  /* Onclick of Task Organiser Icon 
  ================================= */
  document.querySelector('#openTaskOrganiserModal').addEventListener('click', (e) => {
    modal();
    centerEl(document.querySelector('#modal'),{y: -10})
    const contentDiv = document.querySelector('#modalContent');
    const taskOrganiserContent = document.createElement('div');
    taskOrganiserContent.id="taskOrganiserContent"
    taskOrganiserContent.innerHTML = `
      <h1>Task Organiser</h1>
      <div>
        <label for="tasksPerPage">Task Per Page</label>
        <input type="number" min="1" max="20" id="tasksPerPage" value="${user.preferences.tasksPerPage}">
      </div>
      <div>
        <label for="sortTasks">Sort Task Display </label>
        <select id="sortTasks">
          <option value="createdAt_Desc">By Date Added (Newest Top)</option>
          <option value="createdAt_Asc">By Date Added (Oldest Top)</option>
          <option value="dueDate_Asc">By Due Date (Soonest Top)</option>
          <option value="description_Asc">Task Name (Alphabetical)</option>
        </select>
      </div>
    `
    contentDiv.appendChild(taskOrganiserContent)

    
    document.querySelector(`option[value=${user.preferences.sortBy}]`).setAttribute('selected', true)
    

    // Event Handlers
    // Change the tasksPerPage
    document.querySelector('#tasksPerPage').addEventListener('change', (e) => {
      const tasksPerPage = e.target.value * 1 // convert string to number
      if(tasksPerPage < 1 || tasksPerPage > 20) {
        return  // build this into an error message to tell the user. 
      }
           
      user.preferences.tasksPerPage = tasksPerPage;
      tasksComponent(user)
      // Update the Server
      serverComm(`/users/prefs`, "PATCH", undefined, {tasksPerPage})
        .then((jsonRes) => {
          if(jsonRes.status !== 200) {
            throw new Error('Unable to change Tasks Per Page setting..')
          }
        })
        .catch((e) => console.log(e.message));
    })

    /* Sort The Tasks */
    document.querySelector('#sortTasks').addEventListener('change', (e) => {
     const options = e.target.querySelectorAll('option');
     options.forEach((option) => {
       if(option.hasAttribute('selected')) {
         option.removeAttribute('selected')
       }
     })
     document.querySelector(`option[value=${e.target.value}]`).setAttribute('selected', 'true')

      user.preferences.sortBy = e.target.value;
      renderTasks(user) // render tasks wil perform the sort 
    })
  })

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
         })
         .catch((e) => console.log(e.message))
      }
    })

  })


  /*
    FILTERING TO SHOW INCOMPLETE (DEFAULT) / COMPLETE TASKS 
  */
 document.querySelector('#showStatus').addEventListener('change', (e) => {
   e.preventDefault(); 
   let type = e.target.value === 'Completed' ? true : false;
   serverComm(`/status?completed=${type}`, "GET")
    .then((jsonRes) => {
      if(!jsonRes.status === 200) {
        throw new Error('Unable to filter tasks')
      }
      return jsonRes.json();
    })
    .then((res) => {
      res.isShowing = e.target.value  // Add to the user object a property to tell which filter option to set as default
      renderTasks(res)
    })
    .catch((e) => {
      console.log(e.message)
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

    // Find the users task associated with this DOM List Item
    const task = user.tasks.find((task) => task._id === taskId);
    if(!task) {
      throw new Error('no task exists for this list-item?')
    }

    if(task.completed) {
      toggleMarkCompletedStyle(true, li)
    }

    // check the content to see if any need marked as complete already
    

    /* OnMark Complete
    =================== */
    li.querySelector('.mark-complete').addEventListener('change', (e) => {
      e.preventDefault();
      let completed = false
      if(e.target.checked) {
        completed = true;
        toggleMarkCompletedStyle(true, li);
        toggleMarkCompletedArray(true, li, user);
        renderTasks(user)

      }else {
        toggleMarkCompletedStyle(false, li);
        toggleMarkCompletedArray(false, li, user);
        renderTasks(user)
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
        let task = user.tasks.find((task) => task._id === id)
        if(!task) {
          throw new Error('No task exists with that Id?')
        }
        task.description = newTaskTitle;
      }
    })

    /* OnChange Due Date */
    li.querySelector('.change-due-date').addEventListener('click', (e) => {
      e.preventDefault();
      // first, close any other open ones 
      if(document.querySelector('input#changeDueDate')) {
        const targetEl = document.querySelector('input#changeDueDate').closest('li')
        targetEl.querySelector('input#changeDueDate').remove();
        targetEl.querySelector('#confirmChangeDueDate').remove();
        targetEl.querySelector('#cancelChangeDueDate').remove();
        targetEl.querySelector('.change-due-date').style.display = "inline"
      }
      const parent = li.querySelector('.due-date');
      const changeDueDateLink = e.target;
      const changeDateWrapper = document.createElement('div')
      changeDateWrapper.id = "changeDateWrapper"
      changeDateWrapper.innerHTML = `
        <input type="date" id="changeDueDate"> 
        <a href="#" id="confirmChangeDueDate">Confirm</a>
        <a href="#" id="cancelChangeDueDate">Cancel</a>
      `
      parent.insertBefore(changeDateWrapper, changeDueDateLink )
      changeDueDateLink.style.display = "none"
      changeDateWrapper.querySelector('#confirmChangeDueDate').addEventListener("click", (e) => {
        const dateInput = changeDateWrapper.querySelector('#changeDueDate')
        e.preventDefault();
        if(dateInput.value !== ""){
          // update the users array

          serverComm(`/tasks/${li.dataset.id}/changeDueDate`, "PATCH", undefined, {date: dateInput.value})
            .then((jsonRes) => {
              if(!jsonRes.status === 200) {
                throw new Error('Error, unable to change date')
              }
              return jsonRes.json();
            })
            .then((res) => {
              const taskIndex = user.tasks.findIndex((task) => task._id === res._id)
              if(taskIndex == -1) {
                throw new Error('No task exists with that Id')
              }
              user.tasks.splice(taskIndex, 1, res)
              renderTasks(user)        
            })
            .catch((e) => {
              console.log(e.message)
            })
        }
      })
      changeDateWrapper.querySelector('#cancelChangeDueDate').addEventListener('click', (e) => {
        e.preventDefault();
        changeDateWrapper.remove();
        changeDueDateLink.style.display = "inline"
      })
    })

    /* OnDelete A Task
    ==================== */ 
    li.querySelector('.delete-task').addEventListener('click', (e) => {
      e.preventDefault();
      const taskId = li.dataset.id;
      deleteTask(taskId)
        .then((response) => {
          if(response.status === 200) {
            renderTasks(user) // rerender the component to refresh list 
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
        manageNote('delete', {domNoteLi, domTaskLi: li}, user);


      })
    })

  })
 

  const deleteTask = (id) => {
    user.tasks = user.tasks.filter((task) => {
      return task._id != id
    })
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

        spliceTaskArray(user, 'add', {newTaskObj: resObj.task})
        // Add the Event Handler for the remove button on the newly added note
        noteLi.querySelector('.remove-note').addEventListener('click', (e) => {
          e.preventDefault();
  
          const domTaskLi = noteLi.closest('li.notes-holder-li').previousElementSibling
          manageNote('delete', {domNoteLi: noteLi, domTaskLi}, user)
        })
      })
      .catch((e) => {
        console.log(e.message)
      })      
      return
  }

  if(action === 'delete') {
    const taskId = noteObj.domTaskLi.dataset.id;
    const noteId = noteObj.domNoteLi.dataset.id; 
  
    serverComm(`/tasks/note/${noteId}/${taskId}`, "DELETE")
      .then((jsonRes) => {
        if(jsonRes.status === 200) {
          return jsonRes.json()
        }
        throw new Error('Error Deleting Note');
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
    const cb = li.querySelector('#markComplete');
    if(completed){
      // make sure cb is checked (template re-render refrsh wipes this)
      cb.checked = true
      // If the notes box is open close it first
      if(li.nextElementSibling.classList.contains('open-note')) {
        li.nextElementSibling.classList.remove('open-note')
      }
      li.classList.add('completed')
      taskDesc.removeAttribute('contentEditable');
      taskDesc.style.textDecoration="line-through";
      li.querySelector('.edit-notes').style.display = "none";
    }else {
      cb.checked = false;
      li.classList.remove('completed');
      taskDesc.setAttribute('contentEditable', 'true');
      taskDesc.style.textDecoration="none";
      li.querySelector('.edit-notes').style.display = "inline"
    }
}


const toggleMarkCompletedArray = (completed, li, user) => {
  const taskId = li.dataset.id;
  const taskIndex = user.tasks.findIndex( (task) => taskId === task._id)

  if(taskIndex === -1) {
    throw new Error('No task exists with that Id')
  }
  const task = user.tasks[taskIndex]
  if(completed) {    
    task.completed = true;       
    user.tasks.splice(taskIndex, 1);
    user.tasks.push(task) 
  }else {
    task.completed = false
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
      signInComponent();
    })
    .catch((e) => console.log(e.message))
}


/* PAGINATION - GET THE TASKS FOR PAGE REQUESTED 
================================================= */
const getPageTasks = (user) => {
  const pageNumber = user.onPage;
  const tasksPerPage = user.preferences.tasksPerPage

  const skip = (pageNumber - 1) * tasksPerPage;  // formula for implementing pagination

  return user.tasks.slice(skip, skip + tasksPerPage)
  d
}

/* Sorting Tasks */
const sortTasks = (sortBy, ascending) => {
  return (a, b) => {
    if(a[sortBy] === b[sortBy]) {
      return 0
    }
    // nulls should be after anything else
    else if(a[sortBy] === null) {
      return 1;
    }
    else if(b[sortBy] === null) {
      return -1;
    }
    // otherwise if ascending, lowest sorts first
    else if(ascending) {
      return a[sortBy] < b[sortBy] ? -1 : 1
    }
    else {
      // if desc, highest sorts first
      return a[sortBy] < b[sortBy] ? 1 : -1
    }
  }
}

export {renderTasks as default, signOut}



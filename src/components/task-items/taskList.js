"use strict"
// Handlebars Templates
const tasksTemplate = require('../../templates/task-items/tasksTemplate.hbs');
const paginationTemplate = require('../../templates/paginationTemplate.hbs');

// Utility Functions 
let moment = require('moment');
import { serverComm } from '../../utilities/funk'
import Sortable from 'sortablejs'


// On Page Load decided which view template should be rendered.
const renderTasks = (user) => {

  if(user.preferences.sortBy === "custom_Desc") {
    user.tasks = customSort(user)
  }else {
  // for example "dueDate_Desc" is split to dueDate and Desc to allow for sorting on the dueDate and in Desc order
    let sortBy = user.preferences.sortBy.split('_');
    let sortAsc = sortBy[1] === "Asc" ? true : false; // where Asc implies ascending order.
    user.tasks.sort(sortTasks(sortBy[0], sortAsc))
  }

  // Give them their tasks
  tasksComponent(user); 
}

/*  TASK COMPONENT VIEW 
====================================  */
const tasksComponent = (user) => {
  // Dealing with pagination numbers to dislay, Not set on initial page load so default to 1
  if(!user.onPage) {
    user.onPage = 1;
  }

  user.tasks4Page = getPageTasks(user); // function to paginate, get the tasks for page the user wants and add them to the user obj.

  const appContent = document.querySelector('#app-content');

  appContent.innerHTML = tasksTemplate(user)  // Render the Tasks View with the user as it's context

 
/* This property won't be set on initial paga load which defaults to showing incomplete tasks, but will be set each time thereafter that the user toggles the filter between completed and incomplete tasks using the select drop down 
*/
  if(user.isShowing) {
    const comp = document.querySelector('#comp');
    const incomp = document.querySelector('#incomp')
    user.isShowing === 'Completed' ? comp.selected = true : incomp.selected = true
  }  // REVIEW!!! Come back to review this,  not sure it toggles the "selected" property, maybe it does, if you can have only one selected at a given time?

  // Enable drag and drop if the user preference for sortBy is set as custom_Desc
  if(user.preferences.sortBy === "custom_Desc") {
    const el = document.getElementById('task-list');

    const sortable = new Sortable(el, {
      onEnd(evt){
        // Update the customSort array on the user object
        const taskId = user.preferences.customSort.splice(evt.oldDraggableIndex,1)
        user.preferences.customSort.splice(evt.newDraggableIndex, 0, taskId[0])
        // Update the tasks array on the user object
        customSort(user)
        // Update the server.
        serverComm('/users/customSort', 'PATCH', undefined, {customSort: user.preferences.customSort})
      }

    })
  }



} // End of tasksComponent








/* PAGINATION - GET THE TASKS FOR PAGE REQUESTED 
================================================= */
const getPageTasks = (user) => {
  console.log('page tasks user ', user)
  const pageNumber = user.onPage;
  const tasksPerPage = user.preferences.tasksPerPage;

  const skip = (pageNumber - 1) * tasksPerPage;  // formula for implementing pagination

  return user.tasks.slice(skip, skip + tasksPerPage)
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

const customSort = (user) => {
  if(user.tasks.length === 0) {  // Nothing to sort. 
    return [];
  }
  let customArray = user.preferences.customSort
  if(customArray.length === 0) { 
    return customArray = [...user.tasks]
  }
  user.tasks.sort(function(a, b){  
    return customArray.indexOf(a["_id"]) - customArray.indexOf(b["_id"]);
  });
  return user.tasks  
}



export {renderTasks, tasksComponent}  
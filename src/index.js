import { serverComm } from './utilities/funk'
import { renderTasks } from './components/task-items/taskList';
import {renderTaskBar} from './components/task-bar/renderTaskBar'
import {signInComponent} from './components/auth/signin'


// Query if the user is logged in or not, pass the results to the componentsjs intialize function
serverComm('/status', "GET", undefined)
  .then((jsonRes) => {
    return jsonRes.json()
  })
  .then((userObj) => { // User object, augmented with the users tasks array or an object with loggedIn: false if auth fails server side.
    console.log('RenderTasks User Object ', userObj)
    if(userObj.loggedIn === false) {
       return signInComponent() // give the user the sign in template.
    }
    renderTaskBar(userObj)
    renderTasks(userObj)
  })
  .catch((e) => {
    console.log(e.message);
  })





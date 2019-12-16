import { serverComm } from './funk';
import renderTasks from './components';


// Query if the user is logged in or not, pass the results to the componentsjs intialize function
serverComm('/status', "GET", undefined)
  .then((jsonRes) => {
    return jsonRes.json()
  })
  .then((userObj) => { // User object, augmented with the users tasks array#
    // console.log('userObj', userObj)
    renderTasks(userObj)
  })
  .catch((e) => {
    console.log(e.message);
  })





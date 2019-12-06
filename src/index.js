import { serverComm } from './funk';
import initialize from './components';


// Query if the user is logged in or not, pass the results to the componentsjs intialize function
serverComm('/status', "GET", undefined)
  .then((jsonRes) => {
    return jsonRes.json()
  })
  .then((userObj) => { // User object, augmented with the users tasks array
    initialize(userObj)
  })
  .catch((e) => {
    console.log(e.message);
  })





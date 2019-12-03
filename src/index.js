import { serverComm } from './funk';
import initialize from './components';


// Query if the user is logged in or not, pass the results to the componentsjs intialize function
serverComm('/status', "GET", undefined)
  .then((jsonRes) => {
    return jsonRes.json()
  })
  .then((response) => {
    console.log('th rep ', response)
    initialize(response)
  })
  .catch((e) => {
    console.log(e.message);
  })





import {toggleCustomToolTip, serverComm, } from '../../utilities/funk';
import {signInComponent} from '../auth/signin';

const userOptionsComponent = (user) => {
    /* Onclick of Avatar Image / Icon
  ======================================= */
  document.querySelector('#task-tool-bar .fa-user-circle').onclick = () => {
    toggleCustomToolTip(document.querySelector('#task-tool-bar .fa-user-circle'), 'userMenu', 'left')
  };
}

/* Sign Out  Click Event Listener 
================================== */
const signOut = () => {
  serverComm('/users/logout', "GET")
    .then((jsonResponse) => {
      return jsonResponse.json();
    })
    .then((data) => {
      document.querySelector('#task-tool-bar').innerHTML = ''; // wipe out the task tool bar 
      signInComponent();
    })
    .catch((e) => console.log(e.message))
}

export {userOptionsComponent, signOut}
const taskBarTemplate = require('../../templates/task-bar/taskBarTemplate.hbs');
import {addTaskComponent} from './addTaskComponent'
import {organiseTasksComponent} from './organiseTasksComponent';
import {wipeOutComponent} from './wipeOutComponent';
import { userOptionsComponent } from './userOptionsComponent';



const renderTaskBar = (user) => {
  document.querySelector('#task-tool-bar').innerHTML = taskBarTemplate(user);
  userOptionsComponent(user);
  addTaskComponent(user);
  organiseTasksComponent(user);
  wipeOutComponent(user);


}


export {renderTaskBar}
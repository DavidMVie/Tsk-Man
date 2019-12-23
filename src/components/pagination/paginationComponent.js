/* PAGINATION - GET THE TASKS FOR PAGE REQUESTED 
================================================= */

const getPageTasks = (user) => {
  console.log('page tasks user ', user)
  const pageNumber = user.onPage;
  const tasksPerPage = user.preferences.tasksPerPage;

  const skip = (pageNumber - 1) * tasksPerPage;  // formula for implementing pagination

  return user.tasks.slice(skip, skip + tasksPerPage)
}


export {getPageTasks}
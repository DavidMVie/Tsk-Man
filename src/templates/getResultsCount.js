

module.exports = function(user) {
  let arr;
  if(!user.isShowing || user.isShowing === "Incomplete") {
    arr = user.tasks.filter((task) => !task.completed)
  }else {
    arr = user.tasks.filter((task) => task.completed)
  }
  return arr.length
}


module.exports = function (user) {
  let count = user.tasks.length;
  if(count === 0) {
    count++  // Makes pagination tab 1 appear even if they don't have any tasks eg, just signed up, etc, otherwise html is not rendered at all
  }
  const links = Math.ceil(count / user.preferences.tasksPerPage)
  let linksHTML = ``;
  for(i = 1; i <= links; i++) {
    linksHTML += `<li class="paginate-li
    ">${i}</li>`

  }
  return linksHTML;
}


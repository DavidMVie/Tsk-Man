

module.exports = function (user) {
  const count = user.tasks.length;
  const links = Math.ceil(count / user.preferences.tasksPerPage)

  let linksHTML = ``;
  for(i = 1; i <= links; i++) {
    linksHTML += `<li class="paginate-li
    ">${i}</li>`

  }
  return linksHTML;
}


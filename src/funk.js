  import {signOut} from './components'
  
  /* MODAL BOX 
  ====================
    @PARAM:    pos   Object    params for Center Element x and y offsets {x: offset horizontal INT, y: offset vertical INT}
    @PARAM:    maxWidth    INT    CSS related max width modal can grow to on screen,  NOTE: THIS IS IN PX
    @RETURNS   reference to the Modal HTMLElement

    NOTES:  Target #modalContent when you want to inject custom html into the modal,  this retains the close out Cross
  */
  const modal = (pos, maxWidth=750) => {
    // create a modal
    const existingModal = document.querySelector('#modal');
    if(existingModal) {
      return;
    }
    overlay()
    const modal = document.createElement('div');
    modal.id = 'modal';
    modal.innerHTML = `
      <i class="fas fa-times-circle"></i>
      <div id="modalContent"><div> 
    `;  
    document.querySelector('body').appendChild(modal);
    document.querySelector('#modal .fa-times-circle').onclick =  () => {
      modal.remove()
      document.getElementById('overlay').remove();
    }

    modal.style.maxWidth = maxWidth + 'px'


    centerEl(modal, pos);

    return modal;

  }

    /* CENTER AN ELEMENT WITHIN A PAGE / OTHER ELEMENT
    =======================================================
   - EL MUST BE POSITION ABSOLUTE; If you want it to be centered within it's parent then it's parent must be some other then position: static
    @param   el   HTMLObject   The element to center;
    @param   offsetObj   Object  with x and y properties for offsetting the horizontal and vertical positions from the center point

    returns nothing (undefined). 
  */
  const centerEl = (el, offsetObj) => {
    const widthOfPage = window.innerWidth;
    const heightOfPage = window.innerHeight;
    const style = window.getComputedStyle(el);
    const widthOfEl = parseInt(style.width);
    const heightOfEl = parseInt(style.height);

    // Need to add on the page scrolling 
    var scrollTop = window.pageYOffset || (document.documentElement || document.body.parentNode || document.body).scrollTop

    // Center point x
    if(offsetObj) {
      if(!offsetObj.x) {
        el.style.left = ((widthOfPage - widthOfEl) / 2) + 'px';
      }else {
        el.style.left = (((widthOfPage - widthOfEl) + offsetObj.x) / 2) + 'px';
      }
      
      // Center point y
      if(!offsetObj.y) {
        el.style.top = ((heightOfPage - heightOfEl) / 2) + scrollTop + 'px';
      }else {
        el.style.top = (((heightOfPage - heightOfEl)) / 2) + offsetObj.y + scrollTop + 'px';
      }
    }else {
      el.style.left = ((widthOfPage - widthOfEl) / 2) + 'px';
      el.style.top = ((heightOfPage - heightOfEl) / 2) + scrollTop + 'px';
    }

    
  }

  /* CREATE A PAGE/ELEMENT OVERLAY 
  ===================================
   A screen to block out items below the element you want to focus on,  ex for a modal with overlay switched only modal is above the screen and in focus 
    @PARAM   parentel  HTMLElementOBject     The element to screen over, default to full page body
    @PARAM   options   Object      Configurable options {backgroundColor: String}    
  */
  const overlay = (parentEl , styleObj) => {
    const el = parentEl || document.querySelector('body');
    const styles = styleObj || {
      backgroundColor: 'rgba(0,0,0, .7)'
    }
    const overlay = document.createElement('div');
    overlay.id = 'overlay';
    overlay.className = 'over-lay';
    el.appendChild(overlay);

    for(var prop in styles){
      overlay.style[prop] = styles[prop]
    }
  }


    /*  CLIENT SIDE VALIDATION OF FORM SUBMISSION
  ============================================== */
  /* 
    @PARAM:    formObj     Obj    object containing the submitted form values
    @PARAM:    formType    String   which form eg, signup,  signin... 
  */
 const validateForm = (formObj, formType) => {
  let errors = []
  if(formType === 'signup') {
    if(!formObj.username ) {
      errors.push({msg: 'Username is required', param: 'username'});
    }else if(formObj.username.length < 2) {
      errors.push({msg: 'Username must be 2 chars minimum', param: 'username'})
    }
    if(!formObj.email) {
      errors.push({msg: 'An email is required', param: 'email'})
    }
    if(!formObj.password || !formObj.confirmPassword) {
      errors.push({msg: 'Password and Reconfimation required.', param: 'password'})
    }else if(formObj.password !== formObj.confirmPassword) {
      errors.push({msg: 'Passwords don\'t match', param: 'password'})
    }else if(formObj.password.length < 6) {
         errors.push({msg: 'Passwords must be at least 6 chars long', param: 'password'})
       }
  }else if (formType === 'signin') {
    if(!formObj.email) {
      errors.push({msg: 'An email is required', param: 'email'})
    }
    if(!formObj.password) {
      errors.push({msg: 'Password required.', param: 'password'})
    }
  }else if(formType === 'newTask') {
    
      const description = formObj.description.trim(); 
      if(!description) {
        errors.push({msg: 'Task must have a description', param: 'description'})
      }  
  }

  if(errors.length > 0) {
    return {errors};
  }

  return null;
  
}

  /*  FORM ERRORS HTML DISPLAY
  ============================================== */
  /* 
    @PARAM:    errorsObj     Obj    object containing the list of errors to be output

    @NOTES     REQUIRES AN HTML UL ELEMENT OF CLASS ERRORS-LIST TO BE ABLE TO INJECT LIST OF ERRORS IN TO.
  */
  const displayErrorOutput = (errorsObj) => {
    const errorsList = document.querySelector('ul.errors-list');
    errorsObj.errors.forEach((error) => {
      let li = document.createElement('li');
      li.textContent = error.msg;
      errorsList.appendChild(li);
    });
  }


  /* POST DATA USING FETCH API
  ============================== */
  const serverComm = (url = '', method = 'POST', headers = {'Content-Type':'application/json'},  data = {}) => {
    if(method === "POST" || method === "PATCH") {
      return fetch(url, {
        method: method,
        headers: headers,
        body: JSON.stringify(data)
      })
    }else {
      return fetch(url, {
        method: method,
        headers: headers
      })
    }

  }

  /* CUSTOM TOOL TIPS
    Creates A Custom Tool Tip that can't be done via plain html / css ex, needs dynamic data injected into toolTip... Facility to fine tune position also using pos param

    @PARAM:       el          HTMLElementObject      The el you want the tool tip box to point to.  Note this element must have the class .tool-tip added to it      
    @PARAM:        type        String       type of tool tip:  userMenu | info (default) 
    A menu type of tooltip contains an unordered nav list like a drop down#
    The default info type contains basic text

    @PARAM:        dir        String       State where the tool tip box should point relative to the element  up (toolTipbox is below element, pointing up to it) | down (pointing down at it) | right | left

    @PARAM:        pos         Obj         takes x and or y positional offset eg {x: 20, y: -5} would move the tool tip 20px along the x axis (ie move it right) and -5px would move it up vertically
  */
  const toggleCustomToolTip = (el, type, dir) => {

    if(el.querySelector('.custom-tt-box')) {
      el.querySelector('.tool-tip-box').style.visibility = "visible";
      return el.querySelector('.custom-tt-box').remove();
    }
    const toolTipBox = document.createElement('span');
    toolTipBox.className = `custom-tt-box point-${dir}`;
    if(type === "userMenu") {
      toolTipBox.innerHTML = `
      <ul>
        <li><a href="#">Change Avatar</a></li>
        <li><a href="#" id="signOut">Sign Out</a></li>
      </ul>
    `
      // Defering execution of this till event loop, gives this the time it needs to work,  horrible hacky mchackity
      setTimeout( () => {
        document.querySelector('#signOut').addEventListener('click', () => {
          signOut();
        })
      }, 0);
    }

    el.querySelector('.tool-tip-box').style.visibility = "hidden";
    el.appendChild(toolTipBox);
    toolTipBox.style.visibility = "visible";
    toolTipBox.style.opacity = 1;

    // add a listener to color the tool tip pointer on hover (can't find a way to with css )
    toolTipBox.querySelector('ul li:first-child a').onmouseenter = () => {
      toolTipBox.classList.add('pointHover')    
    }
    toolTipBox.querySelector('ul li:first-child a').onmouseleave = () => {
      toolTipBox.classList.remove('pointHover')    
    }
  }

  export {
    serverComm,
    modal,
    validateForm,
    displayErrorOutput,
    centerEl,
    toggleCustomToolTip
  }


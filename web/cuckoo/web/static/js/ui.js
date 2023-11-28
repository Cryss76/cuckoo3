// Copyright (C) 2019-2023 Estonian Information System Authority.
// See the file 'LICENSE' for copying permission.
window.lib = Object.assign(window.lib || {}, {
  // splits url in its counterparts
  url(url) {
    return url.split('/').filter(p => p.length > 0);
  },
  // returns a parent of a child node matching a certain property
  // ex: lib.parent('parent', document.querySelector('.test'))
  // when sel(ector) starts with a '.', a match is looked up by class name
  // when sel(ector) starts with a '#', a match is looked up by its id
  // by default, it will try to match a node name (e.g <p>, <li>, etc.)
  parent(sel, ref) {
    if((!ref instanceof HTMLElement) || (!sel instanceof String)) return null;
    let node = ref;
    let result;
    while(node.tagName.toLowerCase() !== 'body') {
      if(sel[0] == '.') {
        // search in class name if first char is '.'
        if(node.classList.contains(sel.replace('.',''))) {
          result = node;
          break;
        }
      } else if(sel[0] == '#') {
        // search in id if first char is '#'
        if(node.id == sel) {
          result = node;
          break;
        }
      } else {
        // by default, search for a matching node name
        if(node.tagName.toLowerCase() == sel) {
          result = node;
          break;
        }
      }
      node = node.parentNode;
    }
    return result;
  },
  // generates a banner element with a type + text
  banner(content="", type) {
    let icon;
    switch(type) {
      case 'info':
        icon = 'fas fa-info';
      break;
      case 'danger':
        icon = 'fas fa-exclamation';
      break;
      default:
        icon = 'fas fa-comment';
    }
    return parseDOM(`
      <div class="banner is-${type}">
        <div class="banner-icon"><i class="${lib.SafeString(icon)}"></i></div>
        <p class="column no-margin-y">${lib.SafeString(content)}</p>
      </div>
    `);
  },
  // generate a safestring from a string that could contain executable code
  SafeString(str) {

    function _escape(s = "") {
      let r = /[&<>"'\/]/g;
      return '' + new String(s).replace(r, m => {
        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#x27;",
          "/": "&#x2F;"
        }[m];
      });
    }

    class _SS {
      constructor(s) {
        this.s = s;
      }
      toString() {
        return this.s;
      }
    }

    return new _SS(_escape(str)).toString();

  },
  // method to retrieve a client cookie by its name
  getCookie(cName) {
    const name = cName + "=";
    const cDecoded = decodeURIComponent(document.cookie);
    const cArr = cDecoded .split('; ');
    let res;
    cArr.forEach(val => {
      if (val.indexOf(name) === 0) res = val.substring(name.length);
    })
    return res;
  },
  loaderElement: document.querySelector('#loader')
});

/**
 * Parses a string to DOM object to be injected into the page.
 * @param {string} str - HTML as a string
 * @param {string} type - DOM format, should be 'text/html' or 'text/svg'
 * @return {HTMLElement}
 */
function parseDOM(str='', type='text/html') {
  return new DOMParser().parseFromString(str, type).body.firstChild;
}

/**
 * handles navbar interaction (small-screen exclusive enhancement)
 * @param {HTMLElement} toggle - element target
 * @param {number} index - iteration index number
 * @return null;
 */
function handleNavbar(toggle) {
  let n = lib.parent('.navbar', toggle);
  if(!n) return;
  toggle.addEventListener('click', ev => {
    ev.preventDefault();
    n.classList.toggle('is-expanded');
    n.setAttribute('aria-expanded', n.classList.contains('is-expanded'));
  });
  return null;
}

/**
 * enhances default file input experience
 * @param {HTMLElement} input - element target
 * @param {number} index - iteration index number
 * @return {null}
 */
function handleFileInput(input) {
  const { previousElementSibling } = input;
  input.addEventListener('change', ev => {
    if(previousElementSibling) {
      const file = input.files[0];
      if(file instanceof File) {
        previousElementSibling.textContent = file.name;
        previousElementSibling.classList.add('is-disabled');
        previousElementSibling.classList.remove('is-blue');
      }
    }
  });
  // @TODO: handle multiple files
  return null;
}

/**
 * Enhances list-tree variations.
 * @param {HTMLElement} list - list target
 */
function handleListTree(list) {
  // make sure that 'checked' list tree items are visible inside the tree
  [...list.querySelectorAll('input:checked')].forEach(input => {
    let node = input.parentNode;
    while(node !== list) {
      if(node.tagName.toLowerCase() == 'li') {
        const handle = [...node.children].find(n => {
          return (
            n.tagName.toLowerCase() == 'input'
            && n.type == 'checkbox'
            && !n.hasAttribute('value')
          );
        });
        if(handle) handle.checked = true;
      }
      node = node.parentNode;
    }
  });
}

/**
 * Enhances in-page tab behavior. Clicking tab links will hide or show the
 * referenced elements
 * @param {HTMLElement} tabContext
 *
 * if tabContext is an element containing the class '.tabbar', it initializes
 * all tabbar-links within the bar.
 * if tabContext is an element containing the class '.tabbar-link', it will hook
 * that link to the target tab context - if the appropriate ID has been set
 * explicitly for the target tabs.
 */
function handlePageTabs(tabContext) {

  let tabbar;
  if(tabContext.classList.contains('tabbar')) {
    tabbar = tabContext;
  } else if(tabContext.classList.contains('tabbar-link')) {
    tabbar = document.querySelector(tabContext.dataset.tabbar);
  }

  let links = [
    ...tabContext.querySelectorAll('.tabbar-link'),
    ...document.querySelectorAll('[data-tabbar="#'+tabbar.getAttribute('id')+'"]')
  ];

  // hides all the referenced tabs before displaying the new one
  function hideAllRelatedTabs() {
    links.forEach(link => link.classList.remove('is-active'));
    let refs = links.map(link => document.querySelector(link.getAttribute('href')));
    refs.forEach(ref => {
      if(ref)
        ref.setAttribute('hidden', true);
    });
  }

  links.forEach(link => {
    link.addEventListener('click', ev => {
      ev.preventDefault();
      const href = ev.currentTarget.getAttribute('href');
      const target = document.querySelector(href);
      if(target) {
        hideAllRelatedTabs(tabContext);
        target.removeAttribute('hidden');
        link.classList.add('is-active');
      }
    });
  });

  // if there is not a defined active tab, activate the first one
  let hasActiveTab = () => links.find(link => link.classList.contains('is-active'));
  let prioritized = tabContext.dataset.priority;

  // if <data-priority="..."> is set, run through the list of prioritized tabs
  // and make them open accordingly.
  if(prioritized) {
    prioritized.split(",").forEach(id => {
      let results = links.filter(link => link.getAttribute('href').replace('#','') == id);
      if(results.length > 0 && !hasActiveTab()) {
        results.forEach(result => result.dispatchEvent(new Event("click")));
      }
    });
  }

  if(!hasActiveTab() && links.length > 0) {
    links[0].dispatchEvent(new Event("click"));
  }

}

/**
 * Toggles [hidden] attribute on html element. Can be called inline for simplicity
 * of performing this routine.
 * @param {HTMLElement|String} element - target element to toggle, if this is a
 *                                       string, it will querySelector to an element.
 * @param {Boolean} force              - optional, if set it will force the state
 *                                       of the visibility.
 * @param {Undefined} event            - optional, if set it will escape the default
 *                                       event behavior (e.g onclick-like events)
 * @example
 * <button onclick="toggleVisibility('#element', true)">
 */
function toggleVisibility(element, force=null, event) {

  if(event instanceof Event)
    event.preventDefault();

  if(element instanceof NodeList) {
    element.forEach(el => toggleVisibility(el, force, event));
    return;
  }

  if(typeof element == 'string')
    element = document.querySelector(element);
  if(!element) return;
  if(force !== null && force instanceof Boolean)
    element.toggleAttribute('hidden', force);
  else
    element.toggleAttribute('hidden');

  // if the dispatcher sent an event, take the target of the event
  // to indicate said toggleable visibility for appropriate style changes.
  if(event) {
    if(element.getAttribute('hidden') === null) {
      event.currentTarget.classList.remove('visibility-hidden');
      event.currentTarget.classList.add('visibility-visible');
    } else {
      event.currentTarget.classList.remove('visibility-visible');
      event.currentTarget.classList.add('visibility-hidden');
    }
  }

}

/**
 * Lets an element blink for a moment to indicate a change caused by another
 * action.
 * @param {HTMLElement} el - the element to apply the effect on
 * @param {String} blinkColor - a HEX value of the color that the element blinks into
 * @param {Number} speed - the speed in milliseconds of the blink animation
 */
function blink(el, blinkColor = '#fffae8', speed = 75) {
  const background = getComputedStyle(el).getPropertyValue('background-color');
  el.style.transition = `background-color ${speed}ms linear`;
  let mode = 1;
  let step = 0;
  const iv = setInterval(() => {
    if(mode)
      el.style.backgroundColor = blinkColor;
    else
      el.style.backgroundColor = background;
    mode = mode ? 0 : 1;
    step++;
    if(step == 4) {
      clearInterval(iv);
      el.style.transition = null;
      el.style.backgroundColor = background;
    }
  }, speed * 2);
}

/**
 * Toggles all <details> elements on or off
 * @param {Boolean} force - force toggle into a state (true=open/false=closed)
 * @param {HTMLElement} context - look for details inside this context
 * @return {Boolean}
 */
function toggleDetails(force=null, context=document, ev) {

  // escape default event cycle
  if(ev instanceof Event)
    ev.preventDefault();

  const details = context.querySelectorAll('details');
  if(details.length) {
    [...details].forEach(d => {
      if(force === true) {
        return d.setAttribute('open', true);
      } else if(force === false) {
        return d.removeAttribute('open');
      } else {
        if(d.hasAttribute('open')) {
          d.removeAttribute('open');
        } else {
          d.setAttribute('open', true);
        }
      }
    });
  }
}

/**
 * Creates a popover that will toggle on click
 * @param {HTMLElement} trigger - the button that holds the popover
 */
function handlePopover(trigger) {

  const elem  = document.querySelector('.popover' + trigger.getAttribute('data-popover'));
  const close = elem.querySelector('[data-popover-close]');

  function onBodyClick(e) {
    const inPopover = !(lib.parent('.popover', e.target));
    if(inPopover) {
      elem.classList.remove('in');
      document.body.removeEventListener('click', onBodyClick);
    }
  }

  trigger.addEventListener('click', ev => {
    ev.preventDefault();
    elem.classList.toggle('in');
    // register body click
    setTimeout(() => document.body.addEventListener('click', onBodyClick), 100);
  });

  if(close)
    close.addEventListener('click', ev => {
      ev.preventDefault();
      document.body.click();
    });

}

/*
 * Creates a tooltip
 */
function handleTooltip(elem) {

  let tip,
      margin = 5;
  const text = (elem.getAttribute('title') || elem.getAttribute('data-tooltip'));

  function onMousemove(ev) {
    if(tip) {
      tip.style.left = (ev.offsetX + margin) + 'px';
      tip.style.top = (ev.offsetY + margin) + 'px';
    }
  }

  function bindMousemoveHandler() {
    window.addEventListener('mousemove', onMousemove);
  }
  function unbindMousemoveHandler() {
    window.removeEventListener('mousemove', onMousemove);
  }

  const removeTip = t => setTimeout(() => {
    t.classList.remove('in');
    t.remove();
  }, 100);

  elem.classList.add('has-tooltip');

  if(elem.getAttribute('title')) {
    elem.dataset.title = elem.getAttribute('title');
    elem.removeAttribute('title');
  }

  elem.addEventListener('mouseenter', ev => {
    ev.stopPropagation();
    tip = parseDOM(`<span class="tooltip is-bottom">${lib.SafeString(text)}</span>`);
    elem.appendChild(tip);
    bindMousemoveHandler();
    setTimeout(() => {
      tip.classList.add('in');
    }, 10);
  }, false);

  elem.addEventListener('mouseout', ev => {
    removeTip(tip);
    unbindMousemoveHandler();
  });

}

/**
 * Makes a certain password field reveal on demand
 * @param {HTMLElement} input - the password field to toggle
 * @return {null}
 * @note Requires an already existing addon/button element within the control
 *       group that has 'data-toggle' assigned. An additional [data-hide] and
 *       [data-hidden] are toggled to use different icons for the states.
 */
function handlePasswordHide(input) {
  const control   = lib.parent('.control', input);
  const button    = control.querySelector('[data-toggle]');
  const revealed  = control.querySelector('[data-revealed]');
  const hidden    = control.querySelector('[data-hide]');

  function getState() {
    return input.getAttribute('type') == 'password' ? false : true;
  }

  let isRevealed = getState();

  function toggleButton() {
    if(isRevealed === false) {
      hidden.removeAttribute('hidden');
      revealed.setAttribute('hidden', true);
    } else {
      hidden.setAttribute('hidden', true);
      revealed.removeAttribute('hidden');
    }
  }

  if(button) {
    button.addEventListener('click', ev => {
      ev.preventDefault();

      if(isRevealed) {
        input.setAttribute('type', 'password');
      } else {
        input.setAttribute('type', 'text');
      }

      isRevealed = getState();
      toggleButton();
    });
  }

  toggleButton(isRevealed);

}

/**
 * This enables interactions on tag lists such as; 'type-to-tag'
 * @param {HTMLElement} tagList - the password field to toggle
 * @return {null}
 */
function handleTagInput(tagList) {

  const tagValue   = tagList.querySelector('input[data-tag-value]');
  const addTag     = tagList.querySelector('button[data-add-tag]');
  let tagStore     = tagList.querySelector('input[data-tags]');
  const tags       = tagStore.value.length > 0 ? tagStore.value.split(',') : [];

  function commit(str) {
    if(str)
      tags.push(str);
    tagStore.value = tags.join(',');
    tagStore.dispatchEvent(new Event('change'));
  }

  function createTagStore() {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.setAttribute('data-tags', true);
    tagList.appendChild(input);
    tagStore = input;
  }

  function createTag(str, store=true) {
    const tag = document.createElement(`div`);
    tag.classList.add('tag');
    tag.textContent = str;
    tagList.insertBefore(tag, lib.parent('.control', addTag));
    // append removal 'x'
    const closeTag = document.createElement('a');
    const closeIcon = document.createElement('i');
    closeIcon.classList.add('fas');
    closeIcon.classList.add('fa-times');
    closeTag.appendChild(closeIcon);
    closeTag.classList.add('tag-remove');
    tag.appendChild(closeTag);
    closeTag.addEventListener('click', () => removeTag(tag));
    if(store) {
      blink(tag);
      commit(str);
    }
  }

  function removeTag(tag) {
    if(!tag) {
      tagList.querySelectorAll('.tag').forEach(t => removeTag(t));
    } else {
      let index = tags.indexOf(tag.textContent);
      if(index !== -1) {
        tags.splice(index, 1);
      }
      tag.parentNode.removeChild(tag);
      commit();
    }
  }

  tagList.querySelectorAll('.tag .tag-remove').forEach(rm => {
    rm.addEventListener('click', () => removeTag(lib.parent('.tag', rm)));
  });

  tagValue.addEventListener('keydown', e => {
    switch(e.keyCode) {
      case 13:
        addTag.dispatchEvent(new Event('click'));
      break;
    }
  });

  addTag.addEventListener('click', () => {
    if(tagValue.value.length) {
      createTag(tagValue.value);
      tagValue.value = "";
      tagValue.focus();
    }
  });

  if(tags.length) {
    tags.forEach(tag => {
      if(tag.length)
        createTag(tag, false);
    });
  }

  if(!tagStore)
    createTagStore();

 }

/**
  * Handler to enable click-to-copy interactions
  * @param {HTMLElement} elem - element to attach the copy handler to
  *
  * @example
  *   <a data-click-to-copy>This text will be copied</a>
  */
function handleClickToCopy(elem) {

  // when hovered, display a box following the mouse to
  // indicate the copy handler
  const body = elem.dataset.value || elem.textContent;
  let tip;
  let copied = false;
  let tipMargin = 10;

  elem.addEventListener('mouseenter', ev => {
    if(tip) return;
    tip = document.createElement('span');
    tip.classList.add('popover');
    tip.classList.add('in');
    tip.style.position = 'fixed';
    tip.style.left = (ev.clientX + tipMargin) + 'px';
    tip.style.top = (ev.clientY + tipMargin) + 'px';
    tip.style.transform = 'none';

    tip.textContent = (function() {
      if(body.length > 2000) {
        return body.substring(0, 2000) + "... (trimmed " + (body.length - 2000) + " characters for brevity.)";
      } else {
        return body;
      }
    }());
    tip.innerHTML += '<p class="no-margin-bottom has-text-small">Click to copy</p>'

    elem.appendChild(tip);

  });

  elem.addEventListener('mousemove', ev => {
    if(tip) {
      tip.style.left = (ev.clientX + tipMargin) + 'px';
      tip.style.top = (ev.clientY + tipMargin) + 'px';
    }
  });

  elem.addEventListener('mouseleave', ev => {
    if(tip && copied) {
      setTimeout(() => {
        if(tip) tip.remove();
        tip = null;
      }, 500);
    } else {
      tip.remove();
      tip = null;
    }
  });

  // when clicked, copy the code to the users clipboard
  elem.addEventListener('click', ev => {
    ev.preventDefault();

    copied = true;

    // put value into an input field, then copy it into the users
    // clipboard and trash the temporary input
    const inp = document.createElement('input');
    inp.setAttribute('type', 'text');
    inp.classList.add('hidden');
    inp.value = body || elem.textContent;
    document.body.appendChild(inp);
    inp.select();
    document.execCommand('Copy');

    if(tip) {
      tip.textContent = 'Copied to clipboard.';
      setTimeout(() => {
        copied = false;
      }, 500);
    }
    inp.remove();

    blink(elem, '#82DB7A');
  });

}

/**
 * A simple API for filtering through a list of data by typing a string
 * @param {HTMLElement} searchBar - the text field to bind the search event to
 * @example
 *    <input type="search" data-enhance="#my-list-of-strings" />
 *    <ul id="my-list-of-strings">
 *      <li data-search-value="foo">Foo</li>
 *      <li data-search-value="bar">Bar</li>
 *      <li data-search-value="baz">Baz</li>
 *    </ul>
 * @note The data-enhance attribute in the search input field has to point to
 *       an element on the page with that referenced id. The elements to filter
 *       within that context has to have an attribute 'data-search-value' that
 *       contains the searching context to match against.
 */
function handleInlineSearch(searchBar) {
  const searchElement = document.querySelector(searchBar.dataset.enhance);
  if(!searchElement) return;

  let hidden = [],
      shown = [],
      value = "",
      attributes = [...searchElement.querySelectorAll('[data-search-value]')],
      status     = [...document.querySelectorAll('[data-search-status="'+searchElement.id+'"]')];

  function update() {
    status.forEach(stat => stat.textContent = shown.length);
    searchElement.classList.toggle('has-no-results', !shown.length);
  }

  function search(ev) {
    value = ev.target.value;
    hidden = [];
    shown = [];

    if(value.length) {
      attributes.forEach(el => {
        if(el.dataset.searchValue.indexOf(value) > -1)
          shown.push(el);
        else
          hidden.push(el);
      });
    } else {
      attributes.forEach(att => att.removeAttribute('hidden'));
      shown = attributes;
    }

    hidden.forEach(el => el.setAttribute('hidden', true));
    shown.forEach((el, i) => {
      el.classList.toggle('is-odd', !(i % 2));
      el.removeAttribute('hidden');
    });

    if(status.length)
      update();
  }

  searchBar.addEventListener('keyup', search);
  searchBar.dispatchEvent(new KeyboardEvent('keyup'));
}

/**
 * initializes dark mode toggle
 */
function handleUserColorScheme(toggle) {

  const range = toggle.querySelector('input[type="range"]');

  function changeTheme(mode) {
    switch(mode) {
      case 0:
        document.querySelector('html').classList.remove('is-theme-auto');
        document.querySelector('html').classList.remove('is-theme-dark');
      break;
      case 1:
        document.querySelector('html').classList.remove('is-theme-auto');
        document.querySelector('html').classList.add('is-theme-dark');
      break;
      case 2:
        document.querySelector('html').classList.add('is-theme-auto');
        document.querySelector('html').classList.remove('is-theme-dark');
      break;
    }
    let exp = new Date().getTime() + (7*24*60*60*1000); // 1 week
    document.cookie = 'colorscheme='+range.value+'; path=/';
  }

  range.addEventListener('change', e => {
    changeTheme(parseInt(e.target.value));
  });

  let c = lib.getCookie('colorscheme');

  if(c) {
    c = parseInt(c);
    range.value = c;
    changeTheme(c);
  } else {
    range.dispatchEvent(new Event('change'));
  }

}

/**
 * multi-applier for handlers on DOMNodeList selectors
 * @param {string} sel - querySelector string
 * @param {function} fn - iterator function (Array.forEach callback)
 * @return {null}
 */
function applyHandler(sel=null, fn=null) {
  if(sel && fn) [...document.querySelectorAll(sel)].forEach(fn);
  return null;
}

// starts the async loader symbol
function startLoader(next) {
  lib.loaderElement.removeAttribute('hidden')
  if(next) next();
}

// stops the async loader symbol
function stopLoader(next) {
  lib.loaderElement.setAttribute('hidden', true);
  if(next) next();
}

function deleteSubmission(analysis_id) {
  if(!analysis_id)
    return handleOverviewError('Found no analysis ID to send this request to. Refresh the page and try again.');

  fetch('/api/analyses/'+analysis_id+'/deleteanalysis', {
    method: 'GET',
    headers: {
      'X-CSRFToken': window.csrf_token
    }
  }).then(response => response.json())
    .then(response => {
      const { error } = response;
      if(error) {
        handleOverviewError(error);
      } else {
        window.location = '/analyses/';
      }
    });
}

function reSubmission(analysis_id) {
  if(!analysis_id)
    return handleOverviewError('Found no analysis ID to send this request to. Refresh the page and try again.');

  location.href = '/submit/resubmit/'+analysis_id;

}

// prints error in the conclusive block
function handleOverviewError(msg) {
  const overview = document.getElementById("overview:analysis");
  const err = overview.querySelector('#error');
  if(err) err.remove();

  const html = parseDOM(`
    <div class="box has-background-red no-margin-top" id="error">
      <p class="no-margin-top"><strong>${lib.SafeString(msg)}</strong></p>
      <button class="button is-red has-text-small">Dismiss</button>
    </div>
  `);

  overview.insertBefore(html, overview.children[1]);
  html.querySelector('button').onclick = () => html.remove();
}

document.addEventListener('DOMContentLoaded', () => {
  applyHandler('.navbar .navbar-toggle', handleNavbar);
  applyHandler('.input[type="file"][data-enhance]', handleFileInput);
  applyHandler('.input[type="password"][data-enhance]', handlePasswordHide);
  applyHandler('.list.is-tree[data-enhance]', handleListTree);
  applyHandler('.tag-list[data-enhance]', handleTagInput);
  applyHandler('[data-popover]', handlePopover);
  applyHandler('[data-tooltip]', handleTooltip);
  applyHandler('[data-click-to-copy]', handleClickToCopy);
  applyHandler('.input[type="search"][data-enhance]', handleInlineSearch);
  applyHandler('.dark-mode-toggle', handleUserColorScheme)
  // applyHandler('.tabbar[data-enhance]', handlePageTabs);
});

const tierRowTemplate = document.querySelector('#tierRowTemplate');
const listElement = document.querySelector('#list');
const shortcutAreaElement = document.querySelector('#shortcuts');
const unsortedAreaElement = document.querySelector('#unsorted');
const importDialogElement = document.querySelector('#importDialog');
const importInputElement = document.querySelector('#importInput');

const tiers = [];
var items = 0;
var rows = 0;

class TierRowElement extends HTMLElement {
  constructor(name = 'New Tier', color = '#FFF') {
    super();
    this.id = 'row-' + rows++;

    const shadow = this.attachShadow({ mode: "open" });
    shadow.append(tierRowTemplate.content.cloneNode(true));
    this.headElement = shadow.querySelector('#head');
    this.buttonContainerElement = shadow.querySelector('#buttons');
    this.rowElement = shadow.querySelector('#row');
    this.editButtonElement = shadow.querySelector('#editButton');
    this.dialogElement = shadow.querySelector('#editDialog');
    this.editTitleElement = shadow.querySelector('#editName');
    this.editColorElement = shadow.querySelector('#editColor');
    this.closeDialogElement = shadow.querySelector('#closeDialog');
    this.handleElement = shadow.querySelector('#handle');

    this.setAttribute('data-name', this.getAttribute('data-name') ? this.getAttribute('data-name') : name);
    this.setAttribute('data-color', this.getAttribute('data-color') ? this.getAttribute('data-color') : color);

    // Drag and drop events
    this.ondragstart = (event) => event.dataTransfer.setData('row', event.target.id);
    this.ondragend = (event) => this.setAttribute('draggable', 'false');
    this.ondragover = (event) => event.preventDefault();
    this.ondrop = (event) => this.drop(event);

    // Draggable with handle
    this.handleElement.onmousedown = (event) => { this.setAttribute('draggable', 'true') };
    this.handleElement.onmouseup = (event) => { this.setAttribute('draggable', 'false') };

    // Edit modal
    this.editButtonElement.onclick = (event) => {
      this.editTitleElement.value = this.getAttribute('data-name');
      this.editColorElement.value = this.getAttribute('data-color');
      this.dialogElement.showModal();
    };
    this.editTitleElement.onchange = (event) => this.setAttribute('data-name', event.target.value);
    this.editColorElement.onchange = (event) => this.setAttribute('data-color', event.target.value);
    this.closeDialogElement.onclick = (event) => this.dialogElement.close();

  }

  static get observedAttributes() {
    return ['data-name', 'data-color'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    const shortcut = document.querySelector(`[data-shortcut-to='${this.id}']`);
    if (name === 'data-name') { 
      this.headElement.textContent = newValue;

      if (shortcut) shortcut.setAttribute('data-name', newValue);
    }
    if (name === 'data-color') {
      this.headElement.style.backgroundColor = newValue;
      this.headElement.style.color = brightnessByColor(newValue) > 127 ? 'black' : 'white';
      this.buttonContainerElement.style.color = this.headElement.style.color;

      if (shortcut) shortcut.setAttribute('data-color', newValue);
    };
  }

  drop(ev) {
    ev.preventDefault();
    if (!ev.dataTransfer.types.includes('item')) return;
    const data = ev.dataTransfer.getData("item");
    const moved = document.getElementById(data);
    const refNode = ev.target instanceof TierItemElement ? ev.target : null;
    this.insertBefore(moved, refNode);
  }
}
customElements.define("tier-row", TierRowElement);

class TierItemElement extends HTMLDivElement {
  constructor(image = '', text = '', tooltip = '') {
    super();
    this.style.display = "flex";
    this.style.backgroundRepeat = "no-repeat";
    this.style.backgroundSize = "cover";
    this.style.height = "150px";
    this.style.aspectRatio = "23 / 32";
    this.style.textAlign = "center";
    this.style.fontSize = "2em";
    this.style.color = "#fff";
    this.style.webkitTextStroke = "1px black";
    this.style.textAlign = "center";
    this.style.fontFamily = "Impact,Haettenschweiler,Arial Narrow Bold,sans-serif";
    this.style.textShadow = "2px 2px 1px #00000080";
    this.style.alignItems = "flex-end";
    this.style.justifyContent = "center";
    this.style.border = "1px solid white";
    this.style.cursor = "grab";

    this.draggable = "true";
    this.ondragstart = (event) => this.drag(event);

    this.id = 'tierItem-' + items++;

    this.setAttribute('data-image', this.getAttribute('data-image') ? this.getAttribute('data-image') : image)
    this.setAttribute('data-text', this.getAttribute('data-text') ? this.getAttribute('data-text') : text)
    this.setAttribute('data-tooltip', this.getAttribute('data-tooltip') ? this.getAttribute('data-tooltip') : tooltip)
  }

  static get observedAttributes() {
    return ['data-image', 'data-text', 'data-tooltip']
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'data-image') this.style.backgroundImage = `url('${newValue}')`;
    if (name === 'data-text') this.innerHTML = newValue;
    if (name === 'data-tooltip') this.title = newValue;
  }

  drag(ev) {
    ev.dataTransfer.setData('item', ev.target.id);
    ev.stopPropagation();
  }
}
customElements.define("tier-item", TierItemElement, { extends: "div" });

class TierShortcutElement extends HTMLDivElement {
  constructor(tierRef) {
    super();
    this.tierRef = tierRef;

    this.className = 'tier-shortcut';

    this.setAttribute('data-name', this.tierRef.getAttribute('data-name'));
    this.setAttribute('data-color', this.tierRef.getAttribute('data-color'));
    this.setAttribute('data-shortcut-to', this.tierRef.id);

    this.ondragover = (event) => event.preventDefault();
    this.ondrop = (event) => this.drop(event);
  }

  static get observedAttributes() {
    return ['data-name', 'data-color']
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'data-name') this.innerHTML = `<div>${newValue}</div>`;
    if (name === 'data-color') {
      this.style.backgroundColor = newValue;
      this.style.color = brightnessByColor(newValue) > 127 ? 'black' : 'white';
    };
  }

  drop = (event) => {
    event.preventDefault();
    if (!event.dataTransfer.types.includes('item')) return;
    const data = event.dataTransfer.getData('item');
    const moved = document.getElementById(data);
    this.tierRef.appendChild(moved);
  }
}
customElements.define('tier-shortcut', TierShortcutElement, { extends: 'div' });

function addTier() {
  const newTier = new TierRowElement();
  listElement.appendChild(newTier);
  shortcutAreaElement.appendChild()
}

// Handle drag and drop for tiers
listElement.ondragover = (event) => { event.preventDefault() }
listElement.ondrop = (event) => {
  event.preventDefault();
  if (!event.dataTransfer.types.includes('row')) return;
  const data = event.dataTransfer.getData("row");
  const moved = document.getElementById(data);
  const refNode = event.target instanceof TierRowElement ? event.target : null;
  listElement.insertBefore(moved, refNode);

  const movedShortcut = document.querySelector(`[data-shortcut-to='${moved.id}']`);
  const refShortcut = document.querySelector(`[data-shortcut-to='${refNode.id}']`);
  shortcutAreaElement.insertBefore(movedShortcut, refShortcut);
}

// Drag and drop for unsorted area
unsortedAreaElement.ondragover = (event) => { event.preventDefault() }
unsortedAreaElement.ondrop = (event) => {
  event.preventDefault();
  if (!event.dataTransfer.types.includes('item')) return;
  const data = event.dataTransfer.getData("item");
  const moved = document.getElementById(data);
  const refNode = event.target instanceof TierItemElement ? event.target : null
  unsortedAreaElement.insertBefore(moved, refNode);
}

function brightnessByColor(color) {
  var color = "" + color, isHEX = color.indexOf("#") == 0, isRGB = color.indexOf("rgb") == 0;
  if (isHEX) {
    const hasFullSpec = color.length == 7;
    var m = color.substr(1).match(hasFullSpec ? /(\S{2})/g : /(\S{1})/g);
    if (m) var r = parseInt(m[0] + (hasFullSpec ? '' : m[0]), 16), g = parseInt(m[1] + (hasFullSpec ? '' : m[1]), 16), b = parseInt(m[2] + (hasFullSpec ? '' : m[2]), 16);
  }
  if (isRGB) {
    var m = color.match(/(\d+){3}/g);
    if (m) var r = m[0], g = m[1], b = m[2];
  }
  if (typeof r != "undefined") return ((r * 299) + (g * 587) + (b * 114)) / 1000;
}

function importItems(json) {
  try {
    const parsed = JSON.parse(json);
    parsed.items.forEach(i => {
      unsortedAreaElement.appendChild(new TierItemElement(i.image, i.text, i.tooltip));
    });
    importDialogElement.close();
  } catch {
    alert('Invalid JSON');
  }
}

function importList(json) {
  try {
    const parsed = JSON.parse(json);
    parsed.rows.forEach(r => {
      const elem = new TierRowElement(r.name, r.color);
      listElement.appendChild(elem);
      shortcutAreaElement.appendChild(new TierShortcutElement(elem));
      r.items.forEach(i => {
        elem.appendChild(new TierItemElement(i.image, i.text, i.tooltip));
      });
    });
    parsed.unsorted.forEach(i => {
      unsortedAreaElement.appendChild(new TierItemElement(i.image, i.text, i.tooltip));
    });
    importDialogElement.close();
  } catch {
    alert('Invalid JSON');
  }
}

function exportList() {
  const rowElems = Array.from(document.querySelectorAll('tier-row'));
  const rows = rowElems.map(r => {
    const items = Array.from(r.children).map(i => {
      return {
        image: i.getAttribute('data-image'),
        text: i.getAttribute('data-text'),
        tooltip: i.getAttribute('data-tooltip')
      }
    });
    return {
      name: r.getAttribute('data-name'),
      color: r.getAttribute('data-color'),
      items: items
    }
  });
  const unsorted = Array.from(unsortedAreaElement.children).map(i => {
    return {
      image: i.getAttribute('data-image'),
      text: i.getAttribute('data-text'),
      tooltip: i.getAttribute('data-tooltip')
    }
  })
  console.log(JSON.stringify({ rows: rows, unsorted: unsorted }));
}
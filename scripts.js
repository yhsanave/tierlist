const tierRowTemplate = document.querySelector('#tierRowTemplate');
const listElement = document.querySelector('#list');
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

    this.setAttribute('name', this.getAttribute('name') ? this.getAttribute('name') : name);
    this.setAttribute('color', this.getAttribute('color') ? this.getAttribute('color') : color);

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
      this.editTitleElement.value = this.getAttribute('name');
      this.editColorElement.value = this.getAttribute('color');
      this.dialogElement.showModal();
    };
    this.editTitleElement.onchange = (event) => this.setAttribute('name', event.target.value);
    this.editColorElement.onchange = (event) => this.setAttribute('color', event.target.value);
    this.closeDialogElement.onclick = (event) => this.dialogElement.close();

  }

  static get observedAttributes() {
    return ['name', 'color'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'name') this.headElement.textContent = newValue;
    if (name === 'color') {
      this.headElement.style.backgroundColor = newValue;
      this.headElement.style.color = brightnessByColor(newValue) > 127 ? 'black' : 'white';
      this.buttonContainerElement.style.color = this.headElement.style.color;
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

    this.setAttribute('image', this.getAttribute('image') ? this.getAttribute('image') : image)
    this.setAttribute('text', this.getAttribute('text') ? this.getAttribute('text') : text)
    this.setAttribute('tooltip', this.getAttribute('tooltip') ? this.getAttribute('tooltip') : tooltip)
  }

  static get observedAttributes() {
    return ['image', 'text', 'tooltip']
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'image') this.style.backgroundImage = `url('${newValue}')`;
    if (name === 'text') this.innerHTML = newValue;
    if (name === 'tooltip') this.title = newValue;
  }

  drag(ev) {
    ev.dataTransfer.setData('item', ev.target.id);
    ev.stopPropagation();
  }
}
customElements.define("tier-item", TierItemElement, { extends: "div" });

function addTier() {
  listElement.appendChild(new TierRowElement());
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
}

// Drag and drop for unsorted area
unsortedAreaElement.ondragover = (event) => { event.preventDefault() }
unsortedAreaElement.ondrop = (event) => {
  event.preventDefault();
  if (!event.dataTransfer.types.includes('row')) return;
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
        image: i.getAttribute('image'),
        text: i.getAttribute('text'),
        tooltip: i.getAttribute('tooltip')
      }
    });
    return {
      name: r.getAttribute('name'),
      color: r.getAttribute('color'),
      items: items
    }
  });
  const unsorted = Array.from(unsortedAreaElement.children).map(i => {
    return {
      image: i.getAttribute('image'),
      text: i.getAttribute('text'),
      tooltip: i.getAttribute('tooltip')
    }
  })
  console.log(JSON.stringify({ rows: rows, unsorted: unsorted }));
}
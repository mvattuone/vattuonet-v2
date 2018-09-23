const { effectsConfig } = require('./config');
const random = require("random-js")();
const Databender = require('./databend.js');
const dat = require('dat.gui');

function handleDatGUI(databender, canvas, context, overlayContext) {
  const gui = new dat.GUI();

  const effectsTab = gui.addFolder('Effects');
  Object.keys(effectsConfig).forEach(effect => {
    const effectTab = effectsTab.addFolder(effect);
    Object.keys(effectsConfig[effect]).forEach(function (param) {
      effectTab.add(effectsConfig[effect], param).listen();            
    });
  });
};

class Grid {
  constructor(rows, columns) {
    this.rows = rows;
    this.columns = columns;
    this.cells = Uint8Array.from({ length: columns * rows }, (cell, i) => {
      return random.integer(0, 1);
    });
  }

  getNeighbors(i) {
    const rowIndex = this.columns - 1;
    const sizeIndex = this.cells.length - 1;
    const left = i % this.columns != 0 ? this.cells[i-1] : 0;
    const topLeft = i % this.columns != 0 && i > rowIndex ? this.cells[i-this.columns-1] : 0;
    const top = i > rowIndex ? this.cells[i-this.columns] : 0;
    const topRight = i % this.columns != 3 && i > rowIndex ? this.cells[i-this.columns+1] : 0;
    const right = i % this.columns != 3 ? this.cells[i+1] : 0;
    const bottomRight = i % this.columns != 3 && i < this.cells.length - this.columns ? this.cells[i+this.columns+1] : 0;
    const bottom = i < this.cells.length - this.columns ? this.cells[i+this.columns] : 0;
    const bottomLeft = i % rowIndex === 1 && i < sizeIndex - rowIndex ? this.cells[i + this.columns - 1] : 0;
    return [
      left, topLeft, top, topRight, right, bottomRight, bottom, bottomLeft
    ].filter(Boolean);
  }
}

class Conway {
  update(grid) {
    return grid.cells.map((cell, i) => {
      const neighbors = grid.getNeighbors(i);
      const livingNeighbors = neighbors.reduce((acc, cur) => 
        cur === 1 ? acc += 1 : acc, 0)

      if (cell === 0) {
        if (livingNeighbors == 3) {
          cell = 1;
        }
      } else {
        if (livingNeighbors < 2 || livingNeighbors > 3) { 
          cell = 0;
        } 
      }

      return cell; 
    });
  }
}

class Layer {
  constructor(id) { 
    this.canvas = document.querySelector(id);
    this.context = this.canvas.getContext('2d');
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  clear(x = 0, y = 0, width = this.canvas.width, height = this.canvas.height) {
    this.context.clearRect(x, y, width, height);
  }

  draw(image) {
    this.context.drawImage(image, 0, 0);
  }
}

function main() {
  const image = document.querySelector('img');
  const source = new Layer('#source');
  const overlay = new Layer('#overlay');
  source.draw(image, 0, 0);
  const grid = new Grid(16, 16);
  const conway = new Conway();
  const databender = new Databender(effectsConfig);
  handleDatGUI(databender, source.canvas, source.context, overlay.context);

  function step() {
    grid.cells = conway.update(grid);
    let row = 0;
    let column = 0;
    grid.cells.forEach(function(cell, index) {
      if (index > 0 && index % grid.columns === 0) row++;
      column = index % grid.columns;

      const gridY = row > 0 ? (source.canvas.height / grid.rows) * row : 0;
      const gridX = (source.canvas.width / grid.columns) * column;
      const cellWidth = source.canvas.width / grid.columns;
      const cellHeight = source.canvas.height / grid.rows;
      const imageData = source.context.getImageData(gridX, gridY, cellWidth, cellHeight)
      if (cell === 1) {
        databender.bend(imageData, overlay.context, gridX, gridY)
      } else {
        overlay.clear(gridX, gridY, cellWidth, cellHeight); 
      }
    });

    requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

window.onload = () => main();

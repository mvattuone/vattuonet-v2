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
  constructor(rows, columns, height, width) {
    this.rows = rows;
    this.columns = columns;
    let row = 0;
    let column = 0;
    const cellWidth = width / columns;
    const cellHeight = height / rows;
    this.cells = Array.from({ length: columns * rows }, (cell, i) => {
      if (i > 0 && i % this.columns === 0) row++;
      column = i % this.columns;
      return new Cell(row, column, cellHeight, cellWidth);
    });
  }

  getCellValues() {
    return Int32Array.from(this.cells, (cell) => {
      return cell.value;
    });
  }
  
  setSource(source) {
    this.cells.forEach((cell) => {
      cell.renderedData = source.context.getImageData(cell.x, cell.y, cell.width, cell.height)
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
    return grid.getCellValues().map((cell, i) => {
      const neighbors = grid.getNeighbors(i);
      const livingNeighbors = neighbors.reduce((acc, cur) => 
        cur.value === 1 ? acc += 1 : acc, 0)

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
  constructor(id, height, width) { 
    this.canvas = document.querySelector(id); 
    this.context = this.canvas.getContext('2d');
    this.canvas.width = width || window.innerWidth;
    this.canvas.height = height || window.innerHeight;
  }

  clear(x = 0, y = 0, width = this.canvas.width, height = this.canvas.height) {
    this.context.clearRect(x, y, width, height);
  }

  draw(image) {
    this.context.drawImage(image, 0, 0);
  }
}

class Cell {
  constructor(row, column, height, width) {
    this.x = width * column;
    this.y = height * row;
    this.height = height;
    this.width = width;
    this.value = random.integer(0, 1);
  }
}

function main() {
  const image = document.querySelector('img');
  const source = new Layer('#source', 640, 640);
  const overlay = new Layer('#overlay', 640, 640);
  const grid = new Grid(50, 50, source.canvas.height, source.canvas.width);
  const conway = new Conway();
  const databender = new Databender(effectsConfig);
  databender.bend(image, source.context).then((buffer) => {
    grid.setSource(source);
    handleDatGUI(databender, source.canvas, source.context, overlay.context);
    requestAnimationFrame(step);
  }); 

  function step() {
    const newCellValues = conway.update(grid);
    grid.cells.forEach((cell, index) => {
      cell.value = newCellValues[index];
      if (cell.value === 1) {
        overlay.context.putImageData(cell.renderedData, cell.x, cell.y);
      } else {
        overlay.clear(cell.x, cell.y, cell.width, cell.height); 
      }
    });

    requestAnimationFrame(step);
  }

}

window.onload = () => main();

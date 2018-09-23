const { effects: effectsConfig } = require('./config');
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

class Cell {
  constructor(grid, row, index) {
    this.grid = grid;
    this.row = row;
    this.index = index;
    this.value = Math.round(Math.random());
  }

  getNeighbors() {
    const isFirstRow = this.row === 0;
    const isLastRow  = this.row === this.grid.cells.length - 1;
    const isFirstColumn = this.index === 0;
    const isLastColumn  = this.index === this.grid.cells[0].length - 1; // Kinda weird

    const top = !isFirstRow ? this.grid.cells[this.row - 1][this.index] : null;
    const bottom =  !isLastRow ? this.grid.cells[this.row + 1][this.index] : null;
    const left = !isFirstColumn ? this.grid.cells[this.row][this.index - 1] : null;
    const right = !isLastColumn ? this.grid.cells[this.row][this.index + 1] : null;
    const topLeft = !isFirstRow && !isFirstColumn ? this.grid.cells[this.row - 1][this.index - 1] : null;
    const topRight = !isFirstRow && !isLastColumn ? this.grid.cells[this.row - 1][this.index + 1] : null;
    const bottomLeft = !isLastRow && !isFirstColumn? this.grid.cells[this.row + 1][this.index - 1] : null;
    const bottomRight = !isLastRow && !isLastColumn ? this.grid.cells[this.row + 1][this.index + 1] : null;
    return [
      left, topLeft, top, topRight, right, bottomRight, bottom, bottomLeft
    ]
  }

  isAlive() { 
    return this.value === 1;
  }

  isDead() {
    return this.value === 0;
  }

  die() {
    this.value = 0;
  }

  live() {
    this.value = 1;
  }
}

class Grid {
  constructor(rows, columns) {
    this.rows = rows;
    this.columns = columns;
    this.cells = Array.from({ length: rows }, (row, i) => 
      Array.from({ length: columns}, (cell, j) =>  
        new Cell(this, i, j)))
  }
}

class Conway {
  update(grid) {
    return grid.cells.map((row, i) => {
      row.map((cell, i) => {
        const neighbors = cell.getNeighbors().filter(Boolean);
        const livingNeighbors = neighbors.reduce((acc, cur) => 
          cur.isAlive() ? acc += 1 : acc, 0)

        const oldCell = cell.value;

        if (cell.isDead()) {
          if (livingNeighbors == 3) {
            cell.live();
          }
        } else {
          if (livingNeighbors < 2 || livingNeighbors > 3) { 
            cell.die();
          } 
        }

        return cell; 
      });
      return row;
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

  clear() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

function main() {
  const image = document.querySelector('img');
  const source = new Layer('#source');
  const overlay = new Layer('#overlay');
  source.context.drawImage(image, 0, 0);
  const grid = new Grid(70, 70);
  const conway = new Conway();
  let start = 0;
  const databender = new Databender(effectsConfig);
  handleDatGUI(databender, source.canvas, source.context, overlay.context);

  function step() {
    grid.cells = conway.update(grid);
    grid.cells.forEach(function(row, index) { 
      const gridY = (source.canvas.height / grid.rows) * index;
      row.forEach(function(cell, index) {
        const gridX = (source.canvas.width / grid.columns) * index;
        const cellWidth = source.canvas.width / grid.columns;
        const cellHeight = source.canvas.height / grid.rows;
        const imageData = source.context.getImageData(gridX, gridY, cellWidth, cellHeight)
        if (cell.isAlive()) {
          if (!cell.cachedBuffer || databender.configHasChanged()) {
            databender.bend(imageData, overlay.context, gridX, gridY).then((buffer) => {
              cell.databentBuffer = buffer;
              databender.draw(buffer, overlay.context, gridX, gridY);
            }).catch((e) => {
              console.error(e);
            });
          } else {
            databender.draw(cell.databentBuffer, overlay.context, gridX, gridY);
          }
        } else {
          overlay.context.clearRect(gridX, gridY, cellWidth, cellHeight); 
        }
      });
    });

    requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

window.onload = () => main();

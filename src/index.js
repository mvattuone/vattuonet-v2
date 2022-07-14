import { effectsConfig } from './config';
import random from 'random-js';
import Databender from 'databender';
import { GUI } from 'dat.gui';


function handleDatGUI(databender, image, source) {
  const gui = new GUI();

  const effectsTab = gui.addFolder('Effects');
  Object.keys(effectsConfig).forEach(effect => {
    const effectTab = effectsTab.addFolder(effect);
    Object.keys(effectsConfig[effect]).forEach(function(param) {
      effectTab.add(effectsConfig[effect], param).onFinishChange(() => {
        databender.bend(image, source.context);
      });
    });
  });
};


class Grid {
  constructor(rows, columns, height, width) {
    this.rows = rows;
    this.columns = columns;
    this.cellWidth = width / columns;
    this.cellHeight = height / rows;
    this.cells = Array.from({ length: columns * rows }, () => {
      const value = random().integer(0, 1);
      return value;
    });
  }

  reset() {
    this.cells.map(() => {
      return random().integer(0, 1);
    });

  }

  getNeighbors(i) {

    const cellIsInFirstRow = i <= this.columns - 1;
    const cellIsInLastRow = i >= this.cells.length - this.columns;
    const cellIsInFirstColumn = i % this.columns === 0;
    const cellIsInLastColumn = i % this.columns === (this.columns - 1);

    const left = !cellIsInFirstColumn ? this.cells[i - 1] : 0;
    const topLeft = !cellIsInFirstColumn && !cellIsInFirstRow ? this.cells[i - this.columns - 1] : 0;
    const top = !cellIsInFirstRow ? this.cells[i - this.columns] : 0;
    const topRight = !cellIsInLastColumn && !cellIsInFirstRow ? this.cells[i - this.columns + 1] : 0;
    const right = !cellIsInLastColumn ? this.cells[i + 1] : 0;
    const bottomRight = !cellIsInLastColumn && !cellIsInLastRow ? this.cells[i + this.columns + 1] : 0;
    const bottom = !cellIsInLastRow ? this.cells[i + this.columns] : 0;
    const bottomLeft = !cellIsInLastRow && !cellIsInFirstColumn ? this.cells[i + this.columns - 1] : 0;
    return [
      left, topLeft, top, topRight, right, bottomRight, bottom, bottomLeft
    ].filter(Boolean);
  }
}

class Conway {
  update(grid) {
    return grid.cells.map((cell, i) => {
      const neighbors = grid.getNeighbors(i);

      if (cell === 0) {
        if (neighbors.length === 3) {
          return 1;
        }
      } else {
        if (neighbors.length < 2 || neighbors.length > 3) {
          return 0;
        }
      }

      return cell;
    });
  }
}

class Layer {
  constructor(id, height = window.innerHeight, width = window.innerWidth) {
    this.canvas = document.querySelector(id);
    this.context = this.canvas.getContext('2d');
    this.canvas.width = width;
    this.canvas.height = height;
  }
}

const WIDTH = 5120;
const HEIGHT = 5120;

function main() {
  const image = document.querySelector('img');
  const source = new Layer('#source', WIDTH, HEIGHT);
  const overlay = new Layer('#overlay', WIDTH, HEIGHT);
  overlay.context.fillStyle = '#222';
  overlay.context.fillRect(0, 0, overlay.width, overlay.height);
  const grid = new Grid(WIDTH, HEIGHT, source.canvas.height, source.canvas.width);
  let imageData = overlay.context.getImageData(0, 0, WIDTH, HEIGHT);
  let buffer = new Uint32Array(imageData.data.buffer);
  const conway = new Conway();
  const databender = new Databender(effectsConfig);
  databender.bend(image, source.context).then(() => {
    requestAnimationFrame(step);
  });

  function updateImageData(cells, cellWidth, cw, ch) {
    for (var i = 0; i < cells.length - 1; i++) {
      const columnIndex = i % grid.columns;
      const rowIndex = Math.floor(i / grid.columns);
      if (cells[i] !== grid.cells[i]) {
        const startingPixel = (columnIndex * cellWidth) + (cw * cellWidth * rowIndex);

        for (var j = 0; j < cellWidth; j++) {
          for (var k = 0; k < cellWidth; k++) {
            const pixelToChange = startingPixel + k + cw * j;
            buffer[pixelToChange] = cells[i] === 1 ? 0x00222222 : 0xFF222222;
          }
        }
      }
    }

    return imageData;
  }

  handleDatGUI(databender, image, source);

  function step() {

    function redrawGrid() {
      const newCells = conway.update(grid);
      imageData = updateImageData(newCells, grid.cellWidth, overlay.canvas.width, overlay.canvas.height);
      overlay.context.putImageData(imageData, 0, 0);
      grid.cells = newCells;
    }

    if (databender.configHasChanged()) {
      databender.bend(image, source.getContext('2d')).then(redrawGrid);
    } else {
      redrawGrid();
    }

    requestAnimationFrame(step);
  }
}

main();

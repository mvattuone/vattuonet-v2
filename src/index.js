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
    this.cells = Uint8Array.from({ length: columns * rows }, () => {
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

    let count = 0;

    // left
    if (!cellIsInFirstColumn) {
      count += this.cells[i - 1];
    }

    // top left
    if (!cellIsInFirstColumn && !cellIsInFirstRow) {
      count += this.cells[i - this.columns - 1];
    }

    // top
    if (!cellIsInFirstRow) {
      count += !cellIsInFirstRow ? this.cells[i - this.columns] : 0;
    }

    // topright
    if (!cellIsInLastColumn && !cellIsInFirstRow) {
      count += this.cells[i - this.columns + 1];
    }

    // right
    if (!cellIsInLastColumn) {
      count += this.cells[i + 1];
    }

    // bottom right
    if (!cellIsInLastColumn && !cellIsInLastRow) {
      count += this.cells[i + this.columns + 1];
    }

    // bottom
    if (!cellIsInLastRow) {
      count += this.cells[i + this.columns];
    }

    // bottom left
    if (!cellIsInLastRow && !cellIsInFirstColumn) {
      count += this.cells[i + this.columns - 1];
    }

    return count;
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

const WIDTH = window.innerWidth;
const HEIGHT = window.innerWidth;


function main() {
  const image = document.querySelector('img');
  const source = new Layer('#source', window.innerWidth, window.innerWidth);
  const overlay = new Layer('#overlay', window.innerWidth, window.innerWidth);
  overlay.context.fillStyle = '#222';
  overlay.context.fillRect(0, 0, overlay.width, overlay.height);
  const grid = new Grid(WIDTH, HEIGHT, source.canvas.height, source.canvas.width);
  const gridLength = grid.cells.length;
  const cw = overlay.canvas.width;
  let imageData = overlay.context.getImageData(0, 0, window.innerWidth, window.innerWidth);
  let buffer = new Uint32Array(imageData.data.buffer);
  let newCells = new Uint8Array(gridLength);
  const databender = new Databender(effectsConfig);
  const secret = document.getElementById('secret');
  secret.addEventListener('click', (e) => {
    image.classList.add('clicked');
    const scaleX = window.innerWidth / image.width;
    const scaleY = window.innerHeight / image.height;
    image.style.transform = `scale(${scaleX}, ${scaleY})`;
    databender.bend(image, source.context).then(() => {
      image.classList.add('hidden');
      requestAnimationFrame(step);
    })
  });


  handleDatGUI(databender, image, source);

  function update() {
    for (let i = 0; i < gridLength; i++) {
      const neighbors = grid.getNeighbors(i);


      if (grid.cells[i] === 0 && neighbors === 3) {
        const columnIndex = i % grid.columns;
        const rowIndex = Math.floor(i / grid.columns);
        const startingPixel = (columnIndex * grid.cellWidth) + (cw * grid.cellWidth * rowIndex);

        for (var j = 0; j < grid.cellWidth; j++) {
          for (var k = 0; k < grid.cellWidth; k++) {
            const pixelToChange = startingPixel + k + cw * j;
            buffer[pixelToChange] = 0x00222222;
          }
        }
        newCells[i] = 1;
      } else if (grid.cells[i] === 1 && (neighbors < 2 || neighbors > 3)) {
        const columnIndex = i % grid.columns;
        const rowIndex = Math.floor(i / grid.columns);
        const startingPixel = (columnIndex * grid.cellWidth) + (cw * grid.cellWidth * rowIndex);

        for (var j = 0; j < grid.cellWidth; j++) {
          for (var k = 0; k < grid.cellWidth; k++) {
            const pixelToChange = startingPixel + k + cw * j;
            buffer[pixelToChange] = 0xFF222222;
          }
        }
        newCells[i] = 0;
      } else if (grid.cells[i] === 1) {
        newCells[i] = grid.cells[i];
      }
    };
    grid.cells = newCells.slice(0);
    newCells.fill(0);
  }

  function step() {

    function redrawGrid() {
      update();
      overlay.context.putImageData(imageData, 0, 0);
    }

    if (databender.configHasChanged()) {
      databender.bend(image, source.getContext('2d')).then(redrawGrid);
    } else {
      redrawGrid();
    }

    requestAnimationFrame(step);
  }
}

window.onload = () => main();

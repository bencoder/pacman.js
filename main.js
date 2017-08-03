function game(canvasId) {
  const tileSize = 36;
  const offset = 158;
  const canvas = document.getElementById(canvasId);
  const context = canvas.getContext('2d');

  function Position(x,y) {
    this.x = x;
    this.y = y;

    this.add = (position) => {
      return new Position(this.x + position.x, this.y + position.y);
    };

    this.round = () => {
      return new Position(Math.round(this.x), Math.round(this.y));
    };

    this.mul = (m) => {
      return new Position(this.x * m, this.y * m);
    };

    this.screen = () => ({
      topLeft: {
        x: offset + this.x * tileSize,
        y: offset + this.y * tileSize
      },

      center: {
        x: offset + this.x * tileSize + tileSize / 2,
        y: offset + this.y * tileSize + tileSize / 2
      }
    });
    Object.freeze(this);
  }

  function Map() {
    const map = [
      '###################',
      '#........#........#',
      '#.##.###.#.###.##.#',
      '#.................#',
      '#.##.#.#####.#.##.#',
      '#....#...#...#....#',
      '####.###.#.###.####',
      '   #.#.......#.#   ',
      '####.#.#####.#.####',
      '.......#   #.......',
      '####.#.#####.#.####',
      '   #.#.......#.#   ',
      '####.#.#####.#.####',
      '#........#........#',
      '#.##.###.#.###.##.#',
      '#..#..... .....#..#',
      '##.#.#.#####.#.#.##',
      '#....#...#...#....#',
      '#.######.#.######.#',
      '#.................#',
      '###################'
    ];

    this.arePillsEaten = () => {
      return map.filter(row => row.indexOf('.') !== -1).length === 0;
    }

    this.isTileClear = (pos) => {
      if (pos.x < 0 || pos.x > 18) {
        return true;
      }
      const char = map[pos.y].charAt(pos.x);
      return char === ' ' || char === '.';
    }

    this.eatPill = (pos) => {
      const char = map[pos.y].charAt(pos.x);
      if (char === '.') {
        map[pos.y] = map[pos.y].substring(0, pos.x) + ' ' + map[pos.y].substring(pos.x + 1);
        return true;
      }
      return false;
    }

    this.draw = () => {
      context.fillStyle = "black";
      context.fillRect(0, 0, 1000, 1000);

      for (let x = 0; x < 19; x++) {
        for (let y = 0; y < 21; y++) {
          const pos = new Position(x, y);
          const tile = map[y].charAt(x);
          if (tile === '#') {
            context.fillStyle = "blue";
            context.fillRect(pos.screen().topLeft.x, pos.screen().topLeft.y, tileSize, tileSize);
          }
          if (tile === '.') {
            context.beginPath();
            context.fillStyle = "yellow";
            context.arc(pos.screen().center.x, pos.screen().center.y, 5, 0, 2 * Math.PI);
            context.fill();
          }
        }
      }
    }
  }

  function ControllableCharacter(map, speed, drawFunc, x, y, onUpdate, initialMovement) {
    let position = new Position(x,y);
    let moving = initialMovement;
    let nextMove = '';
    let progress = new Position(0,0);

    this.move = (direction) => {
      nextMove = direction;
    };

    this.getPos = () => {
      return position.add(progress.round());
    };

    this.draw = () => {
      const drawPos = position.add(progress);
      drawFunc(drawPos);
    }

    this.update = (dt) => {
      if (position.x > 18) {
        position = new Position(0, position.y);
      }
      if (position.x < 0) {
        position = new Position(18, position.y);
      }

      const v = new Position(
        moving === 'left' ? -1 : moving === 'right' ? 1 : 0,
        moving === 'up' ? -1 : moving === 'down' ? 1 : 0
      );

      if (!map.isTileClear(position.add(v))) {
        moving = '';
      } else {
        progress = progress.add(v.mul(dt*speed));
      }

      if (Math.abs(progress.x) >= 1 || Math.abs(progress.y) >= 1) {
        position = position.add(v);
        progress = new Position(0,0);
      }

      const nextPos = position.add(new Position(
        nextMove === 'left' ? -1 : nextMove === 'right' ? 1 : 0,
        nextMove === 'up' ? -1 : nextMove === 'down' ? 1 : 0
      ));

      if (progress.y === 0 && progress.x === 0 && map.isTileClear(nextPos)) {;
        moving = nextMove;

        if (onUpdate)
          onUpdate(nextPos, moving)
      }
    }
  }

  const map = new Map();

  const playerDraw = (drawPos) => {
    context.beginPath();
    context.arc(drawPos.screen().center.x, drawPos.screen().center.y, tileSize/2-4, 0, 2 * Math.PI);
    context.fillStyle = 'yellow';
    context.fill();
  };

  const ghostDraw = (color) => (drawPos) => {
    context.beginPath();
    context.fillStyle = color;
    context.arc(drawPos.screen().center.x, drawPos.screen().center.y, tileSize/2-6, 0, Math.PI, true);
    context.fill();
    context.fillRect(drawPos.screen().topLeft.x+6, drawPos.screen().topLeft.y+tileSize/2, tileSize-12, tileSize/2-2);
  }


  const updateFunc = (controller) => (nextPos, moving) => {
    controller.postMessage(
      {
        pacman: {x: player.getPos().x, y: player.getPos().y},
        ghost: {x: nextPos.x, y: nextPos.y},
        direction: moving
      }
    );
  };

  const player = new ControllableCharacter(map, 3, playerDraw, 9, 15);

  const ghostControllers = [
    new Worker('./ghostController.js'),
    new Worker('./ghostController.js'),
    new Worker('./ghostController.js'),
    new Worker('./ghostController.js')
  ];
  const ghosts = [
    new ControllableCharacter(map, 2, ghostDraw('red'), 7,7, updateFunc(ghostControllers[0]), 'left'),
    new ControllableCharacter(map, 2.4, ghostDraw('green'), 8,7, updateFunc(ghostControllers[1]), 'right'),
    new ControllableCharacter(map, 2.6, ghostDraw('aqua'), 9,7, updateFunc(ghostControllers[2]), 'left'),
    new ControllableCharacter(map, 2.8, ghostDraw('pink'), 10,7, updateFunc(ghostControllers[3]), 'right'),
  ];

  ghostControllers[0].addEventListener('message', function(e) {
    ghosts[0].move(e.data);
  }, false);
  ghostControllers[1].addEventListener('message', function(e) {
    ghosts[1].move(e.data);
  }, false);
  ghostControllers[2].addEventListener('message', function(e) {
    ghosts[2].move(e.data);
  }, false);
  ghostControllers[3].addEventListener('message', function(e) {
    ghosts[3].move(e.data);
  }, false);



  document.addEventListener("keydown", function(event) {
    switch(event.keyCode) {
      case 37:
        player.move('left'); break;
      case 38:
        player.move('up'); break;
      case 39:
        player.move('right'); break;
      case 40:
        player.move('down'); break;
    }
  })


  let previousTime = 0;
  let gameRunning = true;
  let finishGameText = '';
  let score = 0;
  function tick(timeStamp) {
    let dt = (timeStamp - previousTime) / 1000;
    if (dt > 0.1) {
      dt = 0.1; //if we get less than 10 fps, then limit it
    }
    previousTime = timeStamp;

    if (gameRunning) {
      player.update(dt);
      ghosts.map(g => g.update(dt));
      ghosts.map(ghost => {
        if (ghost.getPos().x === player.getPos().x && ghost.getPos().y === player.getPos().y) {
          gameRunning = false;
          finishGameText = 'GAME OVER';
        }
      })
      const playerPos = player.getPos();
      if (map.eatPill(playerPos)) score++;
      if (map.arePillsEaten()) {
        gameRunning = false;
        finishGameText = 'WINNER';
      }
    }

    map.draw();
    player.draw();
    ghosts.map(g => g.draw());
    context.textAlign="center";
    context.fillStyle = 'white';
    context.font = "70px Arial";
    if (finishGameText !== '') {
      context.fillText(finishGameText,500,500);
    }
    context.fillText(score, 500, 100);
    window.requestAnimationFrame(tick);
  }
  window.requestAnimationFrame(tick);
}
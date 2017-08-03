const map = [
  '$$$$$$$$$$$$$$$$$$$',
  '$        $        $',
  '$ $$ $$$ $ $$$ $$ $',
  '$                 $',
  '$ $$ $ $$$$$ $ $$ $',
  '$    $   $   $    $',
  '$$$$ $$$ $ $$$ $$$$',
  '   $ $       $ $   ',
  '$$$$ $ $$$$$ $ $$$$',
  '       $   $       ',
  '$$$$ $ $$$$$ $ $$$$',
  '   $ $       $ $   ',
  '$$$$ $ $$$$$ $ $$$$',
  '$        $        $',
  '$ $$ $$$ $ $$$ $$ $',
  '$  $           $  $',
  '$$ $ $ $$$$$ $ $ $$',
  '$    $   $   $    $',
  '$ $$$$$$ $ $$$$$$ $',
  '$                 $',
  '$$$$$$$$$$$$$$$$$$$'
];

function char(x,y) {
  return map[y].charAt(x)
}

function isMovable(x,y) {
  return char(x,y) === ' ';
}

function decisions(x,y) {
  const results = [];
  if (isMovable(x+1, y))
    results.push('right');
  if (isMovable(x-1, y))
    results.push('left');
  if (isMovable(x, y+1))
    results.push('down');
  if (isMovable(x, y-1))
    results.push('up');
  return results;
}

function invert(direction) {
  switch(direction) {
    case 'up': return 'down';
    case 'down': return 'up';
    case 'left': return 'right';
    case 'right': return 'left';
  }
}

function setDirection(direction) {
  self.postMessage(direction);
}

//Of the available choices, find which one puts us closer to the player:
function calculateTarget(position, choices, target) {
  let minDist = 1000;
  let choice = choices[0];

  for(i=0;i<choices.length;i++) {
    const x = position.x + (choices[i] === 'left' ? -1 : choices[i] === 'right' ? 1 : 0);
    const y = position.y + (choices[i] === 'up' ? -1 : choices[i] === 'down' ? 1 : 0);
    console.log(position, choices[i], x,y)
    const distance = Math.pow(target.x - x, 2) + Math.pow(target.y - y, 2);
    if (distance < minDist) {
      choice = choices[i];
      minDist = distance;
    }
  }
  console.log(position, target, choice);
  return choice;
}

let direction;

self.addEventListener('message', function(e) {
  const pacman = e.data.pacman;
  const ghost = e.data.ghost;
  direction = e.data.direction;

  const choices = decisions(ghost.x, ghost.y).filter(dir => dir !== invert(direction)); //ghost cannot reverse direction
  if (choices.length === 1) {
    setDirection(choices[0])
  } else if (choices.length > 1) {
    setDirection(calculateTarget(ghost, choices, pacman));
  }
}, false);


'use strict';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  plus(add) {
    if (add instanceof Vector) {
      return new Vector((this.x + add.x), (this.y + add.y));
    }
    else {
      throw (new Error);
    }
  }
  times(multiplier) {
    return new Vector((this.x * multiplier), (this.y * multiplier));
  }
}

function isVector(check) {
  if (check instanceof Vector) {
    return true;
  } else {
    return false;
  }
}

function isActor(check) {
  if (check instanceof Actor) {
    return true;
  } else {
    return false;
  }
}

class Actor {
  constructor(initialPos = new Vector, initialSize = new Vector(1, 1), initialSpeed = new Vector) {
    if (isVector(initialPos) && isVector(initialSize) && isVector(initialSpeed)) {
      this.pos = initialPos;
      this.size = initialSize;
      this.speed = initialSpeed;
    } else {
      throw (new Error);
    }
  }
  act() { }
  get left() {
    return this.pos.x;
  }
  get top() {
    return this.pos.y;
  }
  get right() {
    return this.pos.x + this.size.x;
  }
  get bottom() {
    return this.pos.y + this.size.y;
  }
  get type() {
    return 'actor';
  }
  isIntersect(actor) {
    if (isActor(actor)) {
      if (actor === this) {
        return false;
      }
      if ((this.right <= actor.left) || (actor.right <= this.left) || (this.bottom <= actor.top) || (actor.bottom <= this.top)) {
        return false;
      }
      return true;
    } else {
      throw (new Error);
    }
  }
}

function getMaxLength(array) {
  if (array.length === 0) {
    return 0;
  } else {
    let result = 0;
    if (array[0]) result = array[0].length
    for (let currentArray of array) {
      if (currentArray) {
        if (currentArray.length > result) {
          result = currentArray.length;
        }
      }
    }
    return result;
  }
}
class Level {
  constructor(grid = [], actors = []) {
    this.grid = grid;
    this.actors = actors;
    this.player = actors.find((element) => element.type === 'player');
    this.height = grid.length;
    this.width = getMaxLength(grid);
    this.status = null;
    this.finishDelay = 1;
  }
  isFinished() {
    return (this.finishDelay < 0) && (this.status !== null);
  }
  actorAt(checkingActor) {
    for (let actor of this.actors) {
      if (checkingActor.isIntersect(actor)) {
        return actor;
      }
    }
    return undefined;
  }
  obstacleAt(newPos, size) {
    for (let xCoord = Math.floor(newPos.x); xCoord < Math.ceil(newPos.x + size.x); xCoord++) {
      for (let yCoord = Math.floor(newPos.y); yCoord < Math.ceil(newPos.y + size.y); yCoord++) {
        if ((yCoord < 0) || (xCoord < 0) || (xCoord >= this.width)) {
          return 'wall';
        }
        if (yCoord >= this.height) {
          return 'lava';
        }
        if (this.grid[yCoord][xCoord]) {
          return this.grid[yCoord][xCoord];
        }
      }
    }
    return undefined;
  }
  removeActor(deletingActor) {
    if (this.actors.indexOf(deletingActor) != '-1') {
      this.actors.splice(this.actors.indexOf(deletingActor), 1)
    }
  }
  noMoreActors(type) {
    for (let actor of this.actors) {
      if (actor.type === type) {
        return false;
      }
    }
    return true;
  }
  playerTouched(typeOfObstacle, actor) {
    if ((typeOfObstacle === 'lava') || (typeOfObstacle === 'fireball')) {
      this.status = 'lost';
      return;
    }
    if (typeOfObstacle === 'coin') {
      this.removeActor(actor);
      if (this.noMoreActors('coin')) {
        this.status = 'won';
        return;
      }
    }
  }
}

class LevelParser {
  constructor(glossary) {
    this.glossary = glossary;
  }
  actorFromSymbol(type) {
    if (type === undefined) {
      return undefined;
    }
    if ((Actor.isPrototypeOf(this.glossary[type])) || (this.glossary[type] instanceof Actor) || (this.glossary[type] == Actor)) {
      return this.glossary[type];
    } else {
      return undefined;
    }
  }
  obstacleFromSymbol(obstacleSymbol) {
    if (obstacleSymbol === '!') {
      return 'lava';
    }
    if (obstacleSymbol === 'x') {
      return 'wall';
    }
    return undefined;
  }
  createGrid(stringMap) {
    let resultArray = [];
    for (let string of stringMap) {
      let resultString = [];
      for (let i = 0; i < string.length; i++) {
        resultString.push(this.obstacleFromSymbol(string[i]));
      }
      resultArray.push(resultString);
    }
    return resultArray;
  }
  createActors(stringMap) {
    let yCoord = 0;
    const resultArray = [];
    if (!this.glossary) {
      return resultArray;
    }
    for (let string of stringMap) {
      for (let xCoord = 0; xCoord < string.length; xCoord++) {
        if (this.actorFromSymbol(string[xCoord])) {
          resultArray.push(new (this.actorFromSymbol(string[xCoord]))(new Vector(xCoord, yCoord)));
        }
      }
      yCoord++;
    }
    return resultArray;
  }
  parse(stringMap) {
    const grid = this.createGrid(stringMap);
    const actors = this.createActors(stringMap);
    return new Level(grid, actors);
  }
}

class Fireball extends Actor {
  constructor(initialPos = new Vector, initialSpeed = new Vector) {
    super();
    this.speed = initialSpeed;
    this.pos = initialPos;
  }
  get type() {
    return 'fireball';
  }
  getNextPosition(time = 1) {
    return this.pos.plus(this.speed.times(time));
  }
  handleObstacle() {
    this.speed.x *= -1;
    this.speed.y *= -1;
  }
  act(time, level) {
    if (level.obstacleAt(this.getNextPosition(time), this.size)) {
      this.handleObstacle();
    } else {
      this.pos = this.getNextPosition(time);
    }
  }
}

class HorizontalFireball extends Fireball {
  constructor(initialPos = new Vector) {
    super();
    this.pos = initialPos;
    this.speed = new Vector(2, 0);
    this.size = new Vector(1, 1);
  }
}

class VerticalFireball extends Fireball {
  constructor(initialPos = new Vector) {
    super();
    this.pos = initialPos;
    this.speed = new Vector(0, 2);
    this.size = new Vector(1, 1);
  }
}

class FireRain extends Fireball {
  constructor(initialPos = new Vector) {
    super();
    this.source = initialPos;
    this.pos = initialPos;
    this.speed = new Vector(0, 3);
    this.size = new Vector(1, 1);
  }
  handleObstacle() {
    this.pos = this.source;
  }
}

class Coin extends Actor {
  constructor(initialPos = new Vector) {
    super();
    this.source = initialPos.plus(new Vector(0.2, 0.1));
    this.pos = this.source;
    this.size = new Vector(0.6, 0.6);
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = Math.random() * 2 * Math.PI;
  }

  get type() {
    return 'coin';
  }

  updateSpring(time = 1) {
    this.spring += this.springSpeed * time;
  }

  getSpringVector() {
    return new Vector(0, (Math.sin(this.spring) * (this.springDist)));
  }

  getNextPosition(time = 1) {
    this.updateSpring(time);
    return this.source.plus(this.getSpringVector());
  }

  act(time) {
    this.pos = this.getNextPosition(time);
  }
}

class Player extends Actor {
  constructor(initialPos = new Vector) {
    super();
    this.pos = initialPos.plus(new Vector(0, -0.5));
    this.size = new Vector(0.8, 1.5);
    this.speed = new Vector();
  }
  get type() {
    return 'player';
  }
}
const actorDict = {
  '@': Player,
  'v': FireRain,
  'o': Coin,
  '=': HorizontalFireball,
  '|': VerticalFireball,
}

const schemas = [
  [
    "     v                 ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "  |xxx       w         ",
    "                    o  ",
    "  x               = x  ",
    "  x          o o    x  ",
    "  x  @    *  xxxxx  x  ",
    "  xxxxx             x  ",
    "      x!!!!!!!!!!!!!x  ",
    "      xxxxxxxxxxxxxxx  ",
    "                       "
  ],
  [
    "     v                 ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "  |                    ",
    "  o                 o  ",
    "  x               = x  ",
    "  x          o o    x  ",
    "  x  @       xxxxx  x  ",
    "  xxxxx             x  ",
    "      x!!!!!!!!!!!!!x  ",
    "      xxxxxxxxxxxxxxx  ",
    "                       "
  ],
  [
    "        |           |  ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "     |                 ",
    "                       ",
    "         =      |      ",
    " @ |  o            o   ",
    "xxxxxxxxx!!!!!!!xxxxxxx",
    "                       "
  ],
  [
    "                       ",
    "                       ",
    "                       ",
    "    o                  ",
    "    x      | x!!x=     ",
    "         x             ",
    "                      x",
    "                       ",
    "                       ",
    "                       ",
    "               xxx     ",
    "                       ",
    "                       ",
    "       xxx  |          ",
    "                       ",
    " @                     ",
    "xxx                    ",
    "                       "
  ], [
    "   v         v",
    "              ",
    "         !o!  ",
    "              ",
    "              ",
    "              ",
    "              ",
    "         xxx  ",
    "          o   ",
    "        =     ",
    "  @           ",
    "  xxxx        ",
    "  |           ",
    "      xxx    x",
    "              ",
    "          !   ",
    "              ",
    "              ",
    " o       x    ",
    " x      x     ",
    "       x      ",
    "      x       ",
    "   xx         ",
    "              "
  ]
];

const parser = new LevelParser(actorDict);
runGame(schemas, parser, DOMDisplay)
  .then(() => console.log('Вы выиграли приз!'));
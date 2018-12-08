'use strict';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  plus(add) {
    if (add instanceof Vector) {
      return new Vector(this.x + add.x, this.y + add.y);
    }
    throw (new Error);
  }
  times(multiplier) {
    return new Vector(this.x * multiplier, this.y * multiplier);
  }
}

class Actor {
  constructor(initialPos = new Vector, initialSize = new Vector(1, 1), initialSpeed = new Vector) {

    if (!((initialPos instanceof Vector) && (initialSize instanceof Vector) && (initialSpeed instanceof Vector))) {
      throw (new Error);
    }
    this.pos = initialPos;
    this.size = initialSize;
    this.speed = initialSpeed;
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
  	if (!(actor instanceof Actor)) {
  		throw (new Error);
  	}
  	if (actor === this) {
  		return false;
  	}
  	return ((this.right > actor.left) && (actor.right > this.left) && (this.bottom > actor.top) && (actor.bottom > this.top));
  }
}

class Level {
  constructor(grid = [], actors = []) {
    this.grid = grid;
    this.actors = actors;
    this.player = actors.find((element) => element.type === 'player');
    this.height = grid.length;
    this.width = grid.reduce((result, currentValue) => currentValue.length > result ? currentValue.length : result, 0);
    this.status = null;
    this.finishDelay = 1;
  }
  isFinished() {
    return this.finishDelay < 0 && this.status !== null;
  }
  actorAt(checkingActor) {
    return this.actors.find((actor) => checkingActor.isIntersect(actor))
  }
  obstacleAt(newPos, size) {
    const xFloor = Math.floor(newPos.x);
    const xCeil = Math.ceil(newPos.x + size.x);
    const yFloor = Math.floor(newPos.y);
    const yCeil = Math.ceil(newPos.y + size.y);

    if ((yFloor < 0) || (xFloor < 0) || (xCeil >= this.width)) {
        return 'wall';
    }
    if (yCeil >= this.height) {
        return 'lava';
    }

    for (let xCoord = xFloor; xCoord < xCeil; xCoord++) {
      for (let yCoord = yFloor; yCoord < yCeil; yCoord++) {
        const current = this.grid[yCoord][xCoord];
        if (current) {
          return current;
        }
      }
    }
  }
  removeActor(deletingActor) {
    const index = this.actors.indexOf(deletingActor);
    if (index !== '-1') {
      this.actors.splice(index, 1);
    }
  }
  noMoreActors(type) {
    return (!(this.actors.find((actor) => (actor.type === type))))
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
      }
    }
  }
}

class LevelParser {
  constructor(glossary = {}) {
    this.glossary = glossary;
  }
  actorFromSymbol(type) {
    return this.glossary[type];
  }
  obstacleFromSymbol(obstacleSymbol) {
    if (obstacleSymbol === '!') {
      return 'lava';
    }
    if (obstacleSymbol === 'x') {
      return 'wall';
    }
  }
  createGrid(stringMap) {
    return stringMap.map(function(currentString) {
    	const resultString = [];
    	for (let i = 0; i < currentString.length; i++) {
        	resultString.push(this.obstacleFromSymbol(currentString[i]));
      	}
      	return resultString;
    }, this)
  }

  createActors(stringMap) {
    let yCoord = 0;
    const resultArray = [];
    for (let string of stringMap) {
      for (let xCoord = 0; xCoord < string.length; xCoord++) {
      	const currentConstructor = this.actorFromSymbol(string[xCoord])
      	if (typeof currentConstructor === 'function') {
      		let newActor = new currentConstructor(new Vector(xCoord, yCoord))
      		if (newActor instanceof Actor) resultArray.push(newActor)
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
  constructor(initialPos = new Vector(0, 0), initialSpeed = new Vector(0, 0)) {
    super(initialPos, new Vector(1, 1), initialSpeed);

  }
  get type() {
    return 'fireball';
  }
  getNextPosition(time = 1) {
    return this.pos.plus(this.speed.times(time));
  }
  handleObstacle() {
    this.speed = this.speed.times(-1);
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
  constructor(initialPos = new Vector(0, 0)) {
    super(initialPos, new Vector(2, 0));
  }
}

class VerticalFireball extends Fireball {
  constructor(initialPos = new Vector(0, 0)) {
    super(initialPos, new Vector(0, 2));
  }
}

class FireRain extends Fireball {
  constructor(initialPos = new Vector(0, 0)) {
    super(initialPos, new Vector(0, 3));
    this.source = initialPos;
  }
  handleObstacle() {
    this.pos = this.source;
  }
}

class Coin extends Actor {
  constructor(initialPos = new Vector(0, 0)) {
    super(initialPos.plus(new Vector(0.2, 0.1)), new Vector(0.6, 0.6));
    this.source = initialPos.plus(new Vector(0.2, 0.1));
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
  constructor(initialPos = new Vector(0, 0)) {
    super(initialPos.plus(new Vector(0, -0.5)), new Vector(0.8, 1.5), new Vector());
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
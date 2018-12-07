'use strict';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  plus(add) {
    if (add instanceof Vector) {
      // скобки вокруг аргументов можно опустить
      return new Vector(this.x + add.x, this.y + add.y);
    }
    // else тут можно убрать, если выполнение зайдёт в if,
    // то сработает return и выполнение функции прекратится
      // скобки можно убрать
      // если выбрасываете ошибка,
      // то нужно написать сообщение,
      // иначен непонятно, что произошло.
      // лучше сначала проверять, аргументы,
      // а потом писать основной код
    throw (new Error);
  }
  times(multiplier) {
    // скобки вокруг аргументов можно опустить
    return new Vector(this.x * multiplier, this.y * multiplier);
  }
}

class Actor {
  // не опускайте значения аргументов конструктора
  // если кто-нибудь изменить значения по-умолчанию ваш код сломается
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
    // сначала проверки, потом основной код
  }
}

class Level {
  constructor(grid = [], actors = []) {
    this.grid = grid;
    this.actors = actors;
    this.player = actors.find((element) => element.type === 'player');
    this.height = grid.length;
    // тут лучше использовать reduce или map + Math.max
    // this.width = getMaxLength(grid);
    this.width = grid.reduce((result, currentValue) => currentValue.length > result ? currentValue.length : result, 0);
    this.status = null;
    this.finishDelay = 1;
  }
  isFinished() {
    // скобки можно опустить
    return this.finishDelay < 0 && this.status !== null;
  }
  actorAt(checkingActor) {
    // для поиска обхектов в массиве есть специальный метод
    // for of лучше не использовать, есть for и .forEach
    return this.actors.find((actor) => checkingActor.isIntersect(actor))
    // эта строчка ничего не делает,
    // функция и так возвращает undefined,
    // если не указано иное
  }
  obstacleAt(newPos, size) {
    // вынесите в переменные округлённые значения,
    // тогда они не будут округляться на каждой итерации,
    // и код будет легче читать
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
        // эти проверки можно вынести из цикла
        // this.grid[yCoord][xCoord] лучше записать в переменную,
        // чтобы 2 раза не писать
        const current = this.grid[yCoord][xCoord];
        if (current) {
          return current;
        }
      }
    }
  }
  removeActor(deletingActor) {
    // используйте !==
    // вы ищете объект в массиве 2 раза (indexOf)
    // сделайте, чтобы он искался 1 раз
    const index = this.actors.indexOf(deletingActor);
    if (index !== '-1') {
      this.actors.splice(index, 1);
    }
  }
  noMoreActors(type) {
    // для проверки наличия в массиве объектов по условию
    // есть специальный метод, который принимает функцию обратного вызова
    // и возвращает true/false
    return (!(this.actors.find((actor) => (actor.type === type))))
    // for (let actor of this.actors) {
    //   if (actor.type === type) {
    //     return false;
    //   }
    // }
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
        // эту строчку можно убрать
      }
    }
  }
}

class LevelParser {
  constructor(glossary) {
    this.glossary = glossary;
  }
  actorFromSymbol(type) {
    // все проверки в этом методе лишние
    if (type && ((Actor.isPrototypeOf(this.glossary[type])) || (this.glossary[type] instanceof Actor) || (this.glossary[type] == Actor))) {
      return this.glossary[type];
    }
  }
  obstacleFromSymbol(obstacleSymbol) {
    if (obstacleSymbol === '!') {
      return 'lava';
    }
    if (obstacleSymbol === 'x') {
      return 'wall';
    }
    // лишняя строчка
  }
  createGrid(stringMap) {
    // если значение присваивается переменной 1 раз,
    // то лучше использовать const
    // вообще этот мтеод написать короче, если использовать map
    // let resultArray = [];
    // for (let string of stringMap) {
    //   let resultString = [];
    //   for (let i = 0; i < string.length; i++) {
    //     resultString.push(this.obstacleFromSymbol(string[i]));
    //   }
    //   resultArray.push(resultString);
    // }
    // return resultArray;



    // return stringMap.map(function(currentString) {
    // 	return currentString.map(function(currentSymbol) {
    // 		return this.obstacleFromSymbol(currentSymbol);
    // 	})
    // })


    return stringMap.map(function(currentString) {
    	let resultString = [];
    	for (let i = 0; i < currentString.length; i++) {
        	resultString.push(this.obstacleFromSymbol(currentString[i]));
      	}
      	return resultString;
    }, this)
  }

  createActors(stringMap) {
    let yCoord = 0;
    const resultArray = [];
    // такие проверки лучше делать в конструкторе
    if (!this.glossary) {
      return resultArray;
    }
    for (let string of stringMap) {
      for (let xCoord = 0; xCoord < string.length; xCoord++) {
        // объект создаётся 2 раза
        if (this.actorFromSymbol(string[xCoord])) {
          // отсутствует проверка, что объект это Actor
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
  // не опускайте аргументы у Vector
  constructor(initialPos = new Vector, initialSpeed = new Vector) {
    super(initialPos, new Vector(1, 1), initialSpeed);
    // pos, size, speed должны задаваться
    // через вызов родительского конструктора
  }
  get type() {
    return 'fireball';
  }
  getNextPosition(time = 1) {
    return this.pos.plus(this.speed.times(time));
  }
  handleObstacle() {
    // тут нужно использова метод класса Vector
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
  constructor(initialPos = new Vector) {
    super(initialPos, new Vector(2, 0));
    // pos, size, speed должны задаваться
    // через вызов родительского конструктора
  }
}

class VerticalFireball extends Fireball {
  constructor(initialPos = new Vector) {
    super(initialPos, new Vector(0, 2));
    // pos, size, speed должны задаваться
    // через вызов родительского конструктора
  }
}

class FireRain extends Fireball {
  constructor(initialPos = new Vector) {
    super(initialPos, new Vector(0, 3));
    this.source = initialPos;
    // pos, size, speed должны задаваться
    // через вызов родительского конструктора
  }
  handleObstacle() {
    this.pos = this.source;
  }
}

class Coin extends Actor {
  constructor(initialPos = new Vector) {
    super(initialPos.plus(new Vector(0.2, 0.1)), new Vector(0.6, 0.6));
    this.source = initialPos.plus(new Vector(0.2, 0.1));
    // pos, size, speed должны задаваться
    // через вызов родительского конструктора
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
    super(initialPos.plus(new Vector(0, -0.5)), new Vector(0.8, 1.5), new Vector());
    // pos, size, speed должны задаваться
    // через вызов родительского конструктора
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
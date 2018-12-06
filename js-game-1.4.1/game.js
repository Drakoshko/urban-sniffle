'use strict';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  plus(add) {
    if (add instanceof Vector) {
      // скобки вокруг аргументов можно опустить
      return new Vector((this.x + add.x), (this.y + add.y));
    }
    // else тут можно убрать, если выполнение зайдёт в if,
    // то сработает return и выполнение функции прекратится
    else {
      // скобки можно убрать
      // если выбрасываете ошибка,
      // то нужно написать сообщение,
      // иначен непонятно, что произошло.
      // лучше сначала проверять, аргументы,
      // а потом писать основной код
      throw (new Error);
    }
  }
  times(multiplier) {
    // скобки вокруг аргументов можно опустить
    return new Vector((this.x * multiplier), (this.y * multiplier));
  }
}

function isVector(check) {
  // если выражение в if это true или false и оно не слишком дленное
  // то вместо
  // if (<expr>) { return true; } else { return false; }
  // лучше писать return <expr>
  // в данном случае после преобразования метод можно вообще убрать,
  // т.к. он лишь добавляет сложности
  if (check instanceof Vector) {
    return true;
  } else {
    return false;
  }
}

function isActor(check) {
  // см. выше
  if (check instanceof Actor) {
    return true;
  } else {
    return false;
  }
}

class Actor {
  // не опускайте значения аргументов конструктора
  // если кто-нибудь изменить значения по-умолчанию ваш код сломается
  constructor(initialPos = new Vector, initialSize = new Vector(1, 1), initialSpeed = new Vector) {

    if (isVector(initialPos) && isVector(initialSize) && isVector(initialSpeed)) {
      this.pos = initialPos;
      this.size = initialSize;
      this.speed = initialSpeed;
    } else {
      // лучше сначала проверить аргументы и выбросить исключение,
      // если они некорректные, а потом писать основной код
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
    // сначала проверки, потом основной код
    if (isActor(actor)) {
      if (actor === this) {
        return false;
      }
      // условие в if можно обратить и написать просто return ...
      // чтобы обратить условие, нужно заменить || на &&
      // и операторы на противоположные
      // <= на > и >= на <
      if ((this.right <= actor.left) || (actor.right <= this.left) || (this.bottom <= actor.top) || (actor.bottom <= this.top)) {
        return false;
      }
      return true;
      // else можно убрать
    } else {
      throw (new Error);
    }
  }
}

function getMaxLength(array) {
  // эта проверка линяя
  if (array.length === 0) {
    return 0;
  } else {
    let result = 0;
    // эта проверка лишняя
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
    // тут лучше использовать reduce или map + Math.max
    this.width = getMaxLength(grid);
    this.status = null;
    this.finishDelay = 1;
  }
  isFinished() {
    // скобки можно опустить
    return (this.finishDelay < 0) && (this.status !== null);
  }
  actorAt(checkingActor) {
    // для поиска обхектов в массиве есть специальный метод
    // for of лучше не использовать, есть for и .forEach
    for (let actor of this.actors) {
      if (checkingActor.isIntersect(actor)) {
        return actor;
      }
    }
    // эта строчка ничего не делает,
    // функция и так возвращает undefined,
    // если не указано иное
    return undefined;
  }
  obstacleAt(newPos, size) {
    // вынесите в переменные округлённые значения,
    // тогда они не будут округляться на каждой итерации,
    // и код будет легче читать
    for (let xCoord = Math.floor(newPos.x); xCoord < Math.ceil(newPos.x + size.x); xCoord++) {
      for (let yCoord = Math.floor(newPos.y); yCoord < Math.ceil(newPos.y + size.y); yCoord++) {
        // эти проверки можно вынести из цикла
        if ((yCoord < 0) || (xCoord < 0) || (xCoord >= this.width)) {
          return 'wall';
        }
        if (yCoord >= this.height) {
          return 'lava';
        }
        // this.grid[yCoord][xCoord] лучше записать в переменную,
        // чтобы 2 раза не писать
        if (this.grid[yCoord][xCoord]) {
          return this.grid[yCoord][xCoord];
        }
      }
    }
    return undefined;
  }
  removeActor(deletingActor) {
    // используйте !==
    // вы ищете объект в массиве 2 раза (indexOf)
    // сделайте, чтобы он искался 1 раз
    if (this.actors.indexOf(deletingActor) != '-1') {
      this.actors.splice(this.actors.indexOf(deletingActor), 1)
    }
  }
  noMoreActors(type) {
    // для проверки наличия в массиве объектов по условию
    // есть специальный метод, который принимает функцию обратного вызова
    // и возвращает true/false
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
        // эту строчку можно убрать
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
    // все проверки в этом методе лишние
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
    // лишняя строчка
    return undefined;
  }
  createGrid(stringMap) {
    // если значение присваивается переменной 1 раз,
    // то лучше использовать const
    // вообще этот мтеод написать короче, если использовать map
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
    super();
    // pos, size, speed должны задаваться
    // через вызов родительского конструктора
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
    // тут нужно использова метод класса Vector
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
    // pos, size, speed должны задаваться
    // через вызов родительского конструктора
    this.pos = initialPos;
    this.speed = new Vector(2, 0);
    this.size = new Vector(1, 1);
  }
}

class VerticalFireball extends Fireball {
  constructor(initialPos = new Vector) {
    super();
    // pos, size, speed должны задаваться
    // через вызов родительского конструктора
    this.pos = initialPos;
    this.speed = new Vector(0, 2);
    this.size = new Vector(1, 1);
  }
}

class FireRain extends Fireball {
  constructor(initialPos = new Vector) {
    super();
    this.source = initialPos;
    // pos, size, speed должны задаваться
    // через вызов родительского конструктора
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
    // pos, size, speed должны задаваться
    // через вызов родительского конструктора
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
    // pos, size, speed должны задаваться
    // через вызов родительского конструктора
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
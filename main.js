let cnv;
let numberOfFishes = 200;
let fishArr = new Array(3);
let avoidArr = [];
let fishColors = [];
let canvasHeight = 0;
let canvasWidth = 0;
let globalFrameRate = 60;
let titleCard;
const headerItemBuffer = [];
const myEmail = 'justincqz@gmail.com';

function setup() {
  canvasHeight = window.innerHeight;
  canvasWidth = window.innerWidth;

  numberOfFishes = round(canvasWidth * canvasHeight / 18000);

  fishColors.push(color(130, 180, 203));
  fishColors.push(color(180, 130, 203));
  fishColors.push(color(203, 180, 130));

  cnv = createCanvas(canvasWidth,canvasHeight);
  cnv.parent('bg');

  for (let index = 0; index < acosTable.length; index++) {
    acosTable[index] = acos((index - 100) / 100);
  }

  titleCard = new Hitbox(canvasWidth / 2, canvasHeight / 2, canvasWidth / 5, canvasHeight / 5);
  spawnFishes();
}

function pauseAnimation(el) {
  const play = 'fa-play';
  const pause = 'fa-pause';
  if (el.classList.contains(play)) el.classList.replace(play, pause);
  else if (el.classList.contains(pause)) el.classList.replace(pause, play);
  globalFrameRate = globalFrameRate ? 0 : 60;
  frameRate(globalFrameRate);
}

function mailAnimation(mailEl) {
  const delay = 100;
  let timeout = delay;
  const parent = mailEl.parentElement;

  if (headerItemBuffer.length) {
    setTimeout(
      () => parent.removeChild(parent.children[parent.children.length - 1]),
      timeout,
    );
    timeout += delay;
    while (headerItemBuffer.length > 0) {
      const item = headerItemBuffer.pop();
      setTimeout(
        () => parent.insertBefore(item, mailEl),
        timeout,
      );
      timeout += delay;
    }
  } else {
    for (let i = parent.children.length - 2; i >= 0; i--) {
      setTimeout(() => 
        headerItemBuffer.push(parent.removeChild(parent.children[i])),
        timeout,
      );
      timeout += delay;
    }

    const inputEl = document.createElement('div');
    inputEl.id = 'copyEmail';
    inputEl.innerHTML = myEmail;
    inputEl.setAttribute('aria-label', 'Copy Email');
    inputEl.setAttribute('data-balloon-pos', 'down');
    inputEl.setAttribute('data-balloon-length', 'fit');

    setTimeout(
      () => {
        parent.appendChild(inputEl);
        document.getElementById("copyEmail").onclick = function() {
          copyToClipboard("copyEmail");
          inputEl.setAttribute('data-balloon-visible', 'true');
          inputEl.setAttribute('aria-label', 'Copied Email');
          setTimeout(() => {
            inputEl.removeAttribute('data-balloon-visible');
            inputEl.removeAttribute('data-balloon-pos');
            inputEl.setAttribute('aria-label', 'Copy Email');
          },
          timeout * 5,
          );
          setTimeout(
            () => inputEl.setAttribute('data-balloon-pos', 'down'),
            timeout * 5 + delay,
          );
        }
      },
      timeout,
    );
  }
}

function copyToClipboard (containerid) {
  var textarea = document.createElement('textarea')
  textarea.id = 'temp_element'
  textarea.style.height = 0
  document.body.appendChild(textarea)
  textarea.value = document.getElementById(containerid).innerText
  var selector = document.querySelector('#temp_element')
  selector.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

function draw() {
  background('#23232C');
  fishArr.forEach(group => group.forEach(fish => fish.draw()));
  maintainFrameCount();
}

function maintainFrameCount() {
  if (frameRate() < 50) {
    const arr = fishArr.reduceRight((acc, val) => acc = acc.length > val.length ? val : acc);
    if (arr[0]) arr[0].escapeCanvas();
  }
}

function windowResized() {
  canvasHeight = windowHeight;
  canvasWidth = windowWidth;
  resizeCanvas(canvasWidth, canvasHeight);
  titleCard.setDimensions(canvasWidth / 2, canvasHeight / 2, canvasWidth / 5, canvasHeight / 5);
}

function randomVector() {
  return createVector(random(0, canvasWidth), random(0, canvasHeight));
}

function magic() {
  if (fishArr[0].length) {
    fishArr.forEach(flock => flock.forEach(fish => fish.escapeCanvas()));
  } else {
    spawnFishes();
  }
}

function spawnFishes() {
  for (let group = 0; group < fishArr.length; group++) {
    fishArr[group] = new Array(numberOfFishes);
    for (let i = 0; i < numberOfFishes; i++) {
      fishArr[group][i] = new Fish(fishArr[group], i, fishColors[group]);
    }
  }
}

const acosTable = new Array(200);

function fastAngleBetween(target, other) {
  const dotmagmag = p5.Vector.dot(target, other) / (target.mag() * other.mag());
  const val = Math.min(1, Math.max(-1, dotmagmag));
  return acosTable[round(val * 100) + 100];
};

class Fish {
  constructor(flock, id, color) {
    this.id = id;
    this.flock = flock;
    this.velocity = p5.Vector.random2D();
    this.acceleration = createVector(0, 0);
    this.position = createVector(canvasWidth / 2, canvasHeight / 2);
    this.maxSpeed = 7;
    this.maxForce = 1;
    this.size = 10;
    this.viewRange = 80;
    this.color = color;
    this.target = undefined;
    this.tempVector = createVector(0, 0);
    this.accVector1 = createVector(0, 0);
    this.accVector2 = createVector(0, 0);
    this.accVector3 = createVector(0, 0);
    this.wrapScreen = true;
  }

  handleBoundary() {
    const { x, y } = this.position;
    if (x > windowWidth) {
      if (this.wrapScreen) this.position.x = 0;
      else this.deleteFish();
    }

    if (x < 0) {
      if (this.wrapScreen) this.position.x = windowWidth;
      else this.deleteFish();
    }

    if (y > windowHeight) {
      if (this.wrapScreen) this.position.y = 0;
      else this.deleteFish();
    }

    if (y < 0) {
      if (this.wrapScreen) this.position.y = windowHeight;
      else this.deleteFish();
    }
  }

  deleteFish() {
    for (let i = 0; i < this.flock.length; i++) {
      if (this.flock[i] === this) {
        this.flock.splice(i, 1);
        break;
      }
    }
  }

  update() {
    this.velocity.add(this.acceleration);
    this.velocity.setMag(this.maxSpeed);
    this.position.add(this.velocity);
    this.handleBoundary();
    this.acceleration.mult(0);
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  seek(target) {
    const diff = p5.Vector.sub(target, this.position);
    diff.sub(this.velocity);
    return diff;
  }

  escapeCanvas() {
    const distanceL = this.position.x;
    const distanceR = canvasWidth - this.position.x;
    const distanceU = this.position.y;
    const distanceD = canvasHeight - this.position.y;
    const shortestDistance = min(distanceU, distanceD, distanceL, distanceR);
    if (distanceL === shortestDistance) this.target = createVector(0, this.position.y);
    if (distanceR === shortestDistance) this.target = createVector(canvasWidth, this.position.y);
    if (distanceU === shortestDistance) this.target = createVector(this.position.x, 0);
    if (distanceD === shortestDistance) this.target = createVector(this.position.x, canvasHeight);
    this.wrapScreen = false;
  }

  avoidTitle() {
    const { direction } = titleCard.isWithinBounds(this.position);
    if (direction) {
      switch (direction) {
        case 'up': 
          this.target = createVector(this.position.x + this.velocity.x, this.position.y - this.maxSpeed);
          break;
        case 'down': 
          this.target = createVector(this.position.x + this.velocity.x, this.position.y + this.maxSpeed);
          break;
        case 'left': 
          this.target = createVector(this.position.x - this.maxSpeed, this.position.y + this.velocity.y);
          break;
        case 'right': 
          this.target = createVector(this.position.x + this.maxSpeed, this.position.y + this.velocity.y);
          break;
        default:
          this.acceleration = p5.Vector.random2D();
      }
    } else {
      this.target = undefined;
    }
  }

  draw() {
    this.efficientBehaviours();
    this.update();
    push();
    strokeWeight(0);
    fill(this.color);
    translate(this.position.x, this.position.y);
    rotate(this.velocity.heading());
    triangle(0, this.size, 0, -this.size, this.size * 3, 0);
    pop();
  }

  setColor(color) {
    this.color = color;
  }

  getVelocity() {
    return this.velocity;
  }

  getPosition() {
    return this.position;
  }

  efficientBehaviours() {
    let count = 0;
    this.accVector1.set(0, 0);
    this.accVector2.set(0, 0);
    this.accVector3.set(0, 0);
    this.flock.forEach(other => {
      if (this === other) return;
      const otherPosition = other.getPosition();
      const distance = p5.Vector.dist(this.position, otherPosition);
      if (distance < this.viewRange) {
        this.tempVector.set(otherPosition.x, otherPosition.y);
        this.tempVector.sub(this.position);
        const angleDiff = fastAngleBetween(this.velocity, this.tempVector);
        if (angleDiff > 2) return;
        count++;
        this.accVector1.add(other.getVelocity());

        this.accVector2.add(other.getPosition());
        
        this.tempVector.set(this.position.x, this.position.y);
        this.tempVector.sub(otherPosition);
        this.tempVector.normalize();
        this.tempVector.div(distance);
        this.accVector3.add(this.tempVector);
      }
    });

    if (count !== 0) {
      this.accVector1.div(count);
      this.accVector1.setMag(this.maxSpeed);
      this.accVector1.sub(this.velocity);
      this.accVector2.div(count);
      this.accVector2 = this.seek(this.accVector2);
      this.accVector3.div(count);
      this.accVector3.setMag(this.maxSpeed);
      this.accVector3.sub(this.velocity);

      this.accVector1.limit(this.maxForce);
      this.accVector2.limit(this.maxForce);
      this.accVector3.limit(this.maxForce);

      this.accVector1.mult(0.4);
      this.accVector2.mult(0.8);
      this.accVector3.mult(1.5);

      this.applyForce(this.accVector1);
      this.applyForce(this.accVector2);
      this.applyForce(this.accVector3);
    }

    this.avoidTitle();
    
    if (this.target) {
      const target = this.seek(this.target);
      target.limit(this.maxForce);
      this.accVector3.mult(5);
      this.acceleration = target;
    }
  }
}

class Hitbox {
  constructor(x, y, width, height) {
    this.position = createVector(x, y);
    this.width = width;
    this.height = height;
    this.boundsRange = 150;
    this.initialisePrecomputedValues();
  }

  isWithinBounds(position) {
    const { x, y } = position;
    if ((x >= (this.x1 - this.boundsRange) && x <= (this.x2 + this.boundsRange))) {
      if (y < this.y1 && this.y1 - y < this.boundsRange)
        return { direction: 'up' };
      if (y > this.y2 && (y - this.y2) < this.boundsRange) 
        return { direction: 'down' };
    }

    if (y >= (this.y1 - this.boundsRange) && y <= (this.y2 + this.boundsRange)) {
      if (x < this.x1 && this.x1 - x < this.boundsRange)
        return { direction: 'left' };
      if (x > this.x2 && x - this.x2 < this.boundsRange)
        return { direction: 'right' };
    }

    return {};
  }

  getPosition() {
    return this.position;
  }
  
  getDimensions() {
    return { width: this.width, height: this.height };
  }

  setDimensions(x, y, width, height) {
    this.position.set(x, y);
    this.width = width;
    this.height = height;
    this.initialisePrecomputedValues();
  }

  initialisePrecomputedValues() {
    const { x, y } = this.position;
    this.x1 = x - this.width / 2;
    this.x2 = x + this.width / 2;
    this.y1 = y - this.width / 2;
    this.y2 = y + this.width / 2;
  }
}
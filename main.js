let cnv;
let numberOfFishes = 200;
let fishArr = new Array(3);
let canvasHeight = 0;
let canvasWidth = 0;
let fishColors = [];
let target;
let globalSpeed = 60;

function setup() {
  canvasHeight = window.innerHeight;
  canvasWidth = window.innerWidth;

  numberOfFishes = round(canvasWidth * canvasHeight / 15000);

  fishColors.push(color(130, 180, 203));
  fishColors.push(color(180, 130, 203));
  fishColors.push(color(203, 180, 130));
  cnv = createCanvas(canvasWidth,canvasHeight);
  for (let group = 0; group < fishArr.length; group++) {
    fishArr[group] = new Array(numberOfFishes);
    for (let i = 0; i < numberOfFishes; i++) {
      fishArr[group][i] = new Fish(fishArr[group], i, fishColors[group]);
    }
  }
}

function draw() {
  background('#23232C');
  fishArr.forEach(group => group.forEach(fish => fish.draw()));
}

function windowResized () {
  canvasHeight = windowHeight;
  canvasWidth = windowWidth;
  resizeCanvas(canvasWidth, canvasHeight);
}

function randomVector() {
  return createVector(random(0, canvasWidth), random(0, canvasHeight));
}

function mouseClicked() {
  globalSpeed = globalSpeed ? 0 : 60;
  frameRate(globalSpeed);
}

class Fish {
  constructor(flock, id, color) {
    this.id = id;
    this.flock = flock;
    this.velocity = p5.Vector.random2D();
    this.acceleration = createVector(0, 0);
    this.position = randomVector();
    this.maxSpeed = 7;
    this.maxForce = 1;
    this.size = 10;
    this.viewRange = 150;
    this.color = color;
    this.tempVector = createVector(0, 0);
    this.accVector1 = createVector(0, 0);
    this.accVector2 = createVector(0, 0);
    this.accVector3 = createVector(0, 0);
  }

  handleBoundary() {
    const { x, y } = this.position;
    if (x > windowWidth) this.position.x = 0;
    if (x < 0) this.position.x = windowWidth;

    if (y > windowHeight) this.position.y = 0;
    if (y < 0) this.position.y = windowHeight;
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

  getNearby(others) {
    const nearby = [];
    others.forEach(other => {
      if (this === other) return;
      const otherPosition = other.getPosition();
      const distance = p5.Vector.dist(this.position, otherPosition);
      if (distance < this.viewRange) {
        const diff = p5.Vector.sub(otherPosition, this.position);
        const angleDiff = this.velocity.angleBetween(diff);
        if (angleDiff > 2) return;
        nearby.push(other);
      }
    });
    return nearby;
  }

  avoidOthers(others) {
    const vectorSum = createVector(0, 0);
    if (!others.length) return vectorSum;
    others.forEach(other => {
      const otherPosition = other.getPosition();
      const distance = p5.Vector.dist(this.position, otherPosition);
      const diff = p5.Vector.sub(this.position, otherPosition);
      diff.normalize();
      diff.div(distance);
      vectorSum.add(diff);
    });
    vectorSum.div(others.length);
    vectorSum.setMag(this.maxSpeed);
    const steer = p5.Vector.sub(vectorSum, this.velocity);
    return steer;
  }

  alignDirections(others) {
    const vectorSum = createVector(0, 0);
    if (!others.length) return vectorSum;
    others.forEach(other => {
      vectorSum.add(other.getVelocity());
    });
    vectorSum.div(others.length);
    vectorSum.setMag(this.maxSpeed);

    const steer = p5.Vector.sub(vectorSum, this.velocity);
    return steer;
  }

  cohesiveMovement(others) {
    const vectorSum = createVector(0, 0);
    if (!others.length) return vectorSum;
    others.forEach(other => {
      vectorSum.add(other.getPosition());
    });
    vectorSum.div(others.length);
    const steer = this.seek(vectorSum);
    return steer;
  }

  seekTarget() {
    return this.seek(target);
  }

  applyBehaviours() {
    const nearby = this.getNearby(this.flock);
    const avoidVector = this.avoidOthers(nearby);
    const alignVector = this.alignDirections(nearby);
    const cohesionVector = this.cohesiveMovement(nearby);

    avoidVector.limit(this.maxForce);
    alignVector.limit(this.maxForce);
    cohesionVector.limit(this.maxForce);

    avoidVector.mult(1.5);
    alignVector.mult(0.4);
    cohesionVector.mult(0.7);

    this.applyForce(avoidVector);
    this.applyForce(alignVector);
    this.applyForce(cohesionVector);
  }

  seek(target) {
    const diff = p5.Vector.sub(target, this.position);
    const steer = p5.Vector.sub(diff, this.velocity);
    return steer;
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
        const angleDiff = this.velocity.angleBetween(this.tempVector);
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
    if (count === 0) return;
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
}
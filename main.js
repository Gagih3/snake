class Game {
    constructor(canvas) {
        this.state = false;
        this.velocity = null;
        this.ticker = 0;
        this.stream = [];
        this.apple = null;
        this.factory = new Factory(new Rect(20, 20))
        this.ctx = canvas.getContext('2d');
        this.clearCanvas();
        this.snake = null;
        window.addEventListener("keydown", event => {
            let v = this.snake.direction;
            switch (event.code) {
                case "KeyS":
                case "ArrowDown":
                    v = new Vector(0, 1);
                    break;
                case "KeyW":
                case "ArrowUp":
                    v = new Vector(0, -1);
                    break;
                case "KeyA":
                case "ArrowLeft":
                    v = new Vector(-1, 0);
                    break;
                case "KeyD":
                case "ArrowRight":
                    v = new Vector(1, 0);
                    break;
            }
            if (this.stream.length < 2) {
                this.stream.push(() => {
                    if (!Vector.isAlter(this.snake.direction, v)) {
                        this.snake.direction = v;
                    }
                });
            }
        });
    }
    start() {
        this.clearCanvas();
        this.snake = new Snake(this);
        this.velocity = 0.3;
        this.state = true;
        this.spawnApple();
        this.tick();
    }
    spawnApple() {
        var x = Math.floor(Math.random() * (600 / 20)) * 20;
        var y = Math.floor(Math.random() * (800 / 20)) * 20;
        for (let i = 0; i < this.snake.body.length; i++) {
            if (x == this.snake.body[i].x && y == this.snake.body[i].y) {
                this.spawnApple();
                return;
            }
        }
        this.apple = this.factory.rect;
        this.apple.position = { x, y }
        this.ctx.fillStyle = "red";
        this.ctx.fillRect(x, y, this.apple.width, this.apple.height);
        this.ctx.strokeStyle = "#000";
        this.ctx.strokeRect(x, y, this.apple.width, this.apple.height)
        if (this.velocity >= 0.1) {
            this.velocity -= 0.005;
        }
    }
    clearCanvas() {
        this.ctx.fillStyle = "#000";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
    tick() {
        if (this.state) {
            requestAnimationFrame(() => {
                setTimeout(() => {
                    const exec = this.stream.shift();
                    if (typeof exec == "function") {
                        if (exec.name !== "reset") {
                            exec();
                        } else {
                            exec();
                            return;
                        }
                    }
                    this.snake.move();
                    this.tick();
                }, 1000 * this.velocity);
            }, this.ctx.canvas);
        }
    }
    pause() {
        this.state = false;
    }
    play() {
        this.state = true;
        this.tick();
    }
    reset() {
        const _this = this;
        this.stream.unshift(function reset() {
            _this.pause();
            _this.start()
        })
    }
}
class Rect {
    constructor(width = 10, height, x = 0, y = 0) {
        this.width = width;
        this.height = height !== undefined ? height : width;
        this.x = x;
        this.y = y;
    }
    set position({ x, y }) {
        this.x = x;
        this.y = y;
    }
    get position() {
        return [this.x, this.y];
    }
}
class Factory {
    constructor(rect) {
        this.init = rect;
    }
    get rect() {
        return new Rect(this.init.width, this.init.height)
    }
    set rect(rect) {
        this.init = rect;
    }
}
class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    static isAlter(v1, v2) {
        return !((v1.x + v2.x) && (v1.y + v2.y))
    }
    static summ(v1, v2) {
        return new Vector(v1.x + v2.x, v1.y + v2.y)
    }
}
class Snake {
    constructor(game, length = 3, direction = new Vector(1, 0)) {
        this.body = [];
        this.factory = game.factory;
        this.direction = direction;
        this.ctx = game.ctx;
        this.game = game;
        for (let i = length; i >= 0; i--) {
            const rect = this.factory.rect;
            rect.position = { x: this.direction.x * i * rect.width, y: this.direction.y * i * rect.height }
            this.grow(rect);
            this.fill(rect)
        }
    }
    get head() {
        return this.body[0];
    }
    set head(rect) {
        this.body.unshift(rect);
    }
    move() {
        const prev = this.head;
        this.head = this.body.pop();
        this.clear(this.head);
        this.head.position = this.restrictions(prev);
        this.fill(this.head);
        this.collisions();
    }
    collisions() {
        if (this.head.x == this.game.apple.x && this.head.y == this.game.apple.y) {
            this.grow();
            this.game.spawnApple();
        }
        for (let i = 1, l = this.body.length; i < l; ++i) { // игнорируем голову
            if (this.head.x == this.body[i].x && this.head.y == this.body[i].y) {
                this.game.reset();
                break;
            }
        }
    }
    restrictions(prev) {
        const x = prev.x + (this.direction.x * prev.width),
            y = prev.y + (this.direction.y * prev.height),
            right = this.ctx.canvas.width - prev.width,
            bottom = this.ctx.canvas.height - prev.height;
        return { x: x > right ? 0 : x < 0 ? right : x, y: y > bottom ? 0 : y < 0 ? bottom : y }
    }
    clear(rect) {
        this.ctx.fillStyle = "#000";
        this.ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
    }
    fill(rect) {
        this.ctx.fillStyle = "#fff";
        this.ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
        this.ctx.strokeStyle = "#000";
        this.ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
    }
    grow(rect) {
        this.body.push(rect || this.factory.rect)
    }
}

const game = new Game(document.getElementById("canvas"));
game.start()

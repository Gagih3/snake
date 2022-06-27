class Game {
    constructor({ canvas, pauseBtn, resetBtn, playBtn, scoreWindow }) {
        this.factory = new RectFactory(new Rect(20, 20));
        this.scoreWindow = scoreWindow;
        this.gameControlButtons = {
            pauseBtn,
            resetBtn,
            playBtn
        };
        this._state = false;
        this.velocity = 0.3;
        this.stack = [];
        this.apple = null;
        this.ctx = canvas.getContext('2d');
        this.snake = null;
        this.clearCanvas();
        this.listenKeyboard();
        this.listenControls();
    }
    get score() {
        return parseInt(this.scoreWindow.textContent);
    }
    set score(value) {
        this.scoreWindow.textContent = value;
    }
    get state() {
        return this._state;
    }
    set state(value) {
        this.gameControlButtons.pauseBtn.classList.toggle("d-none", !value);
        this.gameControlButtons.playBtn.classList.toggle("d-none", value);
        this._state = value;
    }
    start() {
        if (!this.state) {
            this.score = 0;
            this.clearCanvas();
            this.snake = new Snake(this);
            this.velocity = 0.3;
            this.state = true;
            this.spawnApple();
            this._tick();
        }
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
    _tick() {
        if (this.state) {
            requestAnimationFrame(() => {
                setTimeout(() => {
                    if (this.stack.length > 0) {
                        this.stack.shift().bind(this)();
                    }
                    this.snake.move();
                    this._tick();
                }, 1000 * this.velocity);
            }, this.ctx.canvas);
        } else if (this.stack.length > 0) {
            this.stack.forEach(func => func.bind(this)());
            this.stack.splice(0, this.stack.length);
        }
    }
    pause() {
        this.state = false;
    }
    play() {
        this.state = true;
        this._tick();
    }
    reset() {
        this.stack.unshift(this.pause, this.start)
        if (!this.state) {
            this._tick()
        }
    }
    listenKeyboard() {
        window.addEventListener("keydown", event => {
            if (this.state) {
                var v = this.snake.direction;
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
                if (this.stack.length < 2) {
                    this.stack.push(() => {
                        this.snake.changeDirection(v);
                    });
                }
            }
        });
    }
    listenControls() {
        Object.entries(this.gameControlButtons).forEach(([k, v]) => {
            var func = this[k.substring(0, k.length - 3)];
            v.addEventListener("click", func.bind(this));
        });
    }
}
class Rect {
    constructor(width = 10, height, x = 0, y = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height !== undefined ? height : width;
    }
    set position({ x, y }) {
        this.x = x;
        this.y = y;
    }
    get position() {
        return [this.x, this.y];
    }
    get dimensions() {
        return Object.values(this)
    }
    intersecting(rect) {
        return (this.x == rect.x) && (this.y == rect.y)
    }
}
class RectFactory {
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
    isAlter(v2) {
        return !((this.x + v2.x) && (this.y + v2.y))
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
            this.draw(rect)
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
        this.draw(this.head);
        this.collisions();
    }
    changeDirection(vector) {
        if (!this.direction.isAlter(vector)) {
            this.direction = vector;
        }
    }
    collisions() {
        if (this.head.intersecting(this.game.apple)) {
            this.game.score++;
            this.grow();
            this.game.spawnApple();
        }
        for (let i = 1, l = this.body.length; i < l; ++i) { // игнорируем голову
            if (this.head.intersecting(this.body[i])) {
                console.log("collisions")
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
        this.ctx.fillRect(...rect.dimensions)
    }
    draw(rect) {
        this.ctx.fillStyle = "#fff";
        this.ctx.fillRect(...rect.dimensions)
        this.ctx.strokeStyle = "#000";
        this.ctx.strokeRect(...rect.dimensions)
    }
    grow(rect) {
        this.body.push(rect || this.factory.rect)
    }
}

const game = new Game({
    canvas: document.getElementById("canvas"),
    pauseBtn: document.getElementById("pause"),
    resetBtn: document.getElementById("reset"),
    playBtn: document.getElementById("play"),
    scoreWindow: document.getElementById("score"),
});
game.start()

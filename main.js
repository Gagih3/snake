class Game {
    #state = false;
    #velosity = 0.3;
    constructor({ canvas, pauseBtn, resetBtn, playBtn, scoreWindow, complexity }) {
        this.ctx = canvas.getContext('2d');
        this.factory = new RectFactory(new Rect(20, 20));
        this.scoreWindow = scoreWindow;
        this.complexitySelector = complexity;
        this.gameControlButtons = {
            pauseBtn,
            resetBtn,
            playBtn
        };
        this.velocity = 0.3;
        this.stack = [];
        this.apple = null;
        this.snake = null;
        this.#clearCanvas();
        this.#listenKeyboard();
        this.#listenControls();
    }
    get complexity() {
        return parseFloat(this.complexitySelector.value);
    }
    get score() {
        return parseInt(this.scoreWindow.textContent);
    }
    set score(value) {
        this.scoreWindow.textContent = value;
    }
    get state() {
        return this.#state;
    }
    set state(value) {
        this.gameControlButtons.pauseBtn.classList.toggle("d-none", !value);
        this.gameControlButtons.playBtn.classList.toggle("d-none", value);
        this.#state = value;
    }
    start() {
        if (!this.state) {
            this.score = 0;
            this.#clearCanvas();
            this.snake = new Snake(this);
            this.velocity = this.#velosity * this.complexity;
            this.state = true;
            this.spawnApple();
            this.#tick();
        }
    }
    spawnApple() {
        const rect = this.factory.rect;
        rect.x = Math.floor(Math.random() * (600 / 20)) * 20;
        rect.y = Math.floor(Math.random() * (800 / 20)) * 20;
        for (let i = 0; i < this.snake.body.length; i++) {
            if (this.snake.body[i].intersecting(rect)) {
                this.spawnApple();
                return;
            }
        }
        this.apple = rect;
        this.ctx.fillStyle = "red";
        this.ctx.fillRect(...Object.values(this.apple));
        this.ctx.strokeStyle = "#000";
        this.ctx.strokeRect(...Object.values(this.apple));
    }
    #clearCanvas() {
        this.ctx.fillStyle = "#000";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
    #tick() {
        if (this.state) {
            requestAnimationFrame(() => {
                setTimeout(() => {
                    var canNext = true;
                    if (this.stack.length > 0) {
                        canNext = this.stack.shift().call(this);
                    }
                    if (this.state && canNext) {
                        this.snake.move();
                        this.#tick();
                    }
                }, 1000 * this.velocity);
            }, this.ctx.canvas);
        } else {
            if (this.stack.length > 0) {
                this.stack.shift().call(this);
            }
        }
    }
    pause() {
        this.state = false;
    }
    play() {
        if (!this.state) {
            this.state = true;
            this.#tick();
        }
    }
    reset() {
        this.stack.unshift(() => {
            this.pause();
            this.start();
            return false;
        })
        if (!this.state) {
            this.#tick()
        }
    }
    #listenKeyboard() {
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
                this.stack.push(() => {
                    this.snake.changeDirection(v);
                    return true;
                });
            }
        });
    }
    #listenControls() {
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
            this.#grow(rect);
            this.#draw(rect)
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
        this.#clear(this.head);
        this.head.position = this.#restrictions(prev);
        this.#draw(this.head);
        this.#collisions();
    }
    changeDirection(vector) {
        if (!this.direction.isAlter(vector)) {
            this.direction = vector;
        }
    }
    #collisions() {
        if (this.head.intersecting(this.game.apple)) {
            this.game.score++;
            this.#grow();
            this.game.spawnApple();
        }
        for (let i = 1, l = this.body.length; i < l; ++i) { // ???????????????????? ????????????
            if (this.head.intersecting(this.body[i])) {
                this.game.reset();
                break;
            }
        }
    }
    #restrictions(prev) {
        const x = prev.x + (this.direction.x * prev.width),
            y = prev.y + (this.direction.y * prev.height),
            right = this.ctx.canvas.width - prev.width,
            bottom = this.ctx.canvas.height - prev.height;
        return { x: x > right ? 0 : x < 0 ? right : x, y: y > bottom ? 0 : y < 0 ? bottom : y }
    }
    #clear(rect) {
        this.ctx.fillStyle = "#000";
        this.ctx.fillRect(...rect.dimensions)
    }
    #draw(rect) {
        this.ctx.fillStyle = "#fff";
        this.ctx.fillRect(...rect.dimensions)
        this.ctx.strokeStyle = "#000";
        this.ctx.strokeRect(...rect.dimensions)
    }
    #grow(rect) {
        this.body.push(rect || this.factory.rect);
        if (this.game.velocity > 0.025) {
            this.game.velocity -= 0.005;
        }
    }
}

const game = new Game({
    canvas: document.getElementById("canvas"),
    pauseBtn: document.getElementById("pause"),
    resetBtn: document.getElementById("reset"),
    playBtn: document.getElementById("play"),
    scoreWindow: document.getElementById("score"),
    complexity: document.getElementById("complexity"),
});
game.start()

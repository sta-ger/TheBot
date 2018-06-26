import {Bot} from "./bot/Bot";
import {App} from "./App";
import {TweenMax, Elastic} from "gsap";
import EventEmitter from 'events';

export class World extends EventEmitter {

    static get EVENT_TARGET_APPEARED() {
        return "targetAppeared";
    }

    static get EVENT_TARGET_DOWN() {
        return "targetDown";
    }

    constructor(stage) {
        super();
        this._stage = stage;
        this.initialize();
    }

    initialize() {
        this.speed = 1;

        this._bulletDistance = 0;
        this._bgColor = 0xFFFFFF;
        this._targetRadius = 15;
        this._targetColor = 0xA0D7FF;
        this._targetX = 0;
        this._targetY = 0;
        this._target = undefined;
        this._maxShootDistance = Math.sqrt(
            Math.pow(App.GAME_WIDTH / 2, 2) + Math.pow(App.GAME_HEIGHT, 2)
        );
        this._bulletRadius = 5;
        this._bulletColor = 0xA0D7FF;

        var g = new PIXI.Graphics();
        g.beginFill(this._bgColor);
        g.drawRect(0, 0, App.GAME_WIDTH, App.GAME_HEIGHT);
        g.endFill();
        this._stage.addChild(g);

        this._testContainer = new PIXI.Container();
        this._stage.addChild(this._testContainer);

        this._score = 0;

        var t = new PIXI.TextStyle;
        t.fontSize = 15;
        t.fill = "#A0D7FF";
        t.fontFamily = "Arial, Helvetica, sans-serif";
        this._scoreText = new PIXI.Text();
        this._scoreText.anchor.x = 0.5;
        this._scoreText.x = App.GAME_WIDTH / 2;
        this._scoreText.y = 5;
        this._scoreText.style = t;
        this._stage.addChild(this._scoreText);

        t = new PIXI.TextStyle;
        t.fontSize = 15;
        t.fill = "#999999";
        t.fontFamily = "Arial, Helvetica, sans-serif";
        this._lossText = new PIXI.Text();
        this._lossText.anchor.x = 0.5;
        this._lossText.x = App.GAME_WIDTH / 2;
        this._lossText.y = 20;
        this._lossText.style = t;
        this._testContainer.addChild(this._lossText);

        this._bot = this.createBot();
        this._bot.getDisplay().x = App.BOT_X;
        this._bot.getDisplay().y = App.BOT_Y;
        this._stage.addChild(this._bot.getDisplay());

        this._bot.on(Bot.EVENT_SHOOT, (angle) => this.onBotShoot(angle));

        this._stage.interactive = true;
        this._stage.on("click", (e) => this.onStageClick(e));
        this._stage.on("touchend", (e) => this.onStageClick(e));

        this._testData = [];

        var testX;
        var testY;
        var i;
        this._testData.push(
            [
                App.GAME_WIDTH / 4,
                App.GAME_HEIGHT / 4
            ]
        );
        this._testData.push(
            [
                App.GAME_WIDTH - App.GAME_WIDTH / 4,
                App.GAME_HEIGHT / 4
            ]
        );
        this._testData.push(
            [
                App.GAME_WIDTH / 4,
                App.GAME_HEIGHT - App.GAME_HEIGHT / 4
            ]
        );
        this._testData.push(
            [
                App.GAME_WIDTH - App.GAME_WIDTH / 4,
                App.GAME_HEIGHT - App.GAME_HEIGHT / 4
            ]
        );

        for (i = 0; i < this._testData.length; i++) {
            testX = this._testData[i][0];
            testY = this._testData[i][1];
            g = new PIXI.Graphics();
            g.beginFill(0x999999);
            g.drawCircle(testX, testY, 5);
            g.endFill();
            this._testContainer.addChild(g);
        }
    }

    initializeNetwork(params) {
        this._bot.initializeNetwork(params);
        this.resetScore();
    }

    resetScore() {
        this._score = 0;
        this._loss = 0;
        this.drawScore();
        this.drawLoss();
    }

    onStageClick(e) {
        if (
            this.isPossibleX(e.data.global.x) || this.isPossibleY(e.data.global.y)
        ) {
            this._stage.interactive = false;
            if (this._target) {
                this._stage.removeChild(this._target);
            }
            this._targetX = Math.floor(e.data.global.x);
            this._targetY = Math.floor(e.data.global.y);
            this.createTarget();
        }
    }

    startTraining() {
        var x;
        var y;
        this._stage.interactive = false;
        this._isTrainingMode = true;
        this._bot.isTrainingMode = true;
        while (x === undefined || !this.isPossibleX(x)) {
            x = this.getTrainingTargetX();
        }
        while (x === undefined || !this.isPossibleY(y)) {
            y = this.getTrainingTargetY();
        }
        this._targetX = x;
        this._targetY = y;
        this.createTarget();
    }

    stopTraining() {
        this._isTrainingMode = false;
        this._bot.isTrainingMode = false;
    }

    createTarget() {
        this._stage.removeChild(this._target);

        var g = new PIXI.Graphics();
        g.beginFill(this._targetColor);
        g.drawCircle(0, 0, this._targetRadius);
        g.endFill();
        this._target = g;
        this._target.x = this._targetX;
        this._target.y = this._targetY;
        this._stage.addChild(this._target);
        this.emit(World.EVENT_TARGET_APPEARED, this._targetX, this._targetY);
        this._target.scale.x = 1.5;
        this._target.scale.y = 1.5;
        TweenMax.to(this._target.scale, 0.5 / this.speed, {x: 1, y: 1, ease: Elastic.easeOut.config(1, 0.5)});
    }

    onBotShoot() {
        this.createBullet();
        this.checkCollision();
        this.bulletDistance = this._bot.gunDistanceIdle;
        this._bulletTween = TweenMax.to(this, 0.5 / this.speed, {bulletDistance: this._maxShootDistance, onComplete: () => this.onBulletFinished(), onUpdate: () => this.onBulletUpdate()});
    }

    onBulletUpdate() {
        var distanceToTarget;
        distanceToTarget = this.getDistanceBetweenPoints(this._bot.getDisplay().x, this._targetX, this._bot.getDisplay().y, this._targetY);
        if (this.bulletDistance >= distanceToTarget && this._isCollisionDetected) {
            this.onTargetDown();
        }

    }

    onTargetDown() {
        this._score++;
        this.drawScore();
        this.drawLoss();
        this._bulletTween.kill();
        this._stage.removeChild(this._target);
        this._target = null;
        this.emit(World.EVENT_TARGET_DOWN);
        this.onBulletFinished();
    }

    drawScore() {
        this._scoreText.text = "Score: " + this._score;
    }

    drawLoss() {
        var brainAngle;
        var testAngle;
        var i;
        if (this._testContainer.visible) {
            this._loss = 0;
            for (i = 0; i < this._testData.length; i++) {
                testAngle = this._bot.getAngleForTrain(this._testData[i][0], this._testData[i][1]);
                brainAngle = this._bot.getBrainAngle(this._testData[i][0], this._testData[i][1]);
                this._loss += Math.abs(testAngle - brainAngle);
            }
            this._lossText.text = "Loss: " + this._loss.toFixed(3);
        }
    }

    setLossVisibility(value) {
        this._testContainer.visible = value;
    }

    onBulletFinished() {
        var x;
        var y;
        this._stage.removeChild(this._bullet);
        if (!this._isTrainingMode) {
            this._stage.interactive = true;
        } else {
            while (x === undefined || !this.isPossibleX(x)) {
                x = this.getTrainingTargetX();
            }
            while (x === undefined || !this.isPossibleY(y)) {
                y = this.getTrainingTargetY();
            }
            this._targetX = x;
            this._targetY = y;
            this.createTarget();
        }
    }

    getTrainingTargetX() {
        return Math.floor(Math.random() * App.GAME_WIDTH);
    }

    getTrainingTargetY() {
        return Math.floor(Math.random() * App.GAME_HEIGHT);
    }

    isPossibleX(x) {
        return x > this._bot.getDisplay().x + this._bot.bodyRadius + this._bot.gunDistanceIdle || x < this._bot.getDisplay().x - this._bot.bodyRadius - this._bot.gunDistanceIdle;
    }

    isPossibleY(y) {
        return y > this._bot.getDisplay().y + this._bot.bodyRadius + this._bot.gunDistanceIdle || y < this._bot.getDisplay().y - this._bot.bodyRadius - this._bot.gunDistanceIdle;
    }

    checkCollision() {
        this._isCollisionDetected = false;
        this.bulletDistance = this._bot.gunDistanceIdle;
        while (this.bulletDistance <= this._maxShootDistance && !this._isCollisionDetected) {
            this.bulletDistance += this._bulletRadius;
            this._isCollisionDetected = this.isCirclesCollision(this._bullet.x, this._bullet.y, this._bulletRadius, this._targetX, this._targetY, this._targetRadius);
        }
    }

    isCirclesCollision(p1x, p1y, r1, p2x, p2y, r2) {
        var a;
        var x;
        var y;
        a = r1 + r2;
        x = p1x - p2x;
        y = p1y - p2y;
        if ( a > Math.sqrt( (x * x) + (y * y) ) ) {
            return true;
        } else {
            return false;
        }
    }

    getDistanceBetweenPoints(x1, x2, y1, y2) {
        var a = x1 - x2;
        var b = y1 - y2;
        var c = Math.sqrt(a * a + b * b);
        return c;
    }

    get bulletDistance() {
        return this._bulletDistance;
    }

    set bulletDistance(val) {
        this._bulletDistance = val;
        this.drawBullet();
    }

    get targetX() {
        return this._targetX;
    }

    get targetY() {
        return this._targetY;
    }

    drawBullet() {
        this._bullet.x = App.BOT_X + Math.cos(this._bot.angle) * this._bulletDistance;
        this._bullet.y = App.BOT_Y + Math.sin(this._bot.angle) * this._bulletDistance;
    }

    createBullet() {
        var r;
        r = new PIXI.Graphics();
        r.beginFill(this._bulletColor);
        r.drawCircle(0 ,0, this._bulletRadius);
        r.endFill();
        this._bullet = r;
        this._stage.addChild(r);
        return r;
    }

    createBot() {
        return new Bot(this);
    }

}
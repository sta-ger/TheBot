import {TweenMax} from "gsap";
import EventEmitter from 'events';
import {Brain} from "./Brain";
import {World} from "../World";

export class Bot extends EventEmitter {

    static get EVENT_SHOOT() {
        return "shoot";
    }

    constructor(world) {
        super();

        this._world = world;

        this.initialize();
    }

    initialize() {
        this._angle = -Math.PI / 2;
        this._bodyRadius = 15;
        this._botColor = 0xA0D7FF;
        this._gunRadius = 5;
        this._gunDistanceIdle = 20;
        this._gunDistanceOnShoot = 15;

        this._world.on(World.EVENT_TARGET_APPEARED, (targetX, targetY) => this.onWorldTargetAppeared(targetX, targetY));
        this._world.on(World.EVENT_TARGET_DOWN, () => this.onWorldTargetDown());

        this._brain = new Brain();

        this._display = new PIXI.Container();
        this._body = new PIXI.Graphics();
        this._body.beginFill(this._botColor);
        this._body.drawCircle(0 ,0, this._bodyRadius);
        this._body.endFill();
        this._display.addChild(this._body);

        this._gun = new PIXI.Graphics();
        this._gun.beginFill(this._botColor);
        this._gun.drawCircle(0 ,0, this._gunRadius);
        this._gun.endFill();
        this._display.addChild(this._gun);

        this.gunDistance = this._gunDistanceIdle;
    }

    initializeNetwork(params) {
        this._brain.initializeNetwork(params);
    }

    onWorldTargetDown() {
        this._brain.learn(this._world.targetX, this._world.targetY, this._angle);
    }

    onWorldTargetAppeared(targetX, targetY) {
        var angle;
        if (this._isTrainingMode) {
            angle = this.getAngleForTrain(targetX, targetY);
        } else {
            angle = this.getBrainAngle(targetX, targetY);
        }
        this.aim(angle);
    }

    aim(angle) {
        this._aimAngle = angle;
        TweenMax.to(this, 0.5 / this._world.speed, {angle: this._aimAngle, onComplete: () => this.onAimed()});
    }

    onAimed() {
        this.shoot();
    }

    shoot() {
        this.emit(Bot.EVENT_SHOOT, this._aimAngle);
        this.gunDistance = this._gunDistanceOnShoot;
        TweenMax.to(this, 0.5 / this._world.speed, {gunDistance: this._gunDistanceIdle});
    }

    drawGun() {
        this._gun.x = this._gunDistance * Math.cos(this._angle);
        this._gun.y = this._gunDistance * Math.sin(this._angle);
    }

    getBrainAngle(x, y) {
        return this._brain.getAngle(x, y) * -1;
    }

    getAngleForTrain(x, y) {
        return this._brain.getAngleForTrain(x, y);
    }

    set isTrainingMode(value) {
        this._isTrainingMode = value;
        this.drawGun();
    }

    get isTrainingMode() {
        return this._isTrainingMode;
    }

    set angle(value) {
        this._angle = value;
        this.drawGun();
    }

    get bodyRadius() {
        return this._bodyRadius;
    }

    get angle() {
        return this._angle;
    }

    get gunDistanceIdle() {
        return this._gunDistanceIdle;
    }

    get gunDistance() {
        return this._gunDistance;
    }

    set gunDistance(value) {
        this._gunDistance = value;
        this.drawGun();
    }

    getDisplay() {
        return this._display;
    }

}
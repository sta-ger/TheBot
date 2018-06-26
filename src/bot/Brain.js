import {App} from "../App";

export class Brain {

    constructor() {
        this.initialize();
    }

    initialize() {

    }

    initializeNetwork(params) {
        this._learningRate = params.learningRate;
        this._hiddenLayers = params.hiddenLayers;
        this._hiddenNeurons = params.hiddenNeurons;
        this._activation = params.activation;

        const {Neuron, Layer, Network} = window.synaptic;

        var outputLayer;
        var hiddenLayer;
        var hiddenLayers;
        var inputLayer;
        var i;
        inputLayer = new Layer(2);
        outputLayer = new Layer(1);
        hiddenLayers = [];
        for (i = 0; i < this._hiddenLayers; i++) {
            hiddenLayer = new Layer(this._hiddenNeurons);
            hiddenLayers.push(hiddenLayer);
            if (i === 0) {
                inputLayer.project(hiddenLayer);
            } else {
                hiddenLayers[i - 1].project(hiddenLayer);
            }
        }
        hiddenLayer.project(outputLayer);
        this._network = new Network({
            input: inputLayer,
            hidden: hiddenLayers,
            output: outputLayer
        });

        var fn = (layer) => {
            for (let i = 0; i < layer.list.length; i++) {
                var act;
                switch (this._activation) {
                    case "sigmoid":
                        act = Neuron.squash.LOGISTIC;
                        break;
                    case "tanh":
                        act = Neuron.squash.TANH;
                        break;
                    case "relu":
                        act = Neuron.squash.RELU;
                        break;
                }
                layer.list[i].squash = act;
            }
        };

        var layer;
        for (var key in this._network.layers) {
            layer = this._network.layers[key];
            if (Array.isArray(layer)) {
                for (let i = 0; i < layer.length; i++) {
                    fn(layer[i]);
                }
            } else {
                fn(layer);
            }
        }
    }

    learn(targetX, targetY, angle) {
        var angleToLearn;
        var normX;
        var normY;
        normX = this.normalizeX(targetX);
        normY = this.normalizeY(targetY);
        angleToLearn = this.normalizeAngle(Math.abs(angle));

        console.log("-----------------------------------");
        console.log("LEARN");
        console.log("X: " + targetX + " Y: " + targetY + " Angle: " + angle);
        console.log("NORM X: " + normX + " NORM  Y: " + normY);
        console.log("Angle to learn: " + angleToLearn);

        this._network.activate([normX, normY]);
        this._network.propagate(this._learningRate, [angleToLearn]);
    }

    getAngle(x, y) {
        var angle;
        var outputAngle;
        var output;
        var normX;
        var normY;
        normX = this.normalizeX(x);
        normY = this.normalizeY(y);
        output = this._network.activate([normX, normY]);
        outputAngle = output[0];
        angle = this.extractAngle(outputAngle);

        console.log("-----------------------------------");
        console.log("PREDICT");
        console.log("Get XY " + x + " : " + y);
        console.log("Norm XY " + normX + " : " + normY);
        console.log("Output angle: " + outputAngle + ", angle: " + angle);
        console.log("Expect angle: " + this.getAngleForTrain(x, y));
        return angle;
    }

    normalizeX(x) {
        return this.scaleBetween(x, 0, 1, 0, App.GAME_WIDTH);
    }

    normalizeY(y) {
        return this.scaleBetween(y, 0, 1, 0, App.GAME_HEIGHT);
    }

    normalizeAngle(angle) {
        return this.scaleBetween(angle, 0, 1, 0, Math.PI);
    }

    extractAngle(normalized) {
        return this.extractFromScaled(normalized, 0, 1, 0, Math.PI);
    }

    scaleBetween(unscaledNum, minAllowed, maxAllowed, min, max) {
        return (maxAllowed - minAllowed) * (unscaledNum - min) / (max - min) + minAllowed;
    }

    extractFromScaled(scaled, minAllowed, maxAllowed, min, max) {
        return (scaled - minAllowed) * (max - min) / (maxAllowed - minAllowed) + min;
    }

    getAngleForTrain(x, y) {
        var angleRadians;
        var p1 = {};
        var p2 = {};
        p1.x = App.BOT_X;
        p1.y = App.BOT_Y;
        p2.x = x;
        p2.y = y;
        angleRadians = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        /*if (angleRadians < 0) {
            angleRadians = Math.PI + (Math.PI + angleRadians);
        }*/
        return angleRadians;
    }

}


import {World} from "./World";

export class App {
    static get GAME_WIDTH() {
        return 500;
    }

    static get GAME_HEIGHT() {
        return 500;
    }

    static get BOT_X() {
        return App.GAME_WIDTH / 2;
    }

    static get BOT_Y() {
        return App.GAME_HEIGHT;
    }

    constructor() {
        this.initialize();
    }

    initialize() {
        this._activation = "relu";
        this._hiddenLayers = 1;
        this._hiddenNeurons = 10;
        this._learningRate = 0.03;
        this._showLoss = false;

        window.onload = () => this.run();
    }

    setNetworkParams() {
        var params = {
            learningRate: this._learningRate,
            hiddenLayers: this._hiddenLayers,
            hiddenNeurons: this._hiddenNeurons,
            activation: this._activation
        };
        this._world.initializeNetwork(params);
    }

    setLossVisibility() {
        this._world.setLossVisibility(this._showLoss);
    }

    run() {
        this._pixiApp = new PIXI.Application(App.GAME_WIDTH, App.GAME_HEIGHT, {backgroundColor : 0xFFFFFF, antialias: true});
        this._pixiApp.renderer.plugins.interaction.autoPreventDefault = false;
        this._pixiApp.renderer.view.style.touchAction = 'auto';
        this._world = this.createWorld(this._pixiApp.stage);
        this.setNetworkParams();
        this.setLossVisibility();
        document.getElementById("app").appendChild(this._pixiApp.view);
        this.initializeUi();
    }

    initializeUi() {
        this._trainBtn = document.getElementById("train");
        this._trainBtn.onclick = () => this.onTrainBtnClick();

        this._stopTrainBtn = document.getElementById("stopTrain");
        this._stopTrainBtn.disabled = true;
        this._stopTrainBtn.onclick = () => this.onStopTrainBtnClick();

        for (var i = 0; i < 100; i++) {
            var btn = document.getElementById("x" + (parseInt(i, 10) + 1));
            if (btn) {
                btn.speed = i + 1;
                btn.onclick = (e) => {
                    this.deactivateSpeedButtons();
                    e.currentTarget.className = e.currentTarget.className.replace("grey", "blue");
                    this._world.speed = e.currentTarget.speed;
                };
            }
        }


        this._layersText = document.getElementById("tLayers");
        this._neuronsText = document.getElementById("tNeurons");
        this._rateText = document.getElementById("tRate");
        this._layersSlider = document.getElementById("sLayers");
        this._neuronsSlider = document.getElementById("sNeurons");
        this._rateSlider = document.getElementById("sRate");
        this._activationDropdown = document.getElementById("dActiv");
        this._showLossCheckbox = document.getElementById("cLoss");



        var minNeurons = 1;
        var maxNeurons = 100;
        var minLayers = 1;
        var maxLayers = 10;
        var minRate = 0.000001;
        var maxRate = 1;

        var updateTextFields = () => {
            this._layersText.value = this._hiddenLayers;
            this._neuronsText.value = this._hiddenNeurons;
            this._rateText.value = this._learningRate.toFixed(6);
        };

        this._layersText.onblur = () => {
            this._layersText.value = this._hiddenLayers;
        };
        this._layersText.onkeypress =(e) => {
            if (e.key === "Enter") {
                var val = this._layersText.value;
                if (val > maxLayers) {
                    val = maxLayers;
                } else if (val < minLayers) {
                    val = minLayers;
                }
                $(this._layersSlider).range('set value', val);
                return false;
            }
        };

        this._neuronsText.onblur = () => {
            this._neuronsText.value = this._hiddenNeurons;
        };
        this._neuronsText.onkeypress = (e) => {
            if (e.key === "Enter") {
                var val = this._neuronsText.value;
                if (val > maxNeurons) {
                    val = maxNeurons;
                } else if (val < minNeurons) {
                    val = minNeurons;
                }
                $(this._neuronsSlider).range('set value', val);
                return false;
            }
        };

        this._rateText.onblur = () => {
            this._rateText.value = this._learningRate.toFixed(6);
        };
        this._rateText.onkeypress = (e) => {
            if (e.key === "Enter") {
                var val = this._rateText.value;
                if (val > maxRate) {
                    val = maxRate;
                } else if (val < minRate) {
                    val = minRate;
                }
                $(this._rateSlider).range('set value', val);
                return false;
            }
        };

        $(this._activationDropdown).dropdown({
            onChange: (val) => {
                this._activation = val;
                if (onUiParamsUpdated) {
                    onUiParamsUpdated();
                }
            }
        });
        $(this._activationDropdown).dropdown("set selected", this._activation);

        $(this._layersSlider).range({
            min: minLayers,
            max: maxLayers,
            start: this._hiddenLayers,
            onChange: (val) => {
                this._hiddenLayers = parseInt(val, 10);
                if (onUiParamsUpdated) {
                    onUiParamsUpdated();
                }
            }
        });

        $(this._neuronsSlider).range({
            min: minNeurons,
            max: maxNeurons,
            start: this._hiddenNeurons,
            onChange: (val) => {
                this._hiddenNeurons = parseInt(val, 10);
                if (onUiParamsUpdated) {
                    onUiParamsUpdated();
                }
            }
        });

        $(this._rateSlider).range({
            min: minRate,
            max: maxRate,
            start: this._learningRate,
            step: 0.000001,
            onChange: (val) => {
                this._learningRate = parseFloat(val);
                if (onUiParamsUpdated) {
                    onUiParamsUpdated();
                }
            }
        });

        $(this._showLossCheckbox).prop('checked', this._showLoss);
        $(this._showLossCheckbox).change(() => {
            this._showLoss = this._showLossCheckbox.checked;
            this.setLossVisibility();
        });

        var onUiParamsUpdated = () => {
            this.setNetworkParams();
            updateTextFields();
        };

        updateTextFields();
    }

    deactivateSpeedButtons() {
        for (var i = 0; i < 100; i++) {
            var btn = document.getElementById("x" + (parseInt(i, 10) + 1));
            if (btn) {
                btn.className = btn.className.replace("blue", "grey");
            }
        }
    }

    onTrainBtnClick() {
        this._stopTrainBtn.disabled = false;
        this._trainBtn.disabled = true;
        this._world.startTraining();
    }

    onStopTrainBtnClick() {
        this._stopTrainBtn.disabled = true;
        this._trainBtn.disabled = false;
        this._world.stopTraining();
    }

    createWorld(stage) {
        return new World(stage);
    }

}
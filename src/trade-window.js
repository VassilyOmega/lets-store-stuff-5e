import {Config} from "./config.js";
import {sendTradeRequest} from "./lets-store-stuff-core.js"
import TradeRequest from "./trade-request.js";

/**
 * A window where the users selects a character to send an item.
 * 
 */
export default class TradeWindow extends Application {
    constructor(data, options) {
        super(options);
        this.data = data;
        this._selectedActor = null;
        if (this.data.item)
            this.quantity = this.data.item.data.data.quantity;

        this.currency = { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 };
    }

    /** 
     * @override
     * */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: Config.TradeWindowTemplate,
            classes: ["lets-store-stuff-window"],
            width: 500,
            jQuery: true
        });
    }

    /**
     * The actor data of the selected trade target
     * 
     * @returns {object|null} actor data or null if none were selected.
     */
    get selectedActor() {
        return this._selectedActor;
    }

    /** @override */
    get title() {
        return "Trade Window";
    }

    /** @override */
    getData(options) {
        let data = {
            characters: this.data.characters,
            quantity: this.quantity,
            showquantity: this.quantity !== 1,
            currency: this.data.currency
        };

        if (this.data.item) {
            data.item = {
                name: this.data.item.name,
                img: this.data.item.img
            };
        }
        return data;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        html.find("li.actor.directory-item").click(this._selectActor.bind(this));
        html.find("button.cancel").click(this.close.bind(this));
        html.find("button.submit").click(this._submit.bind(this));
        html.find(".currency-input").change(this._changeCurrency.bind(this));
        html.find(".quantity-input").change(this._changeQuantity.bind(this));
        html.find(".quantity-quick-btn").click(this._quickChangeQuantity.bind(this));
    }

    /**
     * Handles the change in quantity
     * @private
     */
    _changeCurrency(event) {
        event.preventDefault();
        let value = parseInt(event.target.value);
        let coin = event.target.dataset.coin;
        value = clampNumber(value, 0, this.data.currencyMax[coin]);
        this.currency[coin] = value;
        event.target.value = value;
    }

    /**
     * Handles the change in quantity
     * @private
     */
    _changeQuantity(event) {
        event.preventDefault();
        this.updateQuantity(parseInt(event.target.value));
    }

    /**
     * Handles quick quantity buttons (one, half, all)
     * @private
     */
    _quickChangeQuantity(event) {
        event.preventDefault();
        let qsize = event.currentTarget.dataset.qsize;
        let qmax = this.data.item.data.data.quantity;
        let q = 1;
        switch (qsize) {
            case "one": 
                q = 1;
                break;
            case "half":
                q = Math.floor(qmax / 2);
                break;
            case "all":
                q = qmax;
                break;
        }
        this.updateQuantity(q);
    }

    /**
     * Updates the quantity
     * 
     * @param {number} newQuantity 
     */
    updateQuantity(newQuantity) {
        newQuantity = clampNumber(newQuantity, 1, this.data.item.data.data.quantity);
        this.quantity = newQuantity;
        this.element.find(".quantity-input")[0].value = this.quantity;
    }

    /** 
     * Selects the target character.
     * @private
     */
    async _selectActor(event) {
        event.preventDefault();
        let actorElement = event.currentTarget.closest(".actor.directory-item");
        this._selectedActor = this.data.characters.find(c => c.id === actorElement.dataset.actorId);

        this.element.find(".actor.directory-item").removeClass("active");
        actorElement.classList.add("active");

        if (this.selectedActor) {
            this.element.find("button.submit").attr("disabled", false);
        }
    }

    /**
     * Submit the trade request
     * @private
     */
    async _submit() {
        if (this.selectedActor) {
            let tradeData = {
            //    sourceUserId: game.userId,
                sourceActorId: this.data.actorId,

                destinationActorId: this.selectedActor.id,
            //    destinationUserId: this.selectedActor.userId,
            };

            if (this.data.currency) {
                tradeData.currency = this.currency;
            }

            if (this.data.item) {
                tradeData.itemId = this.data.item.id;
                tradeData.quantity = this.quantity;
            }

            sendTradeRequest(new TradeRequest(tradeData));
        }
        this.close();
    }
}
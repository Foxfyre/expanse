export class ExpanseShipSheet extends ActorSheet {

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["sheet", "actor", "ship"],
            width: 600,
            height: 450,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "abilities" }],
            dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }]
        });
    }

    // Picks between available/listed templates
    get template() {
        let type = this.actor.type;
        return `systems/expanse/templates/sheet/${type}-sheet.html`;
    }

    async getData() {
        const sheetData = super.getData();

        sheetData.dtypes = ["String", "Number", "Boolean"];

        sheetData.system = sheetData.data.system;

        const actorData = sheetData.actor;

        sheetData.enrichment = await this._enrichBio();

        return sheetData;
    }

    async _enrichBio() {
        let enrichment = {};
        enrichment[`system.notes`] = await TextEditor.enrichHTML(this.actor.system.notes, { relativeTo: this.actor });
        return foundry.utils.expandObject(enrichment);
    }

    activateListeners(html) {
        super.activateListeners(html);
        let tabs = html.find('tabs');
        let initial = this._sheetTab;
        new Tabs(tabs, {
            initial: initial,
            callback: clicked => this._sheetTab = clicked.data("tab")
        });

        if (!this.options.editable) return;

        // Update Inventory Item
        html.find(".item-edit").click((ev) => {
            let itemId = $(ev.currentTarget).parents(".item").attr("data-item-id");
            const item = this.actor.getOwnedItem(itemId);
            item.sheet.render(true);
        });

        // Delete Inventory Item
        html.find(".item-delete").click((ev) => {
            let li = $(ev.currentTarget).parents(".item"),
                itemId = li.attr("data-item-id");
            this.actor.deleteEmbeddedEntity("OwnedItem", itemId);
            li.slideUp(200, () => this.render(false));
        });

        html.find(".weapon-usefocus").click(e => {
            const data = super.getData()
            const actorData = data.actor;
            const items = actorData.items;

            let itemId = e.currentTarget.getAttribute("data-item-id");
            const weapon = foundry.utils.duplicate(this.actor.getEmbeddedEntity("OwnedItem", itemId));

            // If targeting same armor, cycle on off (Needs refactoring; else if redundant);
            for (let [k, v] of Object.entries(items)) {
                if (v.type === "weapon" && v.data.usefocus === false && v.id === itemId) {
                    weapon.data.usefocus = !weapon.data.usefocus;
                    this.actor.updateEmbeddedEntity("OwnedItem", weapon)
                } else if (v.type === "weapon" && v.data.usefocus === true && v.id === itemId) {
                    weapon.data.usefocus = !weapon.data.usefocus;
                    this.actor.updateEmbeddedEntity("OwnedItem", weapon)
                }
            }
        });

        html.find('.rollable').click(this._onRoll.bind(this));

        html.find('.npc-attack').click(this._onNPCAttack.bind(this));
    }

    _onNPCAttack(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        const data = super.getData()
        const actorData = data.actor;
        const items = actorData.items;

        // Set variables for to hit
        let itemId = dataset.itemId;
        let itemToUse = actorData.items.filter(i => i.id === itemId);
        let itemUsed = itemToUse[0];
        let weaponToHitAbil = dataset.itemAbil;
        let useFocus = itemUsed.data.usefocus ? 2 : 0;
        let abilityMod = actorData.data.abilities[weaponToHitAbil].rating;
        let die1, die2, die3;
        let stuntPoints = "";
        let tn = 0;
        let rollCard = {};

        let toHitRoll = new Roll(`3D6 + @foc + @abm`, { foc: useFocus, abm: abilityMod });
        toHitRoll.evaluateSync();
        [die1, die2, die3] = toHitRoll.terms[0].results.map(i => i.result);
        let toHit = Number(toHitRoll.total);

        if (die1 == die2 || die1 == die3 || die2 == die3) {
            stuntPoints = `<b>${die3} Stunt Points have been generated!</b></br>`;
        };

        let label = useFocus ? `<b> Rolling ${weaponToHitAbil} with focus </b>` : `Rolling ${weaponToHitAbil}`;

        // Set variables for damage roll
        let diceFormula = itemUsed.data.damage;
        let attackBonus = itemUsed.data.attack;

        let damageRoll = new Roll(`${diceFormula} + @ab`, { ab: attackBonus });
        damageRoll.evaluateSync();
        let damageOnHit = damageRoll.total;

        this.TargetNumber().then(target => {
            tn = Number(target);
            const toHitSuccess = `Your Attack roll of ${toHit} <b>SUCCEEDS</b> against a Target Number of ${tn}.</br>`;
            const toHitFail = `Your Attack roll of ${toHit} with the ${itemUsed.data.name} <b>FAILS</b> against a Target Number of ${tn}.</br>`;
            const damageTotal = `Your attack with the ${itemUsed.data.name} does ${damageOnHit} points of damage.</br>
                Subtract the enemies Toughness and Armor for total damage received`;
            if (toHit >= tn) {
                rollCard = toHitSuccess + stuntPoints + damageTotal
                ChatMessage.create({
                    speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                    flavor: label,
                    content: rollCard
                });
            } else {
                rollCard = toHitFail, stuntPoints
                ChatMessage.create({
                    speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                    flavor: label,
                    content: rollCard
                });
            }
        });
    }



    _onRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        if (dataset.roll) {
            let roll = new Roll(dataset.roll, this.actor.data.data);

            let rollCard;
            let die1 = 0; let die2 = 0; let die3 = 0;
            let useFocus = roll.data.abilities[dataset.label].useFocus ? 2 : 0;
            let abilityMod = roll.data.abilities[dataset.label].rating;

            [die1, die2, die3] = roll.roll().terms[0].results.map(i => i.result);

            let label = useFocus ? `<b> Rolling ${dataset.label} with focus </b>` : `Rolling ${dataset.label}`;
            let results = [die1, die2, die3];
            let resultsSum = die1 + die2 + die3 + useFocus + abilityMod;

            if (die1 == die2 || die1 == die3 || die2 == die3) {
                rollCard = `
              <b>Dice Roll:</b> ${results} <br>
              <b>Ability Test Results:</b> ${resultsSum} <br>
              <b>${die3} Stunt Points have been generated!</b>
              `
            } else {
                rollCard = `
              <b>Dice Roll:</b> ${results} <br>
              <b>Ability Test Results:</b> ${resultsSum}
              `
            }

            ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: label,
                content: rollCard
            });
        }
    }

    TargetNumber() {
        let tn = new Promise((resolve) => {
            renderTemplate("/systems/expanse/templates/dialog/target-number.html").then(dlg => {
                new Dialog({
                    title: game.i18n.localize("EXPANSE.TargetNumber"),
                    content: dlg,
                    buttons: {
                        roll: {
                            label: game.i18n.localize("EXPANSE.Roll"),
                            callback: html => {
                                resolve(html.find(`[name="targetInput"]`).val());
                            }
                        }
                    }
                }).render(true);
            });
        })
        return tn;
    }

    AttackDamage() {

    }

}

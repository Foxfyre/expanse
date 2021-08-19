export class ExpanseActorSheet extends ActorSheet {

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["sheet", "actor", "talents"],
            height: 750,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "abilities" }],
            dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }]
        });
    }

    // Picks between available/listed templates
    get template() {
        const path = "systems/the_expanse/templates/sheet"
        return `${path}/${this.actor.data.type}-sheet.html`;
    }

    get actorData() {
        return this.actor.data;
    }

    get actorProperties() {
        return this.actorData.data;
    }

    getData() {
        const data = super.getData();
        //data.dtypes = ["String", "Number", "Boolean"];
        let sheetData = {};

        sheetData.dtypes = ["String", "Number", "Boolean"];
        sheetData.name = data.actor.data.name;
        sheetData.stunts = data.actor.items.filter(i => i.type === "stunt");
        sheetData.talent = data.actor.items.filter(i => i.type === "talent");
        sheetData.items = data.actor.items.filter(i => i.type === "items");
        sheetData.weapon = data.actor.items.filter(i => i.type === "weapon");
        sheetData.armor = data.actor.items.filter(i => i.type === "armor");
        sheetData.shield = data.actor.items.filter(i => i.type === "shield");
        sheetData.conditions = data.data.data.conditions;
        sheetData.level = data.data.data.attributes.level;
        sheetData.attributes = data.data.data.attributes;
        sheetData.abilities = data.data.data.abilities;
        sheetData.bio = data.data.data.bio;
        //temp fix. new actors shouldnt need this
        sheetData.info = data.data.data.info;
        sheetData.img = data.actor.data.img;

        sheetData.items.sort((a, b) => {
            return a.name.localeCompare(b.name);
        });

        for (let [k, v] of Object.entries(sheetData.weapon)) {
            if (v.type === "weapon") {
                const weapon = duplicate(this.actor.getEmbeddedDocument("Item", v.id));
                let modifierStat = v.data.data.modifier
                let bonusDamage = 0; // get stat from actorData
                let useFocus = v.data.data.usefocus;
                let useFocusPlus = v.data.data.usefocusplus;
                let focusBonus = useFocus ? 2 : 0;
                let focusPlusBonus = useFocusPlus ? 1 : 0;
                const totalFocusBonus = focusBonus + focusPlusBonus;
                let toHitMod = v.data.data.type;
                let modType = "";

                switch (modifierStat) {
                    case 'dex':
                        bonusDamage = data.actor.data.data.abilities.dexterity.rating;
                        break;
                    case 'per':
                        bonusDamage = data.actor.data.data.abilities.perception.rating;
                        break;
                    case 'str':
                        bonusDamage = data.actor.data.data.abilities.strength.rating;
                        break;
                }

                if (bonusDamage > 0) {
                    v.data.data.hasBonusDamage = true;
                } else {
                    v.data.data.hasBonusDamage = false;
                }

                v.data.data.bonusDamage = bonusDamage;

                switch (toHitMod) {
                    case "unarmed":
                    case "makeshift":
                    case "light_melee":
                    case "heavy_melee":
                        modType = "fighting";
                        v.data.data.attack = data.actor.data.data.abilities.fighting.rating;
                        break;
                    case "pistol":
                    case "rifle":
                        modType = "accuracy";
                        v.data.data.attack = data.actor.data.data.abilities.accuracy.rating;
                        break;
                    default:
                        modType = "fighting";
                        v.data.data.attack = data.actor.data.data.abilities.fighting.rating;
                        break;
                }
                v.data.data.tohitabil = modType;
                v.data.data.attack += totalFocusBonus;
                this.actor.updateEmbeddedDocuments("Item", [v])
            }
        }

        // Go through the Degrees of Talents and record the highest talent to display on the character sheet. 
        for (let [k, v] of Object.entries(sheetData.talent)) {
            const talent = duplicate(this.actor.getEmbeddedDocument("Item", v.id));
            let highest = "";
            for (let [s, t] of Object.entries(v.data.data.ranks)) {
                if (t.label === "novice" && t.active === true) {
                    highest = "Novice";
                } else if (t.label === "expert" && t.active === true) {
                    highest = "Expert";
                } else if (t.label === "master" && t.active === true) {
                    highest = "Master";
                }
            }
            talent.data.highest = highest;
            this.actor.updateEmbeddedDocuments("Item", [talent]);
        }
        //return data;
        return sheetData;
    }

    activateListeners(html) {
        super.activateListeners(html);
        let tabs = html.find('tabs');
        let initial = this._sheetTab;
        new TabsV2(tabs, {
            initial: initial,
            callback: clicked => this._sheetTab = clicked.data("tab")
        });

        if (!this.options.editable) return;

        // Update Inventory Item
        html.find(".item-edit").click((ev) => {
            let itemId = $(ev.currentTarget).parents(".item").attr("data-item-id");
            const item = this.actor.items.get(itemId);
            item.sheet.render(true);
        });

        // Delete Inventory Item
        html.find(".item-delete").click((ev) => {
            let li = $(ev.currentTarget).parents(".item"),
                itemId = li.attr("data-item-id");
            this.actor.deleteEmbeddedEntity("Item", itemId);
            li.slideUp(200, () => this.render(false));
        });

        html.find(".active-condition").click(async e => {
            const data = super.getData()
            const actorData = data.actor;
            //const actorId = data.actor.id;
            let conditionName = e.currentTarget.getAttribute("name");

            const conditionData = actorData.data.data.conditions;

            for (let [k, v] of Object.entries(conditionData)) {
                if (k === conditionName) {
                    actorData.data.data.conditions[conditionName] = !v;
                }
            }
            await this.actor.update({ data: { conditions: data.actor.data.data.conditions } });
        })

        // Limit armor able to be equipped to 1
        html.find(".item-equip").click(async e => {
            const data = super.getData()
            const items = data.items;

            let itemId = e.currentTarget.getAttribute("data-item-id");
            const armor = duplicate(this.actor.getEmbeddedDocument("Item", itemId));
            
            for (let [k, v] of Object.entries(items)) {
                // Confirming only one armour equipped
                if ((v.type === "armor" || v.type === "shield") && v.data.equip === true && v._id !== itemId) {
                    Dialog.prompt({
                        title: "Cannot Equip",
                        content: "<p>You can only have one piece of armour and shield equipped at one time. Please remove your current armor before continuing",
                        label: "OK",
                        callback: () => console.log("denied!")
                    });
                    return;
                }
                // If targeting same armor, cycle on off;
                if (v.type === "armor" && v._id === itemId) {
                    armor.data.equip = !armor.data.equip;
                } else if (v.type === "shield" && v._id === itemId) {
                    armor.data.equip = !armor.data.equip;
                }
                this.actor.updateEmbeddedDocuments("Item", [armor])
            }
        });


        // The check is registering on the page, just need to update it.
        html.find(".weapon-usefocus").click(e => {
            const data = super.getData()
            const items = data.items;
            let itemId = e.currentTarget.getAttribute("data-item-id");
            const weapon = duplicate(this.actor.getEmbeddedDocument("Item", itemId));
            for (let [k, v] of Object.entries(items)) {
                if (v.type === "weapon" && v._id === itemId) {
                    weapon.data.usefocus = !weapon.data.usefocus;
                }
            }
            this.actor.updateEmbeddedDocuments("Item", [weapon]);
        });

        html.find(".weapon-usefocusplus").click(e => {
            const data = super.getData()
            const items = data.items;
            let itemId = e.currentTarget.getAttribute("data-item-id");
            const weapon = duplicate(this.actor.getEmbeddedDocument("Item", itemId));

            for (let [k, v] of Object.entries(items)) {
                if (v.type === "weapon" && v._id === itemId) {
                    weapon.data.usefocusplus = !weapon.data.usefocusplus;
                }
            }
            this.actor.updateEmbeddedDocuments("Item", [weapon]);
        });

        html.find(".learn-talent").click(e => {
            const data = super.getData()
            const item = data.data;

            let itemId = e.currentTarget.getAttribute("data-item-id");
            const talent = duplicate(this.actor.getEmbeddedDocument("Item", itemId));
            if (item.type === "talent") {
                talent.data.ranks.active = !talent.data.ranks.active;
            }
            this.actor.updateEmbeddedDocuments("item", [talent.data]);
        });

        html.find('.rollable').click(this._onRoll.bind(this));

        html.find('.pc-attack').click(this._onAttack.bind(this));

        html.find('.income-roll').click(this._IncomeRoll.bind(this));

    }

    _onAttack(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        const data = super.getData()
        const actorData = data.actor;
        const items = actorData.items;

        // Set variables for to hit
        let itemId = dataset.itemId;
        let itemToUse = actorData.data.items.filter(i => i.id === itemId);
        let itemUsed = itemToUse[0];
        let weaponToHitAbil = dataset.itemAbil;
        let useFocus = itemUsed.data.usefocus ? 2 : 0;
        let useFocusPlus = itemUsed.data.usefocusplus ? 1 : 0;
        const focusBonus = useFocus + useFocusPlus
        let abilityMod = actorData.data.data.abilities[weaponToHitAbil].rating;
        let die1, die2, die3;
        let stuntPoints = "";
        let tn = 0;
        let rollCard = {};

        let toHitRoll = new Roll(`3D6 + @foc + @abm`, { foc: focusBonus, abm: abilityMod }).roll({async: false});
        //toHitRoll.evaluate();
        [die1, die2, die3] = toHitRoll.terms[0].results.map(i => i.result);
        let toHit = Number(toHitRoll.total);
        //console.log("To Hit Results:" + " " + die1 + " " + die2 + " " + die3 + " Use Focus: " + focusBonus + " Ability Modifier: " + abilityMod);

        if (die1 == die2 || die1 == die3 || die2 == die3) {
            stuntPoints = `<b>${die3} Stunt Points have been generated!</b></br>`;
        };

        let label = useFocus ? `<b> Rolling ${weaponToHitAbil} with focus </b>` : `Rolling ${weaponToHitAbil}`;

        // Set variables for damage roll
        let diceFormula = itemUsed.data.data.damage;
        let bonusDamage = itemUsed.data.data.bonusDamage;

        let damageRoll = new Roll(`${diceFormula} + @bd`, { bd: bonusDamage }).roll({async: false});
        //damageRoll.evaluate();
        let damageOnHit = damageRoll.total;

        this.TargetNumber().then(target => {
            tn = Number(target);
            const toHitSuccess = `Your Attack roll of ${toHit} <b>SUCCEEDS</b> against a Target Number of ${tn}.</br>`;
            const toHitFail = `Your Attack roll of ${toHit} with the ${itemUsed.name} <b>FAILS</b> against a Target Number of ${tn}.</br>`;
            const damageTotal = `Your attack with the ${itemUsed.name} does ${damageOnHit} points of damage.</br> 
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

    _IncomeRoll(e) {
        e.preventDefault();
        const element = e.currentTarget;
        const dataset = element.dataset;


        const data = super.getData()
        const income = data.data.data.info.income;
        let ic = 0;

        let incomeRoll = new Roll(`3D6 + @inc`, { inc: income });

        incomeRoll.evaluate();
        let incomeResult = incomeRoll.total;

        this.IncomeCost().then(target => {
            ic = Number(target);
            let rollCard;
            const incomeSuccess = `<b>Income Test:</b> 3D6 + ${income} vs ${ic}.</br>
            <b>Result:</b> ${incomeResult}</br></br>
            <i>You are able to successfully secure the item or service.</i></br>`;

            const incomeFail = `<b>Income Test:</b> 3D6 + ${income} vs ${ic}.</br>
            <b>Result:</b> ${incomeResult}</br></br>
            <i>You are unable to secure the item or service.</i></br>`;

            const autoSuccess = `<b>Income Test:</b> 3D6 + ${income} vs ${ic}.</br>
            <b>Result:</b> ${incomeResult}</br></br>
            <i>Your income is high enough that you automatically succeed at securing the item or service</i>`;

            const incomeDeplete = `<b>Income Test:</b> 3D6 + ${income} vs ${ic}.</br>
            <b>Result:</b> ${incomeResult}</br></br>
            <i>You successfully secure the item or service, but due to the great expense, your Income depletes by 1.</>`;

            const label = 'Rolling Income';

            if ((income + 4) >= ic) { // Auto Success
                rollCard = autoSuccess
                ChatMessage.create({
                    speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                    flavor: label,
                    content: rollCard
                });
            } else if (incomeResult >= ic) { // Successful result
                if (ic >= (income + 10)) { // Depletion - Set automation to automatically deplete
                    rollCard = incomeDeplete
                    ChatMessage.create({
                        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                        flavor: label,
                        content: rollCard
                    });
                } else {
                    rollCard = incomeSuccess
                    ChatMessage.create({
                        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                        flavor: label,
                        content: rollCard
                    });
                }
            } else if (incomeResult < ic) { // Failed Result
                rollCard = incomeFail
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
            let roll = new Roll(dataset.roll, this.actor.data.data).roll({async: false});
            let rollCard;
            let die1 = 0; let die2 = 0; let die3 = 0;
            let useFocus = roll.data.abilities[dataset.label].useFocus ? 2 : 0;
            let useFocusPlus = roll.data.abilities[dataset.label].useFocusPlus ? 1 : 0;
            let abilityMod = roll.data.abilities[dataset.label].rating;

            [die1, die2, die3] = roll.roll().terms[0].results.map(i => i.result);

            let label = useFocus ? `<b> Rolling ${dataset.label} with focus </b>` : `Rolling ${dataset.label}`;
            let results = [die1, die2, die3];
            let resultsSum = die1 + die2 + die3 + useFocus + useFocusPlus + abilityMod;

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
            renderTemplate("/systems/the_expanse/templates/dialog/target-number.html").then(dlg => {
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
                    },
                    default: "roll"
                }).render(true);
            });
        })
        return tn;
    }

    IncomeCost() {
        let ic = new Promise((resolve) => {
            renderTemplate("/systems/the_expanse/templates/dialog/income.html").then(dlg => {
                new Dialog({
                    title: game.i18n.localize("EXPANSE.Cost"),
                    content: dlg,
                    buttons: {
                        roll: {
                            label: game.i18n.localize("EXPANSE.Roll"),
                            callback: html => {
                                resolve(html.find(`[name="incomeCost"]`).val());
                            }
                        }
                    },
                    default: "roll"
                }).render(true);
            });
        })
        return ic;
    }

    AttackDamage() {

    }

}

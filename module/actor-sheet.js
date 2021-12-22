import { diceRollType } from "./rolling/dice-rolling.js";
import { RollModifier, RollDamageModifier } from "./rolling/modifiers.js"

export class ExpanseActorSheet extends ActorSheet {

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["sheet", "actor", "talents"],
            height: 750,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "abilities" }],
            dragDrop: [
                { dragSelector: ".item-list .item", dropSelector: null }
            ]
        });
    }

    // Picks between available/listed templates
    get template() {
        const path = "systems/expanse/templates/sheet"
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
                //const weapon = duplicate(this.actor.getEmbeddedDocument("Item", v.id));
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
                    case 'Dexterity':
                        bonusDamage = data.actor.data.data.abilities.dexterity.rating;
                        break;
                    case 'Perception':
                        bonusDamage = data.actor.data.data.abilities.perception.rating;
                        break;
                    case 'Strength':
                        bonusDamage = data.actor.data.data.abilities.strength.rating;
                        break;
                }

                if (bonusDamage !== 0) {
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
                v._id = v.data._id;
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
            this.actor.deleteEmbeddedDocuments("Item", [itemId]);
            li.slideUp(200, () => this.render(false));
        });

        html.find(".active-condition").click(async e => {
            const data = super.getData()
            const actorData = data.actor;
            let conditionName = e.currentTarget.getAttribute("name");
            const conditionData = actorData.data.data.conditions;

            for (let [k, v] of Object.entries(conditionData)) {
                if (k === conditionName) {
                    actorData.data.data.conditions[conditionName].active = !v.active;
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

        html.find(".weapon-extradamage").click(e => {
            const data = super.getData()
            const items = data.items;
            const actorData = data.actor;
            let itemId = e.currentTarget.getAttribute("data-item-id");
            const weapon = duplicate(this.actor.getEmbeddedDocument("Item", itemId));

            for (let [k, v] of Object.entries(items)) {
                if (v.type === "weapon" && v._id === itemId && actorData.data.data.attributes.stuntpoints.modified >= 2) {
                    weapon.data.extraDamage = !weapon.data.extraDamage;
                }
            }
            this.actor.updateEmbeddedDocuments("Item", [weapon]);
        });

        html.find('.rollable').click(this._onRoll.bind(this));

        html.find('.pc-attack').click(this._onAttack.bind(this));

        html.find('.pc-damage').click(this._onDamage.bind(this));

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

        // pull this out into a function
        if (actorData.data.data.attributes.stuntpoints.thisround === true) {
            let spData = actorData.data.data.attributes.stuntpoints;
            spData.modified = 0;
            spData.thisround = false;
            this.actor.update({ data: { attributes: data.actor.data.data.attributes } });
        }

        if (dataset.roll) {
            const diceData = diceRollType();
            let die1, die2, die3;
            let d2; let d1;
            let condMod;
            let condModName;
            let rollCard;
            let condModWarning;
            let resultsSum
            let useFocusPlus = 0;

            // need to conditionally set d2 d1. if game.module for dsn is true, use the dice data, if not use 6;
            if (game.modules.get("dice-so-nice") && game.modules.get("dice-so-nice").active) {
                d2 = diceData.nice[0];
                d1 = diceData.nice[1];
            } else {
                d2 = 6;
                d1 = 6;
            }

            let toHitRoll = new Roll(`2d${d2} + 1d${d1} + @abilities.${dataset.itemAbil}`).roll({ async: false });
            let useFocus = itemUsed.data.data.usefocus ? 2 : 0;
            if (itemUsed.data.data.usefocus === true && itemUsed.data.data.usefocusplus === true) {
                useFocusPlus = 1
            }
            let abilityMod = actorData.data.data.abilities[dataset.itemAbil].rating;
            [die1, die2] = toHitRoll.terms[0].results.map(i => i.result);
            [die3] = toHitRoll.terms[2].results.map(i => i.result);

            if (actorData.data.data.conditions.wounded.active === true) {
                condMod = -2;
                condModName = "wounded";
            } else if ((actorData.data.data.conditions.injured.active === true) && (actorData.data.data.conditions.wounded.active === false)) {
                condMod = -1;
                condModName = "injured";
            } else {
                condMod = 0;
            }

            let label = useFocus ? `<b> Rolling ${weaponToHitAbil} to hit with focus </b>` : `Rolling to hit with ${weaponToHitAbil}`;

            if (condMod < 0) {
                condModWarning = `<i>You are <b>${condModName}</b> and receive a ${condMod} modifier to your roll</i> <br>`;
            } else {
                condModWarning = ``;
            }

            const dieImage = `<img height="75px" width="75px" src="systems/expanse/ui/dice/${diceData.faction}/chat/${diceData.faction}-${die1}-${diceData.style}.png" />
            <img height="75px" width="75px" src="systems/expanse/ui/dice/${diceData.faction}/chat/${diceData.faction}-${die2}-${diceData.style}.png" />
            <img height="75px" width="75px" src="systems/expanse/ui/dice/${diceData.faction}/chat/${diceData.faction}-${die3}-${diceData.stunt}.png" />`

            let chatFocus;

            if (useFocus === 2 && useFocusPlus === 1) {
                chatFocus = `<b>Focus:</b> 3</br>`;
            } else if (useFocus === 2 && useFocusPlus === 0) {
                chatFocus = `<b>Focus:</b> 2</br>`;
            } else (chatFocus = ``);

            let chatMod = `<b>Ability Rating</b>: ${abilityMod}</br>`;

            resultsSum = die1 + die2 + die3 + useFocus + useFocusPlus + abilityMod + condMod;

            let chatStunts = "";
            if (die1 == die2 || die1 == die3 || die2 == die3) {
                chatStunts = `<b>${die3} Stunt Points have been generated!</b>`;
                let spData = actorData.data.data.attributes.stuntpoints;
                spData.modified = die3;
                spData.thisround = true;
                this.actor.update({ data: { attributes: data.actor.data.data.attributes } });
            }

            if (event.shiftKey) {
                RollModifier().then(r => {
                    let testData = r;

                    resultsSum += testData;
                    let chatAddMod = `<b>Additional Modifier</b>: ${testData}</br>`
                    rollCard = `
                        <div style="display: flex; flex-direction: row; justify-content: space-around;">${dieImage}</div><br> 
                        ${chatMod}
                        ${chatAddMod}
                        ${chatFocus}
                        ${condModWarning} 
                        <b>Ability Test Results:</b> ${resultsSum} <br> <br>
                        ${chatStunts}
                    `
                    ChatMessage.create({
                        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
                        roll: toHitRoll,
                        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                        flavor: label,
                        content: rollCard,
                        sound: CONFIG.sounds.dice
                    });
                })

            } else {
                rollCard = `
                <div style="display: flex; flex-direction: row; justify-content: space-around;">${dieImage}</div><br> 
                ${chatMod}
                ${chatFocus}
                ${condModWarning} 
                <b>Ability Test Results:</b> ${resultsSum} <br> 
                ${chatStunts}`

                ChatMessage.create({
                    type: CONST.CHAT_MESSAGE_TYPES.ROLL,
                    roll: toHitRoll,
                    speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                    flavor: label,
                    content: rollCard,
                    sound: CONFIG.sounds.dice
                });
            }

        }
    }

    _onDamage(e) {
        e.preventDefault();
        const element = e.currentTarget;
        const dataset = element.dataset;
        const diceData = diceRollType();
        const data = super.getData()
        const actorData = data.actor;
        const items = actorData.items;
        let itemId = dataset.itemId;
        let itemToUse = actorData.data.items.filter(i => i.id === itemId);
        let itemUsed = itemToUse[0];
        let weaponMod = itemUsed.data.data.modifier; // Modifier for extra damage
        let damageD3 = (itemUsed.data.data.dieFaces === 3) ? true : false;

        let d2;
        // need to conditionally set d2 d1. if game.module for dsn is true, use the dice data, if not use 6;
        if (game.modules.get("dice-so-nice") && game.modules.get("dice-so-nice").active) {
            d2 = diceData.nice[0];
        } else {
            d2 = 6
        }

        let diceFormula = itemUsed.data.data.damage;
        let bonusDamage = itemUsed.data.data.bonusDamage;

        let damageOnHit;
        let diceImageArray = "";

        if (!e.shiftKey) {
            let damageRoll = new Roll(`${diceFormula}d${d2}`).roll({ async: false });
            let damageOutput = damageD3 ? Math.ceil(damageRoll.total / 2) : damageRoll.total;
            let totalDamage = damageOutput + bonusDamage;
            let resultRoll = damageRoll.terms[0].results.map(i => i.result);
            for (let i = 0; i < resultRoll.length; i++) {
                diceImageArray += `<img height="75px" width="75px" src="systems/expanse/ui/dice/${diceData.faction}/chat/${diceData.faction}-${resultRoll[i]}-${diceData.style}.png" /> `
            }
            let label = `<b>Attacking with ${itemUsed.name}</b>`;

            let chatDamage = `<b>Weapon Damage (D${itemUsed.data.data.dieFaces})</b>: ${damageOutput}</br>`;
            let chatBonusDamage = `<b>Damage Modifier (${weaponMod})</b>: ${bonusDamage}</br>`
            let chatDamageTotal = `You do <b>${totalDamage}</b> points of damage.</br></br>
            Subtract the enemies Toughness and Armor for total damage received`;

            let rollCard = `<div style="display: flex; flex-direction: row; justify-content: space-around;">${diceImageArray}</div></br>
                ${chatDamage}
                ${chatBonusDamage}
                ${chatDamageTotal}
            `

            ChatMessage.create({
                type: CONST.CHAT_MESSAGE_TYPES.ROLL,
                roll: damageRoll,
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: label,
                content: rollCard,
                sound: CONFIG.sounds.dice
            });

        } else {
            RollDamageModifier().then(r => {
                let testData = r;
                diceFormula += testData[0];
                const reducer = (previousValue, currentValue) => previousValue + currentValue;
                let damageRoll = new Roll(`${diceFormula}d${d2}`).roll({ async: false });
                let damageOutput = damageD3 ? damageRoll.terms[0].results.map(i => Math.ceil(i.result / 2)) : damageRoll.terms[0].results.map(i => (i.result));
                let cDmg = damageOutput.reduce(reducer);
                let totalDamage = cDmg + bonusDamage + testData[1];
                let resultRoll = damageRoll.terms[0].results.map(i => i.result);
                for (let i = 0; i < resultRoll.length; i++) {
                    diceImageArray += `<img height="75px" width="75px" style="margin-top: 5px;" src="systems/expanse/ui/dice/${diceData.faction}/chat/${diceData.faction}-${resultRoll[i]}-${diceData.style}.png" /> `
                }

                let label = `<b>Attacking with ${itemUsed.name}</b></br>`;

                let chatDamage = `<b>Weapon Damage (D${itemUsed.data.data.dieFaces})</b>: ${cDmg}</br>`;
                let chatBonusDamage = `<b>Damage Modifier (${weaponMod})</b>: ${bonusDamage}</br>`
                let chatExtraDamage = `<b>Extra Damage</b>: ${testData[1]}</br>`
                let chatDamageTotal = `You do <b>${totalDamage}</b> points of damage.</br></br>
                    Subtract the enemies Toughness and Armor for total damage received`;

                let rollCard = `<div style="display: flex; flex-direction: row; justify-content: space-around; flex-wrap: wrap;">${diceImageArray}</div></br>
                    ${chatDamage}
                    ${chatBonusDamage}
                    ${chatExtraDamage}
                    ${chatDamageTotal}
            `

                ChatMessage.create({
                    type: CONST.CHAT_MESSAGE_TYPES.ROLL,
                    roll: damageRoll,
                    speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                    flavor: label,
                    content: rollCard,
                    sound: CONFIG.sounds.dice
                });
            })
        }

    }

    _IncomeRoll(e) {
        e.preventDefault();
        const element = e.currentTarget;
        const dataset = element.dataset;
        const data = super.getData()
        let income = data.data.data.info.income;
        let diceImageArray = "";
        let ic; let d2;

        const diceData = diceRollType();

        // need to conditionally set d2 d1. if game.module for dsn is true, use the dice data, if not use 6;
        if (game.modules.get("dice-so-nice") && game.modules.get("dice-so-nice").active) {
            d2 = diceData.nice[0];
        } else {
            d2 = 6;
        }

        if (income === null) { income = 0; };

        let incomeRoll = new Roll(`3d${d2}`).roll({ async: false });

        let incomeResult = Number(incomeRoll.total + income);

        let resultRoll = incomeRoll.terms[0].results.map(i => i.result);
        for (let i = 0; i < resultRoll.length; i++) {
            diceImageArray += `<img height="75px" width="75px" src="systems/expanse/ui/dice/${diceData.faction}/chat/${diceData.faction}-${resultRoll[i]}-${diceData.style}.png" /> `
        }

        let rollCard;

        const chatDice = `<div style="display: flex; flex-direction: row; justify-content: space-around; flex-wrap: wrap;">${diceImageArray}</div></br>`
        const chatIncome = `<b>Income:</b> ${income}</br>`
        const chatResult = `<b>Result:</b> ${incomeResult}</br>`
        const incomeSuccess = `</br><i>You are able to successfully secure the item or service.</i>`;
        const incomeFail = `</br><i>You are unable to secure the item or service.</i>`;
        const autoSuccess = `</br><i>Your income is high enough that you automatically succeed at securing the item or service</i>`;
        const incomeDeplete = `</br><i>You successfully secure the item or service, but due to the great expense, your Income depletes by 1.</i>`;
        const label = 'Rolling Income';

        if (!e.shiftKey) {
            this.IncomeCost().then(r => {
                ic = r;

                const chatCost = `<b>Cost:</b> ${ic}</br>`

                rollCard = `${chatDice}${chatCost}${chatIncome}${chatResult}
                `
                if ((income + 4) >= ic && ic !== "") { // Auto Success
                    rollCard = `${chatDice}${chatCost}${chatIncome}${chatResult}${autoSuccess}`
                    ChatMessage.create({
                        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
                        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                        flavor: label,
                        roll: incomeRoll,
                        content: rollCard,
                        sound: CONFIG.sounds.dice
                    });
                } else if (incomeResult >= ic && ic !== "") { // Successful result
                    if (ic >= (income + 10)) { // Depletion - Set automation to automatically deplete
                        rollCard = `${chatDice}${chatCost}${chatIncome}${chatResult}${incomeDeplete}`
                        ChatMessage.create({
                            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
                            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                            flavor: label,
                            roll: incomeRoll,
                            content: rollCard,
                            sound: CONFIG.sounds.dice
                        });
                    } else {
                        rollCard = `${chatDice}${chatCost}${chatIncome}${chatResult}${incomeSuccess}`
                        ChatMessage.create({
                            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
                            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                            flavor: label,
                            roll: incomeRoll,
                            content: rollCard,
                            sound: CONFIG.sounds.dice
                        });
                    }
                } else if (incomeResult < ic && ic !== "") { // Failed Result
                    rollCard = `${chatDice}${chatCost}${chatIncome}${chatResult}${incomeFail}`
                    ChatMessage.create({
                        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
                        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                        flavor: label,
                        roll: incomeRoll,
                        content: rollCard,
                        sound: CONFIG.sounds.dice
                    });
                } else if (ic === "") {
                    rollCard = `${chatDice}${chatCost}${chatIncome}${chatResult}`
                    ChatMessage.create({
                        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
                        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                        flavor: label,
                        roll: incomeRoll,
                        content: diceRollDialogue,
                        sound: CONFIG.sounds.dice
                    });
                }
            });
        } else {
            rollCard = `${chatDice}${chatIncome}${chatResult}`
            ChatMessage.create({
                type: CONST.CHAT_MESSAGE_TYPES.ROLL,
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: label,
                roll: incomeRoll,
                content: rollCard,
                sound: CONFIG.sounds.dice
            });
        }
    }

    _onRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        const data = super.getData();
        const actorData = data.actor;
        let testData;
        // pull this out into a function
        if (actorData.data.data.attributes.stuntpoints.thisround === true) {
            let spData = actorData.data.data.attributes.stuntpoints;
            spData.modified = 0;
            spData.thisround = false;
            this.actor.update({ data: { attributes: data.actor.data.data.attributes } });
        }
        // This is the start of a refactoring test. If things go bad, undo to here.
        if (dataset.roll) {
            const diceData = diceRollType();
            let die1 = 0; let die2 = 0; let die3 = 0;
            let d2; let d1;
            let condMod;
            let condModName;
            let rollCard;
            let condModWarning;
            let resultsSum;
            let useFocusPlus = 0;
            // need to conditionally set d2 d1. if game.module for dsn is true, use the dice data, if not use 6;
            if (game.modules.get("dice-so-nice") && game.modules.get("dice-so-nice").active) {
                d2 = diceData.nice[0];
                d1 = diceData.nice[1];
            } else {
                d2 = 6;
                d1 = 6;
            }

            let roll = new Roll(`2d${d2} + 1d${d1} + @abilities.${dataset.label}.rating`, this.actor.data.data).roll({ async: false });
            let useFocus = roll.data.abilities[dataset.label].useFocus ? 2 : 0;
            if (roll.data.abilities[dataset.label].usefocus === true && roll.data.abilities[dataset.label].usefocusplus === true) {
                useFocusPlus = 1
            }
            let abilityMod = roll.data.abilities[dataset.label].rating;
            [die1, die2] = roll.terms[0].results.map(i => i.result);
            [die3] = roll.terms[2].results.map(i => i.result);

            if (roll.data.conditions.wounded.active === true) {
                condMod = -2;
                condModName = "wounded";
            } else if ((roll.data.conditions.injured.active === true) && (roll.data.conditions.wounded.active === false)) {
                condMod = -1;
                condModName = "injured";
            } else {
                condMod = 0;
            }

            let label = useFocus ? `<b> Rolling ${dataset.label} with focus </b>` : `Rolling ${dataset.label}`;

            if (condMod < 0) {
                condModWarning = `<i>You are <b>${condModName}</b> and receive a ${condMod} modifier to your roll</i> <br>`;
            } else {
                condModWarning = ``;
            }

            const dieImage = `<img height="75px" width="75px" src="systems/expanse/ui/dice/${diceData.faction}/chat/${diceData.faction}-${die1}-${diceData.style}.png" />
            <img height="75px" width="75px" src="systems/expanse/ui/dice/${diceData.faction}/chat/${diceData.faction}-${die2}-${diceData.style}.png" />
            <img height="75px" width="75px" src="systems/expanse/ui/dice/${diceData.faction}/chat/${diceData.faction}-${die3}-${diceData.stunt}.png" />`

            let chatFocus;

            if (useFocus === 2 && useFocusPlus === 1) {
                chatFocus = `<b>Focus:</b> 3</br>`;
            } else if (useFocus === 2 && useFocusPlus === 0) {
                chatFocus = `<b>Focus:</b> 2</br>`;
            } else (chatFocus = ``);

            let chatMod = `<b>Ability Rating</b>: ${abilityMod}</br>`;

            resultsSum = die1 + die2 + die3 + useFocus + useFocusPlus + abilityMod + condMod;

            // Stunt Points Generation
            let chatStunts = "";
            if (die1 == die2 || die1 == die3 || die2 == die3) {
                chatStunts = `<b>${die3} Stunt Points have been generated!</b>`;
                let spData = actorData.data.data.attributes.stuntpoints;
                spData.modified = die3;
                spData.thisround = true;
                this.actor.update({ data: { attributes: data.actor.data.data.attributes } });
            }

            if (event.shiftKey) {
                this.RollModifier().then(r => {
                    testData = r;

                    resultsSum += testData;
                    let chatAddMod = `<b>Additional Modifier</b>: ${testData}</br>`
                    rollCard = `
                        <div style="display: flex; flex-direction: row; justify-content: space-around;">${dieImage}</div><br> 
                        ${chatMod}
                        ${chatAddMod}
                        ${chatFocus}
                        ${condModWarning} 
                        <b>Ability Test Results:</b> ${resultsSum} <br> 
                        ${chatStunts}
                    `
                    ChatMessage.create({
                        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
                        roll: roll,
                        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                        flavor: label,
                        content: rollCard,
                        sound: CONFIG.sounds.dice
                    });
                })

            } else {
                rollCard = `
                <div style="display: flex; flex-direction: row; justify-content: space-around;">${dieImage}</div><br> 
                ${chatMod}
                ${chatFocus}
                ${condModWarning} 
                <b>Ability Test Results:</b> ${resultsSum} <br> 
                ${chatStunts}`

                ChatMessage.create({
                    type: CONST.CHAT_MESSAGE_TYPES.ROLL,
                    roll: roll,
                    speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                    flavor: label,
                    content: rollCard,
                    sound: CONFIG.sounds.dice
                });
            }
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
                    },
                    default: "Roll"
                }).render(true);
            });
        })
        return tn;
    }

    IncomeCost() {
        let ic = new Promise((resolve) => {
            renderTemplate("/systems/expanse/templates/dialog/income.html").then(dlg => {
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
                    default: "Roll"
                }).render(true);
            });
        })
        return ic;
    }

    RollDamageModifier() {
        let dMod = new Promise((resolve) => {
            renderTemplate("/systems/expanse/templates/dialog/damageModifiers.html").then(dlg => {
                new Dialog({
                    title: game.i18n.localize("EXPANSE.DamageModifier"),
                    content: dlg,
                    buttons: {
                        roll: {
                            label: game.i18n.localize("EXPANSE.Roll"),
                            callback: (html) => {
                                resolve([
                                    Number(html.find(`[name="add1D6"]`).val()),
                                    Number(html.find(`[name="addDamage"]`).val())
                                ])
                            }
                        }
                    },
                    default: "Roll"
                }).render(true)
            });
        })
        return dMod;
    }

    RollModifier() {
        let rMod = new Promise((resolve) => {
            renderTemplate("/systems/expanse/templates/dialog/rollModifiers.html").then(dlg => {
                new Dialog({
                    title: game.i18n.localize("EXPANSE.RollModifier"),
                    content: dlg,
                    buttons: {
                        roll: {
                            label: game.i18n.localize("EXPANSE.Roll"),
                            callback: (html) => {
                                resolve(
                                    rMod.addModifier = Number(html.find(`[name="addRollModifier"]`).val())
                                )
                            }
                        }
                    },
                    default: "Roll"
                }).render(true)
            });
        })
        return rMod;
    }

}

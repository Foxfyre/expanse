import { diceRollType } from "./rolling/dice-rolling.js";
import { RollModifier, RollDamageModifier } from "./rolling/modifiers.js"

export class ExpanseNPCSheet extends ActorSheet {

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["sheet", "actor", "npc"],
            width: 500,
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

    getData() {
        const sheetData = super.getData();
        //data.dtypes = ["String", "Number", "Boolean"];
        //let sheetData = {};

        sheetData.system = sheetData.data.system;
        const actorData = sheetData.actor;
        console.log(sheetData);
        sheetData.dtypes = ["String", "Number", "Boolean"];
        sheetData.name = actorData.name;
        sheetData.stunts = actorData.items.filter(i => i.type === "stunt");
        sheetData.talent = actorData.items.filter(i => i.type === "talent");
        sheetData.items = actorData.items.filter(i => i.type === "items");
        sheetData.weapon = actorData.items.filter(i => i.type === "weapon");
        sheetData.armor = actorData.items.filter(i => i.type === "armor");
        sheetData.shield = actorData.items.filter(i => i.type === "shield");
        sheetData.conditions = actorData.system.conditions;
        sheetData.level = actorData.system.attributes.level;
        sheetData.attributes = actorData.system.attributes;
        sheetData.abilities = actorData.system.abilities;
        sheetData.bio = actorData.system.bio;
        //temp fix. new actors shouldnt need this
        sheetData.info = actorData.system.info;
        sheetData.img = actorData.system.img;
        sheetData.threat = actorData.system.threat;
        sheetData.notes = actorData.system.notes;
        sheetData.stunts = actorData.system.stunts;
        sheetData.talent1 = actorData.system.talent1;
        sheetData.talent2 = actorData.system.talent2;
        sheetData.equipment1 = actorData.system.equipment1;
        sheetData.equipment2 = actorData.system.equipment2;

        sheetData.items.sort((a, b) => {
            return a.name.localeCompare(b.name);
        });

        sheetData.enrichment = this._enrichBio();

        for (let [k, v] of Object.entries(sheetData.weapon)) {
            if (v.type === "weapon") {
                const weapon = duplicate(this.actor.getEmbeddedDocument("Item", v.id));
                let modifierStat = v.system.modifier
                let bonusDamage = 0; // get stat from actorData
                let useFocus = v.system.usefocus;
                let focusBonus = useFocus ? 2 : 0;
                let toHitMod = v.system.type;
                let modType = "";
                switch (modifierStat) {
                    case 'Dexterity':
                        bonusDamage = actorData.system.abilities.dexterity.rating;
                        break;
                    case 'Perception':
                        bonusDamage = actorData.system.abilities.perception.rating;
                        break;
                    case 'Strength':
                        bonusDamage = actorData.system.abilities.strength.rating;
                        break;
                    case 'Manual':
                        bonusDamage = weapon.system.manualDamage;
                        break;
                }
                if (bonusDamage !== 0) {
                    v.system.hasBonusDamage = true;
                } else {
                    v.system.hasBonusDamage = false;
                }

                v.system.bonusDamage = bonusDamage;

                switch (toHitMod) {
                    case "unarmed":
                    case "makeshift":
                    case "light_melee":
                    case "heavy_melee":
                        modType = "fighting";
                        v.system.attack = actorData.system.abilities.fighting.rating;
                        break;
                    case "pistol":
                    case "rifle":
                        modType = "accuracy";
                        v.system.attack = actorData.system.abilities.accuracy.rating;
                        break;
                    default:
                        modType = "fighting";
                        v.system.attack = actorData.system.abilities.fighting.rating;
                        break;
                }
                v.system.tohitabil = modType;
                v.system.attack += focusBonus;
                //v._id = v._id;
                this.actor.updateEmbeddedDocuments("Item", [v])
            }
        }
        return sheetData;
    }

    _enrichBio() {
        let enrichment = {};
        enrichment[`system.notes`] = TextEditor.enrichHTML(this.actor.system.notes, { async: false, relativeTo: this.actor });
        return expandObject(enrichment);
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

        html.find(".weapon-usefocus").click(e => {
            const data = super.getData()
            const items = data.items;
            let itemId = e.currentTarget.getAttribute("data-item-id");
            const weapon = duplicate(this.actor.getEmbeddedDocument("Item", itemId));
            for (let [k, v] of Object.entries(items)) {
                if (v.type === "weapon" && v._id === itemId) {
                    weapon.system.usefocus = !weapon.system.usefocus;
                }
            }
            this.actor.updateEmbeddedDocuments("Item", [weapon]);
        });

        html.find('.rollable').click(this._onRoll.bind(this));

        html.find('.npc-attack').click(this._onNPCAttack.bind(this));

        html.find('.npc-damage').click(this._onNPCDamage.bind(this));
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
        let itemToUse = items.filter(i => i.id === itemId);
        let itemUsed = itemToUse[0];
        let weaponToHitAbil = dataset.itemAbil;

        if (dataset.roll) {
            const diceData = diceRollType();
            let die1, die2, die3;
            let d2; let d1;
            let condMod;
            let condModName;
            let rollCard;
            let condModWarning;
            let resultsSum

            // need to conditionally set d2 d1. if game.module for dsn is true, use the dice data, if not use 6;
            if (game.modules.get("dice-so-nice") && game.modules.get("dice-so-nice").active) {
                d2 = diceData.nice[0];
                d1 = diceData.nice[1];
            } else {
                d2 = 6;
                d1 = 6;
            }

            let toHitRoll = new Roll(`2d${d2} + 1d${d1} + @abilities.${dataset.itemAbil}`).roll({ async: false });
            let useFocus = itemUsed.system.usefocus ? 2 : 0;
            let useFocusPlus = itemUsed.system.usefocusplus ? 1 : 0;
            let abilityMod = actorData.system.abilities[dataset.itemAbil].rating;
            [die1, die2] = toHitRoll.terms[0].results.map(i => i.result);
            [die3] = toHitRoll.terms[2].results.map(i => i.result);

            let label = useFocus ? `<b> Rolling ${weaponToHitAbil} to hit with focus </b>` : `Rolling to hit with ${weaponToHitAbil}`;

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

            resultsSum = die1 + die2 + die3 + useFocus + useFocusPlus + abilityMod;

            let chatStunts = "";
            if (die1 == die2 || die1 == die3 || die2 == die3) {
                chatStunts = `</br><b>${die3} Stunt Points have been generated!</b>`;
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
                        <b>Ability Test Results:</b> ${resultsSum} <br> <br>
                        ${chatStunts}
                    `
                    ChatMessage.create({
                        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
                        roll: toHitRoll,
                        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                        flavor: label,
                        content: rollCard
                    });
                })

            } else {
                rollCard = `
                <div style="display: flex; flex-direction: row; justify-content: space-around;">${dieImage}</div><br> 
                ${chatMod}
                ${chatFocus}
                <b>Ability Test Results:</b> ${resultsSum} <br> 
                ${chatStunts}`

                ChatMessage.create({
                    type: CONST.CHAT_MESSAGE_TYPES.ROLL,
                    roll: toHitRoll,
                    speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                    flavor: label,
                    content: rollCard
                });
            }

        }
    }

    _onNPCDamage(e) {
        e.preventDefault();
        const element = e.currentTarget;
        const dataset = element.dataset;
        const diceData = diceRollType();
        const data = super.getData()
        const actorData = data.actor;
        const items = actorData.items;
        let itemId = dataset.itemId;
        let itemToUse = items.filter(i => i.id === itemId);
        let itemUsed = itemToUse[0];
        let weaponMod = itemUsed.system.modifier; // Modifier for extra damage
        let damageD3 = (itemUsed.system.dieFaces === 3) ? true : false;

        let d2;
        // need to conditionally set d2 d1. if game.module for dsn is true, use the dice data, if not use 6;
        if (game.modules.get("dice-so-nice") && game.modules.get("dice-so-nice").active) {
            d2 = diceData.nice[0];
        } else {
            d2 = 6
        }

        let diceFormula = itemUsed.system.damage;
        let bonusDamage = itemUsed.system.bonusDamage;

        let damageOnHit;
        let diceImageArray = "";

        if (!e.shiftKey) {
            let damageRoll = new Roll(`${diceFormula}d${d2}`).roll({ async: false });
            let damageOutput = damageD3 ? Math.ceil(damageRoll.total/2) : damageRoll.total;
            let totalDamage = damageOutput + bonusDamage;



            let resultRoll = damageRoll.terms[0].results.map(i => i.result);       
            for (let i = 0; i < resultRoll.length; i++) {
                diceImageArray += `<img height="75px" width="75px" src="systems/expanse/ui/dice/${diceData.faction}/chat/${diceData.faction}-${resultRoll[i]}-${diceData.style}.png" /> `
            }

            let label = `<b>Attacking with ${itemUsed.name}</b>`;

            let chatDamage = `<b>Weapon Damage (D${itemUsed.system.dieFaces})</b>: ${damageOutput}</br>`;
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
                content: rollCard
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

                let chatDamage = `<b>Weapon Damage (D${itemUsed.system.dieFaces})</b>: ${cDmg}</br>`;
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
                    content: rollCard
                });
            })
        }

    }

    _onRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        const data = super.getData();
        const actorData = data.actor;
        let testData;

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
            // need to conditionally set d2 d1. if game.module for dsn is true, use the dice data, if not use 6;
            if (game.modules.get("dice-so-nice") && game.modules.get("dice-so-nice").active) {
                d2 = diceData.nice[0];
                d1 = diceData.nice[1];
            } else {
                d2 = 6;
                d1 = 6;
            }

            let roll = new Roll(`2d${d2} + 1d${d1} + @abilities.${dataset.label}.rating`, this.actor.system).roll({ async: false });
            let useFocus = roll.data.abilities[dataset.label].useFocus ? 2 : 0;
            let useFocusPlus = roll.data.abilities[dataset.label].useFocusPlus ? 1 : 0;
            let abilityMod = roll.data.abilities[dataset.label].rating;
            [die1, die2] = roll.terms[0].results.map(i => i.result);
            [die3] = roll.terms[2].results.map(i => i.result);

            /*if (roll.data.conditions.wounded.active === true) {
                condMod = -2;
                condModName = "wounded";
            } else if ((roll.data.conditions.injured.active === true) && (roll.data.conditions.wounded.active === false)) {
                condMod = -1;
                condModName = "injured";
            } else {
                condMod = 0;
            }*/

            let label = useFocus ? `<b> Rolling ${dataset.label} with focus </b>` : `Rolling ${dataset.label}`;

            /*if (condMod < 0) {
                condModWarning = `<i>You are <b>${condModName}</b> and receive a ${condMod} modifier to your roll</i> <br>`;
            } else {
                condModWarning = ``;
            }*/

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

            resultsSum = die1 + die2 + die3 + useFocus + useFocusPlus + abilityMod;

            // Stunt Points Generation
            let chatStunts = "";
            if (die1 == die2 || die1 == die3 || die2 == die3) {
                chatStunts = `<b>${die3} Stunt Points have been generated!</b>`;
                /*let spData = actorData.system.attributes.stuntpoints;
                spData.modified = die3;
                spData.thisround = true;
                this.actor.update({ data: { attributes: data.actor.system.attributes } });*/
            }

            if (event.shiftKey) {
                RollModifier().then(r => {
                    testData = r;

                    resultsSum += testData;
                    let chatAddMod = `<b>Additional Modifier</b>: ${testData}</br>`
                    rollCard = `
                        <div style="display: flex; flex-direction: row; justify-content: space-around;">${dieImage}</div><br> 
                        ${chatMod}
                        ${chatAddMod}
                        ${chatFocus}
                        <b>Ability Test Results:</b> ${resultsSum} <br> 
                        ${chatStunts}
                    `
                    ChatMessage.create({
                        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
                        roll: roll,
                        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                        flavor: label,
                        content: rollCard
                    });
                })

            } else {
                rollCard = `
                <div style="display: flex; flex-direction: row; justify-content: space-around;">${dieImage}</div><br> 
                ${chatMod}
                ${chatFocus}
                <b>Ability Test Results:</b> ${resultsSum} <br> 
                ${chatStunts}`

                ChatMessage.create({
                    type: CONST.CHAT_MESSAGE_TYPES.ROLL,
                    roll: roll,
                    speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                    flavor: label,
                    content: rollCard
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
                    }
                }).render(true);
            });
        })
        return tn;
    }

    AttackDamage() {

    }

}
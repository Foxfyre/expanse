import { diceRollType } from "./rolling/dice-rolling.js";
import { RollModifier, RollDamageModifier } from "./rolling/modifiers.js";
import { migrateFocus } from "./focusMigration.js";

export class ExpanseActorSheet extends foundry.appv1.sheets.ActorSheet {

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["sheet", "actor", "talents"],
            width: 730,
            height: 750,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "abilities" }],
            dragDrop: [
                { dragSelector: ".item-list .item", dropSelector: null }
            ]
        });
    }

    // Picks between available/listed templates
    get template() {
        let type = this.actor.type;
        return `systems/expanse/templates/sheet/${type}-sheet.html`;
    }

    get actorData() {
        return this.actor.system;
    }

    get actorProperties() {
        return this.actorData.system;
    }

    async getData() {
        const sheetData = super.getData();

        sheetData.system = sheetData.data.system;

        /* LOOK AT PROCESSING THE FOCUS STUFF HERE FIRST OR MAYBE IN SHEETdDATA.SYSTEMS*/
        migrateFocus(this.actor);
        const actorData = sheetData.actor;

        sheetData.dtypes = ["String", "Number", "Boolean"];
        sheetData.name = actorData.name;
        sheetData.stunts = actorData.items.filter(i => i.type === "stunt");
        sheetData.talent = actorData.items.filter(i => i.type === "talent");
        sheetData.items = actorData.items.filter(i => i.type === "items");
        sheetData.weapon = actorData.items.filter(i => i.type === "weapon");
        sheetData.armor = actorData.items.filter(i => i.type === "armor");
        sheetData.shield = actorData.items.filter(i => i.type === "shield");
        sheetData.focuses = actorData.items.filter(i => i.type === "focus");
        sheetData.conditions = actorData.system.conditions;
        sheetData.level = actorData.system.attributes.level;
        sheetData.attributes = actorData.system.attributes;
        sheetData.abilities = actorData.system.abilities;
        sheetData.bio = actorData.system.bio;
        //temp fix. new actors shouldnt need this
        sheetData.info = actorData.system.info;
        sheetData.img = actorData.system.img;
        sheetData.items.sort((a, b) => {
            return a.name.localeCompare(b.name);
        });

        for (let [f, v] of Object.entries(sheetData.focuses)) {
            const focus = foundry.utils.duplicate(this.actor.getEmbeddedDocument("Item", v.id));
            focus.system.name = v.name;
            this.actor.updateEmbeddedDocuments("Item", [focus])
        }

        for (let [k, v] of Object.entries(sheetData.weapon)) {
            if (v.type === "weapon") {
                const weapon = foundry.utils.duplicate(this.actor.getEmbeddedDocument("Item", v.id));
                let modifierStat = weapon.system.modifier
                let bonusDamage = 0; // get stat from actorData
                let useFocus = weapon.system.usefocus;
                let useFocusPlus = weapon.system.usefocusplus;
                let focusBonus = useFocus ? 2 : 0;
                let focusPlusBonus = useFocusPlus ? 1 : 0;
                const totalFocusBonus = focusBonus + focusPlusBonus;
                let toHitMod = weapon.system.type;
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
                }

                if (bonusDamage !== 0) {
                    weapon.system.hasBonusDamage = true;
                } else {
                    weapon.system.hasBonusDamage = false;
                }

                weapon.system.bonusDamage = bonusDamage;

                switch (toHitMod) {
                    case "unarmed":
                    case "makeshift":
                    case "light_melee":
                    case "heavy_melee":
                        modType = "fighting";
                        weapon.system.attack = actorData.system.abilities.fighting.rating;
                        break;
                    case "pistol":
                    case "rifle":
                        modType = "accuracy";
                        weapon.system.attack = actorData.system.abilities.accuracy.rating;
                        break;
                    default:
                        modType = "fighting";
                        weapon.system.attack = actorData.system.abilities.fighting.rating;
                        break;
                }
                weapon.system.tohitabil = modType;
                weapon.system.attack += totalFocusBonus;
                this.actor.updateEmbeddedDocuments("Item", [weapon])
            }
        }

        sheetData.enrichment = await this._enrichBio();

        // Go through the Degrees of Talents and record the highest talent to display on the character sheet.
        for (let [k, v] of Object.entries(sheetData.talent)) {
            const talent = foundry.utils.duplicate(this.actor.getEmbeddedDocument("Item", v.id));
            let highest = "";
            for (let [s, t] of Object.entries(v.system.ranks)) {
                if (t.label === "novice" && t.active === true) {
                    highest = "Novice";
                } else if (t.label === "expert" && t.active === true) {
                    highest = "Expert";
                } else if (t.label === "master" && t.active === true) {
                    highest = "Master";
                }
            }
            talent.system.highest = highest;
            this.actor.updateEmbeddedDocuments("Item", [talent]);
        }

        // Handle external overrides of attributes and conditions.
        let overrides = null;
        if (typeof this?.object?.overrides?.system !== 'undefined') {
            overrides = this.object.overrides.system;
            
            // defense
            if (typeof overrides?.attributes?.defense?.modified !== 'undefined') {
                sheetData.attributes.defense.modified = Number(overrides.attributes.defense.modified);
            }

            // injured
            if (typeof overrides?.conditions?.injured?.active !== 'undefined') {
                if (overrides.conditions.injured.active) {                   
                    sheetData.conditions.fatigued.active = true;
                    sheetData.attributes.run.modified = 0;
                }
            }
            // hindered
            if (typeof overrides?.conditions?.hindered?.active !== 'undefined') {
                if (overrides.conditions.hindered.active) {                   
                    sheetData.attributes.move.modified = sheetData.attributes.move.modified / 2;
                    sheetData.attributes.run.modified = 0;
                }
            }
            // exhausted
            if (typeof overrides?.conditions?.exhausted?.active !== 'undefined') {
                if (overrides.conditions.exhausted.active) {                   
                    sheetData.attributes.run.modified = 0;
                }
            }
            // prone
            if (typeof overrides?.conditions?.prone?.active !== 'undefined') {
                if (overrides.conditions.prone.active) {                   
                    sheetData.attributes.run.modified = 0;
                }
            }
            // fatigued
            if (typeof overrides?.conditions?.fatigued?.active !== 'undefined') {
                if (overrides.conditions.fatigued.active) {                   
                    sheetData.attributes.run.modified = 0;
                }
            }
            // helpless
            if (typeof overrides?.conditions?.helpless?.active !== 'undefined') {
                if (overrides.conditions.helpless.active) {                   
                    sheetData.attributes.run.modified = 0;
                    sheetData.attributes.move.modified = 0;
                }
            }  
            // restrained
            if (typeof overrides?.conditions?.restrained?.active !== 'undefined') {
                if (overrides.conditions.restrained.active) {                   
                    sheetData.attributes.run.modified = 0;
                    sheetData.attributes.move.modified = 0;
                }
            }
            // unconscious
            if (typeof overrides?.conditions?.unconscious?.active !== 'undefined') {
                if (overrides.conditions.unconscious.active) {                   
                    sheetData.conditions.prone.active = true;
                    sheetData.attributes.move.modified = 0;
                    sheetData.attributes.run.modified = 0;
                }
            }                                   
        }
        return sheetData;
    }

    async _enrichBio() {
        let enrichment = {};
        enrichment[`system.bio.notes`] = await foundry.applications.ux.TextEditor.enrichHTML(this.actor.system.bio.notes, { relativeTo: this.actor });
        enrichment[`system.bio.appearance`] = await foundry.applications.ux.TextEditor.enrichHTML(this.actor.system.bio.appearance, { relativeTo: this.actor });
        enrichment[`system.bio.relationships`] = await foundry.applications.ux.TextEditor.enrichHTML(this.actor.system.bio.relationships, { relativeTo: this.actor });
        enrichment[`system.bio.goals`] = await foundry.applications.ux.TextEditor.enrichHTML(this.actor.system.bio.goals, { relativeTo: this.actor });
        return foundry.utils.expandObject(enrichment);
    }

    activateListeners(html) {
        super.activateListeners(html);
        let tabs = html.find('tabs');
        let initial = this._sheetTab;
        new foundry.applications.ux.Tabs(tabs, {
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

        html.find(".item-create").click(this._itemCreate.bind(this));

        html.find(".active-condition").click(async e => {
            const data = super.getData()
            const actorData = data.actor;
            let conditionName = e.currentTarget.getAttribute("name");
            const conditionData = actorData.system.conditions;

            for (let [k, v] of Object.entries(conditionData)) {
                if (k === conditionName) {
                    actorData.system.conditions[conditionName].active = !v.active;
                }
            }
            await this.actor.update({ system: { conditions: this.actor.system.conditions } });
        })

        html.find(".shield-equip").click(async e => {
            const items = this.actor.items;

            let itemId = e.currentTarget.getAttribute("data-item-id");
            const shield = foundry.utils.duplicate(this.actor.getEmbeddedDocument("Item", itemId));
            items.map(x => {
                if ((x.type === "shield")) {
                    if (x.id === itemId) {
                        let isEquipped = x.system.equip;
                        isEquipped = !isEquipped;
                        shield.system.equip = isEquipped;
                        this.actor.updateEmbeddedDocuments("Item", [shield])
                        return;
                    } else if (x.system.equip === true && x._id !== itemId) {
                        Dialog.prompt({
                            title: "Cannot Equip",
                            content: "<p>You can only have one shield equipped at one time. Please remove your current shield before continuing",
                            label: "OK",
                            callback: () => {
                                console.log("denied!")
                                shield.system.equip = false;
                                this.actor.updateEmbeddedDocuments("Item", [shield]);
                                return;
                            }
                        });
                    }
                }
            })
        })

        // Limit armor able to be equipped to 1
        html.find(".armor-equip").click(async e => {
            const items = this.actor.items;

            let itemId = e.currentTarget.getAttribute("data-item-id");
            const armor = foundry.utils.duplicate(this.actor.getEmbeddedDocument("Item", itemId));
            items.map(x => {
                if ((x.type === "armor")) {
                    if (x.id === itemId) {
                        let isEquipped = x.system.equip;
                        isEquipped = !isEquipped;
                        armor.system.equip = isEquipped;
                        this.actor.updateEmbeddedDocuments("Item", [armor])
                        return;
                    } else if (x.system.equip === true && x._id !== itemId) {
                        Dialog.prompt({
                            title: "Cannot Equip",
                            content: "<p>You can only have one piece of armour equipped at one time. Please remove your current armor before continuing",
                            label: "OK",
                            callback: () => {
                                console.log("denied!")
                                armor.system.equip = false;
                                this.actor.updateEmbeddedDocuments("Item", [armor]);
                                return;
                            }
                        });
                    }
                }
            })
        });

        html.find(".weapon-usefocus").click(e => {
            const data = super.getData()
            const items = data.items;
            let itemId = e.currentTarget.getAttribute("data-item-id");
            const weapon = foundry.utils.duplicate(this.actor.getEmbeddedDocument("Item", itemId));
            for (let [k, v] of Object.entries(items)) {
                if (v.type === "weapon" && v._id === itemId) {
                    weapon.system.usefocus = !weapon.system.usefocus;
                }
            }
            this.actor.updateEmbeddedDocuments("Item", [weapon]);
        });

        html.find(".weapon-usefocusplus").click(e => {
            const data = super.getData()
            const items = data.items;
            let itemId = e.currentTarget.getAttribute("data-item-id");
            const weapon = foundry.utils.duplicate(this.actor.getEmbeddedDocument("Item", itemId));

            for (let [k, v] of Object.entries(items)) {
                if (v.type === "weapon" && v._id === itemId) {
                    weapon.system.usefocusplus = !weapon.system.usefocusplus;
                }
            }
            this.actor.updateEmbeddedDocuments("Item", [weapon]);
        });



        html.find(".weapon-extradamage").click(e => {
            const data = super.getData()
            const items = data.items;
            const actorData = data.actor;
            let itemId = e.currentTarget.getAttribute("data-item-id");
            const weapon = foundry.utils.duplicate(this.actor.getEmbeddedDocument("Item", itemId));

            for (let [k, v] of Object.entries(items)) {
                if (v.type === "weapon" && v._id === itemId && actorData.system.attributes.stuntpoints.modified >= 2) {
                    weapon.system.extraDamage = !weapon.system.extraDamage;
                }
            }
            this.actor.updateEmbeddedDocuments("Item", [weapon]);
        });

        html.find('.rollable').click(this._onRoll.bind(this));

        html.find('.pc-attack').click(this._onAttack.bind(this));

        html.find('.pc-damage').click(this._onDamage.bind(this));

        html.find('.income-roll').click(this._IncomeRoll.bind(this));

    }

    
    _itemCreate(event) {
        event.preventDefault();
        const header = event.currentTarget;
        const type = header.dataset.type;
        const itemData = {
            name: game.i18n.localize(`TYPES.Item.${type}`),
            type: type,
            data: foundry.utils.deepClone(header.dataset)
        };
        delete itemData.data.type;
        return this.actor.createEmbeddedDocuments("Item", [itemData], { renderSheet: true });
    }

    async _onAttack(event) {
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

        // pull this out into a function
        if (actorData.system.attributes.stuntpoints.thisround === true) {
            let spData = actorData.system.attributes.stuntpoints;
            spData.modified = 0;
            spData.thisround = false;
            this.actor.update({ data: { attributes: data.actor.system.attributes } });
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

            let toHitRoll = new Roll(`2d${d2} + 1d${d1} + @abilities.${dataset.itemAbil}`);
            await toHitRoll.evaluate();
            let useFocus = itemUsed.system.usefocus ? 2 : 0;
            if (itemUsed.system.usefocus === true && itemUsed.system.usefocusplus === true) {
                useFocusPlus = 1
            }
            let abilityMod = actorData.system.abilities[dataset.itemAbil].rating;
            [die1, die2] = toHitRoll.terms[0].results.map(i => i.result);
            [die3] = toHitRoll.terms[2].results.map(i => i.result);

            if (actorData.system.conditions.wounded.active === true) {
                condMod = -2;
                condModName = "wounded";
            } else if ((actorData.system.conditions.injured.active === true) && (actorData.system.conditions.wounded.active === false)) {
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

            let unmodRoll = `<b>Unmodified Roll</b>: ${die1 + die2 + die3}</br>`;
            let chatMod = `<b>Ability Rating</b>: ${abilityMod}</br>`;

            resultsSum = die1 + die2 + die3 + useFocus + useFocusPlus + abilityMod + condMod;

            let chatStunts = "";
            if (die1 == die2 || die1 == die3 || die2 == die3) {
                chatStunts = `<b>${die3} Stunt Points have been generated!</b>`;
                let spData = actorData.system.attributes.stuntpoints;
                spData.modified = die3;
                spData.thisround = true;
                this.actor.update({ data: { attributes: data.actor.system.attributes } });
            }

            if (event.shiftKey) {
                RollModifier().then(r => {
                    let testData = r;

                    resultsSum += testData;
                    let chatAddMod = `<b>Additional Modifier</b>: ${testData}</br>`
                    rollCard = `
                        <div class="chat-dice-box">${dieImage}</div><br>
                        ${unmodRoll}
                        ${chatMod}
                        ${chatAddMod}
                        ${chatFocus}
                        ${condModWarning}
                        <b>Ability Test Results:</b> ${resultsSum} <br> <br>
                        ${chatStunts}
                    `;

                    ChatMessage.create({
                        rolls: [toHitRoll],
                        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                        flavor: label,
                        content: rollCard,
                        sound: CONFIG.sounds.dice
                    });
                })

            } else {
                rollCard = `
                <div class="chat-dice-box">${dieImage}</div><br>
                ${unmodRoll}
                ${chatMod}
                ${chatFocus}
                ${condModWarning}
                <b>Ability Test Results:</b> ${resultsSum} <br>
                ${chatStunts}`;

                ChatMessage.create({
                    rolls: [toHitRoll],
                    speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                    flavor: label,
                    content: rollCard,
                    sound: CONFIG.sounds.dice
                });
            }

        }
    }

    async _onDamage(e) {
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
            let damageRoll = new Roll(`${diceFormula}d${d2}`);
            await damageRoll.evaluate();

            let damageOutput = damageD3 ? Math.ceil(damageRoll.total / 2) : damageRoll.total;
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

            let rollCard = `<div class="chat-dice-box">${diceImageArray}</div></br>
                ${chatDamage}
                ${chatBonusDamage}
                ${chatDamageTotal}
            `

            ChatMessage.create({
                rolls: [damageRoll],
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: label,
                content: rollCard,
                sound: CONFIG.sounds.dice
            });

        } else {
            RollDamageModifier().then(r => {
                let testData = r;
                diceFormula += testData[0];
                let extraDamage = testData[1];
                let damageRoll = new Roll(`${diceFormula}d${d2}`);
                damageRoll.evaluate().then(r =>{
                    const reducer = (previousValue, currentValue) => previousValue + currentValue;
                    let damageOutput = damageD3 ? r.terms[0].results.map(i => Math.ceil(i.result / 2)) : r.terms[0].results.map(i => (i.result));
                    let cDmg = damageOutput.reduce(reducer);
                    let totalDamage = cDmg + bonusDamage + extraDamage;
                    let resultRoll = r.terms[0].results.map(i => i.result);
                    for (let i = 0; i < resultRoll.length; i++) {
                        diceImageArray += `<img height="75px" width="75px" style="margin-top: 5px;" src="systems/expanse/ui/dice/${diceData.faction}/chat/${diceData.faction}-${resultRoll[i]}-${diceData.style}.png" /> `
                    }

                    let label = `<b>Attacking with ${itemUsed.name}</b></br>`;

                    let chatDamage = `<b>Weapon Damage (D${itemUsed.system.dieFaces})</b>: ${cDmg}</br>`;
                    let chatBonusDamage = `<b>Damage Modifier (${weaponMod})</b>: ${bonusDamage}</br>`
                    let chatExtraDamage = `<b>Extra Damage</b>: ${extraDamage}</br>`
                    let chatDamageTotal = `You do <b>${totalDamage}</b> points of damage.</br></br>
                        Subtract the enemies Toughness and Armor for total damage received`;

                    let rollCard = `<div class="chat-dice-box">${diceImageArray}</div></br>
                        ${chatDamage}
                        ${chatBonusDamage}
                        ${chatExtraDamage}
                        ${chatDamageTotal}
                `

                    ChatMessage.create({
                        rolls: [r],
                        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                        flavor: label,
                        content: rollCard,
                        sound: CONFIG.sounds.dice
                    });

                });
            });
                                          
        }

    }

    async _IncomeRoll(e) {
        e.preventDefault();
        const element = e.currentTarget;
        const dataset = element.dataset;
        const data = super.getData()
        let income = data.actor.system.info.income;
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

        let incomeRoll = new Roll(`3d${d2}`);
        await incomeRoll.evaluate();

        let incomeResult = Number(incomeRoll.total + income);

        let resultRoll = incomeRoll.terms[0].results.map(i => i.result);
        for (let i = 0; i < resultRoll.length; i++) {
            diceImageArray += `<img height="75px" width="75px" src="systems/expanse/ui/dice/${diceData.faction}/chat/${diceData.faction}-${resultRoll[i]}-${diceData.style}.png" /> `
        }

        let rollCard;

        const chatDice = `<div class="chat-dice-box">${diceImageArray}</div></br>`
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
                        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                        flavor: label,
                        rolls: [incomeRoll],
                        content: rollCard,
                        sound: CONFIG.sounds.dice
                    });
                } else if (incomeResult >= ic && ic !== "") { // Successful result
                    if (ic >= (income + 10)) { // Depletion - Set automation to automatically deplete
                        rollCard = `${chatDice}${chatCost}${chatIncome}${chatResult}${incomeDeplete}`
                        ChatMessage.create({
                            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                            flavor: label,
                            rolls: [incomeRoll],
                            content: rollCard,
                            sound: CONFIG.sounds.dice
                        });
                    } else {
                        rollCard = `${chatDice}${chatCost}${chatIncome}${chatResult}${incomeSuccess}`
                        ChatMessage.create({
                            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                            flavor: label,
                            rolls: [incomeRoll],
                            content: rollCard,
                            sound: CONFIG.sounds.dice
                        });
                    }
                } else if (incomeResult < ic && ic !== "") { // Failed Result
                    rollCard = `${chatDice}${chatCost}${chatIncome}${chatResult}${incomeFail}`
                    ChatMessage.create({
                        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                        flavor: label,
                        rolls: [incomeRoll],
                        content: rollCard,
                        sound: CONFIG.sounds.dice
                    });
                } else if (ic === "") {
                    rollCard = `${chatDice}${chatCost}${chatIncome}${chatResult}`
                    ChatMessage.create({
                        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                        flavor: label,
                        rolls: [incomeRoll],
                        content: diceRollDialogue,
                        sound: CONFIG.sounds.dice
                    });
                }
            });
        } else {
            rollCard = `${chatDice}${chatIncome}${chatResult}`
            ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: label,
                rolls: [incomeRoll],
                content: rollCard,
                sound: CONFIG.sounds.dice
            });
        }
    }

    async _onRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        const data = super.getData();
        const actorData = data.actor;
        let testData;
        // pull this out into a function
        if (actorData.system.attributes.stuntpoints.thisround === true) {
            let spData = actorData.system.attributes.stuntpoints;
            spData.modified = 0;
            spData.thisround = false;
            this.actor.update({ data: { attributes: data.actor.system.attributes } });
        }
        // This is the start of a refactoring test. If things go bad, undo to here.

        if (dataset.roll) {
            const diceData = diceRollType();
            let die1 = 0; let die2 = 0; let die3 = 0;
            let d2; let d1;
            let condMod;
            let condModName;
            let armorPenaltyWarning
            let rollCard;
            let armorPenalty = 0;
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

            let roll = new Roll(`2d${d2} + 1d${d1} + @abilities.${dataset.label}.rating`, this.actor.system);
            await roll.evaluate();

            let useFocus = roll.data.abilities[dataset.label].useFocus ? 2 : 0;
            if (roll.data.abilities[dataset.label].usefocus === true && roll.data.abilities[dataset.label].usefocusplus === true) {
                useFocusPlus = 1
            }
            if (dataset.label === 'dexterity' && roll.data.abilities[dataset.label].usePenalty === true) {
                armorPenalty = roll.data.attributes.penalty.modified
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

            if (armorPenalty > 0) {
                armorPenaltyWarning = `<i>Your armor is restrictive, you receive a -${armorPenalty} modifier to your roll</i> <br>`;
            } else {
                armorPenaltyWarning = ``;
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

            let unmodRoll = `<b>Unmodified Roll</b>: ${die1 + die2 + die3}</br>`;

            let chatMod = `<b>Ability Rating</b>: ${abilityMod}</br>`;

            resultsSum = die1 + die2 + die3 + useFocus + useFocusPlus + abilityMod + condMod - armorPenalty;

            // Stunt Points Generation
            let chatStunts = "";
            if (die1 == die2 || die1 == die3 || die2 == die3) {
                chatStunts = `<b>${die3} Stunt Points have been generated!</b>`;
                let spData = actorData.system.attributes.stuntpoints;
                spData.modified = die3;
                spData.thisround = true;
                this.actor.update({ data: { attributes: data.actor.system.attributes } });
            }

            if (event.shiftKey) {
                RollModifier().then(r => {
                    testData = r;

                    resultsSum += testData;
                    let chatAddMod = `<b>Additional Modifier</b>: ${testData}</br>`
                    rollCard = `
                        <div class="chat-dice-box">${dieImage}</div><br>
                        ${unmodRoll}
                        ${chatMod}
                        ${chatAddMod}
                        ${chatFocus}
                        ${condModWarning}
                        ${armorPenaltyWarning}
                        <b>Ability Test Results:</b> ${resultsSum} <br>
                        ${chatStunts}
                    `
                    ChatMessage.create({
                        rolls: [roll],
                        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                        flavor: label,
                        content: rollCard,
                        sound: CONFIG.sounds.dice
                    });
                })

            } else {
                rollCard = `
                <div class="chat-dice-box">${dieImage}</div><br>
                ${unmodRoll}
                ${chatMod}
                ${chatFocus}
                ${condModWarning}
                ${armorPenaltyWarning}
                <b>Ability Test Results:</b> ${resultsSum} <br>
                ${chatStunts}`

                ChatMessage.create({
                    rolls: [roll],
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

}

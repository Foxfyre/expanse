import { diceRollType } from "./rolling/dice-rolling.js";
import { RollModifier} from "./rolling/modifiers.js";
import { migrateShipData } from "./shipDataMigration.js";

Hooks.on('ready', () => {
    $(document).on('click', '.collateralDamageButton', async function (event) {
        const diceData = diceRollType();
        const dataset = event.currentTarget.dataset;
        const actor = game.actors.get(dataset.actorId);
        let roll = dataset.roll;        
        let text = "";
        let dieImage = "";
        let damage = 0;
        // dice-so-nice
        if (game.modules.get("dice-so-nice") && game.modules.get("dice-so-nice").active) {
            const dsnFormat = "d"+diceData.nice[0];
            roll = roll.replace("d6",dsnFormat);
        }

        let collateralRoll = new Roll(roll);
        await collateralRoll.evaluate();
        let dies = collateralRoll.terms[0].results.map(i => i.result);

        for (let i = 0; i < dies.length; i++) {
            dieImage += `<img height="75px" width="75px" src="systems/expanse/ui/dice/${diceData.faction}/chat/${diceData.faction}-${dies[i]}-${diceData.style}.png" />`;
            damage += dies[i];
        }
        text += `<div class="chat-dice-box">${dieImage}</div>`;

        for (let i = 0; i<dies.length; i++) {
            text += "</br><b>"+game.i18n.localize("EXPANSE.Losses.ApplyCollateralDamage")+": "+dies[i]+"</b>";
        }
        ChatMessage.create({
            rolls: [collateralRoll],
            speaker: ChatMessage.getSpeaker({ actor: actor }),
            flavor: game.i18n.localize("EXPANSE.Losses.CollateralDamageRoll"),
            content: text,
            sound: CONFIG.sounds.dice
        }); 
        
    });
});

Hooks.on('diceSoNiceRollComplete', (messageId) => {
    
    const message = ChatMessage.get(messageId);    
    if (message.flags.commandTest || message.flags.engineerTest) {
        const actor = game.actors.get(message.speaker.actor);
        actor.update({ system: { combat:  actor.system.combat} });
    }
    if (message.flags.losses) {
        const actor = game.actors.get(message.speaker.actor);
        actor.update({ system: { losses:  actor.system.losses} });
        actor.update({ system: { seriouslosses:  actor.system.seriouslosses} });
    }
    
});

export class ExpanseShipSheet extends foundry.appv1.sheets.ActorSheet {

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
        migrateShipData(this.actor);

        sheetData.dtypes = ["String", "Number", "Boolean"];

        sheetData.system = sheetData.data.system;

        const actorData = sheetData.actor;

        sheetData.enrichment = await this._enrichBio();

        let conditions = {};
        for (const [key, loss] of Object.entries(actorData.system.losses)) {
            let tmp = {};
            for (let i = 0; i < 6;  i++) {
                if (loss.value > i) {
                    tmp[i] = {selected:"checked"};
                } else {
                    tmp[i] = {selected:""};
                }
            };
            conditions[key] = tmp;
        };        
        sheetData["conditions"] = conditions;
        
        return sheetData;
    }

    async _enrichBio() {
        let enrichment = {};
        enrichment[`system.notes`] = await foundry.applications.ux.TextEditor.enrichHTML(this.actor.system.notes, { relativeTo: this.actor });
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

        html.find('.crew-type-selector').change(this._onCrewTypeSelect.bind(this));

        html.find('.rollable').click(this._onRoll.bind(this));

        html.find('.crew-roll').click(this._onCrewRoll.bind(this));

        html.find('.defense-roll').click(this._onDefenseRoll.bind(this));

        html.find('.simple-loss').click(this._onRollSimpleLoss.bind(this));

        html.find('.serious-loss').click(this._onRollSimpleLoss.bind(this));

        html.find('.reset-loss').click(this._onResetLoss.bind(this));

        html.find('.npc-attack').click(this._onNPCAttack.bind(this));

        html.find('.losses-checkbox-group').click(this._onConditionChange.bind(this));
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

    async _onCrewTypeSelect(event){
        const data = super.getData();
        const role = event.currentTarget.value;
        const crewName = event.currentTarget.dataset.crew
        const crewData = data.actor.system.crew;

        const ability = {
            "captain" : `${game.i18n.localize("EXPANSE.Communication")} (${game.i18n.localize("EXPANSE.Leadership")})`,
            "pilot" : `${game.i18n.localize("EXPANSE.Dexterity")} (${game.i18n.localize("EXPANSE.Piloting")})`,
            "sensors" : `${game.i18n.localize("EXPANSE.Intelligence")} (${game.i18n.localize("EXPANSE.Technology")})`,
            "gunnary" : `${game.i18n.localize("EXPANSE.Accuracy")} (${game.i18n.localize("EXPANSE.Gunnery")})`,
            "engineer" : `${game.i18n.localize("EXPANSE.Intelligence")} (${game.i18n.localize("EXPANSE.Engineering")})`,
            "other" : ""
        }   
        
        const buttonTitle = {
            "captain" : game.i18n.localize("EXPANSE.CrewCommandTest"),
            "pilot" : game.i18n.localize("EXPANSE.CrewPilotTest"),
            "sensors" : game.i18n.localize("EXPANSE.CrewElectronicWarfareTest"),
            "gunnary" : game.i18n.localize("EXPANSE.CrewGunnaryTest"),
            "engineer" : game.i18n.localize("EXPANSE.CrewDamageControlTest"),
            "other" : ""
        } 

        crewData[crewName].stat = ability[role];
        crewData[crewName].buttonTitle = buttonTitle[role];
        this.actor.update({ system: { crew: crewData} });
    }

    async _onConditionChange(event) {
        const data = super.getData();
        const losses = data.actor.system.losses;
        let type = event.currentTarget.attributes.name.value;
        let conditions = event.currentTarget.children;

        let counter = 0;
        for (const [k, v] of Object.entries(conditions)) {
            counter += Number(v.checked);
        }
        losses[type].value = counter;
        this.actor.update({ system: { losses: losses } });
    }

    async _onResetLoss(event){
        event.preventDefault();
        const data = super.getData();
        const losses = data.actor.system.losses;
        const seriousLosses = data.actor.system.seriouslosses;

        for (const [key, loss] of Object.entries(losses)) {
            loss.value = 0;
        }

        for (const [key, loss] of Object.entries(seriousLosses)) {
            loss.value = false;
        }

        this.actor.update({ system: { losses: losses, seriouslosses: seriousLosses } });

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            flavor: game.i18n.localize("EXPANSE.Losses.Reset"),
            content: "<b>"+game.i18n.localize("EXPANSE.Losses.ResetMessage")+"</b>"
        }); 

    }

    async _onRollSimpleLoss(event) {
        
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        const data = super.getData();
        const seriousFlag = (dataset.label == "serious-loss");
        let losses;
        if (seriousFlag) {
            losses = data.actor.system.seriouslosses;
        } else {
            losses = data.actor.system.losses;
        }
        let lossesKeys = [];
        let totalLosses = 0;
        let maxLosses = 0;
        let rollCard = "";
        let collateralDamageCount = 0;
        
        for (const [key, loss] of Object.entries(losses)) {
            lossesKeys.push(key);
            totalLosses += parseInt(Number(loss.value));
            if (!seriousFlag) {maxLosses += loss.max};     
        }
        
        if (dataset.roll) {
            const diceData = diceRollType();
            let conditionsCount = 0;
            let flavor = "";
            let flags = {};
            let conditionsText = "";
            let reductionText = "";
            let reductionRoll;
            let dns = false;
            //Single loss, two conditions.
            if (dataset.roll == "1d6") {
                flavor = "<b>"+game.i18n.localize("EXPANSE.Losses.SingleLoss")+"</b>";
                conditionsText = "<b>"+game.i18n.localize("EXPANSE.Losses.CannotSingle")+"</b>";
            }
            if (dataset.roll == "1d6" && totalLosses<=(maxLosses-2)) {
                conditionsCount = 2;
                conditionsText = "<b>"+game.i18n.localize("EXPANSE.Losses.SingleApplied")+"</b></br>";
            }

            //Double loss, four conditions.
            if (dataset.roll == "2d6"){
                flavor = "<b>"+game.i18n.localize("EXPANSE.Losses.DoubleLoss")+"</b>";
                conditionsText = "<b>"+game.i18n.localize("EXPANSE.Losses.CannotDouble")+"</b>";
            }
            if (dataset.roll == "2d6" && totalLosses<=(maxLosses-4)){
                conditionsCount = 4;
                conditionsText = "<b>"+game.i18n.localize("EXPANSE.Losses.DoubleApplied")+"</b></br>";
            }
            //Serious loss, one condition.
            if (seriousFlag){
                conditionsCount = 0;
                flavor = "<b>"+game.i18n.localize("EXPANSE.Losses.SeriousLoss")+"</b>";
                conditionsText = "<b>"+game.i18n.localize("EXPANSE.Losses.CannotSerious")+"</b>";
            }
            if (seriousFlag && totalLosses<2){
                conditionsCount = 1;
                conditionsText = "<b>"+game.i18n.localize("EXPANSE.Losses.SeriousApplied")+"</b></br>";
            }

            if (conditionsCount > 0) {
                //damage reduction roll
                let damage = 0;
                let roll = dataset.roll; 
                // dice-so-nice
                if (game.modules.get("dice-so-nice") && game.modules.get("dice-so-nice").active) {
                    const dsnFormat = "d"+diceData.nice[0];
                    roll = roll.replace("d6",dsnFormat);
                    dns = true;
                    flags["losses"] = true;
                }

                reductionRoll = new Roll(roll);
                await reductionRoll.evaluate();
                let dies = reductionRoll.terms[0].results.map(i => i.result);
                let dieImage = "";
                for (let i = 0; i < dies.length; i++) {
                    dieImage += `<img height="75px" width="75px" src="systems/expanse/ui/dice/${diceData.faction}/chat/${diceData.faction}-${dies[i]}-${diceData.style}.png" />`;
                    damage += dies[i];
                }
                reductionText += `<div class="chat-dice-box">${dieImage}</div>`;

                reductionText += "</br><b>"+game.i18n.localize("EXPANSE.Losses.DamageReduce")+damage+"</b>";

                if (!event.shiftKey) {
                    for (let i = 0; i < conditionsCount; i++) {
                        let conditionApplied = false;
                        while(conditionApplied == false) {
                            let conditionId = Math.floor(Math.random() * lossesKeys.length);
                            let value = losses[lossesKeys[conditionId]].value
                            if ( !seriousFlag && value < losses[lossesKeys[conditionId]].max) {
                                conditionApplied = true;
                                if (lossesKeys[conditionId] == "collateral") {
                                    collateralDamageCount++;
                                }
                                losses[lossesKeys[conditionId]].value +=  1;
                                if (!dns) {
                                    this.actor.update({ system: { losses: losses } });
                                }
                                conditionsText += (i+1) + `. ` + game.i18n.localize("EXPANSE.Losses."+lossesKeys[conditionId]) + `</br>`;
                            };
                            if ( seriousFlag && !value) {
                                conditionApplied = true;
                                losses[lossesKeys[conditionId]].value = true;
                                if (!dns) {
                                    this.actor.update({ system: { seriouslosses: losses } });
                                }
                                conditionsText += (i+1) + `. ` + game.i18n.localize("EXPANSE.Losses."+lossesKeys[conditionId]) + `</br>`;
                            };
                        }
                    }
                    rollCard = `
                        ${reductionText}
                        </br></br>
                        ${conditionsText}                            
                    `;

                    let button = '</br><div class="ship-losses-btn simple-loss collateralDamageButton" data-roll="'+collateralDamageCount+'d6" data-label="collateralDamage" data-actor-id="'+ data.actor.id + '">'+game.i18n.localize("EXPANSE.Losses.ApplyCollateralDamage")+'</div>';

                    if(collateralDamageCount > 0) {
                        rollCard += button;
                    }

                    ChatMessage.create({
                        rolls: [reductionRoll],
                        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                        flavor: flavor,
                        flags: flags,
                        content: rollCard,
                        sound: CONFIG.sounds.dice
                    }); 

                } else {
                    let conditions = {};
                    for (const [key, loss] of Object.entries(losses)) {
                        let tmp = {};
                        let iterator = seriousFlag ? 1 : loss.max;
                        for (let i = 0; i < iterator;  i++) {
                            if (loss.value > i) {
                                tmp[i] = {selected:"checked",active:"disabled"};
                            } else {
                                tmp[i] = {selected:"",active:""};
                            }
                        };
                        conditions[key] = tmp;
                    };

                    this.ManualLossConditions(conditions, conditionsCount).then(r => {    
                        let conditions = r[0].children;
                        let validate = 0;
                        let numerator = 1;
                        let tmp = JSON.parse(JSON.stringify(losses));
                        for (const [k, v] of Object.entries(tmp)) { 
                            let iterator = seriousFlag ? 1 : v.max;
                            for (let i = 1; i <= iterator;  i++) {
                                if (conditions[k].children[i].checked && !conditions[k].children[i].disabled) {
                                    v.value++;
                                    validate++;
                                    conditionsText += (numerator++) + `. ` + game.i18n.localize("EXPANSE.Losses."+k) + `</br>`;
                                    if (k == "collateral") {
                                        collateralDamageCount++;
                                    }
                                };
                            }; 
                        };
                        if (validate == conditionsCount) {
                            if (seriousFlag) {
                                if (!dns) {
                                    this.actor.update({ system: { losses: tmp } });
                                } else {
                                    for (let [k, v] of Object.entries(losses)) {
                                        v.value = tmp[k].value;
                                    }
                                }
                            } else {
                                if (!dns) {
                                    this.actor.update({ system: { losses: tmp } });
                                } else {
                                    for (const [k, v] of Object.entries(losses)) {
                                        v.value = tmp[k].value;
                                    }
                                }
                                
                            }
                            

                            rollCard = `
                            ${reductionText}
                            </br></br>
                            ${conditionsText}                         
                            `;

                            let button = '</br><div class="ship-losses-btn simple-loss collateralDamageButton" data-roll="'+collateralDamageCount+'d6" data-label="collateralDamage" data-actor-id="'+ data.actor.id + '">'+game.i18n.localize("EXPANSE.Losses.ApplyCollateralDamage")+'</div>';


                            if(collateralDamageCount > 0) {
                                rollCard += button;
                            }

                            ChatMessage.create({
                                rolls: [reductionRoll],
                                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                                flavor: flavor,
                                flags: flags,
                                content: rollCard,
                                sound: CONFIG.sounds.dice
                            }); 
                        } else {
                            rollCard = "<b>"+game.i18n.localize("EXPANSE.Losses.IncorrectNumber")+"</b>"

                            ChatMessage.create({
                                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                                flavor: flavor,
                                content: rollCard,
                            }); 
                        };
                    });
                }
            } else {
                ChatMessage.create({
                    speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                    flavor: flavor,
                    content: conditionsText,
                }); 
            }                    
        }
    }

    ManualLossConditions(conditions, conditionsCount) {
        let ic = new Promise((resolve) => {
            renderTemplate("/systems/expanse/templates/dialog/lossconditions.html", {conditions: conditions,count: conditionsCount}).then(dlg => {
                new Dialog({
                    title: game.i18n.localize("EXPANSE.LossConditions"+conditionsCount),
                    content: dlg,
                    buttons: {
                        confirm: {
                            label: game.i18n.localize("EXPANSE.Confirm"),
                            callback: html => {
                                resolve(html.find(`[name="fieldset"]`));
                            }
                        }
                    },
                    default: "Confirm"
                }).render(true);
            });
        })
        return ic;
    }

    async _onRoll (event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        const data = super.getData();
        const actorData = data.actor.system;
        const diceData = diceRollType();
        let rollData = dataset.roll;        
        let text = "";
        let flavor = "";
        let dieImage = "";
        let damage = 0;
        let loss = 0;

        const pattern = new RegExp("[0-9]+d6", "g");
        if(rollData.match(pattern)) {
        
            // dice-so-nice
            if (game.modules.get("dice-so-nice") && game.modules.get("dice-so-nice").active) {
                const dsnFormat = "d"+diceData.nice[0];
                rollData = rollData.replace("d6",dsnFormat);
            }

            let roll = new Roll(rollData);
            await roll.evaluate();
            let dies = roll.terms[0].results.map(i => i.result);

            for (let i = 0; i < dies.length; i++) {
                dieImage += `<img height="75px" width="75px" src="systems/expanse/ui/dice/${diceData.faction}/chat/${diceData.faction}-${dies[i]}-${diceData.style}.png" />`;
                damage += dies[i];
            }
            text += `<div class="chat-dice-box">${dieImage}</div>`;
            
            switch (dataset.label) {
                case "hull-roll":
                    flavor = `<b>${game.i18n.localize("EXPANSE.ShipHullRoll")}</b>`, 
                    loss = Number(actorData.losses.hull.value);
                    if (loss>0) {
                        text += `</br><b>${game.i18n.localize("EXPANSE.chatHullLoss")}:</b> -${loss}</br>`;
                    } else {
                        text += "</br>";
                    }
                    damage = (damage-loss >0) ? damage-loss : 0;
                    text += `${game.i18n.format("EXPANSE.HullScore",{damage:damage})}`;
                    break;
                case "weapon-roll":
                    let weapon = actorData[dataset.weapon].type;
                    flavor = `<b>${game.i18n.localize("EXPANSE.ShipDamageRoll")}${weapon}</b>`,
                    loss = Number(actorData.losses.weapons.value);
                    if (loss>0) {
                        text += `</br><b>${game.i18n.localize("EXPANSE.chatWeaponsLoss")}:</b> -${loss}</br>`;
                    } else {
                        text += "</br>";
                    }
                    damage = (damage-loss >0) ? damage-loss : 0;
                    text += `${game.i18n.format("EXPANSE.DealDamage",{damage:damage})}`;
                    break;
                default:
            }

            ChatMessage.create({
                rolls: [roll],
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: flavor,
                content: text,
                sound: CONFIG.sounds.dice
            });  
        } else {
            ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: game.i18n.localize("EXPANSE.Error"),
                content: `<b>${game.i18n.localize("EXPANSE.IncorrectRollDataValue")}<b>`
            }); 
        }
    }

    async _onCrewRoll(event) {
        
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        const data = super.getData();
        const actorData = data.actor;
        const crewData = actorData.system.crew[dataset.crew];
        let testData;

        if (dataset.roll) {
            const diceData = diceRollType();
            const combatData = data.actor.system.combat;
            let die1 = 0; let die2 = 0; let die3 = 0;
            let d2; let d1;
            let rollCard = "";
            let chatFocus = "";
            let chatStunts = "";
            let TN = 0;
            let SP = 0;
            let chatTN = "";
            let sensors = 0;
            let chatSensors = "";
            let loss = 0;
            let chatLoss = "";
            let condModWarning;
            let resultsSum;
            let flags = {};
            let dsn = false;
            // need to conditionally set d2 d1. if game.module for dsn is true, use the dice data, if not use 6;
            if (game.modules.get("dice-so-nice") && game.modules.get("dice-so-nice").active) {
                d2 = diceData.nice[0];
                d1 = diceData.nice[1];
                dsn = true;
            } else {
                d2 = 6;
                d1 = 6;
            }

            let roll = new Roll(`2d${d2} + 1d${d1}`);
            await roll.evaluate();

            let useFocus = crewData.focus ? 2 : 0;

            let abilityMod = crewData.modValue;
            [die1, die2] = roll.terms[0].results.map(i => i.result);
            [die3] = roll.terms[2].results.map(i => i.result);

            let label = "";
            switch (crewData.role) {
                case "captain":
                    label = game.i18n.localize("EXPANSE.CrewCommandTest");
                    TN=11;
                    SP=1;
                    break;
                case "pilot":
                    label = game.i18n.localize("EXPANSE.CrewPilotTest");
                    loss = Number(actorData.system.losses.maneuverability.value);
                    if (loss>0) {
                        chatLoss = `<b>${game.i18n.localize("EXPANSE.chatManeuverabilityLoss")}:</b> -${loss}</br>`;
                    }
                    break;
                case "sensors":
                    label = game.i18n.localize("EXPANSE.CrewElectronicWarfareTest");
                    TN=11;
                    sensors = Number(actorData.system.sensors);
                    chatSensors = `<b>${game.i18n.localize("EXPANSE.Sensors")}:</b> ${sensors}</br>`;
                    loss = Number(actorData.system.losses.sensors.value);
                    if (loss>0) {
                        chatLoss = `<b>${game.i18n.localize("EXPANSE.chatSensorsLoss")}:</b> -${loss}</br>`;
                    }
                    break;
                case "gunnary":
                    label = game.i18n.localize("EXPANSE.CrewGunnaryTest");
                    TN=15;
                    break;
                case "engineer":
                    label = game.i18n.localize("EXPANSE.CrewDamageControlTest");
                    TN=11; 
                    break;             
                default:
            }

            if (useFocus) {
                label += " "+game.i18n.localize("EXPANSE.WithFocus");
                chatFocus = `<b>${game.i18n.localize("EXPANSE.Focus")}:</b> ${useFocus}</br>`;
            }

            if (TN>0) {
                chatTN = `<b>${game.i18n.localize("EXPANSE.TargetNumber")}:</b> ${TN}</br></br>`;
            }

            const dieImage = `<img height="75px" width="75px" src="systems/expanse/ui/dice/${diceData.faction}/chat/${diceData.faction}-${die1}-${diceData.style}.png" />
            <img height="75px" width="75px" src="systems/expanse/ui/dice/${diceData.faction}/chat/${diceData.faction}-${die2}-${diceData.style}.png" />
            <img height="75px" width="75px" src="systems/expanse/ui/dice/${diceData.faction}/chat/${diceData.faction}-${die3}-${diceData.stunt}.png" />`

            let unmodRoll = `<b>${game.i18n.localize("EXPANSE.UnmodifiedRoll")}:</b> ${die1 + die2 + die3}</br>`;

            let ability =  TN ? `<b>${crewData.stat}</b></br>` : `<b>${crewData.stat}</b></br></br>` ;

            let chatMod = `<b>${game.i18n.localize("EXPANSE.AbilityRating")}:</b> ${abilityMod}</br>`;

            if (TN==0) {
                if (die1 == die2 || die1 == die3 || die2 == die3 ) {
                    SP += die3;
                    chatStunts = `<b>${game.i18n.format("EXPANSE.ChatStunts",{SP:SP})}</b>`;
                }
            }

            if (crewData.role == "gunnary"){
                sensors = die3-3; 
                chatSensors = `<b>${game.i18n.localize("EXPANSE.SensorsGunnery")}:</b> ${sensors}</br>`; 
            }

            resultsSum = die1 + die2 + die3 + abilityMod + useFocus + sensors - loss;

            if (event.shiftKey) {
                RollModifier().then(r => {
                    testData = r;

                    resultsSum += testData;

                    if (TN>0 && resultsSum >= TN) {
                        // Stunt Points Generation  
                        if (die1 == die2 || die1 == die3 || die2 == die3 || crewData.role == "captain") {
                            if (die1 == die2 || die1 == die3 || die2 == die3) {
                                SP += die3;
                            }
                            chatStunts = `<b>${game.i18n.format("EXPANSE.ChatStunts",{SP:SP})}</b>`;
                            if(crewData.role == "captain") {                        
                                combatData.commandPoints = SP;
                                flags["commandTest"] = 1;                      
                            }                    
                        }
                        if(crewData.role == "engineer") {                   
                            combatData.engineerPoints += die3;
                            flags["engineerTest"] = 1; 
                        }
                    }
        
                    if (TN>0 && resultsSum < TN) {
                        chatStunts = `<b class="test-failure">${game.i18n.localize("EXPANSE.TestFailure")}</b>`;
                    }

                    let chatAddMod = `<b>${game.i18n.localize("EXPANSE.AdditionalModifier")}:</b> ${testData}</br>`
                    rollCard = `
                        ${ability}
                        ${chatTN}
                        <div class="chat-dice-box">${dieImage}</div><br>
                        ${unmodRoll}
                        ${chatSensors}
                        ${chatLoss}
                        ${chatMod}
                        ${chatAddMod}
                        ${chatFocus}
                        <b>${game.i18n.localize("EXPANSE.AbilityTestResults")}:</b> ${resultsSum} <br>
                        ${chatStunts}
                    `
                    ChatMessage.create({
                        rolls: [roll],
                        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                        flavor: label,
                        content: rollCard,
                        flags: flags,
                        sound: CONFIG.sounds.dice
                    });

                    if (!dsn) {
                        this.actor.update({ system: { combat:  combatData} });
                    }
                })

            } else {
                
                if (TN>0 && resultsSum >= TN) {
                    // Stunt Points Generation  
                    if (die1 == die2 || die1 == die3 || die2 == die3 || crewData.role == "captain") {
                        if (die1 == die2 || die1 == die3 || die2 == die3) {
                            SP += die3;
                        }
                        chatStunts = `<b>${game.i18n.format("EXPANSE.ChatStunts",{SP:SP})}</b>`;
                        if(crewData.role == "captain") {                        
                            combatData.commandPoints = SP; 
                            flags["commandTest"] = 1;                       
                        }                    
                    }
                    if(crewData.role == "engineer") {                   
                        combatData.engineerPoints += die3;
                        flags["engineerTest"] = 1;  
                    }
                }
    
                if (TN>0 && resultsSum < TN) {
                    chatStunts = `<b class="test-failure">${game.i18n.localize("EXPANSE.TestFailure")}</b>`;
                    if(crewData.role == "captain") {                        
                        combatData.commandPoints = 0; 
                        flags["commandTest"] = 1;                       
                    } 
                }
                
                rollCard = `
                ${ability}
                ${chatTN}
                <div class="chat-dice-box">${dieImage}</div><br>
                ${unmodRoll}
                ${chatSensors}
                ${chatLoss}
                ${chatMod}
                ${chatFocus}
                <b>${game.i18n.localize("EXPANSE.AbilityTestResults")}:</b> ${resultsSum} <br>
                ${chatStunts}`

                ChatMessage.create({
                    rolls: [roll],
                    speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                    flavor: label,
                    content: rollCard,
                    flags: flags,
                    sound: CONFIG.sounds.dice
                });

                if (!dsn) {
                    this.actor.update({ system: { combat:  combatData} });
                }
            }
        }
    }

    async _onDefenseRoll(event){
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        const data = super.getData();
        const actorData = data.actor.system;
        let testData;

        if (dataset.roll) {
            const diceData = diceRollType();
            let die1 = 0; let die2 = 0; let die3 = 0;
            let d2; let d1;
            let rollCard = "";
            let sensors = Number(actorData.sensors);
            let chatSensors = `<b>${game.i18n.localize("EXPANSE.Sensors")}:</b> ${sensors}</br>`; ;
            let loss = Number(actorData.losses.sensors.value);
            let chatLoss = "";
            let resultsSum;
            const label = game.i18n.localize("EXPANSE.DefenseTest");

            if (loss>0) {
                chatLoss = `<b>${game.i18n.localize("EXPANSE.chatSensorsLoss")}:</b> -${loss}</br>`;
            }
            // need to conditionally set d2 d1. if game.module for dsn is true, use the dice data, if not use 6;
            if (game.modules.get("dice-so-nice") && game.modules.get("dice-so-nice").active) {
                d2 = diceData.nice[0];
                d1 = diceData.nice[1];
            } else {
                d2 = 6;
                d1 = 6;
            }

            let roll = new Roll(`2d${d2} + 1d${d1}`);
            await roll.evaluate();

            [die1, die2] = roll.terms[0].results.map(i => i.result);
            [die3] = roll.terms[2].results.map(i => i.result);

            const dieImage = `<img height="75px" width="75px" src="systems/expanse/ui/dice/${diceData.faction}/chat/${diceData.faction}-${die1}-${diceData.style}.png" />
            <img height="75px" width="75px" src="systems/expanse/ui/dice/${diceData.faction}/chat/${diceData.faction}-${die2}-${diceData.style}.png" />
            <img height="75px" width="75px" src="systems/expanse/ui/dice/${diceData.faction}/chat/${diceData.faction}-${die3}-${diceData.stunt}.png" />`

            let unmodRoll = `<b>${game.i18n.localize("EXPANSE.UnmodifiedRoll")}:</b> ${die1 + die2 + die3}</br>`;

            resultsSum = die1 + die2 + die3 + sensors - loss;

            if (event.shiftKey) {
                RollModifier().then(r => {
                    testData = r;

                    resultsSum += testData;
                    let chatAddMod = `<b>${game.i18n.localize("EXPANSE.AdditionalModifier")}:</b> ${testData}</br>`
                    rollCard = `
                        <div class="chat-dice-box">${dieImage}</div><br>
                        ${unmodRoll}
                        ${chatSensors}
                        ${chatLoss}
                        ${chatAddMod}
                        <b>${game.i18n.localize("EXPANSE.DefenseTestResults")}:</b> ${resultsSum} <br>
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
                    ${chatSensors}
                    ${chatLoss}
                    <b>${game.i18n.localize("EXPANSE.DefenseTestResults")}:</b> ${resultsSum} <br>
                `

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



}

export class ExpanseItemSheet extends ItemSheet {

    constructor(...args) {
        super(...args);
        // Expand the default size of different item sheet
        const itemType = this.object.type;
        switch (itemType) {
            case "item":
                // this.options.width = this.position.width = "350";
                break;
            case "talent":
                this.options.width = this.position.width = "600";
                this.options.height = this.position.height = "660";
                break;
            case "stunt":
                // this.options.width = this.position.width = "400";
                this.options.height = this.position.height = "265";
                break;
            case "weapon":
                this.options.width = this.position.width = "680";
                this.options.height = this.position.height = "360";
                break;
            case "armor":
                this.options.width = this.position.width = "470";
                this.options.height = this.position.height = "305";
                break;
            case "shield":
                this.options.width = this.position.width = "480";
                this.options.height = this.position.height = "305";
                break;
            default:
                break;
        };
    };

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["sheet", "item", "talents", "weapons", "armors"],
            width: 600,
            height: 750,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "attributes" }],
            /*dragDrop: [
                { dragSelector: ".item-list .item", dropSelector: null },
                { dragSelector: ".talent-item", dropSelector: ".talent-list" }
            ]*/
        });
    }

    // Picks between available/listed templates
    get template() {
        let type = this.item.type;
        return `systems/expanse/templates/sheet/${type}-sheet.html`;
    }

    getData(options) {
        const itemData = super.getData(options);
        itemData.system = itemData.item._source.system;
        //let itemData = {}

        itemData.name = itemData.data.name;
        itemData.img = itemData.data.img;
        itemData.type = itemData.data.type;
        itemData._id = this.item._id;
        itemData.enrichment = this._enrichItem();

        if (this.item.isOwned === null) {
            itemData.system.owned = false;
            //return itemData;
        } else {
            itemData.system.owned = true;
        }

        /*if (data.data.type === "armor") {
            itemData.data = {};
            itemData.data.type = data.data.data.type;
            itemData.data.bonus = data.data.data.bonus;
            itemData.data.penalty = data.data.data.penalty;
            itemData.data.cost = data.data.data.cost;
            itemData.data.equip = data.data.data.equip;
            itemData.data.description = data.data.data.description;
        }*/

        if (this.item.type === "talent") {
            //itemData.type = this.item.type;
            //itemData.name = this.item.name;
            //itemData._id = this.item._id;
            //itemData.data = this.item.system;
            itemData.specialization = this.item.system.specialization;
        }
        console.log(itemData);

        if (this.item.type === "stunt") {
            //itemData.type = data.data.type;
            //itemData.name = data.data.name;
            //itemData.data = data.data.data;
        }
        /*
                if (data.data.type === "shield") {
                    itemData.data = {};
                    itemData.type = data.data.type;
                    itemData.name = data.data.name;
                    itemData.data.bonus = data.data.data.bonus;
                    itemData.data.cost = data.data.data.cost;
                    itemData.data.equip = data.data.data.equip;
                    itemData.data.type = data.data.data.type;
                    itemData.data.description = data.data.data.description;
                }
        
                if (data.data.type === "weapon") {
                    itemData.data = {};
                    itemData.name = data.data.name;
                    itemData.type = data.data.type;
                    itemData.img = data.data.img;
                    itemData._id = data.data.id;
                    itemData.data.type = data.data.data.type;
                    itemData.data.group = data.data.data.group;
                    itemData.data.attack = data.data.data.attack;
                    itemData.data.npcAttack = data.data.data.npcattack;
                    itemData.data.usefocus = data.data.data.usefocus;
                    itemData.data.usefocusplus = data.data.data.usefocusplus;
                    itemData.data.damage = data.data.data.damage;
                    itemData.data.manualDamage = data.data.data.manualDamage;
                    itemData.data.hasBonusDamage = data.data.data.hasBonusDamage;
                    itemData.data.bonusDamage = data.data.data.bonusDamage;
                    itemData.data.rangemin = data.data.data.rangemin;
                    itemData.data.rangemax = data.data.data.rangemax;
                    itemData.data.range = data.data.data.range;
                    itemData.data.cost = data.data.data.cost;
                    itemData.data.equipped = data.data.data.equipped;
                    itemData.data.description = data.data.data.description;
                    itemData.data.modifier = data.data.data.modifier;
                    itemData.data.tohitabil = data.data.data.tohitabil;
                    itemData.data.quality = data.data.data.quality;
                    itemData.data.dieFaces = data.data.data.dieFaces;
                }*/
        return itemData;
    }

    _enrichItem() {
        let enrichment = {};
        enrichment[`system.description`] = TextEditor.enrichHTML(this.item.system.description, { async: false, relativeTo: this.actor });
        if (this.item.type === "talent") {
            enrichment[`system.requirements`] = TextEditor.enrichHTML(this.item.system.requirements, { async: false, relativeTo: this.actor });
            enrichment[`system.ranks.novice.effect`] = TextEditor.enrichHTML(this.item.system.ranks.novice.effect, { async: false, relativeTo: this.actor });
            enrichment[`system.ranks.expert.effect`] = TextEditor.enrichHTML(this.item.system.ranks.expert.effect, { async: false, relativeTo: this.actor });
            enrichment[`system.ranks.master.effect`] = TextEditor.enrichHTML(this.item.system.ranks.master.effect, { async: false, relativeTo: this.actor });
        }

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

        html.find(".learn-specialization").click(async e => {
            const data = super.getData()
            const item = data.item;
            //let itemId = e.currentTarget.getAttribute("data-item-id");
            //let spec = this.item.isOwned ? duplicate(this.actor.getEmbeddedDocument("Item", itemId)) : item;

            //if (item.type === "talent") {
            item.system.specialization = !item.system.specialization;
            if (this.item.isOwned) {
                await this.actor.updateEmbeddedDocuments("Item", [item])
            } else {
                return item;
            }
            //}
            //console.log(spec);
            /*if (item.type === "talent") {
                item.data.specialization = !item.data.specialization;
            }*/
            //await this.actor.updateEmbeddedDocuments("Item", [spec])
        });

        html.find(".learn-talent").click(async e => {
            const data = super.getData()
            const item = data.item;
            let talentRank = e.currentTarget.getAttribute("data-rank");
            let learnedRank = talentRank === "novice" ?
                item.system.ranks.novice.active : talentRank === "expert" ?
                    item.system.ranks.expert.active : item.system.ranks.master.active;
            learnedRank = !learnedRank;
            if (this.item.isOwned) {
                await this.actor.updateEmbeddedDocuments("Item", [item])
            } else {
                return item;
            }
        });
    }
}

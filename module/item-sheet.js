export class ExpanseItemSheet extends ItemSheet {

    constructor(...args) {
        super(...args);
        // Expand the default size of different item sheet
        const itemType = this.object.data.type;
        switch (itemType) {
            case "item":
                // this.options.width = this.position.width = "350";
                break;
            case "talent":
                this.options.width = this.position.width = "600";
                this.options.height = this.position.height = "610";
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
            dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }]
        });
    }

    // Picks between available/listed templates
    get template() {
        const path = "systems/the_expanse/templates/sheet"
        return `${path}/${this.item.data.type}-sheet.html`;
    }

    /*get template() {
    if (this.isOwned)
      return `path/to/owned/template.html`;
    else 
      return `path/to/unowned/template.html`;
  }*/
    getData() {
        const data = super.getData();
        //data.dtypes = ["String", "Number", "Boolean"];

        let itemData = {}

        itemData.name = data.data.name;
        itemData.img = data.data.img;
        itemData.type = data.data.type;
        if (data.data.type === "armor") {
            itemData.data = {};
            itemData.data.type = data.data.data.type;
            itemData.data.bonus = data.data.data.bonus;
            itemData.data.penalty = data.data.data.penalty;
            itemData.data.cost = data.data.data.cost;
            itemData.data.equip = data.data.data.equip;
            itemData.data.description = data.data.data.description;
        }

        if (data.data.type === "talent") {
            itemData.type = data.data.type;
            itemData.name = data.data.name;
            itemData._id = data.data._id;
            itemData.data = data.data.data
        }

        if (data.data.type === "stunt") {
            itemData.type = data.data.type;
            itemData.name = data.data.name;
            itemData.data = data.data.data;
        }

        if (data.data.type === "shield") {
            itemData.data = {};
            itemData.type = data.data.type;
            itemData.name = data.data.name;
            itemData.data.bonus = data.data.data.bonus;
            itemData.data.cost = data.data.data.cost;
            itemData.data.equip = data.data.data.equip;
            itemData.data.type = data.data.data.type;
        }

        if (data.data.type === "weapon") {
            itemData.data = {};
            itemData.name = data.data.name;
            itemData.type = data.data.type;
            itemData.img = data.data.img;
            itemData.data.type = data.data.data.type;
            itemData.data.group = data.data.data.group;
            itemData.data.attack = data.data.data.attack;
            itemData.data.npcAttack = data.data.data.npcattack;
            itemData.data.usefocus = data.data.data.usefocus;
            itemData.data.usefocusplus = data.data.data.usefocusplus;
            itemData.data.damage = data.data.data.damage;
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
        }
        return itemData;
    }

    activateListeners(html) {
        super.activateListeners(html);
        let tabs = html.find('tabs');
        let initial = this._sheetTab;
        new TabsV2(tabs, {
            initial: initial,
            callback: clicked => this._sheetTab = clicked.data("tab")
        });
    }
}

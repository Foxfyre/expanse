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
            case "focus":
                this.options.width = this.position.width = "400";
                this.options.height = this.position.height = "200";
            default:
                break;
        };
    };

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["sheet", "item", "talents", "weapons", "armors"],
            width: 600,
            height: 750,
            tabs: [{
                navSelector: ".sheet-tabs",
                contentSelector: ".sheet-body",
                initial: "attributes"
            }],
        });
    }

    // Picks between available/listed templates
    get template() {
        let type = this.item.type;
        return `systems/expanse/templates/sheet/${type}-sheet.html`;
    }

    async getData(options) {
        const itemData = super.getData(options);

        itemData.system = itemData.item._source.system;
        itemData.name = itemData.data.name;
        itemData.img = itemData.data.img;
        itemData.type = itemData.data.type;
        itemData._id = this.item._id;
        itemData.enrichment = await this._enrichItem();

        if (this.item.isOwned === null) {
            itemData.system.owned = false;
        } else {
            itemData.system.owned = true;
        }

        if (this.item.type === "talent") {
            itemData.specialization = this.item.system.specialization;
        }

        if (this.item.type === "weapon") {
            itemData.data.usePenalty = this.item.system.usePenalty;
        }

        return itemData;
    }

    async _enrichItem() {
        let enrichment = {};
        enrichment[`system.description`] = await TextEditor.enrichHTML(this.item.system.description, { relativeTo: this.actor });
        if (this.item.type === "talent") {
            enrichment[`system.requirements`] = await TextEditor.enrichHTML(this.item.system.requirements, { relativeTo: this.actor });
            enrichment[`system.ranks.novice.effect`] = await TextEditor.enrichHTML(this.item.system.ranks.novice.effect, { relativeTo: this.actor });
            enrichment[`system.ranks.expert.effect`] = await TextEditor.enrichHTML(this.item.system.ranks.expert.effect, { relativeTo: this.actor });
            enrichment[`system.ranks.master.effect`] = await TextEditor.enrichHTML(this.item.system.ranks.master.effect, { relativeTo: this.actor });
        }

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

        html.find(".learn-specialization").click(async e => {
            const data = super.getData()
            const item = data.item;
            item.system.specialization = !item.system.specialization;
            if (this.item.isOwned) {
                await this.actor.updateEmbeddedDocuments("Item", [item])
            } else {
                return item;
            }
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

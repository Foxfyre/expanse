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
        data.dtypes = ["String", "Number", "Boolean"];
        console.log(data);

        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        let tabs = html.find('tabs');
        let initial = this._sheetTab;
        new TabsV2(tabs, {
            initial: initial,
            callback: clicked => this._sheetTab = clicked.data("tab")
        });

        html.find(".learn-talent").click(async e => {
            const data = super.getData()
            const itemData = data.item;
            const talent = itemData.data;
            let itemId = e.currentTarget.getAttribute("data-item-id");
        });
    }
}
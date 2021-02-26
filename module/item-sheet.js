export class ExpanseItemSheet extends ItemSheet {

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
        //console.log(data);
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
            //console.log(data);
            let itemId = e.currentTarget.getAttribute("data-item-id");
            
            //console.log(talent);

        });
    }
}
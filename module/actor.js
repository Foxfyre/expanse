/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */

export class ExpanseActor extends Actor {
  /** @override */
  /*getRollData() {
    const data = super.getRollData();
    console.log(data)
    // proceeding commented out block due to not using shorthand
    //const shorthand = game.settings.get("expansetemplate", "macroShorthand");

    // Re-map all attributes onto the base roll data
    if (!!shorthand) {
      for (let [k, v] of Object.entries(data.attributes)) {
        if (!(k in data)) data[k] = v.value;
      }
      delete data.attributes;
    }

    // Map all items data using their slugified names
    data.items = this.data.items.reduce((obj, i) => {
      let key = i.name.slugify({ strict: true });
      let itemData = duplicate(i.data);
      if (!!shorthand) {
        for (let [k, v] of Object.entries(itemData.attributes)) {
          if (!(k in itemData)) itemData[k] = v.value;
        }
        delete itemData["attributes"];
      }
      obj[key] = itemData;
      return obj;
    }, {});
    return data;
  }*/

  // Replace default image
  /*static async create(data, options = {}) {

    const path = "systems/the_expanse/ui/portraits"
    return `${path}/${this.actor.img}`;

    data.img = `${CONFIG.l5r5e.paths.assets}icons/actors/${data.type}.svg`;
  }*/

  prepareDerivedData() {
    super.prepareDerivedData();
    const actorData = this.data;
    const data = actorData.data;



    if (actorData.type === "character") {
      data.attributes.speed.modified = 10 + Number(data.abilities.dexterity.rating);
      data.attributes.defense.modified = 10 + Number(data.abilities.dexterity.rating) + Number(data.attributes.defense.bonus);
      data.attributes.toughness.modified = Number(data.abilities.constitution.rating);
      data.attributes.move.modified = Number(data.attributes.speed.modified);
      data.attributes.run.modified = Number(data.attributes.speed.modified * 2)
    }
    //console.log(data);

  }

  prepareEmbeddedEntities() {
    super.prepareEmbeddedEntities();
    const actorData = this.data;
    const data = actorData.data;
    const items = actorData.items

    //console.log(actorData);

    // if armour is equipped, set modified value to bonus.

    //console.log(items)
    for (let [k, v] of Object.entries(items)) {
      //console.log(v)
      if (v.type === "armor" && v.data.equip === true) {
        //console.log("Armor is equipped") 
        data.attributes.armor.modified = Number(v.data.bonus);
        data.attributes.penalty.modified = Number(v.data.penalty);
      } else if (v.type === "shield" && v.data.equip === true) {
        data.attributes.defense.bonus = Number(v.data.bonus);
      }
    }



  }
}

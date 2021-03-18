/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */

export class ExpanseActor extends Actor {
  /** @override */

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

      if (data.attributes.level.modified >= 11) {
        console.log("level 11 or greater detected");
        data.attributes.level.elevenbonus = true;
      }
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

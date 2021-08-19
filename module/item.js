/**
 * Extend the base Item entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Item}
 */

export class ExpanseItem extends Item {

    _preCreate() {
        console.log(this.data)
        const data = this.data;
        const path = "systems/the_expanse/ui/item-img/"
        if (data.type === "armor") {
            data.update({ img: `${path}item-armor.png` })
        } else if (data.type === "shield") {
            data.update({ img: `${path}item-shield.png` })
        }
    }

    _onUpdate(changed, options, userId) {
        const data = this.data;
        const path = "systems/the_expanse/ui/item-img/"
        if (data.type === "weapon") {
            if (data.data.type === "pistol") {
                this.update({ img: `${path}item-pistol.png` })
            } else if (data.data.type === "rifle") {
                this.update({ img: `${path}item-rifle1.png` })
            } else if (data.data.type === "light_melee") {
                this.update({ img: `${path}item-light_melee.png`})
            } else if (data.data.type === "heavy_melee") {
                this.update({ img: `${path}item-heavy_melee.png`})
            } else if (data.data.type === "makeshift") {
                this.update({ img: `${path}item-makeshift1.png`})
            } else if (data.data.type === "grenade") {
                this.update({ img: `${path}item-grenade.png`})
            } else if (data.data.type === "unarmed") {
                this.update({ img: `${path}item-unarmed.png`})
            }
        }
    }
}
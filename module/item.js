/**
 * Extend the base Item entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Item}
 */

export class ExpanseItem extends Item {

    prepareData() {
        super.prepareData();
    }

    _preCreate(data) {
        const path = "systems/expanse/ui/item-img/"
        if (this.type === "armor") {
            this.updateSource({ img: `${path}item-armor.png` })
        } else if (data.type === "shield") {
            this.updateSource({ img: `${path}item-shield.png` })
        } else if (data.type === "talent") {
            this.updateSource({ img: `${path}talent-tablet.png` })
        } else if (data.type === "stunt") {
            this.updateSource({ img: `${path}stunt.png` })
        }
    }

    _onUpdate(changed, options, userId) {
        const data = this.toObject().system;
        const path = "systems/expanse/ui/item-img/"
        if (this.type === "weapon") {
            if (this.type === "pistol") {
                this.updateSource({ img: `${path}item-pistol.png` })
            } else if (this.type === "rifle") {
                this.updateSource({ img: `${path}item-rifle1.png` })
            } else if (this.type === "light_melee") {
                this.updateSource({ img: `${path}item-light_melee.png` })
            } else if (this.type === "heavy_melee") {
                this.updateSource({ img: `${path}item-heavy_melee.png` })
            } else if (this.type === "makeshift") {
                this.updateSource({ img: `${path}item-makeshift1.png` })
            } else if (this.type === "grenade") {
                this.updateSource({ img: `${path}item-grenade.png` })
            } else if (this.type === "unarmed") {
                this.updateSource({ img: `${path}item-unarmed.png` })
            }
        }

        if (this.type === "talent" && this.system.specialization === true) {
            this.updateSource({ img: `${path}talent-book.png` })
        }

        if (this.type === "talent" && this.system.specialization === false) {
            this.updateSource({ img: `${path}talent-tablet.png` })
        }

        if (this.type === "stunt") {
            this.updateSource({ img: `${path}stunt.png` })
        }
    }
}

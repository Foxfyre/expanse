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
        if (data.type === "armor") {
            this.updateSource({ img: `${path}item-armor.png` })
        } else if (data.type === "shield") {
            this.updateSource({ img: `${path}item-shield.png` })
        } else if (data.type === "talent") {
            this.updateSource({ img: `${path}talent-tablet.png` })
        } else if (data.type === "stunt") {
            this.updateSource({ img: `${path}stunt.png` })
        } else if (data.type === "weapon") {
            this.updateSource({ img: `${path}item-unarmed.png` })
        }
    }

    _onUpdate(changed, options, userId) {
        const weaponType = this.system.type;
        const path = "systems/expanse/ui/item-img/"
        if (this.type === "weapon") {
            if (weaponType === "pistol") {
                this.update({ img: `${path}item-pistol.png` });
            } else if (weaponType === "rifle") {
                this.update({ img: `${path}item-rifle1.png` })
            } else if (weaponType === "light_melee") {
                this.update({ img: `${path}item-light_melee.png` })
            } else if (weaponType === "heavy_melee") {
                this.update({ img: `${path}item-heavy_melee.png` })
            } else if (weaponType === "makeshift") {
                this.update({ img: `${path}item-makeshift1.png` })
            } else if (weaponType === "grenade") {
                this.update({ img: `${path}item-grenade.png` })
            } else if (weaponType === "unarmed") {
                this.update({ img: `${path}item-unarmed.png` })
            }
        }

        if (this.type === "talent" && this.system.specialization === true) {
            this.update({ img: `${path}talent-book.png` })
        }

        if (this.type === "talent" && this.system.specialization === false) {
            this.update({ img: `${path}talent-tablet.png` })
        }

        if (this.type === "stunt") {
            this.update({ img: `${path}stunt.png` })
        }
    }
}

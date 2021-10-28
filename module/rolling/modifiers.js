export function RollModifier() {
    let rMod = new Promise((resolve) => {
        renderTemplate("/systems/the_expanse/templates/dialog/rollModifiers.html").then(dlg => {
            new Dialog({
                title: game.i18n.localize("EXPANSE.RollModifier"),
                content: dlg,
                buttons: {
                    roll: {
                        label: game.i18n.localize("EXPANSE.Roll"),
                        callback: (html) => {
                            resolve(
                                rMod.addModifier = Number(html.find(`[name="addRollModifier"]`).val())
                            )
                        }
                    }
                },
                default: "Roll"
            }).render(true)
        });
    })
    return rMod;
}

export function RollDamageModifier() {
    let dMod = new Promise((resolve) => {
        renderTemplate("/systems/the_expanse/templates/dialog/damageModifiers.html").then(dlg => {
            new Dialog({
                title: game.i18n.localize("EXPANSE.DamageModifier"),
                content: dlg,
                buttons: {
                    roll: {
                        label: game.i18n.localize("EXPANSE.Roll"),
                        callback: (html) => {
                            resolve([
                                Number(html.find(`[name="add1D6"]`).val()),
                                Number(html.find(`[name="addDamage"]`).val())
                            ])
                        }
                    }
                },
                default: "Roll"
            }).render(true)
        });
    })
    return dMod;
}
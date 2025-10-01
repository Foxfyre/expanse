export class TheExpanseEarthLight extends foundry.dice.terms.Die {
    constructor(termData) {
        termData.faces = 6;
        super(termData);
    }

    /* -------------------------------------------- */

    /** @override */
    static DENOMINATION = "l";

    /* -------------------------------------------- */

    /** @override */
    getResultLabel(result) {
        return {
            "1": '<img src="systems/expanse/ui/dice/earth/earth-1-light.png" />',
            "2": '<img src="systems/expanse/ui/dice/earth/earth-2-light.png" />',
            "3": '<img src="systems/expanse/ui/dice/earth/earth-3-light.png" />',
            "4": '<img src="systems/expanse/ui/dice/earth/earth-4-light.png" />',
            "5": '<img src="systems/expanse/ui/dice/earth/earth-5-light.png" />',
            "6": '<img src="systems/expanse/ui/dice/earth/earth-6-light.png" />'
        }[result.result];
    }
}
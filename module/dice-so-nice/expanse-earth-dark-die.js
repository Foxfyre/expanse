export class TheExpanseEarthDark extends foundry.dice.terms.Die {
    constructor(termData) {
        termData.faces = 6;
        super(termData);
    }

    /* -------------------------------------------- */

    /** @override */
    static DENOMINATION = "a";

    /* -------------------------------------------- */

    /** @override */
    getResultLabel(result) {
        return {
            "1": '<img src="systems/expanse/ui/dice/earth/earth-1-dark.png" />',
            "2": '<img src="systems/expanse/ui/dice/earth/earth-2-dark.png" />',
            "3": '<img src="systems/expanse/ui/dice/earth/earth-3-dark.png" />',
            "4": '<img src="systems/expanse/ui/dice/earth/earth-4-dark.png" />',
            "5": '<img src="systems/expanse/ui/dice/earth/earth-5-dark.png" />',
            "6": '<img src="systems/expanse/ui/dice/earth/earth-6-dark.png" />'
        }[result.result];
    }
}
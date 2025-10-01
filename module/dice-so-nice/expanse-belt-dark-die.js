export class TheExpanseBeltDark extends foundry.dice.terms.Die {
    constructor(termData) {
        termData.faces = 6;
        super(termData);
    }

    /* -------------------------------------------- */

    /** @override */
    static DENOMINATION = "e";

    /* -------------------------------------------- */

    /** @override */
    getResultLabel(result) {
        return {
            "1": '<img src="systems/expanse/ui/dice/belt/belt-1-dark.png" />',
            "2": '<img src="systems/expanse/ui/dice/belt/belt-2-dark.png" />',
            "3": '<img src="systems/expanse/ui/dice/belt/belt-3-dark.png" />',
            "4": '<img src="systems/expanse/ui/dice/belt/belt-4-dark.png" />',
            "5": '<img src="systems/expanse/ui/dice/belt/belt-5-dark.png" />',
            "6": '<img src="systems/expanse/ui/dice/belt/belt-6-dark.png" />'
        }[result.result];
    }
}
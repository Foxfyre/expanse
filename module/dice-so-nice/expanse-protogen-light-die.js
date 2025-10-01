export class TheExpanseProtogenLight extends foundry.dice.terms.Die {
    constructor(termData) {
        termData.faces = 6;
        super(termData);
    }

    /* -------------------------------------------- */

    /** @override */
    static DENOMINATION = "h";

    /* -------------------------------------------- */

    /** @override */
    getResultLabel(result) {
        return {
            "1": '<img src="systems/expanse/ui/dice/protogen/protogen-1-light.png" />',
            "2": '<img src="systems/expanse/ui/dice/protogen/protogen-2-light.png" />',
            "3": '<img src="systems/expanse/ui/dice/protogen/protogen-3-light.png" />',
            "4": '<img src="systems/expanse/ui/dice/protogen/protogen-4-light.png" />',
            "5": '<img src="systems/expanse/ui/dice/protogen/protogen-5-light.png" />',
            "6": '<img src="systems/expanse/ui/dice/protogen/protogen-6-light.png" />'
        }[result.result];
    }
}
export class TheExpanseBeltLight extends Die {
    constructor(termData) {
        termData.faces = 6;
        super(termData);
    }

    /* -------------------------------------------- */

    /** @override */
    static DENOMINATION = "r";

    /* -------------------------------------------- */

    /** @override */
    getResultLabel(result) {
        return {
            "1": '<img src="systems/expanse/ui/dice/belt/belt-1-light.png" />',
            "2": '<img src="systems/expanse/ui/dice/belt/belt-2-light.png" />',
            "3": '<img src="systems/expanse/ui/dice/belt/belt-3-light.png" />',
            "4": '<img src="systems/expanse/ui/dice/belt/belt-4-light.png" />',
            "5": '<img src="systems/expanse/ui/dice/belt/belt-5-light.png" />',
            "6": '<img src="systems/expanse/ui/dice/belt/belt-6-light.png" />'
        }[result.result];
    }
}
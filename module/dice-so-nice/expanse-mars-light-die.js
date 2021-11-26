export class TheExpanseMarsLight extends Die {
    constructor(termData) {
        termData.faces = 6;
        super(termData);
    }

    /* -------------------------------------------- */

    /** @override */
    static DENOMINATION = "d";

    /* -------------------------------------------- */

    /** @override */
    getResultLabel(result) {
        return {
            "1": '<img src="systems/expanse/ui/dice/mars/mars-1-light.png" />',
            "2": '<img src="systems/expanse/ui/dice/mars/mars-2-light.png" />',
            "3": '<img src="systems/expanse/ui/dice/mars/mars-3-light.png" />',
            "4": '<img src="systems/expanse/ui/dice/mars/mars-4-light.png" />',
            "5": '<img src="systems/expanse/ui/dice/mars/mars-5-light.png" />',
            "6": '<img src="systems/expanse/ui/dice/mars/mars-6-light.png" />'
        }[result.result];
    }
}
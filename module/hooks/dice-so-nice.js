export function registerDiceSoNice(dice3d) {
    dice3d.addSystem({ id: "expanse", name: "The Expanse" }, "preferred");
    dice3d.addColorset({
        name: "earth-dark",
        category: "The Expanse",
        description: "Earther Dice - Dark",
        edge: "#0019FF",
        background: "#0019FF",
        material: "plastic",
    });

    dice3d.addColorset({
        name: "earth-light",
        category: "The Expanse",
        description: "Earther Dice - Light",
        edge: "#FFFFFF",
        background: "#FFFFFF",
        material: "plastic",
    });

    dice3d.addColorset({
        name: "mars-dark",
        category: "The Expanse",
        description: "Mars Dice - Dark",
        edge: "#000000",
        background: "#000000",
        material: "plastic",
    });

    dice3d.addColorset({
        name: "mars-light",
        category: "The Expanse",
        description: "Mars Dice - Light",
        edge: "#BC3219",
        background: "#BC3219",
        material: "plastic",
    });

    dice3d.addColorset({
        name: "belt-dark",
        category: "The Expanse",
        description: "Belt Dice - Dark",
        edge: "#000000",
        background: "#000000",
        material: "plastic",
    });

    dice3d.addColorset({
        name: "belt-light",
        category: "The Expanse",
        description: "Belt Dice - Light",
        edge: "#FFFFFF",
        background: "#FFFFFF",
        material: "plastic",
    });

    dice3d.addColorset({
        name: "protogen-dark",
        category: "The Expanse",
        description: "Protogen Dice - Dark",
        edge: "#000000",
        background: "#000000",
        material: "plastic",
    });

    dice3d.addColorset({
        name: "protogen-light",
        category: "The Expanse",
        description: "Protogen Dice - Light",
        edge: "#5BCBF5",
        background: "#5BCBF5",
        material: "plastic",
    });

    dice3d.addDicePreset(
        {
            type: "da",
            labels: [
                "systems/expanse/ui/dice/earth/earth-1-dark.png",
                "systems/expanse/ui/dice/earth/earth-2-dark.png",
                "systems/expanse/ui/dice/earth/earth-3-dark.png",
                "systems/expanse/ui/dice/earth/earth-4-dark.png",
                "systems/expanse/ui/dice/earth/earth-5-dark.png",
                "systems/expanse/ui/dice/earth/earth-6-dark.png",
            ],
            bumpMaps: [
                "systems/expanse/ui/dice/earth/earth-1-bump.png",
                "systems/expanse/ui/dice/earth/earth-2-bump.png",
                "systems/expanse/ui/dice/earth/earth-3-bump.png",
                "systems/expanse/ui/dice/earth/earth-4-bump.png",
                "systems/expanse/ui/dice/earth/earth-5-bump.png",
                "systems/expanse/ui/dice/earth/earth-6-bump.png",
            ],
            colorset: "earth-dark",
            system: "expanse",
        },
        "d6"
    );

    dice3d.addDicePreset(
        {
            type: "dl",
            labels: [
                "systems/expanse/ui/dice/earth/earth-1-light.png",
                "systems/expanse/ui/dice/earth/earth-2-light.png",
                "systems/expanse/ui/dice/earth/earth-3-light.png",
                "systems/expanse/ui/dice/earth/earth-4-light.png",
                "systems/expanse/ui/dice/earth/earth-5-light.png",
                "systems/expanse/ui/dice/earth/earth-6-light.png",
            ],
            bumpMaps: [
                "systems/expanse/ui/dice/earth/earth-1-bump.png",
                "systems/expanse/ui/dice/earth/earth-2-bump.png",
                "systems/expanse/ui/dice/earth/earth-3-bump.png",
                "systems/expanse/ui/dice/earth/earth-4-bump.png",
                "systems/expanse/ui/dice/earth/earth-5-bump.png",
                "systems/expanse/ui/dice/earth/earth-6-bump.png",
            ],
            colorset: "earth-light",
            system: "expanse",
        },
        "d6"
    );

    dice3d.addDicePreset(
        {
            type: "dc",
            labels: [
                "systems/expanse/ui/dice/mars/mars-1-dark.png",
                "systems/expanse/ui/dice/mars/mars-2-dark.png",
                "systems/expanse/ui/dice/mars/mars-3-dark.png",
                "systems/expanse/ui/dice/mars/mars-4-dark.png",
                "systems/expanse/ui/dice/mars/mars-5-dark.png",
                "systems/expanse/ui/dice/mars/mars-6-dark.png",
            ],
            bumpMaps: [
                "systems/expanse/ui/dice/mars/mars-1-bump.png",
                "systems/expanse/ui/dice/mars/mars-2-bump.png",
                "systems/expanse/ui/dice/mars/mars-3-bump.png",
                "systems/expanse/ui/dice/mars/mars-4-bump.png",
                "systems/expanse/ui/dice/mars/mars-5-bump.png",
                "systems/expanse/ui/dice/mars/mars-6-bump.png",
            ],
            colorset: "mars-dark",
            system: "expanse",
        },
        "d6"
    );

    dice3d.addDicePreset(
        {
            type: "dd",
            labels: [
                "systems/expanse/ui/dice/mars/mars-1-light.png",
                "systems/expanse/ui/dice/mars/mars-2-light.png",
                "systems/expanse/ui/dice/mars/mars-3-light.png",
                "systems/expanse/ui/dice/mars/mars-4-light.png",
                "systems/expanse/ui/dice/mars/mars-5-light.png",
                "systems/expanse/ui/dice/mars/mars-6-light.png",
            ],
            bumpMaps: [
                "systems/expanse/ui/dice/mars/mars-1-bump.png",
                "systems/expanse/ui/dice/mars/mars-2-bump.png",
                "systems/expanse/ui/dice/mars/mars-3-bump.png",
                "systems/expanse/ui/dice/mars/mars-4-bump.png",
                "systems/expanse/ui/dice/mars/mars-5-bump.png",
                "systems/expanse/ui/dice/mars/mars-6-bump.png",
            ],
            colorset: "mars-light",
            system: "expanse",
        },
        "d6"
    );

    dice3d.addDicePreset(
        {
            type: "de",
            labels: [
                "systems/expanse/ui/dice/belt/belt-1-dark.png",
                "systems/expanse/ui/dice/belt/belt-2-dark.png",
                "systems/expanse/ui/dice/belt/belt-3-dark.png",
                "systems/expanse/ui/dice/belt/belt-4-dark.png",
                "systems/expanse/ui/dice/belt/belt-5-dark.png",
                "systems/expanse/ui/dice/belt/belt-6-dark.png",
            ],
            bumpMaps: [
                "systems/expanse/ui/dice/belt/belt-1-bump.png",
                "systems/expanse/ui/dice/belt/belt-2-bump.png",
                "systems/expanse/ui/dice/belt/belt-3-bump.png",
                "systems/expanse/ui/dice/belt/belt-4-bump.png",
                "systems/expanse/ui/dice/belt/belt-5-bump.png",
                "systems/expanse/ui/dice/belt/belt-6-bump.png",
            ],
            colorset: "belt-dark",
            system: "expanse",
        },
        "d6"
    );

    dice3d.addDicePreset(
        {
            type: "df",
            labels: [
                "systems/expanse/ui/dice/belt/belt-1-light.png",
                "systems/expanse/ui/dice/belt/belt-2-light.png",
                "systems/expanse/ui/dice/belt/belt-3-light.png",
                "systems/expanse/ui/dice/belt/belt-4-light.png",
                "systems/expanse/ui/dice/belt/belt-5-light.png",
                "systems/expanse/ui/dice/belt/belt-6-light.png",
            ],
            bumpMaps: [
                "systems/expanse/ui/dice/belt/belt-1-bump.png",
                "systems/expanse/ui/dice/belt/belt-2-bump.png",
                "systems/expanse/ui/dice/belt/belt-3-bump.png",
                "systems/expanse/ui/dice/belt/belt-4-bump.png",
                "systems/expanse/ui/dice/belt/belt-5-bump.png",
                "systems/expanse/ui/dice/belt/belt-6-bump.png",
            ],
            colorset: "belt-light",
            system: "expanse",
        },
        "d6"
    );

    dice3d.addDicePreset(
        {
            type: "dg",
            labels: [
                "systems/expanse/ui/dice/protogen/protogen-1-dark.png",
                "systems/expanse/ui/dice/protogen/protogen-2-dark.png",
                "systems/expanse/ui/dice/protogen/protogen-3-dark.png",
                "systems/expanse/ui/dice/protogen/protogen-4-dark.png",
                "systems/expanse/ui/dice/protogen/protogen-5-dark.png",
                "systems/expanse/ui/dice/protogen/protogen-6-dark.png",
            ],
            bumpMaps: [
                "systems/expanse/ui/dice/protogen/protogen-1-bump.png",
                "systems/expanse/ui/dice/protogen/protogen-2-bump.png",
                "systems/expanse/ui/dice/protogen/protogen-3-bump.png",
                "systems/expanse/ui/dice/protogen/protogen-4-bump.png",
                "systems/expanse/ui/dice/protogen/protogen-5-bump.png",
                "systems/expanse/ui/dice/protogen/protogen-6-bump.png",
            ],
            colorset: "protogen-dark",
            system: "expanse",
        },
        "d6"
    );

    dice3d.addDicePreset(
        {
            type: "dh",
            labels: [
                "systems/expanse/ui/dice/protogen/protogen-1-light.png",
                "systems/expanse/ui/dice/protogen/protogen-2-light.png",
                "systems/expanse/ui/dice/protogen/protogen-3-light.png",
                "systems/expanse/ui/dice/protogen/protogen-4-light.png",
                "systems/expanse/ui/dice/protogen/protogen-5-light.png",
                "systems/expanse/ui/dice/protogen/protogen-6-light.png",
            ],
            bumpMaps: [
                "systems/expanse/ui/dice/protogen/protogen-1-bump.png",
                "systems/expanse/ui/dice/protogen/protogen-2-bump.png",
                "systems/expanse/ui/dice/protogen/protogen-3-bump.png",
                "systems/expanse/ui/dice/protogen/protogen-4-bump.png",
                "systems/expanse/ui/dice/protogen/protogen-5-bump.png",
                "systems/expanse/ui/dice/protogen/protogen-6-bump.png",
            ],
            colorset: "protogen-light",
            system: "expanse",
        },
        "d6"
    );
}
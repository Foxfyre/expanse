export function registerDiceSoNice(dice3d) {
    dice3d.addSystem({ id: "the_expanse", name: "The Expanse" }, "preferred");
    dice3d.addColorset({
        name: "earth-dark",
        category: "The Expanse",
        description: "Earther Dice - Dark",
        edge: "#FFFFFF",
        background: "#FFFFFF",
        material: "plastic",
    });

    dice3d.addColorset({
        name: "earth-light",
        category: "The Expanse",
        description: "Earther Dice - Light",
        edge: "#4270B7",
        background: "#4270B7",
        material: "plastic",
    });

    dice3d.addDicePreset(
        {
            type: "da",
            labels: [
                "systems/the_expanse/ui/dice/earth/earth-1-dark.png",
                "systems/the_expanse/ui/dice/earth/earth-2-dark.png",
                "systems/the_expanse/ui/dice/earth/earth-3-dark.png",
                "systems/the_expanse/ui/dice/earth/earth-4-dark.png",
                "systems/the_expanse/ui/dice/earth/earth-5-dark.png",
                "systems/the_expanse/ui/dice/earth/earth-6-dark.png",
            ],
            bumpMaps: [
                "systems/the_expanse/ui/dice/earth/earth-1-bump.png",
                "systems/the_expanse/ui/dice/earth/earth-2-bump.png",
                "systems/the_expanse/ui/dice/earth/earth-3-bump.png",
                "systems/the_expanse/ui/dice/earth/earth-4-bump.png",
                "systems/the_expanse/ui/dice/earth/earth-5-bump.png",
                "systems/the_expanse/ui/dice/earth/earth-6-bump.png",
            ],
            colorset: "earth-dark",
            system: "the_expanse",
        },
        "d6"
    );

    dice3d.addDicePreset(
        {
            type: "dl",
            labels: [
                "systems/the_expanse/ui/dice/earth/earth-1-light.png",
                "systems/the_expanse/ui/dice/earth/earth-2-light.png",
                "systems/the_expanse/ui/dice/earth/earth-3-light.png",
                "systems/the_expanse/ui/dice/earth/earth-4-light.png",
                "systems/the_expanse/ui/dice/earth/earth-5-light.png",
                "systems/the_expanse/ui/dice/earth/earth-6-light.png",
            ],
            bumpMaps: [
                "systems/the_expanse/ui/dice/earth/earth-1-bump.png",
                "systems/the_expanse/ui/dice/earth/earth-2-bump.png",
                "systems/the_expanse/ui/dice/earth/earth-3-bump.png",
                "systems/the_expanse/ui/dice/earth/earth-4-bump.png",
                "systems/the_expanse/ui/dice/earth/earth-5-bump.png",
                "systems/the_expanse/ui/dice/earth/earth-6-bump.png",
            ],
            colorset: "earth-light",
            system: "the_expanse",
        },
        "d6"
    );
}
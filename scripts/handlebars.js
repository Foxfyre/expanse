export const initializeHandlebars = () => {
    preloadHandlebarsTemplates();
}

function preloadHandlebarsTemplates() {
    const templatePaths = [
        "systems/expanse/templates/sheet/sections/player-conditions.html",
        "systems/expanse/templates/sheet/sections/player-talents.html",
        "systems/expanse/templates/sheet/sections/player-attributes.html",
        "systems/expanse/templates/sheet/sections/player-abilities.html",
        "systems/expanse/templates/sheet/sections/player-equipment.html",
        "systems/expanse/templates/sheet/sections/player-biography.html",
        "systems/expanse/templates/sheet/sections/player-notes.html"
    ];
    return loadTemplates(templatePaths);
}
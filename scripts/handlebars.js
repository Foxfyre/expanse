export const initializeHandlebars = () => {
    registerHandlebarsHelpers();
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
        "systems/expanse/templates/sheet/sections/player-notes.html",
    ];
    return loadTemplates(templatePaths);
}

function registerHandlebarsHelpers() {
    Handlebars.registerHelper('concat', function () {
        let arg = Array.prototype.slice.call(arguments, 0);
        arg.pop();
        return arg.join('');
    })

    Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {
        switch (operator) {
            case '==':
                return (v1 == v2) ? options.fn(this) : options.inverse(this);
            case '===':
                return (v1 === v2) ? options.fn(this) : options.inverse(this);
            case '!=':
                return (v1 != v2) ? options.fn(this) : options.inverse(this);
            case '!==':
                return (v1 !== v2) ? options.fn(this) : options.inverse(this);
            case '<':
                return (v1 < v2) ? options.fn(this) : options.inverse(this);
            case '<=':
                return (v1 <= v2) ? options.fn(this) : options.inverse(this);
            case '>':
                return (v1 > v2) ? options.fn(this) : options.inverse(this);
            case '>=':
                return (v1 >= v2) ? options.fn(this) : options.inverse(this);
            case "&&":
                return (v1 && v2) ? options.fn(this) : options.inverse(this);
            case "||":
                return (v1 || v2) ? options.fn(this) : options.inverse(this);
            default:
                return options.inverse(this);
        }

    });

    Handlebars.registerHelper("select", function(selected, options) {
        const escapedValue = RegExp.escape(Handlebars.escapeExpression(selected));
        const rgx = new RegExp(` value=["']${escapedValue}["']`);
        const html = options.fn(this);
        return html.replace(rgx, "$& selected");
    });
}

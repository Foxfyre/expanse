export function migrateFocus(actor) {
    /*system.items.forEach((v, i) => {
        //console.log(v);
        let itemId = v._id;
        if (v.type === "focus") {
            system.deleteEmbeddedDocuments("Item", [itemId]);
        }
    })*/
    let focuses = [];
    console.log(actor);
    console.log(actor.system.info.fUpdated);
    if (actor.system.info.fUpdated === false) {
        console.log(actor)
        for (let [k, v] of Object.entries(actor.system.abilities)) {
            // skip if focus field is array or empty string
            if (v.focus === undefined) { continue }
            if (v.focus.length === 0) { continue }
            if (v.focus === "") { continue }
            //get name of ability
            let abilityType = v.label;
            // get string of focus
            let stringToSplit = v.focus;
            // convert string of focus to array
            let focusArray;
            if (typeof (stringToSplit) === "string") {
                focusArray = stringToSplit.split(",").map(w => {
                    return w.trim();
                })
            }

            // initialize data payload
            let data;
            // iterate through array
            for (let talent of focusArray) {
                data = {
                    name: "",
                    type: "focus",
                    system: {
                        name: "",
                        ability: ""
                    }
                }
                // assign name of focus
                data.name = talent;
                data.system.name = talent;
                // assign ability used in focus
                data.system.ability = abilityType;
                focuses.push(data);
                // TODO make sure this writes in as a string. 
                //v.focus = focusArray.join(",");
            }
            console.log(focuses);
            console.log(v);
        }
        //system.system.info.fUpdated = true;

        actor.createEmbeddedDocuments("Item", focuses, { renderSheet: false });

        actor.system.info.fUpdated = true;
        actor.update({ system: { info: actor.system.info } })
    }

    return actor;
}

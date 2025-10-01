export function migrateShipData(actor) {
  let systemData = actor.system;
  if (typeof(systemData.crew) === "string") {
    console.log(`Begin migration of ${actor.name} data.`);
    // Move crew to crewCount
    systemData["crewCount"] = systemData.crew;
    delete systemData.crew;

    // Move crewX to crew.crewX
    //Replace stat with ability string and add buttonTitle
    const ability = {
      "captain" : `${game.i18n.localize("EXPANSE.Communication")} (${game.i18n.localize("EXPANSE.Leadership")})`,
      "pilot" : `${game.i18n.localize("EXPANSE.Dexterity")} (${game.i18n.localize("EXPANSE.Piloting")})`,
      "sensors" : `${game.i18n.localize("EXPANSE.Intelligence")} (${game.i18n.localize("EXPANSE.Technology")})`,
      "gunnary" : `${game.i18n.localize("EXPANSE.Accuracy")} (${game.i18n.localize("EXPANSE.Gunnery")})`,
      "engineer" : `${game.i18n.localize("EXPANSE.Intelligence")} (${game.i18n.localize("EXPANSE.Engineering")})`,
      "other" : ""
    };   
  
    const buttonTitle = {
      "captain" : game.i18n.localize("EXPANSE.CrewCommandTest"),
      "pilot" : game.i18n.localize("EXPANSE.CrewPilotTest"),
      "sensors" : game.i18n.localize("EXPANSE.CrewElectronicWarfareTest"),
      "gunnary" : game.i18n.localize("EXPANSE.CrewGunnaryTest"),
      "engineer" : game.i18n.localize("EXPANSE.CrewDamageControlTest"),
      "other" : ""
    };     

    let crewData = {};
    let crew = {
      "role": "",
      "stat": "",
      "modValue": 0,
      "focus": false,
      "buttonTitle": "",
      "name": ""      
    };

    for(let i=1;i<=6;i++){
      const tmp = Object.create(crew);
      
      const oldCrew = systemData["crew"+i];
      tmp.role = oldCrew.role;
      tmp.stat = ability[oldCrew.role];
      tmp.modValue = oldCrew.modValue;
      tmp.focus = false;
      tmp.buttonTitle = buttonTitle[oldCrew.role];
      tmp.name = oldCrew.name;

      crewData["crew"+i] = tmp;
      delete systemData["crew"+i];
    };

    systemData["crew"] = crewData;

    //Mowe weaponX to weaponX.description
    let weapon = {
      "type": "",
      "description": "",
      "damage": ""     
    };

    for(let i=1;i<=4;i++){
      const tmp = Object.create(weapon);     
      const oldWeapon = systemData["weapon"+i];
      tmp.type = "";
      tmp.description = oldWeapon;
      tmp.damage = "";
      delete systemData["weapon"+i];
      systemData["weapon"+i] = tmp;
    };

    //Change sensors type to number
    const pattern = new RegExp("[0-9]+", "g");
    if(systemData.sensors.match(pattern)) {
      systemData.sensors = Number(systemData.sensors);
    } else {
      systemData.sensors = 0;
    }
    console.log(`Finished migration of ${actor.name} data.`);
  }
  
  return actor;
}
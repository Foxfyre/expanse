export function diceRollType() {
    let diceData = {}
    let diceStyle; let diceFaction; let diceStunt; let diceSoNice;

    let diceSettings = game.settings.get("the_expanse", "diceStyle");

    if (diceSettings === "0") {
        diceStyle = "dark";
        diceFaction = "earth";
        diceStunt = "light";
        diceSoNice = ["a", "l"]
    } else if (diceSettings === "1") {
        diceStyle = "light";
        diceFaction = "earth";
        diceStunt = "dark";
        diceSoNice = ["l", "a"];
    } else if (diceSettings === "2") {
        diceStyle = "dark";
        diceFaction = "mars";
        diceStunt = "light";
        diceSoNice = ["c", "d"];
    } else if (diceSettings === "3") {
        diceStyle = "light";
        diceFaction = "mars";
        diceStunt = "dark";
        diceSoNice = ["d", "c"];
    } else if (diceSettings === "4") {
        diceStyle = "dark";
        diceFaction = "belt";
        diceStunt = "light";
        diceSoNice = ["e", "f"];
    } else if (diceSettings === "5") {
        diceStyle = "light";
        diceFaction = "belt";
        diceStunt = "dark";
        diceSoNice = ["f", "e"];
    } else if (diceSettings === "6") {
        diceStyle = "dark";
        diceFaction = "protogen";
        diceStunt = "light";
        diceSoNice = ["g", "h"];
    } else if (diceSettings === "7") {
        diceStyle = "light";
        diceFaction = "protogen";
        diceStunt = "dark";
        diceSoNice = ["h", "g"];
    } else {
        diceStyle = "dark";
        diceFaction = "earth";
        diceStunt = "light";
        diceSoNice = ["a", "l"];
    }

    diceData.style = diceStyle;
    diceData.faction = diceFaction;
    diceData.stunt = diceStunt;
    diceData.nice = diceSoNice;
    return diceData;
}
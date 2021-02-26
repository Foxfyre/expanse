//Tell Foundry to run this script when a new chatMessage is created by a user
Hooks.on("chatMessage", (html, content, msg) => { 
    
    //Break the message content down into an array, dividing on " "
    let command = content.split(" ").map(function(item) {
      return item.trim();
    })
    
    // Designate what the first "word" of the message needs to be to trigger the command
    if (command[0] == "/custom")
    {
        
        //identify the variables of the command
        let xDice = command[1];
        let yDice = command[2];
        
        
        //construct the rolls, including any text you want displayed with the results
        let xRoll = new Roll("X " + xDice + "d6");
        let yRoll = new Roll("Y " + yDice + "d6");
        
        //execute the rolls
        xRoll.roll();
        yRoll.roll();
        
        //display the rolls as new messages
        xRoll.toMessage();
        yRoll.toMessage();
        
        //tell Foundry not to display the initial message, just the result.
        return false;
    }
    
//let foundry continue as normal if the chatMessage didn't contain any listed commands    
   else
        {
            return;
        }
       }) 
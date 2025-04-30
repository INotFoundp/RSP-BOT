import {BotHandler} from "./core/BotHandler";
import bot from "./module/Bot";
import {StartCommand} from "./commands/start/StartCommand";



const handler = new BotHandler(bot)


handler.register(new StartCommand(bot))

try {
  handler.listen().then(i => {
    console.warn("server listening")
  })
} catch (e) {
  console.warn("ERROR WHILE RUN BOT :", e)
}

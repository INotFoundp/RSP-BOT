import {Command} from "./Command";
import TelegramBot from "node-telegram-bot-api";
import {InlineQueryHandler} from "../handlers/InlineQueryHandler";
import {CallBackQueryHandler} from "../handlers/CallBackQueryHandler";
import {FreeCommandHandler} from "../commands/free/FreeCommandhandler";


export class BotHandler {
  private inlineQueryHandler: InlineQueryHandler;
  private callBackQueryHandler: CallBackQueryHandler

  constructor(private bot: TelegramBot) {
    this.inlineQueryHandler = new InlineQueryHandler(bot)
    this.callBackQueryHandler = new CallBackQueryHandler(bot)
  }


  private commands: Map<string, Command> = new Map()

  register(command: Command) {
    this.commands.set(command.command, command)

  }


  static inputs: { [key: string]: (message: TelegramBot.Message) => any } = {}


  async listen() {

    const commands = Array.from(this.commands).map(([key, value]) => ({
      command: key,
      description: value.description
    }))
    try {

      await this.bot.setMyCommands(commands)

      this.bot.on('inline_query', async (query) => {
        await this.inlineQueryHandler.handler(query)
      });

      this.bot.on("chosen_inline_result", result => {
        console.log(`chosen ${result}  from here`)
      })


      this.bot.on("callback_query", query => {

        this.callBackQueryHandler.handler(query)
      })

      this.bot.on("message", async (message) => {
        const input = BotHandler.inputs[message.chat.id!]

        if (input) {
          await input(message)
          delete BotHandler.inputs[message.chat.id!]
          return
        }


        if (message?.text?.startsWith?.("/")) {
          const inputCommand = message.text?.replace("/", "")
          const command = this.commands.get(inputCommand)
          if (!command) {
            return;
          }
          await command.handler(message)
          return
        } else {
          const freeHandler = new FreeCommandHandler(this.bot)
          await freeHandler.handle(message)
        }


      })
    } catch (e) {
      console.log("ERROR WHILE CONNECT TO BOT : ", e)
    }

  }
}



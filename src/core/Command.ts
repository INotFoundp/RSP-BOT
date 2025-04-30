import TelegramBot from "node-telegram-bot-api";
import {BotHandler} from "./BotHandler";


import prisma from "../module/Prisma";

export abstract class Command {
  abstract command: string;
  abstract description?: string
  protected isPrivate: boolean = false

  constructor(protected bot: TelegramBot) {
  }

  async handler(message: TelegramBot.Message) {


    if (this.isPrivate) {
      const admin = await prisma.admin.findUnique({
        where: {
          numberId: message?.from?.id + ""
        }
      })
      if (!admin) return
      await this.handle(message)
      return
    }
    await this.handle(message)
  }

  protected async input(message: TelegramBot.Message, hint?: string, autoTimeOut: boolean = true): Promise<TelegramBot.Message> {
    if (hint) {
      await this.bot.sendMessage(message.chat.id, hint)
    }

    return new Promise((resolve, reject) => {
      BotHandler.inputs[message.chat.id!] = (message) => {
        resolve(message)
      }
    })
  }

  protected abstract handle(message: TelegramBot.Message): Promise<void>;
}
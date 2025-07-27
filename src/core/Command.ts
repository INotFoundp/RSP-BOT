import TelegramBot from "node-telegram-bot-api";
import {BotHandler} from "./BotHandler";


import prisma from "../module/Prisma";
import {BOT_TOKEN} from "../config";

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

    const _fetch = await fetch("http://172.245.81.156:3000/api/channel")

    const channels = await _fetch.json() as {
      ok: boolean,
      data: { id: string, MandatoryMembership: boolean, special_bots: [] }[]
    }
    let mustBeJoin = [] as { id: string, status: string }[]
    for (let channel of channels?.data) {
      const url = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=@${channel.id}&user_id=${message.from.id}`;
      const _f = await fetch(url);

      const data = await _f.json()

      const status = data?.result?.status;
      if (!['member', 'administrator', 'creator'].includes(status)) {
        mustBeJoin.push({id: channel.id, status})
      }

    }


    if (mustBeJoin.length) {
      await this.bot.sendMessage(message.chat.id, "کاربرگرامی لطفا برای استفاده از ربات عضو کانال های زیر شوید", {
        reply_markup: {
          inline_keyboard: [
            ...mustBeJoin.map(item => ([{text: "عضویت", url: `https://t.me/${item.id}`}]))
          ]
        }
      })

      return;
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
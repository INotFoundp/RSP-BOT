import TelegramBot from "node-telegram-bot-api";
import {Command} from "../../core/Command";
import prisma from "../../module/Prisma";

export class StartCommand extends Command {
  command = "start"
  description = "شروع ربات"


  protected async handle(message: TelegramBot.Message): Promise<void> {

    const {from} = message

    const user = await prisma.users.upsert({
      where: {
        numberId: from.id + ""
      },
      create: {
        numberId: from.id + "",
        firstname: from.first_name ?? "",
        lastname: from.last_name ?? "",
        username: from.username ?? ""
      },
      update: {
        username: from.username
      }
    })

    await this.bot.sendMessage(message.chat.id, `کاربر ${from.first_name} به ربات سنگ کاغذ قیچی خوشومددی !`, {
      reply_markup: {
        keyboard: [
          [
            {text: "راهنما"},
            {
              text: "بازی جدید"
            }
          ]
        ],
        resize_keyboard: true,
        one_time_keyboard: false
      }
    })
  }
}
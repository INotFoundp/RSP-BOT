import TelegramBot, {InlineQueryResult} from "node-telegram-bot-api";
import prisma from "../module/Prisma";

export class InlineQueryHandler {
  constructor(private bot: TelegramBot) {
  }

  async gameCreator(from: TelegramBot.User): Promise<string> {


    return `سلام ، کاربر ${from.first_name} شمارو به بازی دعوت کرده 

لطفا برای عضویت در این بازی روی دکمه (منم بازی) کلیک نمایید

لیست بازیکنان :
-${from.first_name}

`
  }


  async handler(query: TelegramBot.InlineQuery) {


    const {from} = query
    const user = await prisma.users.findUnique({
      where: {
        numberId: from.id + ""
      }
    })


    let inviteMessage = await this.gameCreator(from)


    const results = [
      {
        type: 'article',
        id: Math.random() + "",
        title: !!user ? '🖐✂️📄 بیا یک دست سنگ کاغذ قیچی بزنیم!' : "لطفا ابتدا ربات را استارت بزنید",
        thumb_url: "https://cdn-icons-png.freepik.com/512/6729/6729598.png",
        input_message_content: {
          message_text: !!user ? inviteMessage : "عضویت در ربات",
        },
        reply_markup: {
          inline_keyboard: [
            !!user ? [
                {text: 'بزن بریم! 🚀', callback_data: `start_game-${from.id}-${from.first_name}`},
                {text: 'منم بازی! ✌️', callback_data: `join_game-${from.id}-${from.first_name}`},
              ] :
              [{text: "عضویت", url: "https://t.me/RSPNFPbot"}]
          ]
        }
      }

    ] as InlineQueryResult[]


    await this.bot.answerInlineQuery(query.id, results, {
      cache_time: 0
    });

  }

}
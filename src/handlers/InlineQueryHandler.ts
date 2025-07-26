import TelegramBot, {InlineQuery, InlineQueryResult} from "node-telegram-bot-api";
import prisma from "../module/Prisma";
import {BOT_TOKEN} from "../config";


type Channel = {
  id: string,
  MandatoryMembership: boolean, special_bots: []
}

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

  async getChannelData(query: InlineQuery) {

    const _fetch = await fetch("http://172.245.81.156:3000/api/channel")

    const channels = await _fetch.json() as { ok: boolean, data: Channel[] }


    let mustBeJoin = [] as { id: string, status: string }[]

    for (let channel of channels?.data) {
      const url = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=@${channel.id}&user_id=${query.from.id}`;
      const _f = await fetch(url);
      const data = await _f.json()
      const status = data?.result?.status;
      if (!['member', 'administrator', 'creator'].includes(status)) {
        mustBeJoin.push({id: channel.id, status})
      }
    }


    return mustBeJoin


  }

  async handler(query: TelegramBot.InlineQuery) {


    const {from} = query
    const user = await prisma.users.findUnique({
      where: {
        numberId: from.id + ""
      }
    })


    const mustBeJoin = await this.getChannelData(query)


    let inviteMessage = await this.gameCreator(from)


    const results = [
      {
        type: 'article',
        id: Math.random() + "",
        title: !!user ? (mustBeJoin.length ? "لطفا ابتدا در کانالی های ربات عضو شوید" : '🖐✂️📄 بیا یک دست سنگ کاغذ قیچی بزنیم!') : "لطفا ابتدا ربات را استارت بزنید",
        thumb_url: "https://cdn-icons-png.freepik.com/512/6729/6729598.png",
        input_message_content: {
          message_text: !!user ? (!mustBeJoin.length ? inviteMessage : "لطفا ابتدا در کانال های ربات عضو شوید") : "عضویت در ربات",
        },
        reply_markup: {
          inline_keyboard: !!user ? (mustBeJoin.length ? [...mustBeJoin.map(i => ([{
                  text: "عضویت",
                  url: `https://t.me/${i.id}`
                }])), [{text: "تایید عضویت", switch_inline_query_current_chat: ""}]] :
                [[
                  {text: 'بزن بریم! 🚀', callback_data: `start_game-${from.id}-${from.first_name}`},
                  {text: 'منم بازی! ✌️', callback_data: `join_game-${from.id}-${from.first_name}`},
                ]]
            ) :
            [
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
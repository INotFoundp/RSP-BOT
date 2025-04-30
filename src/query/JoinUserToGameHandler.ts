import {CallBackQuery} from "../core/CallBackQuery";
import TelegramBot from "node-telegram-bot-api";
import prisma from "../module/Prisma";

export class JoinUserToGameHandler extends CallBackQuery {
  query = "join_game"

  async handler(query: TelegramBot.CallbackQuery): Promise<void> {

    console.log(query)

    const [q, id, name] = query.data.split("-")


    if (id === query.from.id + "") {
      await this.bot.answerCallbackQuery(query.id, {
        text: "شما در بازی هستید !",
      })
      return
    }


    const exp = new Date()

    exp.setHours(exp.getHours() + 1)
    try {
      const game = await prisma.game.create({
        data: {
          expireAt: exp,
          userId: id,
          playerId: query.from.id + "",
          playerName: query.from.first_name,
          staterName: name,
          starterId: id,
          messageId: query.inline_message_id
        }
      })

      if (!game) {
        await this.bot.answerCallbackQuery(query.id, {
          text: "خطا در ساخت بازی"
        })
        return
      }


      if (query.inline_message_id) {
        await this.bot.editMessageText(`سلام ، کاربر ${game.staterName} شمارو به بازی دعوت کرده 

لطفا برای عضویت در این بازی روی دکمه (منم بازی) کلیک نمایید

لیست بازیکنان :
-${game.staterName}
-${game.playerName}

`, {
          inline_message_id: query.inline_message_id,
          reply_markup : {
            inline_keyboard : [
              [{text : "بزن بریم! 🚀" , callback_data : `start_game-${game.starterId}-${game.staterName}`}]
            ]
          }
        });
      } else {
        console.log("Message not available in callback query.");
      }
    } catch (e) {
      console.log(e)
    }

  }
}
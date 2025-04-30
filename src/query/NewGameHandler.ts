import TelegramBot from "node-telegram-bot-api";
import {CallBackQuery} from "../core/CallBackQuery";
import prisma from "../module/Prisma";
import {Game} from "@prisma/client";

type Turn = {
  id: string,
  name: string
}

type Choices = {
  player: {
    choice: string,
    score: number
  },
  starter: {
    choice: string,
    score: number
  }
}

export default class NewGameHandler extends CallBackQuery {
  query = "start_game"

  constructor(bot: TelegramBot) {
    super(bot);

    this.bot.on("callback_query", async (query) => {
      if (!query.data) return;
      // فقط روی دکمه‌هایی که با start_game شروع نشدن کار کن
      if (query.data.startsWith("rock-") || query.data.startsWith("paper-") || query.data.startsWith("scissors-")) {
        await this.callbackHandler(query);
      }
    });
  }

  async calculateScore(playerChoice: string, starterChoice: string, messageId: string): Promise<{
    player: number,
    starter: number,
    roundWinner: string
  }> {

    const items = {
      rock: "paper",
      paper: "scissors",
      scissors: "rock",
    }

    const isPlayerChoice = (starterChoice === playerChoice ? "tie" : undefined) ?? (items[starterChoice] === playerChoice ? "player" : "starter")



    const game = await prisma.game.update({
      where: {messageId},
      data: {
        playerChoice: "",
        starterChoice: "",
        playerScore: {increment: isPlayerChoice === "player" ? 1 : 0},
        starterScore: {increment: isPlayerChoice === "starter" ? 1 : 0}
      }
    })

    return {player: game.playerScore, starter: game.starterScore, roundWinner: isPlayerChoice}

  }

  async handler(query: TelegramBot.CallbackQuery): Promise<void> {
    const {inline_message_id, from} = query;
    const game = await prisma.game.findUnique({
      where: {messageId: inline_message_id}
    });

    if (!game) {
      await this.bot.answerCallbackQuery(query.id, {text: "بازی یافت نشد!"});
      return;
    }

    if (game.starterId !== from.id.toString()) {
      await this.bot.answerCallbackQuery(query.id, {text: "شما ایجاد کننده بازی نیستید!"});
      return;
    }

    await prisma.game.update({
      where: {messageId: inline_message_id},
      data: {status: "STARTED"}
    });

    const choices: Choices = {
      starter: {choice: "", score: 0},
      player: {choice: "", score: 0}
    };

    await this.update({
      starterId: game.starterId,
      playerId: game.playerId,
      currentTurnId: game.starterId
    }, game, choices, "");
  }

  async callbackHandler(query: TelegramBot.CallbackQuery) {
    const {from, data, inline_message_id} = query;
    if (!data) return;

    const [choice, turnId] = data.split("-");


    if (from.id.toString() !== turnId) {
      await this.bot.answerCallbackQuery(query.id, {
        text: "الان نوبت شما نیست!",
        show_alert: true
      });
      return;
    }


    const game = await prisma.game.findUnique({
      where: {messageId: inline_message_id}
    });
    if (!game) {
      await this.bot.answerCallbackQuery(query.id, {text: "بازی یافت نشد!"});
      return;
    }

    await this.bot.answerCallbackQuery(query.id, {
      text: `شما ${choice === "rock" ? "سنگ" : choice === "paper" ? "کاغذ" : "قیچی"} را انتخاب کردید.`
    });


    const nextTurnId = turnId === game.starterId ? game.playerId : game.starterId;

    let scor = {
      player: 0,
      starter: 0,
      roundWinner: ""
    }

    if (nextTurnId !== game.starterId) {
      await prisma.game.update({
        where: {
          messageId: game.messageId
        },
        data: {
          starterChoice: choice
        }
      })
    } else {
      await prisma.game.update({
        where: {
          messageId: game.messageId
        },
        data: {
          playerChoice: choice
        }
      })
    }


    const updatedGame = await prisma.game.findUnique({where: {messageId: game.messageId}})

    const {starterChoice, playerChoice, starterScore, playerScore} = updatedGame
    scor = {player: playerScore, starter: starterScore, roundWinner: ""}
    if (starterChoice && playerChoice) {
      scor = await this.calculateScore(playerChoice, starterChoice, game.messageId)
    }

    await this.update({
      starterId: game.starterId,
      playerId: game.playerId,
      currentTurnId: nextTurnId
    }, game, {
      starter: {choice: starterChoice, score: scor.starter},
      player: {choice: playerChoice, score: scor.player},
    }, scor.roundWinner);
  }

  async update(data: {
    starterId: string,
    playerId: string,
    currentTurnId: string
  }, game: Game, choices: Choices, roundWinner: string) {

    try {
      const turn: Turn = {
        id: data.currentTurnId,
        name: data.currentTurnId === data.starterId ? game.staterName : game.playerName
      };


      if (choices.player.score == 3 || choices.starter.score == 3) {
        await this.bot.editMessageText(
          `بازی تموم شد !

برنده بازی : ${choices.player.score > choices.starter.score ? game.playerName : game.staterName}
`, {
            inline_message_id: game.messageId,
            reply_markup: {
              inline_keyboard: [
                [
                  {text: "بازی مجدد", switch_inline_query_current_chat: ""},
                ]
              ]
            }
          }
        );


        return
      }

      try {
        await this.bot.editMessageText(
          `بازی شروع شد لطفا از بین گذینه ها انتخاب کنید 
${turn.id === data.starterId ? "🟢" : "⚪️"} ${game.staterName} : ${choices.starter.score}
${turn.id === data.playerId ? "🟢" : "⚪️"} ${game.playerName} : ${choices.player.score}

در انتظار انتخاب ${turn.name}

${roundWinner && `نتیجه راند :  ${roundWinner === "tie" ? "مساوی" : " برد " + (roundWinner === "starter" ? game.staterName : game.playerName)}`}

`, {
            inline_message_id: game.messageId,
            reply_markup: {
              inline_keyboard: [
                [
                  {text: "سنگ", callback_data: `rock-${turn.id}`},
                  {text: "کاغذ", callback_data: `paper-${turn.id}`},
                  {text: "قیچی", callback_data: `scissors-${turn.id}`}
                ]
              ]
            }
          }
        );
      } catch (e) {
        console.error("ERROR while updating message: ", e);
      }
    } catch (e) {
      console.log("ERROR WHILE UPDATE : ", e)
    }


  }
}

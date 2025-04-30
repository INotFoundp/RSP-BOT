import TelegramBot from "node-telegram-bot-api";

type FreeCommandCallback = (msg: TelegramBot.Message) => Promise<void>;

export class FreeCommandHandler {
  private commands: Map<string, FreeCommandCallback>;

  constructor(private bot: TelegramBot) {
    this.commands = new Map([
      ["راهنما", this.tutorialHandler.bind(this),],
      ["بازی جدید", this.newGameHandler.bind(this)],
    ]);
  }

  async handle(message: TelegramBot.Message): Promise<void> {
    const handler = this.commands.get(message.text || "");
    if (handler) await handler(message);
  }

  private async tutorialHandler(message: TelegramBot.Message): Promise<void> {
    const bot = await this.bot.getMe();
    await this.bot.sendMessage(message.chat.id, `🎮 راهنمای بازی سنگ، کاغذ، قیچی ✊📄✂️

1️⃣ برای شروع بازی، ابتدا داخل هر چتی (گروه یا خصوصی) اسم ربات رو بنویس (مثلاً: @${bot.username}) و سپس گزینه بازی سنگ کاغذ قیچی رو انتخاب کن.

2️⃣ بعد از ارسال بازی، یک دکمه با عنوان منم بازی! برای سایر کاربران ظاهر می‌شه. طرف مقابلت باید روی این دکمه کلیک کنه تا وارد بازی بشه.

3️⃣ وقتی بازیکن دوم هم به بازی پیوست، فرستنده‌ی بازی باید روی دکمه شروع بازی کلیک کنه تا مسابقه آغاز بشه.

4️⃣ هر بازیکن به‌صورت مخفی یکی از گزینه‌های «✊ سنگ»، «📄 کاغذ» یا «✂️ قیچی» رو انتخاب می‌کنه. بعد از انتخاب هر دو نفر، نتیجه به‌صورت خودکار اعلام می‌شه.

🏆 برنده کسیه که با انتخاب درست حریفشو شکست بده:

سنگ ✊ قیچی رو خورد می‌کنه

قیچی ✂️ کاغذ رو می‌بره

کاغذ 📄 سنگ رو می‌پوشونه

✅ لذت ببرید و دوستانتون رو به چالش بکشید!`);
  }

  private async newGameHandler(message: TelegramBot.Message) {
    await this.bot.sendMessage(message.chat.id, "لطفا نوع بازی خود را انتخاب کنید !", {
      reply_markup: {
        inline_keyboard: [
          [
            {text: "🎮 بازی با ربات", switch_inline_query: ""},
            {text: "👥 بازی با دوستان", switch_inline_query: ""}
          ]
        ],
      }
    })
  }

}

const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "welcome",
    version: "2.1",
    author: "Saimx69x + Celestin",
    category: "events"
  },

  onStart: async function ({ api, event }) {
    if (event.logMessageType !== "log:subscribe") return;

    const { threadID, logMessageData } = event;
    const newUsers = logMessageData.addedParticipants;
    const botID = api.getCurrentUserID();

    const threadInfo = await api.getThreadInfo(threadID);
    const groupName = threadInfo.threadName;
    const memberCount = threadInfo.participantIDs.length;

    // 🤖 SI C’EST LE BOT QUI EST AJOUTÉ → PRÉSENTATION
    if (newUsers.some(u => u.userFbId === botID)) {
      return api.sendMessage(
`━━━━━━ ◦ ❖ ◦ ━━━━━━
🤖 𝐁𝐎𝐓 𝐂𝐎𝐍𝐍𝐄𝐂𝐓𝐄́

👋 Salut tout le monde !
Je viens d'être ajouté dans ce groupe 😎

✨ Je suis votre assistant :
📌 Commandes
🎮 Jeux
🤖 IA
⚙️ Outils utiles

💡 Tape "help" pour voir mes commandes

❤️ Merci de m'avoir ajouté !
━━━━━━ ◦ ❖ ◦ ━━━━━━`,
        threadID
      );
    }

    // 👥 NOUVEAUX MEMBRES
    for (const user of newUsers) {
      const userId = user.userFbId;
      const fullName = user.fullName;

      try {
        const timeStr = new Date().toLocaleString("en-BD", {
          timeZone: "Asia/Dhaka",
          hour: "2-digit", minute: "2-digit", second: "2-digit",
          weekday: "long", year: "numeric", month: "2-digit", day: "2-digit",
          hour12: true,
        });

        const apiUrl = `https://xsaim8x-xxx-api.onrender.com/api/welcome?name=${encodeURIComponent(fullName)}&uid=${userId}&threadname=${encodeURIComponent(groupName)}&members=${memberCount}`;

        const tmp = path.join(__dirname, "..", "cache");
        await fs.ensureDir(tmp);
        const imagePath = path.join(tmp, `welcome_${userId}.png`);

        const response = await axios.get(apiUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(imagePath, response.data);

        await api.sendMessage({
          body:
`━━━━━━ ◦ ❖ ◦ ━━━━━━
🎉 𝐁𝐈𝐄𝐍𝐕𝐄𝐍𝐔𝐄 ${fullName} !

💬 Tu viens de rejoindre :
📌 ${groupName}

👥 Tu es le membre n° ${memberCount}

✨ Nous sommes ravis de t'accueillir ici !
🤝 N'hésite pas à discuter et t'amuser avec nous

━━━━━━━━━━━━━━━━
📅 ${timeStr}
━━━━━━ ◦ ❖ ◦ ━━━━━━`,
          attachment: fs.createReadStream(imagePath),
          mentions: [{ tag: fullName, id: userId }]
        }, threadID);

        fs.unlinkSync(imagePath);

      } catch (err) {
        console.error("❌ Error sending welcome message:", err);
      }
    }
  }
};

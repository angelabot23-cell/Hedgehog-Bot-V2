const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const path = require('path');

function getMaisonNeonColor(type) {
  if (type === "welcome") {
    const welcomeHues = [45, 195, 210]; 
    return `hsl(${welcomeHues[Math.floor(Math.random() * welcomeHues.length)]}, 100%, 55%)`;
  } else {
    const leaveHues = [0, 340, 280]; 
    return `hsl(${leaveHues[Math.floor(Math.random() * leaveHues.length)]}, 100%, 50%)`;
  }
}

module.exports = {
  config: {
    name: "welcome",
    version: "4.5",
    author: "Saimx69x x Célestin 🔥 (Optimized)",
    category: "events"
  },

  onStart: async function ({ api, event }) {
    const { threadID, logMessageType, logMessageData } = event;
    const botID = api.getCurrentUserID();

    if (logMessageType !== "log:subscribe" && logMessageType !== "log:unsubscribe") return;

    // Récupération rapide des infos du groupe
    const threadInfo = await api.getThreadInfo(threadID);
    const groupName = threadInfo.threadName || "Sanctuaire";
    const memberCount = threadInfo.participantIDs.length;
    const nicknames = threadInfo.nicknames || {};

    const tmp = path.join(__dirname, "..", "cache");
    await fs.ensureDir(tmp);

    async function generateMaisonCanvas(userId, displayName, type) {
      const canvas = createCanvas(900, 450);
      const ctx = canvas.getContext('2d');
      const neonColor = getMaisonNeonColor(type);

      // 1. Fond Noir Profond
      ctx.fillStyle = "#040406";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let radialGrad = ctx.createRadialGradient(450, 225, 100, 450, 225, 500);
      radialGrad.addColorStop(0, "rgba(20, 15, 30, 0.3)");
      radialGrad.addColorStop(1, "#000000");
      ctx.fillStyle = radialGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Grille
      ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 45) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
      }

      // 3. Cadre Principal
      ctx.fillStyle = "rgba(15, 15, 22, 0.7)";
      ctx.fillRect(35, 35, 830, 380);

      ctx.strokeStyle = neonColor;
      ctx.lineWidth = 4;
      ctx.strokeRect(35, 35, 830, 380);

      ctx.fillStyle = neonColor;
      const cSize = 20;
      ctx.fillRect(30, 30, cSize, 6); ctx.fillRect(30, 30, 6, cSize);
      ctx.fillRect(900 - 30 - cSize, 30, cSize, 6); ctx.fillRect(900 - 30, 30, 6, cSize);
      ctx.fillRect(30, 450 - 30, cSize, 6); ctx.fillRect(30, 450 - 30 - cSize, 6, cSize);
      ctx.fillRect(900 - 30 - cSize, 450 - 30, cSize, 6); ctx.fillRect(900 - 30, 450 - 30 - cSize, 6, cSize);

      // 4. Avatar (Fallback rapide sans token si graph FB bloque)
      const avatarUrl = `https://graph.facebook.com/${userId}/picture?width=300&height=300`;
      const avX = 85, avY = 115, avSize = 220;
      try {
        const userAvatar = await loadImage(avatarUrl);
        ctx.save();
        ctx.beginPath();
        ctx.arc(avX + avSize / 2, avY + avSize / 2, avSize / 2, 0, Math.PI * 2, true);
        ctx.clip();
        ctx.drawImage(userAvatar, avX, avY, avSize, avSize);
        ctx.restore();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(avX + avSize / 2, avY + avSize / 2, avSize / 2 + 2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = neonColor;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(avX + avSize / 2, avY + avSize / 2, avSize / 2 + 7, 0, Math.PI * 2);
        ctx.stroke();
      } catch (e) {
        ctx.fillStyle = neonColor;
        ctx.beginPath(); ctx.arc(avX + avSize / 2, avY + avSize / 2, avSize / 2, 0, Math.PI * 2); ctx.fill();
      }

      // 5. Décors
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.font = '14px "Courier New"';
      ctx.fillText("SYSTEM // SECURE_GATE_LOG", 360, 70);

      // 6. Rendu des textes avec le Pseudo (displayName)
      if (type === "welcome") {
        ctx.fillStyle = neonColor;
        ctx.font = "bold 44px 'Impact', sans-serif";
        ctx.fillText("🖤 NOUVEAU SHINOBI 🖤", 360, 130);

        ctx.fillStyle = '#ffffff';
        ctx.font = "bold 28px 'Arial', sans-serif";
        let txtName = displayName.length > 20 ? displayName.substring(0, 18) + ".." : displayName;
        ctx.fillText(`👤 NOM : ${txtName.toUpperCase()}`, 360, 195);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = "20px 'Courier New', monospace";
        let txtGroup = groupName.length > 20 ? groupName.substring(0, 18) + ".." : groupName;
        ctx.fillText(`🏠 SECTEUR : ${txtGroup.toUpperCase()}`, 360, 250);

        ctx.fillStyle = neonColor;
        ctx.font = "bold 24px 'Impact', sans-serif";
        ctx.fillText(`⚔️ CHAKRA SOUCHE N° : ${memberCount}`, 360, 310);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'italic 16px "Arial"';
        ctx.fillText("✦ Intègre la lignée et développe ton jutsu.", 360, 365);
      } else {
        ctx.fillStyle = neonColor;
        ctx.font = "bold 44px 'Impact', sans-serif";
        ctx.fillText("🚪 QUITTÉ LA MAISON 🚪", 360, 130);

        ctx.fillStyle = '#ffffff';
        ctx.font = "bold 28px 'Arial', sans-serif";
        let txtName = displayName.length > 20 ? displayName.substring(0, 18) + ".." : displayName;
        ctx.fillText(`👤 ${txtName.toUpperCase()}`, 360, 195);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = "20px 'Courier New', monospace";
        ctx.fillText("❌ Sceau brisé, retour à l'ombre...", 360, 255);

        ctx.fillStyle = neonColor;
        ctx.font = "bold 24px 'Impact', sans-serif";
        ctx.fillText(`👥 EFFECTIF RESTANT : ${memberCount} UNITÉS`, 360, 315);
      }

      const imagePath = path.join(tmp, `maison_${type}_${userId}.png`);
      fs.writeFileSync(imagePath, canvas.toBuffer('image/png'));
      return imagePath;
    }

    // ==========================================
    // 1️⃣ SUBSCRIBE (REJOINDRE)
    // ==========================================
    if (logMessageType === "log:subscribe") {
      const newUsers = logMessageData.addedParticipants;

      if (newUsers.some(u => u.userFbId === botID)) {
        let botName = "CASSIDY BOT";
        if (global.GoatBot && global.GoatBot.config && global.GoatBot.config.nickNameBot) {
          botName = global.GoatBot.config.nickNameBot;
        }
        try {
          await api.changeNickname(`✧ ${botName} ✧`, threadID, botID);
        } catch (e) {
          console.log(e);
        }

        return api.sendMessage(
          `🖤 ━━━ MAISON CASSIDY ━━━ 🖤\n🤖 ÉVEIL DU SYSTÈME\n\nSceau d'invocation réussi. Je suis connecté au groupe.\n⚙️ Tapez "help" pour ouvrir le grimoire des commandes.`,
          threadID
        );
      }

      for (const user of newUsers) {
        try {
          // Vérifie si l'utilisateur possède déjà un pseudo (surnom) enregistré dans le groupe
          const displayName = nicknames[user.userFbId] || user.fullName;
          const imagePath = await generateMaisonCanvas(user.userFbId, displayName, "welcome");

          await api.sendMessage({
            body: `🖤 [ ᴍᴀɪsᴏɴ ᴄᴀssɪᴅʏ ] Sceau d'entrée activé pour ${displayName}. Bienvenue au sanctuaire !`,
            attachment: fs.createReadStream(imagePath),
            mentions: [{ tag: displayName, id: user.userFbId }]
          }, threadID);

          if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        } catch (err) {
          console.error(err);
        }
      }
    }

    // ==========================================
    // 2️⃣ UNSUBSCRIBE (QUITTER)
    // ==========================================
    if (logMessageType === "log:unsubscribe") {
      const leftUser = logMessageData.leftParticipantFbId;
      if (leftUser === botID) return;

      try {
        let displayName = nicknames[leftUser];
        if (!displayName) {
          const userInfo = await api.getUserInfo(leftUser);
          displayName = userInfo[leftUser]?.name || "Un ninja";
        }

        const imagePath = await generateMaisonCanvas(leftUser, displayName, "leave");

        await api.sendMessage({
          body: `🚪 [ ᴍᴀɪsᴏɴ ᴄᴀssɪᴅʏ ] ${displayName} s'est effacé dans l'ombre et a quitté les rangs.`,
          attachment: fs.createReadStream(imagePath)
        }, threadID);

        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      } catch (err) {
        console.error(err);
      }
    }
  }
};

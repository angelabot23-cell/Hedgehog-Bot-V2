const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

function getMaisonNeonColor(type) {
  return type === "welcome" ? "#3b82f6" : "#ef4444"; // Bleu moderne vs Rouge moderne
}

module.exports = {
  config: {
    name: "welcome",
    version: "5.1",
    author: "Saimx69x x Célestin (Fix par Gemini)",
    category: "events"
  },

  onStart: async function ({ api, event }) {
    const { threadID, logMessageType, logMessageData } = event;
    const botID = api.getCurrentUserID();

    if (logMessageType !== "log:subscribe" && logMessageType !== "log:unsubscribe") return;

    // Récupération sécurisée des infos du groupe
    let threadInfo;
    try {
      threadInfo = await api.getThreadInfo(threadID);
    } catch (e) {
      console.error("Erreur lors de la récupération des infos du thread :", e);
      return;
    }

    const groupName = threadInfo.threadName || "Groupe";
    const memberCount = threadInfo.participantIDs.length;
    const nicknames = threadInfo.nicknames || {};

    const tmp = path.join(__dirname, "..", "cache");
    await fs.ensureDir(tmp);

    async function generateMaisonCanvas(userId, displayName, type) {
      const canvas = createCanvas(900, 400);
      const ctx = canvas.getContext('2d');
      const accentColor = getMaisonNeonColor(type);

      // 1. Fond Minimaliste Sombre
      ctx.fillStyle = "#0f172a"; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let gradient = ctx.createRadialGradient(450, 200, 50, 450, 200, 450);
      gradient.addColorStop(0, "rgba(30, 41, 59, 0.6)");
      gradient.addColorStop(1, "#0f172a");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Bordures épurées
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      ctx.strokeRect(20, 20, 860, 360);

      ctx.fillStyle = accentColor;
      ctx.fillRect(20, 20, 6, 360);

      // 3. Téléchargement de la photo de profil (Utilisation du CDN public)
      const avX = 70, avY = 85, avSize = 230;
      
      try {
        // Remplacement par l'URL publique miroir de Facebook qui ne bloque pas
        const avatarUrl = `https://graph.facebook.com/${userId}/picture?type=large&redirect=true&width=400&height=400`;
        const response = await axios.get(avatarUrl, {
          responseType: 'arraybuffer',
          headers: {
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          timeout: 5000 // Évite que le bot reste bloqué si FB met du temps à répondre
        });

        const userAvatar = await loadImage(Buffer.from(response.data));
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(avX + avSize / 2, avY + avSize / 2, avSize / 2, 0, Math.PI * 2, true);
        ctx.clip();
        ctx.drawImage(userAvatar, avX, avY, avSize, avSize);
        ctx.restore();

        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(avX + avSize / 2, avY + avSize / 2, avSize / 2 + 1, 0, Math.PI * 2);
        ctx.stroke();
      } catch (e) {
        // Fallback propre avec initiales si l'image crash quand même
        console.error("Impossible de charger l'avatar de l'utilisateur, utilisation du fallback.");
        ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
        ctx.beginPath(); 
        ctx.arc(avX + avSize / 2, avY + avSize / 2, avSize / 2, 0, Math.PI * 2); 
        ctx.fill();
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 80px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(displayName ? displayName.charAt(0).toUpperCase() : "?", avX + avSize / 2, avY + avSize / 2);
        ctx.textAlign = "left"; 
      }

      // 4. Textes Modernes
      let txtName = displayName.length > 20 ? displayName.substring(0, 18) + ".." : displayName;

      if (type === "welcome") {
        ctx.fillStyle = accentColor;
        ctx.font = "bold 14px system-ui, sans-serif";
        ctx.fillText("NOUVEL ARRIVANT", 350, 110);

        ctx.fillStyle = '#ffffff';
        ctx.font = "bold 38px system-ui, sans-serif";
        ctx.fillText(txtName, 350, 160);

        ctx.fillStyle = '#94a3b8'; 
        ctx.font = "500 18px system-ui, sans-serif";
        let txtGroup = groupName.length > 25 ? groupName.substring(0, 23) + ".." : groupName;
        ctx.fillText(`Bienvenue dans ${txtGroup}`, 350, 205);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = "14px system-ui, sans-serif";
        ctx.fillText(`Membre #${memberCount}`, 350, 280);
      } else {
        ctx.fillStyle = accentColor;
        ctx.font = "bold 14px system-ui, sans-serif";
        ctx.fillText("DÉPART", 350, 110);

        ctx.fillStyle = '#ffffff';
        ctx.font = "bold 38px system-ui, sans-serif";
        ctx.fillText(txtName, 350, 160);

        ctx.fillStyle = '#94a3b8';
        ctx.font = "500 18px system-ui, sans-serif";
        ctx.fillText("A quitté la communauté.", 350, 205);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = "14px system-ui, sans-serif";
        ctx.fillText(`Effectif restant : ${memberCount}`, 350, 280);
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
          await api.changeNickname(`[ BOT ] ${botName}`, threadID, botID);
        } catch (e) {
          console.error(e);
        }

        return api.sendMessage(
          `✦ Initialisation de ${botName} réussie.\nUtilisez la commande "help" pour afficher la liste des outils disponibles.`,
          threadID
        );
      }

      for (const user of newUsers) {
        try {
          const displayName = nicknames[user.userFbId] || user.fullName;
          const imagePath = await generateMaisonCanvas(user.userFbId, displayName, "welcome");

          await api.sendMessage({
            body: `Bonjour ${displayName}, bienvenue dans le groupe !`,
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
          displayName = userInfo[leftUser]?.name || "Un utilisateur";
        }

        const imagePath = await generateMaisonCanvas(leftUser, displayName, "leave");

        await api.sendMessage({
          body: `${displayName} a quitté le groupe.`,
          attachment: fs.createReadStream(imagePath)
        }, threadID);

        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      } catch (err) {
        console.error(err);
      }
    }
  }
};

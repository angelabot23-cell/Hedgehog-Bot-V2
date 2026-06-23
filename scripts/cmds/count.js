const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const path = require('path');

// 1. CANVAS DU CLASSEMENT PAR PAGE (GRAND FORMAT)
async function generateLeaderboardCanvas(arraySort, page, totalPages, topGlobalUser) {
  const width = 600;
  const height = 900; // Taille fixe et standardisée pour photo Messenger
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fond dégradé Bleu Noir Cyber
  let gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#04060d');
  gradient.addColorStop(0.5, '#0b1126');
  gradient.addColorStop(1, '#04060d');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Bordure lumineuse cyan/bleue
  ctx.strokeStyle = '#0052ff';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, width - 20, height - 20);

  // Titre principal
  ctx.fillStyle = '#00d2ff';
  ctx.font = 'bold 28px "Sans-Serif"';
  ctx.fillText("🏆 CLASSEMENT DES MEMBRES", 40, 55);

  ctx.fillStyle = '#ffffff';
  ctx.font = '12px "Sans-Serif"';
  ctx.fillText(`PAGE ${page} / ${totalPages}  |  ACTIVITÉ DU GROUPE`, 40, 80);

  // Ligne de séparation
  ctx.strokeStyle = 'rgba(0, 210, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(30, 95); ctx.lineTo(width - 30, 95); ctx.stroke();

  // 👑 LE GAGNANT ABSOLU (Toujours affiché en haut)
  if (topGlobalUser) {
    ctx.fillStyle = 'rgba(255, 215, 0, 0.05)';
    ctx.fillRect(40, 110, width - 80, 100);
    ctx.strokeStyle = '#ffd700'; 
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 110, width - 80, 100);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 12px "Sans-Serif"';
    ctx.fillText("👑 LE GAGNANT DU GROUPE (TOP #1) 👑", 60, 133);

    const topAvatarX = 60;
    const topAvatarY = 145;
    ctx.save();
    ctx.beginPath();
    ctx.arc(topAvatarX + 25, topAvatarY + 25, 25, 0, Math.PI * 2, true);
    ctx.clip();
    try {
      const imgUrl = `https://graph.facebook.com/${topGlobalUser.uid}/picture?type=large&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
      const img = await loadImage(imgUrl);
      ctx.drawImage(img, topAvatarX, topAvatarY, 50, 50);
    } catch (e) {
      ctx.fillStyle = '#0b1126';
      ctx.fillRect(topAvatarX, topAvatarY, 50, 50);
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px "Sans-Serif"';
      ctx.fillText("👤", topAvatarX + 13, topAvatarY + 33);
    }
    ctx.restore();

    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(topAvatarX + 25, topAvatarY + 25, 26, 0, Math.PI * 2); ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px "Sans-Serif"';
    let topName = topGlobalUser.name || "Inconnu";
    if (topName.length > 20) topName = topName.substring(0, 18) + "..";
    ctx.fillText(topName, 130, 175);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 16px "Sans-Serif"';
    ctx.fillText(`${topGlobalUser.count} messages`, width - 180, 175);
  }

  // Liste des 10 membres de la page active
  const startX = 40;
  const startY = 240; 
  const rowHeight = 58;

  for (let i = 0; i < arraySort.length; i++) {
    const user = arraySort[i];
    const currentY = startY + (i * rowHeight);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.fillRect(startX, currentY, width - 80, 48);
    ctx.strokeStyle = 'rgba(0, 82, 255, 0.15)';
    ctx.strokeRect(startX, currentY, width - 80, 48);

    // Couleur des rangs
    ctx.fillStyle = user.stt === 1 ? '#ffd700' : user.stt === 2 ? '#c0c0c0' : user.stt === 3 ? '#cd7f32' : '#00d2ff';
    ctx.font = 'bold 15px "Sans-Serif"';
    ctx.fillText(`#${user.stt}`, startX + 15, currentY + 29);

    // Avatar
    const avatarX = startX + 55;
    const avatarY = currentY + 8;
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + 16, avatarY + 16, 16, 0, Math.PI * 2, true);
    ctx.clip();
    try {
      const imgUrl = `https://graph.facebook.com/${user.uid}/picture?type=large&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
      const img = await loadImage(imgUrl);
      ctx.drawImage(img, avatarX, avatarY, 32, 32);
    } catch (e) {
      ctx.fillStyle = '#0b1126';
      ctx.fillRect(avatarX, avatarY, 32, 32);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px "Sans-Serif"';
      ctx.fillText("👤", avatarX + 9, avatarY + 21);
    }
    ctx.restore();

    ctx.strokeStyle = '#00d2ff';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(avatarX + 16, avatarY + 16, 17, 0, Math.PI * 2); ctx.stroke();

    // Nom
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px "Sans-Serif"';
    let name = user.name || "Inconnu";
    if (name.length > 22) name = name.substring(0, 20) + "..";
    ctx.fillText(name, startX + 110, currentY + 28);

    // Messages
    ctx.fillStyle = '#00d2ff';
    ctx.font = 'bold 12px "Sans-Serif"';
    ctx.fillText(`${user.count} msgs`, width - 140, currentY + 28);
  }

  // Barre cyberpunk fixe à 100% en bas
  const loadingY = height - 45;
  ctx.fillStyle = 'rgba(0, 210, 255, 0.1)';
  ctx.fillRect(40, loadingY, width - 80, 15);
  ctx.fillStyle = '#00d2ff';
  ctx.fillRect(40, loadingY, width - 80, 15);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px "Sans-Serif"';
  ctx.fillText(`PAGE DATA SYNCED ██████████ 100%`, 40, loadingY - 8);

  const tmpDir = path.join(process.cwd(), "cache");
  await fs.ensureDir(tmpDir);
  const imagePath = path.join(tmpDir, `count_page_${Date.now()}.png`);
  fs.writeFileSync(imagePath, canvas.toBuffer('image/png'));
  return imagePath;
}

// 2. CANVAS INDIVIDUEL (TAILLE LARGE MESSENGER)
async function generateUserCanvas(user) {
  const width = 600;
  const height = 800; 
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  let gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#04060d');
  gradient.addColorStop(0.5, '#0b1126');
  gradient.addColorStop(1, '#04060d');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#0052ff';
  ctx.lineWidth = 6;
  ctx.strokeRect(15, 15, width - 30, height - 30);

  ctx.fillStyle = '#00d2ff';
  ctx.font = 'bold 30px "Sans-Serif"';
  ctx.fillText("📊 PERFORMANCES DE MEMBRE", 50, 75);

  ctx.strokeStyle = 'rgba(0, 210, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(40, 100); ctx.lineTo(width - 40, 100); ctx.stroke();

  const avRadius = 100;
  const avX = width / 2;
  const avY = 260;

  ctx.save();
  ctx.beginPath();
  ctx.arc(avX, avY, avRadius, 0, Math.PI * 2, true);
  ctx.clip();
  try {
    const imgUrl = `https://graph.facebook.com/${user.uid}/picture?type=large&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
    const img = await loadImage(imgUrl);
    ctx.drawImage(img, avX - avRadius, avY - avRadius, avRadius * 2, avRadius * 2);
  } catch (e) {
    ctx.fillStyle = '#0b1126';
    ctx.fillRect(avX - avRadius, avY - avRadius, avRadius * 2, avRadius * 2);
    ctx.fillStyle = '#ffffff';
    ctx.font = '70px "Sans-Serif"';
    ctx.textAlign = 'center';
    ctx.fillText("👤", avX, avY + 25);
    ctx.textAlign = 'left';
  }
  ctx.restore();

  ctx.strokeStyle = '#00d2ff';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(avX, avY, avRadius + 2, 0, Math.PI * 2); ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px "Sans-Serif"';
  ctx.textAlign = 'center';
  ctx.fillText(user.name || "Utilisateur", width / 2, 420);

  const boxX = 60, boxY = 470, boxW = width - 120, boxH = 180;
  ctx.fillStyle = 'rgba(0, 82, 255, 0.05)';
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeStyle = 'rgba(0, 210, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '20px "Sans-Serif"';
  ctx.fillText("POSITION DU RANG :", boxX + 30, boxY + 65);
  
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 32px "Sans-Serif"';
  ctx.fillText(`#${user.stt}`, boxX + boxW - 120, boxY + 68);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '20px "Sans-Serif"';
  ctx.fillText("VOLUME DE MESSAGES :", boxX + 30, boxY + 130);

  ctx.fillStyle = '#00d2ff';
  ctx.font = 'bold 28px "Sans-Serif"';
  ctx.fillText(`${user.count} msgs`, boxX + boxW - 180, boxY + 130);

  const lY = height - 60;
  ctx.fillStyle = 'rgba(0, 210, 255, 0.1)';
  ctx.fillRect(50, lY, width - 100, 16);
  ctx.fillStyle = '#0052ff';
  ctx.fillRect(50, lY, width - 100, 16);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px "Sans-Serif"';
  ctx.fillText("USER CORE DATA SYNCED ██████████ 100%", 50, lY - 10);

  const tmpDir = path.join(process.cwd(), "cache");
  await fs.ensureDir(tmpDir);
  const imagePath = path.join(tmpDir, `count_user_${Date.now()}.png`);
  fs.writeFileSync(imagePath, canvas.toBuffer('image/png'));
  return imagePath;
}

module.exports = {
  config: {
    name: "count",
    version: "4.0",
    author: "NTKhang, Christus & AI",
    countDown: 5,
    role: 0,
    description: {
      vi: "Xem số lượng tin nhắn dạng Canvas phân trang lớn",
      en: "View members message counts split into perfectly sized Canvas photos"
    },
    category: "box chat",
    guide: {
      en: "{pn} | {pn} @tag | {pn} all [page]"
    }
  },

  langs: {
    vi: { invalidPage: "Số trang không hợp lệ" },
    en: { invalidPage: "Invalid page number" }
  },

  onStart: async function ({ args, threadsData, message, event, api, commandName, getLang }) {
    const { threadID, senderID } = event;
    const threadData = await threadsData.get(threadID);
    const { members } = threadData;
    const usersInGroup = (await api.getThreadInfo(threadID)).participantIDs;
    
    let arraySort = [];
    for (const user of members) {
      if (!usersInGroup.includes(user.userID)) continue;
      arraySort.push({
        name: user.name,
        count: user.count || 0,
        uid: user.userID
      });
    }

    let stt = 1;
    arraySort.sort((a, b) => b.count - a.count);
    arraySort.map(item => item.stt = stt++);

    if (args[0] && args[0].toLowerCase() === "all") {
      let page = parseInt(args[1]) || 1;
      const pageSize = 10;
      const totalPages = Math.ceil(arraySort.length / pageSize);

      if (page < 1 || page > totalPages) page = 1;

      const startIndex = (page - 1) * pageSize;
      const currentSelection = arraySort.slice(startIndex, startIndex + pageSize);
      const topGlobalUser = arraySort[0]; // Reste fixé en haut de chaque page

      const imagePath = await generateLeaderboardCanvas(currentSelection, page, totalPages, topGlobalUser);

      return message.reply({
        body: `📊 [ Page ${page}/${totalPages} ]\nRépondez avec un numéro de page pour naviguer.`,
        attachment: fs.createReadStream(imagePath)
      }, (err, info) => {
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        if (err) return message.err(err);
        
        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          messageID: info.messageID,
          author: senderID,
          arraySort
        });
      });
    } else if (event.mentions && Object.keys(event.mentions).length > 0) {
      const targetID = Object.keys(event.mentions)[0];
      const findUser = arraySort.find(item => item.uid == targetID);
      if (!findUser) return message.reply("Aucune donnée disponible pour cet utilisateur.");

      const imagePath = await generateUserCanvas(findUser);
      return message.reply({ attachment: fs.createReadStream(imagePath) }, () => {
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      });
    } else {
      const findUser = arraySort.find(item => item.uid == senderID);
      if (!findUser) return message.reply("Aucune donnée disponible pour votre profil.");

      const imagePath = await generateUserCanvas(findUser);
      return message.reply({ attachment: fs.createReadStream(imagePath) }, () => {
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      });
    }
  },

  onReply: async ({ message, event, Reply, commandName, getLang }) => {
    const { senderID, body } = event;
    const { author, arraySort } = Reply;
    if (author != senderID) return;

    const page = parseInt(body, 10);
    const pageSize = 10;
    const totalPages = Math.ceil(arraySort.length / pageSize);

    if (isNaN(page) || page < 1 || page > totalPages) {
      return message.reply(getLang("invalidPage"));
    }

    const startIndex = (page - 1) * pageSize;
    const currentSelection = arraySort.slice(startIndex, startIndex + pageSize);
    const topGlobalUser = arraySort[0];

    const imagePath = await generateLeaderboardCanvas(currentSelection, page, totalPages, topGlobalUser);

    message.reply({
      body: `📊 [ Page ${page}/${totalPages} ]\nRépondez avec un numéro de page pour naviguer.`,
      attachment: fs.createReadStream(imagePath)
    }, (err, info) => {
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      if (err) return message.err(err);
      
      try { message.unsend(Reply.messageID); } catch(e) {}

      global.GoatBot.onReply.set(info.messageID, {
        commandName,
        messageID: info.messageID,
        author: senderID,
        arraySort
      });
    });
  }
};

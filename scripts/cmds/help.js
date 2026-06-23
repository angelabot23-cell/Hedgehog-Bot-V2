const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const path = require('path');

const { commands, aliases } = global.GoatBot;

function toSmallCaps(text) {
  const smallCapsMap = {
    a:'ᴀ', b:'ʙ', c:'ᴄ', d:'ᴅ', e:'ᴇ', f:'ꜰ', g:'ɢ', h:'ʜ', i:'ɪ', j:'ᴊ',
    k:'ᴋ', l:'ʟ', m:'ᴍ', n:'ɴ', o:'ᴏ', p:'ᴘ', q:'ǫ', r:'ʀ', s:'ѕ', t:'ᴛ',
    u:'ᴜ', v:'ᴠ', w:'ᴡ', x:'x', y:'ʏ', z:'ᴢ',
    A:'ᴀ', B:'ʙ', C:'ᴄ', D:'ᴅ', E:'ᴇ', F:'ꜰ', G:'ɢ', H:'ʜ', I:'ɪ', J:'ᴊ',
    K:'ᴋ', L:'ʟ', M:'ᴍ', N:'ɴ', O:'ᴏ', P:'ᴘ', Q:'ǫ', R:'ʀ', S:'ѕ', T:'ᴛ',
    U:'ᴜ', V:'ᴠ', W:'ᴡ', X:'x', Y:'ʏ', Z:'ᴢ',
    'é':'ᴇ́', 'è':'ᴇ̀', 'ê':'ᴇ̂', 'ç':'ᴄ̧', 'à':'ᴀ̀', 'ô':'ᴏ̂'
  };
  return text.split('').map(c => smallCapsMap[c] || c).join('');
}

// Fonction utilitaire pour générer une couleur HEX aléatoire et lumineuse
function getRandomNeonColor() {
  const hues = [0, 30, 60, 120, 180, 200, 270, 300, 330]; // Sélection de teintes vives
  const randomHue = hues[Math.floor(Math.random() * hues.length)];
  return `hsl(${randomHue}, 100%, 60%)`;
}

async function generateHelpCanvas(userId, userName, categories) {
  const allFlattened = [];
  
  Object.keys(categories).sort().forEach(cat => {
    const authors = [...new Set(categories[cat].map(c => commands.get(c).config.author || "Inconnu"))].join(", ");
    allFlattened.push({ type: 'cat', name: `${cat.toUpperCase()}`, author: authors });
    
    categories[cat].sort().forEach(cmd => {
      allFlattened.push({ type: 'cmd', name: cmd });
    });
  });

  const startY = 160;
  const lineHeight = 24;
  const colWidth = 250; 
  const startX = 40;
  
  const columnsCount = 4;
  const itemsPerCol = Math.ceil(allFlattened.length / columnsCount);
  const contentHeight = itemsPerCol * lineHeight;
  
  const canvasWidth = (columnsCount * colWidth) + (startX * 2);
  const canvasHeight = Math.max(850, startY + contentHeight + 60);

  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  // ---- CRÉATION DES COULEURS ALÉATOIRES POUR CETTE SÉQUENCE ----
  const primaryColor = getRandomNeonColor();
  const secondaryColor = getRandomNeonColor();
  const accentColor = getRandomNeonColor();

  // ---- DÉCOR : FOND CYBERPUNK SOMBRE ----
  let bgGradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
  bgGradient.addColorStop(0, '#0a0b10');
  bgGradient.addColorStop(0.5, '#121520');
  bgGradient.addColorStop(1, '#0a0b10');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // ---- DÉCOR : BORDURE EN DÉGRADÉ ALÉATOIRE ----
  let borderGradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
  borderGradient.addColorStop(0, primaryColor);
  borderGradient.addColorStop(0.5, secondaryColor);
  borderGradient.addColorStop(1, accentColor);
  ctx.strokeStyle = borderGradient;
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, canvasWidth - 40, canvasHeight - 40);

  // ---- DÉCOR : AVATAR AVEC AURÉOLE LUMINEUSE ALEATOIRE ----
  const avatarUrl = `https://graph.facebook.com/${userId}/picture?width=150&height=150&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  try {
    const userAvatar = await loadImage(avatarUrl);
    ctx.save();
    ctx.beginPath(); 
    ctx.arc(75, 75, 35, 0, Math.PI * 2, true); 
    ctx.clip();
    ctx.drawImage(userAvatar, 40, 40, 70, 70);
    ctx.restore();
    
    // Cercle Néon changeant autour de l'avatar
    ctx.strokeStyle = primaryColor; 
    ctx.lineWidth = 3; 
    ctx.beginPath(); 
    ctx.arc(75, 75, 36, 0, Math.PI * 2); 
    ctx.stroke();
  } catch (e) {
    ctx.fillStyle = secondaryColor; 
    ctx.beginPath(); 
    ctx.arc(75, 75, 35, 0, Math.PI * 2); 
    ctx.fill();
  }

  // ---- DÉCOR : TEXTES DE L'ENTÊTE ----
  ctx.fillStyle = primaryColor; 
  ctx.font = 'bold 26px "Sans-Serif"'; 
  ctx.fillText("⚡ MULTI-COLOR SYSTEM MATRIX", 135, 65);
  
  ctx.fillStyle = '#ffffff'; 
  ctx.font = '13px "Sans-Serif"';
  const cleanName = userName.length > 20 ? userName.substring(0, 20) + "..." : userName;
  ctx.fillText(`USER // ${cleanName.toUpperCase()} | ONLINE COMMANDS: ${allFlattened.filter(i => i.type === 'cmd').length}`, 135, 90);

  // Ligne de séparation Tech
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'; 
  ctx.lineWidth = 1;
  ctx.beginPath(); 
  ctx.moveTo(35, 125); 
  ctx.lineTo(canvasWidth - 35, 125); 
  ctx.stroke();

  // Lignes verticales discrètes pour structurer les colonnes
  for (let i = 1; i < columnsCount; i++) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.beginPath();
    ctx.moveTo(startX + (i * colWidth) - 10, startY - 10);
    ctx.lineTo(startX + (i * colWidth) - 10, canvasHeight - 50);
    ctx.stroke();
  }

  // ---- CONFIGURATION ET RENDU DES COMMANDES ----
  allFlattened.forEach((item, index) => {
    const col = Math.floor(index / itemsPerCol);
    const row = index % itemsPerCol;
    const x = startX + (col * colWidth);
    const y = startY + (row * lineHeight);

    if (item.type === 'cat') {
      // Les catégories prennent la couleur secondaire dynamique
      ctx.fillStyle = secondaryColor;
      ctx.font = 'bold 12px "Sans-Serif"';
      const displayAuthor = item.author.length > 15 ? item.author.substring(0, 12) + '..' : item.author;
      ctx.fillText(`⧓  ${item.name}`, x, y);
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '9px "Sans-Serif"';
      ctx.fillText(`by ${displayAuthor}`, x + 12, y + 10);
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = '12px "Sans-Serif"';
      const displayCmd = item.name.length > 20 ? item.name.substring(0, 17) + '..' : item.name;
      ctx.fillText(`  ▫ ${displayCmd}`, x + 5, y + 5);
    }
  });

  const tmpDir = path.join(__dirname, "..", "cache");
  await fs.ensureDir(tmpDir);
  const imagePath = path.join(tmpDir, `premium_photo_${Date.now()}_${userId}.png`);
  fs.writeFileSync(imagePath, canvas.toBuffer('image/png'));
  return imagePath;
}

module.exports = {
  config: {
    name: "help",
    version: "19.10",
    author: "Christus x Célestin 🔥",
    countDown: 2,
    role: 0,
    shortDescription: { en: "Indexation au format carré avec couleurs dynamiques aléatoires." },
    category: "info",
    guide: { en: "help [all]" },
  },

  onReply: async function ({ message, Reply, event }) {
    try {
      const targetCmd = event.body.trim().toLowerCase();
      const checkCmd = commands.get(targetCmd) || commands.get(aliases.get(targetCmd));

      if (checkCmd) {
        const cfg = checkCmd.config;
        const replyMsg = `
🌐 [ ᴄᴏɴꜰɪɢᴜʀᴀᴛɪᴏɴ ѕʏѕᴛᴇᴍ // ${cfg.name.toUpperCase()} ]
──────────────────────────────
🔹 𝖭𝗈𝗆 : ${toSmallCaps(cfg.name)}
🔹 𝖢𝗋ᴇ́𝖺ᴛ𝖾𝗎𝗋 : ${cfg.author || "Inconnu"}
🔹 𝖣𝖾𝗌𝖼𝗋𝗂𝗉ᴛɪᴏ𝗇 : ${cfg.description?.en || cfg.shortDescription?.en || "Aucune description"}
🔹 𝖢𝖺𝗍ᴇ́ɢᴏʀɪᴇ : ${toSmallCaps(cfg.category || "info")}
🔹 𝖢ᴏᴏʟᴅᴏᴡɴ : ${cfg.countDown || 0}s
🔹 𝖭𝗂𝗏ᴇᴀᴜ 𝖱ᴏʟᴇ : ${cfg.role === 2 ? "Owner" : cfg.role === 1 ? "Admin" : "Membres"}
──────────────────────────────`;
        
        const res = await message.reply(replyMsg);
        global.GoatBot.onReply.set(res.messageID, {
          commandName: this.config.name,
          messageID: res.messageID,
          author: event.senderID
        });
        return;
      }
    } catch (err) {
      console.error(err);
    }
  },

  onStart: async function ({ message, args, event, usersData }) {
    try {
      const uid = event.senderID;
      const userName = await usersData.getName(uid);
      
      const categories = {};
      let totalCmds = 0;
      for (let [name, cmd] of commands) {
        const cat = cmd.config.category || "Autres";
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(name);
        totalCmds++;
      }

      if (args[0] && args[0].toLowerCase() === "all") {
        let textList = `💎 ᴍᴇɴᴜ ᴘʀᴇᴍɪᴜᴍ ━━✥👑✥━━\n`;
        textList += `📊 ᴛᴏᴛᴀʟ : ${totalCmds} ᴄᴏᴍᴍᴀɴᴅᴇѕ activées.\n`;
        
        for (const cat of Object.keys(categories).sort()) {
          const catAuthors = [...new Set(categories[cat].map(c => commands.get(c).config.author || "Inconnu"))].join(", ");
          textList += `\n🔹 ᴄᴀᴛᴇ́ɢᴏʀɪᴇ : *${toSmallCaps(cat.toUpperCase())}* (✍️ ${catAuthors})\n`;
          textList += categories[cat].sort().map(c => ` ∟ sʏsᴛᴇᴍ : ${c}`).join("\n");
        }
        textList += `\n\n💬 *💡 ᴀѕᴛᴜᴄᴇ :* Répondez directement à cette liste avec le nom d'une commande pour voir ses détails techniques.`;

        const res = await message.reply(textList);
        global.GoatBot.onReply.set(res.messageID, {
          commandName: this.config.name,
          messageID: res.messageID,
          author: uid
        });
        return;
      }

      if (args[0]) {
        const checkCmd = commands.get(args[0].toLowerCase()) || commands.get(aliases.get(args[0].toLowerCase()));
        if (checkCmd) {
          const cfg = checkCmd.config;
          const replyMsg = `
🌐 [ ᴄᴏɴꜰɪɢᴜʀᴀᴛɪᴏɴ ѕʏѕᴛᴇᴍ // ${cfg.name.toUpperCase()} ]
──────────────────────────────
🔹 𝖭𝗈𝗆 : ${toSmallCaps(cfg.name)}
🔹 𝖢𝗋ᴇ́𝖺ᴛ𝖾𝗎𝗋 : ${cfg.author || "Inconnu"}
🔹 𝖣𝖾𝗌𝖼𝗋𝗂𝗉ᴛɪᴏ̂ɴ : ${cfg.description?.en || cfg.shortDescription?.en || "Aucune description"}
🔹 𝖢𝖺𝗍ᴇ́ɢᴏʀɪᴇ : ${toSmallCaps(cfg.category || "info")}
🔹 𝖢ᴏᴏʟᴅᴏᴡɴ : ${cfg.countDown || 0}s
🔹 𝖭𝗂𝗏ᴇᴀᴜ 𝖱ᴏ𝒍ᴇ : ${cfg.role === 2 ? "Owner" : cfg.role === 1 ? "Admin" : "Membres"}
──────────────────────────────`;
          return message.reply(replyMsg);
        }
      }

      const imagePath = await generateHelpCanvas(uid, userName, categories);

      const res = await message.reply({
        body: "✨ Répondez à cette image avec le nom d'un module pour ouvrir ses configurations.\n\n📱 *Mode Basique :* Utilisez la commande `.help all` si l'image ne charge pas.",
        attachment: fs.createReadStream(imagePath)
      });

      setTimeout(() => {
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      }, 5000);

      global.GoatBot.onReply.set(res.messageID, {
        commandName: this.config.name,
        messageID: res.messageID,
        author: uid
      });

    } catch (err) {
      console.error(err);
    }
  }
};

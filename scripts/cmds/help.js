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

// Convertit les titres de catégories en caractères gras stylés (Math Bold)
function toMathBold(text) {
  const boldMap = {
    'A':'𝐀','B':'𝐁','C':'𝐂','D':'𝐃','E':'𝐄','F':'𝐅','G':'𝐆','H':'𝐇','I':'𝐈','J':'𝐉','K':'𝐊','L':'𝐋','M':'𝐌',
    'N':'𝐍','O':'𝐎','P':'𝐏','Q':'𝐐','R':'𝐑','S':'𝐒','T':'𝐓','U':'𝐔','V':'𝐕','W':'𝐖','X':'𝐗','Y':'𝐘','Z':'𝐙',
    'a':'𝐚','b':'𝐛','c':'𝐜','d':'𝐝','e':'𝐞','f':'𝐟','g':'𝐠','h':'𝐡','i':'𝐢','j':'𝐣','k':'𝐤','l':'𝐥','m':'𝐦',
    'n':'𝐧','o':'𝐨','p':'𝐩','q':'𝐪','r':'𝐫','s':'𝐬','t':'𝐭','u':'𝐮','v':'𝐯','w':'𝐰','x':'𝐱','y':'𝐲','z':'𝐳',
    '0':'𝟎','1':'𝟏','2':'𝟐','3':'𝟑','4':'𝟒','5':'𝟓','6':'𝟔','7':'𝟕','8':'𝟖','9':'𝟗'
  };
  return text.split('').map(c => boldMap[c] || c).join('');
}

// Convertit les noms de commandes en alphabet monospace/sans-serif pour l'effet "clean"
function toMonospace(text) {
  const monoMap = {
    'a':'𝖺','b':'𝖻','c':'𝖼','d':'𝖽','e':'𝖾','f':'𝖿','g':'𝗀','h':'𝗁','i':'𝗂','j':'𝗃','k':'𝗄','l':'𝗅','m':'𝗆',
    'n':'𝗇','o':'𝗈','p':'𝗉','q':'𝗊','r':'𝗋','s':'𝗌','t':'𝗍','u':'𝗎','v':'𝗏','w':'𝗐','x':'𝗑','y':'𝗒','z':'𝗓',
    'A':'𝖺','B':'𝖻','C':'𝖼','D':'𝖽','E':'𝖾','F':'𝖿','G':'𝗀','H':'𝗁','I':'𝗂','J':'𝗃','K':'𝗄','L':'𝗅','M':'𝗆',
    'N':'𝗇','O':'𝗈','P':'𝗉','Q':'𝗊','R':'𝗋','S':'𝗌','T':'𝗍','U':'𝗎','V':'𝗏','W':'𝗐','X':'𝗑','Y':'𝗒','Z':'𝗓',
    '0':'𝟢','1':'𝟣','2':'𝟤','3':'𝟥','4':'𝟦','5':'𝟧','6':'𝟨','7':'𝟩','8':'𝟪','9':'𝟫','-':'-'
  };
  return text.split('').map(c => monoMap[c] || c).join('');
}

function getRandomNeonColor() {
  const hues = [0, 45, 145, 195, 260, 320]; 
  const randomHue = hues[Math.floor(Math.random() * hues.length)];
  return `hsl(${randomHue}, 100%, 65%)`;
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
  const lineHeight = 26;
  const colWidth = 260; 
  const startX = 45;
  
  const columnsCount = 4;
  const itemsPerCol = Math.ceil(allFlattened.length / columnsCount);
  const contentHeight = itemsPerCol * lineHeight;
  
  const canvasWidth = (columnsCount * colWidth) + (startX * 2);
  const canvasHeight = Math.max(900, startY + contentHeight + 60);

  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  const primaryColor = getRandomNeonColor();
  const secondaryColor = getRandomNeonColor();
  const accentColor = getRandomNeonColor();

  let bgGradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
  bgGradient.addColorStop(0, '#06070d');
  bgGradient.addColorStop(0.5, '#0b0d16');
  bgGradient.addColorStop(1, '#06070d');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  let borderGradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
  borderGradient.addColorStop(0, primaryColor);
  borderGradient.addColorStop(0.5, secondaryColor);
  borderGradient.addColorStop(1, accentColor);
  ctx.strokeStyle = borderGradient;
  ctx.lineWidth = 5;
  ctx.strokeRect(20, 20, canvasWidth - 40, canvasHeight - 40);

  const avatarUrl = `https://graph.facebook.com/${userId}/picture?width=150&height=150&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  try {
    const userAvatar = await loadImage(avatarUrl);
    ctx.save();
    ctx.beginPath(); 
    ctx.arc(80, 80, 40, 0, Math.PI * 2, true); 
    ctx.clip();
    ctx.drawImage(userAvatar, 40, 40, 80, 80);
    ctx.restore();
    
    ctx.strokeStyle = primaryColor; 
    ctx.lineWidth = 3; 
    ctx.beginPath(); 
    ctx.arc(80, 80, 41, 0, Math.PI * 2); 
    ctx.stroke();
  } catch (e) {
    ctx.fillStyle = secondaryColor; 
    ctx.beginPath(); 
    ctx.arc(80, 80, 40, 0, Math.PI * 2); 
    ctx.fill();
  }

  ctx.fillStyle = primaryColor; 
  ctx.font = 'bold 28px "Sans-Serif"'; 
  ctx.fillText("⚡ CASSIDY MATRIX SYSTEM", 145, 70);
  
  ctx.fillStyle = '#ffffff'; 
  ctx.font = '14px "Sans-Serif"';
  const cleanName = userName.length > 20 ? userName.substring(0, 20) + "..." : userName;
  ctx.fillText(`OPERATOR // ${cleanName.toUpperCase()} | TOTAL EXPANSION: ${allFlattened.filter(i => i.type === 'cmd').length} MODULES`, 145, 95);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'; 
  ctx.lineWidth = 1;
  ctx.beginPath(); 
  ctx.moveTo(35, 135); 
  ctx.lineTo(canvasWidth - 35, 135); 
  ctx.stroke();

  for (let i = 1; i < columnsCount; i++) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.beginPath();
    ctx.moveTo(startX + (i * colWidth) - 10, startY - 10);
    ctx.lineTo(startX + (i * colWidth) - 10, canvasHeight - 50);
    ctx.stroke();
  }

  allFlattened.forEach((item, index) => {
    const col = Math.floor(index / itemsPerCol);
    const row = index % itemsPerCol;
    const x = startX + (col * colWidth);
    const y = startY + (row * lineHeight);

    if (item.type === 'cat') {
      ctx.fillStyle = secondaryColor;
      ctx.font = 'bold 13px "Sans-Serif"';
      const displayAuthor = item.author.length > 15 ? item.author.substring(0, 12) + '..' : item.author;
      ctx.fillText(`⧓  ${item.name}`, x, y);
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.font = '9px "Sans-Serif"';
      ctx.fillText(`by ${displayAuthor}`, x + 12, y + 11);
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = '12px "Sans-Serif"';
      const displayCmd = item.name.length > 22 ? item.name.substring(0, 19) + '..' : item.name;
      ctx.fillText(`  ▫ ${displayCmd}`, x + 5, y + 5);
    }
  });

  const tmpDir = path.join(__dirname, "..", "cache");
  await fs.ensureDir(tmpDir);
  const imagePath = path.join(tmpDir, `cassidy_help_${Date.now()}_${userId}.png`);
  fs.writeFileSync(imagePath, canvas.toBuffer('image/png'));
  return imagePath;
}

module.exports = {
  config: {
    name: "help",
    version: "21.0",
    author: "Célestin 🔥",
    countDown: 2,
    role: 0,
    shortDescription: { en: "Catalogue interactif en grille ou liste propre par catégorie pour mode basique." },
    category: "info",
    guide: { en: "help [all / commande]" },
  },

  onReply: async function ({ message, Reply, event }) {
    try {
      const targetCmd = event.body.trim().toLowerCase();
      const checkCmd = commands.get(targetCmd) || commands.get(aliases.get(targetCmd));

      if (checkCmd) {
        const cfg = checkCmd.config;
        const replyMsg = `
🌐 [ CONFIGURATION SYSTEM // ${cfg.name.toUpperCase()} ]
──────────────────────────────
👑 Nom : ${toSmallCaps(cfg.name)}
✍️ Créateur : ${cfg.author || "Inconnu"}
📝 Description : ${cfg.description?.en || cfg.shortDescription?.en || "Aucune description"}
📂 Catégorie : ${toSmallCaps(cfg.category || "info")}
⏱️ Cooldown : ${cfg.countDown || 0}s
🔐 Rang Requis : ${cfg.role === 2 ? "Owner" : cfg.role === 1 ? "Admin" : "Membres"}
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
        const cat = cmd.config.category || "Other";
        // Formate le nom de la catégorie (ex: "box chat" -> "Box Chat")
        const formattedCat = cat.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        if (!categories[formattedCat]) categories[formattedCat] = [];
        categories[formattedCat].push(name);
        totalCmds++;
      }

      // ---- VERSION TEXTUELLE PROPRE ET PRO / PAR CATÉGORIES SANS AUTEURS ----
      if (args[0] && args[0].toLowerCase() === "all") {
        let textList = `🔍 ${toMathBold("Available Commands")} 🧰 (${totalCmds})\n\n`;
        
        const sortedCategories = Object.keys(categories).sort();
        
        for (const cat of sortedCategories) {
          const cmds = categories[cat].sort();
          textList += `${toMathBold(cat)} (${cmds.length})\n`;
          
          // Aligne les commandes proprement par paquets de 3 par ligne
          let lineBuffer = [];
          for (let i = 0; i < cmds.length; i++) {
            lineBuffer.push(`📄 ${toMonospace(cmds[i])}`);
            if (lineBuffer.length === 3 || i === cmds.length - 1) {
              textList += lineBuffer.join("   ") + "\n";
              lineBuffer = [];
            }
          }
          textList += `\n`;
        }
        
        textList += `\n`;
        textList += `➜ ${toMathBold("Command details")}: +menu <commande>\n`;
        textList += `➜ ${toMathBold("Basics")}: +help basics\n`;
        textList += `➜ ${toMathBold("Search")}: +help search <mot>\n`;
        textList += `➜ ${toMathBold("Developed by")} Célestin 🎀`;

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
🌐 [ CONFIGURATION SYSTEM // ${cfg.name.toUpperCase()} ]
──────────────────────────────
👑 Nom : ${toSmallCaps(cfg.name)}
✍️ Créateur : ${cfg.author || "Inconnu"}
📝 Description : ${cfg.description?.en || cfg.shortDescription?.en || "Aucune description"}
📂 Catégorie : ${toSmallCaps(cfg.category || "info")}
⏱️ Cooldown : ${cfg.countDown || 0}s
🔐 Rang Requis : ${cfg.role === 2 ? "Owner" : cfg.role === 1 ? "Admin" : "Membres"}
──────────────────────────────`;
          return message.reply(replyMsg);
        }
      }

      // ---- INTERFACE GRAPHIQUE CANVAS DYNAMIQUE ----
      const imagePath = await generateHelpCanvas(uid, userName, categories);

      const res = await message.reply({
        body: `🤖 CASSIDY INTERACTIVE INTERFACE 🤖\n\n💬 Répondez directement à cette matrice avec le nom d'un module pour ouvrir sa configuration.\n\n📱 Mode Basique : Écrivez ".help all" pour avoir la liste brute en texte rapide.`,
        attachment: fs.createReadStream(imagePath)
      });

      setTimeout(() => {
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      }, 7000);

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

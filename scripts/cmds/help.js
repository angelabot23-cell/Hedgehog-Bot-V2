const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const path = require('path');

const { commands, aliases } = global.GoatBot;

// --- Fonction pour transformer un texte en style 𝑨𝒁 ---
function toAZStyle(text) {
  const azMap = {
    A:'𝑨', B:'𝑩', C:'𝑪', D:'𝑫', E:'𝑬', F:'𝑭', G:'𝑮', H:'𝑯', I:'𝑰', J:'𝑱',
    K:'𝑲', L:'𝑳', M:'𝑴', N:'𝑵', O:'𝑶', P:'𝑷', Q:'𝑸', R:'𝑹', S:'𝑺', T:'𝑻',
    U:'𝑼', V:'𝑽', W:'𝑾', X:'𝑿', Y:'𝒀', Z:'𝒁',
    a:'𝒂', b:'𝒃', c:'𝒄', d:'𝒅', e:'𝒆', f:'𝒇', g:'𝒈', h:'𝒉', i:'𝒊', j:'𝒋',
    k:'𝒌', l:'𝒍', m:'𝒎', n:'𝒏', o:'𝒐', p:'𝒑', q:'𝒒', r:'𝒓', s:'𝒔', t:'𝒕',
    u:'𝒖', v:'𝒗', w:'𝒘', x:'𝒙', y:'𝒚', z:'𝒛',
    ' ':' '
  };
  return text.split('').map(c => azMap[c] || c).join('');
}

// ==========================================
// 🎨 ENGIN CANVAS POUR L'AFFICHAGE HELP
// ==========================================
async function generateHelpCanvas(userId, userName, totalCommands) {
  const canvas = createCanvas(900, 450);
  const ctx = canvas.getContext('2d');

  // Fond dégradé sombre Style Espace / Cyberpunk
  let gradient = ctx.createLinearGradient(0, 0, 900, 450);
  gradient.addColorStop(0, '#090a15');
  gradient.addColorStop(0.5, '#12132c');
  gradient.addColorStop(1, '#090a15');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Lignes technologiques en arrière-plan (Design Matrix subtil)
  ctx.strokeStyle = 'rgba(114, 239, 221, 0.03)';
  ctx.lineWidth = 1;
  for (let i = 0; i < canvas.width; i += 30) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
  }

  // Doubles bordures gravées holographiques
  ctx.strokeStyle = '#72efdd';
  ctx.lineWidth = 4;
  ctx.strokeRect(25, 25, 850, 400);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.strokeRect(32, 32, 836, 386);

  // Séparateurs de style
  ctx.fillStyle = '#72efdd';
  ctx.font = 'bold 16px "Sans-Serif"';
  ctx.fillText("✧ ▬▭▬ ▬▬ ✦ ▬▬ ▬▭▬ ✧", 400, 65);
  ctx.fillText("✧ ▬▭▬ ▬▬ ✦ ▬▬ ▬▭▬ ✧", 400, 395);

  // Intégration circulaire de l'avatar Facebook de l'utilisateur
  const avatarUrl = `https://graph.facebook.com/${userId}/picture?width=300&height=300&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  try {
    const userAvatar = await loadImage(avatarUrl);
    ctx.save();
    ctx.beginPath();
    ctx.arc(190, 225, 110, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(userAvatar, 80, 115, 220, 220);
    ctx.restore();

    // Cercle lumineux néon turquoise
    ctx.strokeStyle = '#72efdd';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(190, 225, 112, 0, Math.PI * 2);
    ctx.stroke();
  } catch (e) {
    ctx.fillStyle = '#72efdd';
    ctx.beginPath(); ctx.arc(190, 225, 110, 0, Math.PI * 2); ctx.fill();
  }

  // --- ÉCRITURE DES TEXTES DANS L'IMAGE ---
  ctx.fillStyle = '#72efdd';
  ctx.font = 'bold 36px "Sans-Serif"';
  ctx.fillText("📚 𝑩𝑰𝑩𝑳𝑰𝑶𝑻𝑯𝑬̀𝑸𝑼𝑬 𝑩𝑶𝑻", 400, 125);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px "Sans-Serif"';
  let cleanName = userName.length > 20 ? userName.substring(0, 20) + "..." : userName;
  ctx.fillText(`👤 𝑼𝒕𝒊𝒍𝒊𝒔𝒂𝒕𝒆𝒖𝒓 : ${cleanName}`, 400, 185);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px "Sans-Serif"';
  ctx.fillText(`📊 𝑻𝒐𝒕𝒂𝒍 : ${totalCommands} 𝑪𝒐𝒎𝒎𝒂𝒏𝒅𝒆𝒔`, 400, 255);

  ctx.fillStyle = '#aaaaaa';
  ctx.font = 'italic 18px "Sans-Serif"';
  ctx.fillText("👉 Regarde la liste ci-dessous pour les détails", 400, 310);

  ctx.fillStyle = '#72efdd';
  ctx.font = 'bold 14px "Sans-Serif"';
  ctx.fillText("»» CLIQUEZ SUR RECHERCHER POUR FILTRER ««", 400, 355);

  const tmpDir = path.join(__dirname, "..", "cache");
  await fs.ensureDir(tmpDir);
  const imagePath = path.join(tmpDir, `help_${Date.now()}_${userId}.png`);
  fs.writeFileSync(imagePath, canvas.toBuffer('image/png'));
  return imagePath;
}

module.exports = {
  config: {
    name: "help",
    version: "6.0",
    author: "Christus x Célestin 🔥 (Canvas Edition)",
    countDown: 2,
    role: 0,
    shortDescription: { en: "Explorer toutes les commandes avec style" },
    category: "info",
    guide: { en: "help <commande> ou help -ai <mot>" },
  },

  onStart: async function ({ message, args, event, usersData }) {
    try {
      const uid = event.senderID;
      const userName = await usersData.getName(uid);

      const autoDelete = async (msgID, delay = 30000) => { // Augmenté à 30s car le menu est plus complet
        setTimeout(async () => {
          try { await message.unsend(msgID); } catch {}
        }, delay);
      };

      // --- LISTE DES COMMANDES ---
      if (!args || args.length === 0) {
        let body = `
✄┈┈┈┈┈┈┈┈┈┈┈┈┈
┅┅┅┅┅༻❁༺┅┅┅┅┅
📚 𝑳𝑰𝑺𝑻𝑬 𝑫𝑬𝑺 𝑪𝑶𝑴𝑴𝑨𝑵𝑫𝑬𝑺
┅┅┅┅┅༻❁༺┅┅┅┅┅
`;

        const categories = {};
        for (let [name, cmd] of commands) {
          const cat = cmd.config.category || "Autres";
          if (!categories[cat]) categories[cat] = [];
          categories[cat].push(name);
        }

        for (const cat of Object.keys(categories).sort()) {
          const list = categories[cat]
            .sort()
            .map(c => `• ${toAZStyle(c)}`)
            .join("\n");

          body += `
✄┈┈┈┈┈┈┈┈┈┈┈┈┈
┅┅┅┅┅༻❁༺┅┅┅┅┅
📂 𝑪𝑨𝑻𝑬́𝑮𝑶𝑹𝑰𝑬 : ${toAZStyle(cat)}
┅┅┅┅┅༻❁༺┅┅┅┅┅
${list || "• 𝑨𝒖𝒄𝒖𝒏𝒆"}
┅┅┅┅┅༻❁༺┅┅┅┅┅
`;
        }

        body += `
✄┈┈┈┈┈┈┈┈┈┈┈┈┈
┅┅┅┅┅༻❁༺┅┅┅┅┅
📊 𝑻𝒐𝒕𝒂𝒍 : ${commands.size} 𝒄𝒐𝒎𝒎𝒂𝒏𝒅𝒆𝒔
┅┅┅┅┅༻❁༺┅┅┅┅┅

📌 .help <commande>
📌 .help -ai <mot>

⚠️ Ce message s'auto-détruira dans 30 secondes.
✄┈┈┈┈┈┈┈┈┈┈┈┈┈
`;

        // Génération de l'interface graphique personnalisée
        const imagePath = await generateHelpCanvas(uid, userName, commands.size);

        const res = await message.reply({ 
          body, 
          attachment: fs.createReadStream(imagePath)
        }, () => {
          if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        });

        return autoDelete(res.messageID);
      }

      // --- AJOUT FACULTATIF : RECHERCHE PAR MOT CLÉ (help <commande>) ---
      if (args[0]) {
        const checkCmd = commands.get(args[0].toLowerCase()) || commands.get(aliases.get(args[0].toLowerCase()));
        if (checkCmd) {
          const cfg = checkCmd.config;
          let replyMsg = `
» COMMAND DETAILS «
═══════════════════
👤 𝑵𝒐𝒎 : ${toAZStyle(cfg.name)}
ℹ️ 𝑫𝒆𝒔𝒄𝒓𝒊𝒑𝒕𝒊𝒐𝒏 : ${cfg.description?.en || cfg.shortDescription?.en || "Aucune"}
📁 𝑪𝒂𝒕𝒆́𝒈𝒐𝒓𝒊𝒆 : ${toAZStyle(cfg.category || "info")}
⏳ 𝑪𝒐𝒐𝒍𝒅𝒐𝒘𝒏 : ${cfg.countDown || 0}s
👑 𝑹𝒐𝒍𝒆 𝒓𝒆𝒒𝒖𝒊𝒔 : ${cfg.role === 2 ? "Owner" : cfg.role === 1 ? "Admin" : "Membres"}
═══════════════════
`;
          return message.reply(replyMsg);
        }
      }

    } catch (err) {
      console.error(err);
    }
  }
};

const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const path = require('path');
const moment = require("moment-timezone");

// ==========================================
// 🎨 ENGIN CANVAS POUR LA CONFIRMATION VISUELLE
// ==========================================
async function generateResultCanvas(actionType, usersProcessed) {
    // On limite à 5 avatars pour garder l'image lisible
    const listToDisplay = usersProcessed.slice(0, 5);
    const canvasHeight = 150 + (listToDisplay.length * 90);
    const canvas = createCanvas(700, canvasHeight);
    const ctx = canvas.getContext('2d');

    // Fond style "Néo"
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 700, canvasHeight);
    
    // Bordure animée selon l'action
    ctx.strokeStyle = actionType === "Acceptée" ? '#10b981' : '#ef4444';
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, 700, canvasHeight);

    // Titre
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 35px Arial';
    ctx.fillText("CONFIRMATION ACTIONS", 150, 60);
    
    ctx.fillStyle = actionType === "Acceptée" ? '#10b981' : '#ef4444';
    ctx.font = 'bold 30px Arial';
    ctx.fillText(`Statut: ${actionType}`, 150, 100);

    // Affichage des profils
    for (let i = 0; i < listToDisplay.length; i++) {
        const user = listToDisplay[i];
        const yOffset = 150 + (i * 90);

        // Chargement Avatar
        try {
            const avatarUrl = `https://graph.facebook.com/${user.node.id}/picture?width=200&height=200`;
            const avatar = await loadImage(avatarUrl);
            ctx.save();
            ctx.beginPath();
            ctx.arc(80, yOffset + 40, 35, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(avatar, 45, yOffset + 5, 70, 70);
            ctx.restore();
            
            // Anneau de statut autour de l'avatar
            ctx.strokeStyle = actionType === "Acceptée" ? '#10b981' : '#ef4444';
            ctx.lineWidth = 4;
            ctx.beginPath(); ctx.arc(80, yOffset + 40, 37, 0, Math.PI * 2); ctx.stroke();
        } catch (e) {
            // Fond par défaut si échec chargement
            ctx.fillStyle = '#334155';
            ctx.beginPath(); ctx.arc(80, yOffset + 40, 35, 0, Math.PI * 2); ctx.fill();
        }

        // Nom de l'utilisateur
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px Arial';
        ctx.fillText(user.node.name, 150, yOffset + 35);
        
        ctx.fillStyle = '#aaaaaa';
        ctx.font = '16px Arial';
        ctx.fillText(`ID: ${user.node.id}`, 150, yOffset + 60);
    }

    if (usersProcessed.length > 5) {
        ctx.fillStyle = '#aaaaaa';
        ctx.font = 'italic 16px Arial';
        ctx.fillText(`... et ${usersProcessed.length - 5} autres demandes.`, 150, canvasHeight - 20);
    }

    const p = path.join(__dirname, 'cache', `accept_${Date.now()}.png`);
    await fs.ensureDir(path.join(__dirname, 'cache'));
    await fs.writeFile(p, canvas.toBuffer('image/png'));
    return p;
}

// ==========================================
// 🚀 MODULE ACCEPT
// ==========================================
module.exports = {
  config: {
    name: "accept",
    aliases: ["acp"],
    version: "2.5",
    author: "Christus x Célestin (Canvas Edition)",
    countDown: 8,
    role: 2,
    description: "Accepter ou refuser les demandes d'amis visuellement",
    category: "utility"
  },

  onReply: async function ({ message, Reply, event, api }) {
    const { author, listRequest, messageID } = Reply;
    if (author !== event.senderID) return;
    const args = event.body.trim().toLowerCase().split(/\s+/);

    clearTimeout(Reply.unsendTimeout);

    const form = {
      av: api.getCurrentUserID(),
      fb_api_caller_class: "RelayModern",
      variables: { input: { source: "friends_tab", actor_id: api.getCurrentUserID(), client_mutation_id: Math.round(Math.random() * 19).toString() }, scale: 3, refresh_num: 0 }
    };

    let actionType;
    if (args[0] === "add") {
      form.fb_api_req_friendly_name = "FriendingCometFriendRequestConfirmMutation";
      form.doc_id = "3147613905362928";
      actionType = "Acceptée";
    } else if (args[0] === "del") {
      form.fb_api_req_friendly_name = "FriendingCometFriendRequestDeleteMutation";
      form.doc_id = "4108254489275063";
      actionType = "Refusée";
    } else {
      return api.sendMessage("❌ Commande invalide.", event.threadID, event.messageID);
    }

    let targetIDs = args.slice(1);
    if (args[1] === "all") {
      targetIDs = Array.from({ length: listRequest.length }, (_, i) => i + 1);
    }

    const usersProcessed = [];
    const promiseFriends = [];

    for (const stt of targetIDs) {
      const user = listRequest[parseInt(stt) - 1];
      if (user) {
        form.variables.input.friend_requester_id = user.node.id;
        form.variables = JSON.stringify(form.variables);
        usersProcessed.push(user);
        promiseFriends.push(api.httpPost("https://www.facebook.com/api/graphql/", form));
        form.variables = JSON.parse(form.variables);
      }
    }

    await Promise.allSettled(promiseFriends);

    // Génération et envoi du résultat visuel
    if (usersProcessed.length > 0) {
        const imagePath = await generateResultCanvas(actionType, usersProcessed);
        await api.sendMessage({
            body: `▅▄▃▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▂▃▄▅\n✅ Opération terminée visuellement.\n▅▄▃▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▂▃▄▅`,
            attachment: fs.createReadStream(imagePath)
        }, event.threadID);
        await fs.unlink(imagePath);
    } else {
        api.sendMessage("❌ Aucune demande valide traitée.", event.threadID);
    }

    api.unsendMessage(messageID);
  },

  onStart: async function ({ event, api, commandName }) {
    // ... (Garde ton code onStart original ici, il est déjà parfait avec le style ▅▄▃▁...) ...
    // Pense juste à utiliser le style ▅▄▃▁... pour encadrer ton texte dans le onStart.
  }
};

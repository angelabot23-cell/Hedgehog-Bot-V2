const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const path = require('path');

async function generateNotifyCanvas(adminId, adminName, groupName, memberCount, messageContent, timeStr, dateStr) {
    const canvas = createCanvas(950, 520);
    const ctx = canvas.getContext('2d');

    // Fond
    ctx.fillStyle = '#060a14';
    ctx.fillRect(0, 0, 950, 520);

    // Cadre
    ctx.strokeStyle = '#ffb703';
    ctx.lineWidth = 4;
    ctx.strokeRect(25, 25, 900, 470);

    // Avatar (URL directe sans token si possible)
    try {
        const avatarUrl = `https://graph.facebook.com/${adminId}/picture?width=300&height=300`;
        const adminAvatar = await loadImage(avatarUrl);
        ctx.save();
        ctx.beginPath();
        ctx.arc(190, 260, 110, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(adminAvatar, 80, 150, 220, 220);
        ctx.restore();
    } catch (e) {
        ctx.fillStyle = '#ffb703';
        ctx.beginPath(); ctx.arc(190, 260, 110, 0, Math.PI * 2); ctx.fill();
    }

    // Texte
    ctx.fillStyle = '#ffb703';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText("👑 COMMUNIQUÉ OFFICIEL", 440, 120);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`🏰 Groupe : ${groupName.substring(0, 25)}`, 440, 175);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px sans-serif';
    ctx.fillText(messageContent, 440, 265);

    const tmpDir = path.join(__dirname, "cache");
    await fs.ensureDir(tmpDir);
    const imagePath = path.join(tmpDir, `notify_${Date.now()}.png`);
    await fs.promises.writeFile(imagePath, canvas.toBuffer('image/png'));
    return imagePath;
}

module.exports = {
    config: {
        name: "notification",
        version: "3.0",
        role: 2,
        description: "Envoie un communiqué visuel",
        category: "owner"
    },

    onStart: async function ({ message, api, event, args, threadsData, usersData }) {
        if (!args[0]) return message.reply("⚠️ Message requis.");

        const allThreads = (await threadsData.getAll()).filter(t => t.isGroup);
        const adminId = event.senderID;
        const adminName = await usersData.getName(adminId);
        const messageContent = args.join(" ");
        
        message.reply(`📡 Envoi en cours à ${allThreads.length} groupes...`);

        for (const thread of allThreads) {
            try {
                const info = await api.getThreadInfo(thread.threadID);
                const imagePath = await generateNotifyCanvas(
                    adminId, adminName, info.threadName || "Groupe", 
                    info.participantIDs.length, messageContent, "now", "now"
                );

                await api.sendMessage({
                    body: `👑 𝘾𝙊𝙈𝙈𝙐𝙉𝙄𝙌𝙐𝙀́ 𝙊𝙁𝙁𝙄𝘾𝙄𝙀𝙇\n\n📢 ${messageContent}`,
                    attachment: fs.createReadStream(imagePath)
                }, thread.threadID);

                await fs.unlink(imagePath); // Nettoyage
                await new Promise(r => setTimeout(r, 500)); // Pause anti-spam
            } catch (e) {
                console.error("Erreur groupe", thread.threadID, e.message);
            }
        }
        message.reply("✅ Envoi terminé.");
    }
};

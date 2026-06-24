const { getStreamsFromAttachment, log } = global.utils;
const { createCanvas, loadImage } = require("canvas");
const { writeFileSync, createReadStream, unlinkSync } = require("fs-extra");
const path = require("path");

const mediaTypes = ["photo", 'png', "animated_image", "video", "audio"];

async function generateCallAdminCard({ title, name, id, details, content, avatarUrl, cacheKey }) {
	const width = 650;
	const padding = 25;
	
	const canvasTemp = createCanvas(width, 200);
	const ctxTemp = canvasTemp.getContext("2d");
	ctxTemp.font = "16px sans-serif";
	
	const words = content.split(' ');
	let lines = [];
	let currentLine = "";
	
	for (let token of words) {
		let testLine = currentLine + token + " ";
		let metrics = ctxTemp.measureText(testLine);
		if (metrics.width > (width - padding * 2 - 20) && currentLine !== "") {
			lines.push(currentLine);
			currentLine = token + " ";
		} else {
			currentLine = testLine;
		}
	}
	lines.push(currentLine);

	const textHeight = lines.length * 24;
	const height = padding * 2 + 100 + textHeight + (details ? 40 : 0);

	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext("2d");

	ctx.fillStyle = "#0d1117";
	ctx.fillRect(0, 0, width, height);

	ctx.strokeStyle = "#00a2ff";
	ctx.lineWidth = 3;
	ctx.strokeRect(1.5, 1.5, width - 3, height - 3);

	ctx.fillStyle = "#161b22";
	ctx.beginPath();
	ctx.roundRect(padding, padding, width - padding * 2, 70, 8);
	ctx.fill();

	try {
		const avatar = await loadImage(avatarUrl);
		ctx.save();
		ctx.beginPath();
		ctx.arc(padding + 35, padding + 35, 25, 0, Math.PI * 2, true);
		ctx.closePath();
		ctx.clip();
		ctx.drawImage(avatar, padding + 10, padding + 10, 50, 50);
		ctx.restore();
	} catch (e) {
		ctx.fillStyle = "#00a2ff";
		ctx.beginPath();
		ctx.arc(padding + 35, padding + 35, 25, 0, Math.PI * 2, true);
		ctx.fill();
	}

	ctx.fillStyle = "#ff4757";
	ctx.font = "bold 14px monospace";
	ctx.fillText(title.toUpperCase(), padding + 75, padding + 25);

	ctx.fillStyle = "#ffffff";
	ctx.font = "bold 18px sans-serif";
	ctx.fillText(name, padding + 75, padding + 48);

	ctx.fillStyle = "#8b949e";
	ctx.font = "12px monospace";
	ctx.fillText(`ID: ${id}`, padding + 75, padding + 62);

	let currentY = padding + 95;
	ctx.fillStyle = "#1f242c";
	ctx.beginPath();
	ctx.roundRect(padding, currentY, width - padding * 2, textHeight + 20, 6);
	ctx.fill();

	ctx.fillStyle = "#e6edf3";
	ctx.font = "16px sans-serif";
	let textY = currentY + 22;
	for (let line of lines) {
		ctx.fillText(line.trim(), padding + 15, textY);
		textY += 24;
	}

	if (details) {
		ctx.fillStyle = "#58a6ff";
		ctx.font = "italic 13px sans-serif";
		ctx.fillText(details, padding, height - padding);
	}

	const cachePath = path.join(__dirname, "cache", `callad-${cacheKey}-${Date.now()}.png`);
	writeFileSync(cachePath, canvas.toBuffer("image/png"));
	return cachePath;
}

module.exports = {
	config: {
		name: "callad",
		version: "2.1",
		author: "NTKhang x Canvas",
		countDown: 5,
		role: 0,
		description: {
			vi: "gửi báo cáo, góp ý, báo lỗi bằng hình ảnh Canvas về admin",
			en: "send UI canvas report, feedback, bug to admin bot"
		},
		category: "contacts admin",
		guide: {
			vi: "   {pn} <tin nhắn>",
			en: "   {pn} <message>"
		}
	},

	langs: {
		vi: {
			missingMessage: "Vui lòng nhập tin nhắn bạn muốn gửi về admin",
			success: "Đã gửi tin nhắn của bạn về %1 admin thành công!",
			failed: "Đã có lỗi xảy ra khi gửi tin nhắn.",
			replyUserSuccess: "Đã gửi phản hồi của bạn về người dùng thành công!",
			replySuccess: "Đã gửi phản hồi của bạn về admin thành công!",
			noAdmin: "Hiện tại bot chưa có admin nào"
		},
		en: {
			missingMessage: "Please enter the message you want to send to admin",
			success: "Sent your message to %1 admin successfully!",
			failed: "An error occurred while sending your message.",
			replyUserSuccess: "Sent your reply to user successfully!",
			replySuccess: "Sent your reply to admin successfully!",
			noAdmin: "Bot has no admin at the moment"
		}
	},

	onStart: async function ({ args, message, event, usersData, threadsData, api, commandName, getLang }) {
		const { config } = global.GoatBot;
		if (!args[0]) return message.reply(getLang("missingMessage"));
		
		const { senderID, threadID, isGroup } = event;
		if (!config.adminBot || config.adminBot.length == 0) return message.reply(getLang("noAdmin"));

		const senderName = await usersData.getName(senderID);
		const userAvatar = `https://graph.facebook.com/${senderID}/picture?width=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
		
		let details = "";
		if (isGroup) {
			const tInfo = await threadsData.get(threadID);
			details = `📍 Envoyé depuis le groupe : ${tInfo.threadName || threadID} (ID: ${threadID})`;
		} else {
			details = `👤 Envoyé en message privé`;
		}

		const imagePath = await generateCallAdminCard({
			title: "📥 NOUVEAU MESSAGE ALERTE",
			name: senderName,
			id: senderID,
			details: details,
			content: args.join(" "),
			avatarUrl: userAvatar,
			cacheKey: `user-${senderID}`
		});

		const formMessage = {
			body: `📩 Répondez à ce message pour écrire à ${senderName}.`,
			attachment: [
				createReadStream(imagePath),
				...(await getStreamsFromAttachment(event.attachments.filter(item => mediaTypes.includes(item.type))))
			]
		};

		const successIDs = [];
		for (const uid of config.adminBot) {
			try {
				const messageSend = await api.sendMessage(formMessage, uid);
				successIDs.push(uid);
				global.GoatBot.onReply.set(messageSend.messageID, {
					commandName,
					messageID: messageSend.messageID,
					threadID, // Groupe/MP de l'utilisateur initial
					adminID: uid, // ID de l'admin qui a reçu l'alerte
					messageIDSender: event.messageID,
					type: "userCallAdmin"
				});
			} catch (err) {
				log.err("CALL ADMIN", err);
			}
		}

		try { unlinkSync(imagePath); } catch (e) {}

		if (successIDs.length > 0) {
			return message.reply(getLang("success", successIDs.length));
		} else {
			return message.reply(getLang("failed"));
		}
	},

	onReply: async function ({ args, event, api, message, reply, usersData, commandName, getLang }) {
		// Ajustement automatique de la variable de récupération des données de réponse
		const handleReply = reply || arguments[0].Reply;
		if (!handleReply) return;

		const { type, threadID, adminID, messageIDSender } = handleReply;
		const senderName = await usersData.getName(event.senderID);
		const userAvatar = `https://graph.facebook.com/${event.senderID}/picture?width=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
		const { config } = global.GoatBot;

		if (!args[0]) return message.reply(getLang("missingMessage"));

		switch (type) {
			case "userCallAdmin": {
				// Sécurité : Seul l'admin enregistré ou un admin global peut répondre à l'alerte
				if (!config.adminBot.includes(event.senderID)) return;

				const imagePath = await generateCallAdminCard({
					title: "👑 RÉPONSE DE L'ADMINISTRATEUR",
					name: senderName,
					id: event.senderID,
					details: "⚡ Support Cassidy Bot",
					content: args.join(" "),
					avatarUrl: userAvatar,
					cacheKey: `admin-reply-${event.senderID}`
				});

				const formMessage = {
					body: `💬 Répondez à ce message pour continuer la conversation avec l'admin.`,
					attachment: [
						createReadStream(imagePath),
						...(await getStreamsFromAttachment(event.attachments.filter(item => mediaTypes.includes(item.type))))
					]
				};

				// On envoie le message vers le canal de l'utilisateur (threadID)
				api.sendMessage(formMessage, threadID, (err, info) => {
					try { unlinkSync(imagePath); } catch (e) {}
					if (err) return log.err("CALL ADMIN", err);
					
					message.reply(getLang("replyUserSuccess"));
					global.GoatBot.onReply.set(info.messageID, {
						commandName,
						messageID: info.messageID,
						messageIDSender: event.messageID,
						threadID: event.threadID, // Contient le canal de l'admin actuel
						adminID: event.senderID,
						type: "adminReply"
					});
				}, messageIDSender);
				break;
			}
			case "adminReply": {
				// L'utilisateur répond à l'admin
				let details = event.isGroup ? `📍 Groupe ID: ${event.threadID}` : `👤 Message Privé`;
				
				const imagePath = await generateCallAdminCard({
					title: "🔄 RETOUR UTILISATEUR (SUITE)",
					name: senderName,
					id: event.senderID,
					details: details,
					content: args.join(" "),
					avatarUrl: userAvatar,
					cacheKey: `user-reply-${event.senderID}`
				});

				const formMessage = {
					body: `📥 Suite du rapport de ${senderName}. Répondez pour lui écrire.`,
					attachment: [
						createReadStream(imagePath),
						...(await getStreamsFromAttachment(event.attachments.filter(item => mediaTypes.includes(item.type))))
					]
				};

				// On renvoie vers le canal privé de l'admin initial (adminID)
				api.sendMessage(formMessage, adminID, (err, info) => {
					try { unlinkSync(imagePath); } catch (e) {}
					if (err) return log.err("CALL ADMIN", err);

					message.reply(getLang("replySuccess"));
					global.GoatBot.onReply.set(info.messageID, {
						commandName,
						messageID: info.messageID,
						messageIDSender: event.messageID,
						threadID: event.threadID, // Canal de l'utilisateur
						adminID: adminID,
						type: "userCallAdmin"
					});
				}, messageIDSender);
				break;
			}
			default:
				break;
		}
	}
};

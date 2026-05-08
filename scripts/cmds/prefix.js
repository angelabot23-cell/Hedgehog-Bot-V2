const fs = require("fs-extra");
const { utils } = global;

module.exports = {
	config: {
		name: "prefix",
		version: "1.4",
		author: "NTKhang",
		countDown: 5,
		role: 0,
		description: "Changer le préfixe du bot",
		category: "config",
		guide: {
			en:
"   {pn} <nouveau préfixe>\n" +
"   Exemple:\n    {pn} #\n\n" +
"   {pn} <nouveau préfixe> -g (admin bot)\n" +
"   Exemple:\n    {pn} # -g\n\n" +
"   {pn} reset"
		}
	},

	langs: {
		en: {
			reset: "Préfixe réinitialisé: %1",
			onlyAdmin: "Seul un admin bot peut faire ça",
			confirmGlobal: "Réagis pour confirmer le changement global",
			confirmThisThread: "Réagis pour confirmer dans ce groupe",
			successGlobal: "Préfixe global changé: %1",
			successThisThread: "Préfixe du groupe changé: %1",

			myPrefix:
`
┅┅┅┅┅┅┅༻❁༺┅┅┅┅┅┅┅
⚙️ 𝑺𝒚𝒔𝒕𝒆̀𝒎𝒆 : %1 ┃
💬 𝑮𝒓𝒐𝒖𝒑𝒆 : %2 ┃
┅┅┅┅┅┅┅༻❁༺┅┅┅┅┅┅`
		}
	},

	onStart: async function ({ message, role, args, commandName, event, threadsData, getLang }) {
		if (!args[0])
			return message.SyntaxError();

		if (args[0] == 'reset') {
			await threadsData.set(event.threadID, null, "data.prefix");
			return message.reply(getLang("reset", global.GoatBot.config.prefix));
		}

		const newPrefix = args[0];
		const formSet = {
			commandName,
			author: event.senderID,
			newPrefix
		};

		if (args[1] === "-g") {
			if (role < 2)
				return message.reply(getLang("onlyAdmin"));
			else
				formSet.setGlobal = true;
		}
		else {
			formSet.setGlobal = false;
		}

		return message.reply(
			args[1] === "-g" ? getLang("confirmGlobal") : getLang("confirmThisThread"),
			(err, info) => {
				formSet.messageID = info.messageID;
				global.GoatBot.onReaction.set(info.messageID, formSet);
			}
		);
	},

	onReaction: async function ({ message, threadsData, event, Reaction, getLang }) {
		const { author, newPrefix, setGlobal } = Reaction;

		if (event.userID !== author)
			return;

		if (setGlobal) {
			global.GoatBot.config.prefix = newPrefix;
			fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
			return message.reply(getLang("successGlobal", newPrefix));
		}
		else {
			await threadsData.set(event.threadID, newPrefix, "data.prefix");
			return message.reply(getLang("successThisThread", newPrefix));
		}
	},

	onChat: async function ({ event, message, getLang, usersData }) {
		if (event.body && event.body.toLowerCase() === "prefix") {
			return async () => {

				const uid = event.senderID;
				let avatar = await usersData.getAvatarUrl(uid).catch(() => null);
				if (!avatar) avatar = "https://i.imgur.com/TPHk4Qu.png";

				return message.reply({
					body: getLang(
						"myPrefix",
						global.GoatBot.config.prefix,
						utils.getPrefix(event.threadID)
					),
					attachment: await global.utils.getStreamFromURL(avatar)
				});
			};
		}
	}
};

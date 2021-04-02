import readHTMLFile from "./readHTMLFile";
import * as nodeMailer from "nodemailer";
import * as handlebars from "handlebars";
import log from "./log";

export default function mailTo(
	host: string,
	hostPort: number,
	senderUserName: string,
	senderPassword: string,
	from: string,
	to: string,
	subject: string,
	absoltutePagePath: string,
	replacements?: any
) {
	return new Promise(function (resolve, reject) {
		const transporter = nodeMailer.createTransport({
			//@ts-ignore
			host,
			hostPort,
			auth: {
				user: senderUserName,
				pass: senderPassword,
			},
			tls: {
				ciphers: "SSLv3",
			},
		});

		try {
			readHTMLFile(process.cwd() + absoltutePagePath, function (err: any, html: any) {
				var template = handlebars.compile(html);

				var htmlToSend = template(replacements);
				var mailOptions = {
					from,
					to,
					subject: `Plateforme GCTTU - ${subject}`,
					html: htmlToSend,
				};

				transporter.sendMail(mailOptions, function (error, info) {
					if (error) {
						log.error("Error while sending mail");
						log.error(error);
						reject();
					} else {
						log.debug(`Message ${info.messageId} sent: ${info.response}`);
						resolve("ok");
					}
				});
			});
		} catch(error) {
			reject()
		}
	});
}


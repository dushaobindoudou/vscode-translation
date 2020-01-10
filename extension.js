const vscode = require('vscode');
const request = require('request');
const crypto = require('crypto');
const randomstring = require("randomstring");

const config = {
	api: 'http://api.fanyi.baidu.com/api/trans/vip/translate',
	appId: 'appId',
	appKey: 'appKey',
};

function getMD5(content) {
	if (!content) {
		return content;
	}
	const md5 = crypto.createHash('md5');
	md5.update(content);
	const d = md5.digest('hex');
	return d.toLowerCase();
}

export const activate = (context) => {
	const transDisposable = vscode.commands.registerCommand('extension.translate', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			console.warn('no open text editor!');
			return; // No open text editor
		}

		const { selection } = editor;
		const text = editor.document.getText(selection);

		if (!text) {
			return;
		}

		const salt = (new Date()).getTime() + randomstring.generate();
		let ipt = '';
		let texts = text.split(/\s+/);
		texts.forEach(v => {
			ipt += encodeURI(v) + ' '
		});
		//var ecText = encodeURIComponent(text.replace(/\s+/g,'\r'));
		request.post({
			url: config.api,
			formData: {
				q: ipt,
				from: 'auto',
				to: 'zh',
				appid: config.appId,
				salt: salt,
				sign: getMD5(config.appId + ipt + salt + config.appKey)
			}
		}, (err, res, body) => {
			if (err) {
				vscode.window.showInformationMessage('翻译出错了：' + err.message);
				return;
			}
			try {
				const msg = JSON.parse(body);
				if (msg.error_code) {
					vscode.window.showInformationMessage('翻译出错了：' + msg.error_msg);
				} else {
					msg.trans_result && msg.trans_result.forEach(v => {
						vscode.window.showInformationMessage(decodeURIComponent(v.dst));
					});
				}
			} catch (e) {
				vscode.window.showInformationMessage('翻译出错了：' + e.message);
			}
		});
	});

	context.subscriptions.push(transDisposable);
}

// this method is called when your extension is deactivated
export const deactivate = () => {

};
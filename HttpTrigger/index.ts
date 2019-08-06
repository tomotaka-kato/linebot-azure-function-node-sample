import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import fetch = require( 'node-fetch');
import line = require("@line/bot-sdk"); // Messaging APIのSDKをインポート

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request.');


    // パラメータ設定
    const line_config = {
        channelAccessToken: process.env.LINE_ACCESS_TOKEN, // 環境変数からアクセストークンをセットしています
        channelSecret: process.env.LINE_CHANNEL_SECRET // 環境変数からChannel Secretをセットしています
    };

    const qna_config = {
        url: process.env.QnA_URL,
        authorization: process.env.QnA_AUTHORIZATION
    }

    const bot = new line.Client(line_config);

     // 先行してLINE側にステータスコード200でレスポンスする。
    context.res = { body: "" };

    // イベントオブジェクトを順次処理。
    req.body.events.forEach((event: any) => {
        // この処理の対象をイベントタイプがメッセージで、かつ、テキストタイプだった場合に限定。
        if (event.type == "message" && event.message.type == "text"){


            const data = JSON.stringify({ question: event.message.text })

            fetch(qna_config.url, {
                method: "POST",
                body: data,
                headers: {
                    "Authorization": qna_config.authorization,
                    "Content-type": "application/json"
                }
            }).then((response: any) => response.json())
            .then((json: any) => json.answers[0].answer)
                .then((answer: any) => {
                    // replyMessage()で返信し、そのプロミスをevents_processedに追加。
                    bot.replyMessage(event.replyToken, {
                        type: "text",
                        text: answer
                    });
                })

        }
    });
};

export default httpTrigger;

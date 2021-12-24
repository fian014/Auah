async function sendStickerReply(client, msg, content, options = {}) {
    let internalOptions = {
        linkPreview: undefined,
        sendAudioAsVoice: undefined,
        sendMediaAsSticker: true,
        sendMediaAsDocument: undefined,
        caption: options.caption,
        quotedMessageId: msg.id._serialized,
        parseVCards: false,
        mentionedJidList: []
    }

    const sendSeen = typeof options.sendSeen === 'undefined' ? true : options.sendSeen

    if (content instanceof MessageMedia) internalOptions.attachment = content;
    else if (options.media instanceof MessageMedia) internalOptions.attachment = options.media;
    content = '';

    const exifPath = 'data.exif'
    const resultPath = 'sticker.webp'
    internalOptions.attachment = await Util.formatToWebpSticker(internalOptions.attachment);
    fs.writeFileSync(resultPath, internalOptions.attachment.data, 'base64')
    // Custom?
    const stickerpackid = "com.snowcorp.stickerly.android.stickercontentprovider b5e7275f-f1de-4137-961f-57becfad34f2" //not sure what this does
    const packname = options.name || "KucingPeduli";
    const author = options.author || "Fn¹⁴";
    const googlelink = "https://play.google.com/store/apps/details?id=com.marsvard.stickermakerforwhatsapp";
    const applelink = "https://itunes.apple.com/app/sticker-maker-studio/id1443326857";

    const json = { "sticker-pack-id": stickerpackid, "sticker-pack-name": packname, "sticker-pack-publisher": author, "android-app-store-link": googlelink, "ios-app-store-link": applelink }
    let exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00])
    let jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8')
    let exif = Buffer.concat([exifAttr, jsonBuffer])
    exif.writeUIntLE(jsonBuffer.length, 14, 4)
    fs.writeFileSync(exifPath, exif)
    spawnSync('webpmux', [
        '-set', 'exif', exifPath,
        '-o', resultPath, resultPath
    ])
    internalOptions.attachment = MessageMedia.fromFilePath(resultPath)

    const newMessage = await client.pupPage.evaluate(async (chatId, message, options, sendSeen) => {
        const chatWid = window.Store.WidFactory.createWid(chatId);
        const chat = await window.Store.Chat.find(chatWid);

        if (sendSeen) {
            window.WWebJS.sendSeen(chatId);
        }

        const msg = await window.WWebJS.sendMessage(chat, message, options, sendSeen);
        return msg.serialize();
    }, (await msg.getChat()).id._serialized, content, internalOptions, sendSeen);

    return new Message(this, newMessage);
}

module.exports = { fian}
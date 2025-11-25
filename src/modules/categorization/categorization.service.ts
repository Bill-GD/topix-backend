import { createUserContent, GoogleGenAI } from '@google/genai';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CategorizationService {
  private readonly ai = new GoogleGenAI({});

  async categorize(text: string, mediaUrls: string[], resultCount: number = 5) {
    // const uploadedFiles =
    //   mediaUrls.length > 0
    //     ? await Promise.all(
    //         mediaUrls
    //           .filter((m) => !m.includes('.gif') && !m.includes('.mkv'))
    //           .map((m) => this.ai.files.upload({ file: m })),
    //       )
    //     : [];

    const imageRes = await fetch(mediaUrls[0]);
    const imageArrayBuffer = await imageRes.arrayBuffer();
    const base64ImageData = Buffer.from(imageArrayBuffer).toString('base64');

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: createUserContent([
        `0-${resultCount} catogorie(s) for a SM post:\n` +
          `-format '<cate_1>,<0-1.0>|<cate_2>,<0-1.0>|...'(name w/ score)\n` +
          `-lowercase, snake_case, no extra response\n` +
          `-name should be general enough->increase category hit chance\n` +
          `-less category (0-4) if generic/unclear, if none, no result` +
          // (mediaUrls.length > 0
          //   ? `-post contain media, categorize using those as well\n`
          // + `-Media URLs:\n${mediaUrls.join('\n')}`
          //     : '') +
          // `-post content: '${text}'`,
          `-post content: ${text.length > 0 ? `'${text}'` : 'none, only media'}`,
        {
          inlineData: {
            mimeType: mediaUrls[0].includes('image')
              ? 'image/png'
              : 'video/mp4',
            data: base64ImageData,
          },
        },
        // ...mediaUrls
        //   .filter((m) => !m.includes('.gif') && !m.includes('.mkv'))
        //   .map((url) => {
        //     const fileExt = url.split('.').at(-1);
        //     const type = url.split('/upload')[0].split('/').at(-1);
        //     return createPartFromUri(url, `${type}/${fileExt}`);
        //   }),
      ]),
    });
    return response.text?.split('|');
  }
}

// const uploadedFiles = mediaUrls.map((m) => {
//   const fileExt = m.split('.').at(-1);
//   const type = m.split('/upload')[0].split('/').at(-1);
//
//   return {
//     uri: m,
//     mimeType: `${type}/${fileExt}`,
//   };
// });
//
// const response = await this.ai.models.generateContent({
//   model: 'gemini-2.5-flash-lite',
//   contents: createUserContent([
//     `0-${resultCount} catogorie(s) for a SM post:\n` +
//     `-format '<cate_1>,<0-1.0>|<cate_2>,<0-1.0>|...'(name w/ score)\n` +
//     `-lowercase,space is underscore,no extra response\n` +
//     `-name should be general enough->increase category hit chance\n` +
//     `-less category (0-4) if generic/unclear` +
//     (uploadedFiles.length > 0
//       ? `-post contain media, categorize using those as well\n`
//       : '') +
//     `-post content: '${text}'`,
//     ...uploadedFiles.map((f) => createPartFromUri(f.uri, f.mimeType)),
//   ]),
// });
// return response.text?.split('|');

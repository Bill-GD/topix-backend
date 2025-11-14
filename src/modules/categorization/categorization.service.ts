import { Injectable } from '@nestjs/common';
import { pipeline, ZeroShotClassificationOutput } from '@xenova/transformers';

@Injectable()
export class CategorizationService {
  async categorize(
    text: string,
    categories: string[],
    resultCount: number = 5,
  ) {
    const classifier = await pipeline(
      'zero-shot-classification',
      'Xenova/bart-large-mnli',
    );
    const output = await classifier(text, categories);

    const scores = (output as ZeroShotClassificationOutput).scores.slice(
      0,
      resultCount,
    );
    const results = (output as ZeroShotClassificationOutput).labels
      .slice(0, resultCount)
      .map((e, i) => ({
        label: e,
        score: scores[i],
      }));

    return results;
  }
}

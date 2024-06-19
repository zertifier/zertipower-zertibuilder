import {PredictionPacket} from "./prediction-packet";

export class Predictor {
  private readonly ranges: { from: number, to: number, coefficient: number, sum: number, counter: number }[];

  constructor(sample: Map<string, PredictionPacket>, ranges: { from: number, to: number }[]) {
    this.ranges = ranges.map(r => {
      return {...r, coefficient: 0, sum: 0, counter: 0}
    });

    for (const val of sample.values()) {
      const index = this.ranges.findIndex(
        r => r.from <= val.radiation
          && val.radiation < r.to
      );
      const range = this.ranges[index];

      if (!range) {
        continue
      }

      range.sum += val.coefficient;
      range.counter += 1;
      this.ranges[index] = range;
    }

    for (let i = 0; i < this.ranges.length; i++) {
      const range = this.ranges[i];
      range.coefficient = range.sum / range.counter;
      this.ranges[i] = range;
    }
  }

  getPrediction(radiation: number): number {
    // Find coefficient from ranges
    const range = this.ranges.find(r => r.from <= radiation && radiation < r.to);
    if (!range) {
      return 0;
    }

    return radiation * range.coefficient;
  }

  getRanges() {
    return this.ranges;
  }
}

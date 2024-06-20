import * as testData from "../../../../../../test/assets/prediction_data.json";
import {Predictor} from "./predictor";
import {PredictionPacket} from "./prediction-packet";
describe('Predictor', () => {
  it('should parse ranges correctly', () => {
    const samples: PredictionPacket[] = testData.data.filter(d => {
      return d.radiation > 50;
    }).map(d => {
      return {
        coefficient: d.coef,
        production: d.production,
        radiation: d.radiation,
      }
    })
    const predictor = new Predictor(samples, testData.ranges);

    interface Range {
      from: number,
      to: number,
      coefficient: number,
      count: number,
    }
    const expectedRanges: Range[] = testData.ranges.map(r => {
      return {
        coefficient: r.coefficient,
        count: r.counter,
        to: r.to,
        from: r.from
      }
    });
    const ranges: Range[] = predictor.getRanges().map(r => {
      return {
        coefficient: r.coefficient,
        count: r.counter,
        to: r.to,
        from: r.from
      }
    });

    for (let i = 0; i < ranges.length; i++) {
      expect(ranges[i].count).toEqual(expectedRanges[i].count);
    }
  });
});

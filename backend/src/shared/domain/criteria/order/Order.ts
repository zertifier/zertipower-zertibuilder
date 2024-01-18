import { OrderBy } from "./OrderBy";
import { OrderType } from "./OrderType";

export class Order {
  constructor(
    public readonly orderBy: OrderBy,
    public readonly orderType: OrderType = OrderType.asc()
  ) {}

  public static none() {
    return new Order(new OrderBy(""), OrderType.none());
  }
}

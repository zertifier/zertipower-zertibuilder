import { Injectable } from '@nestjs/common';
import {PrismaService} from "../../../shared/infrastructure/services";
import moment from "moment";

@Injectable()
export class CommunitiesStatsService {
  constructor(
    private prisma: PrismaService,
  ) {
  }
  public async statsDaily(id: number, start: Date, end: Date, origin = 'datadis') {
    const startDate = moment(start).format('YYYY-MM-DD');
    const endDate = moment(end).format('YYYY-MM-DD');

    let data: any = await this.prisma.$queryRaw`
      WITH stats AS (
SELECT
		SUM(kwh_in) AS kwh_in,
		SUM(eh.kwh_out) AS kwh_out,
		SUM(kwh_out_virtual) AS kwh_out_virtual,
		SUM(
                     CASE
                       WHEN kwh_in IS NOT NULL OR kwh_out IS NOT NULL THEN IFNULL(production, 0)
                       ELSE 0
                       END
                   ) AS surplus_community_active,
		kwh_in_price AS kwh_in_price,
		kwh_out_price AS kwh_out_price,
		kwh_in_price_community AS kwh_in_price_community,
		kwh_out_price_community AS kwh_out_price_community,
		CAST(COUNT(DISTINCT CASE WHEN kwh_in IS NOT NULL OR kwh_out IS NOT NULL THEN customer_id END) AS VARCHAR(255)) AS active_members,
		HOUR(eh.info_dt) AS filter_dt,
		info_dt
	FROM
		energy_hourly eh
	LEFT JOIN
                 cups c
                 ON
		eh.cups_id = c.id
	WHERE
		c.type != 'community'
		AND (eh.info_dt BETWEEN '${startDate}' AND '${endDate}')
		AND c.community_id = ${id}
	GROUP BY
		eh.info_dt
), surplus AS (
SELECT
		SUM(kwh_out) AS surplus_community,
		HOUR(info_dt) AS filter_dt,
		info_dt
	FROM
		energy_hourly eh
	LEFT JOIN
                 cups c
                 ON
		cups_id = c.id
	WHERE
		c.type = 'community'
		AND (info_dt BETWEEN '${startDate}' AND '${endDate}')
		AND c.community_id = ${id}
		AND origin = '${origin}'
	GROUP BY
		eh.info_dt
)

SELECT
	b.*,
	a.surplus_community
FROM stats b
LEFT JOIN surplus a ON a.filter_dt = b.filter_dt;
    `;
  }

  public async statsMonthly(id: number, date: Date) {

  }

  public async statsYearly(id: number, date: Date) {

  }
}

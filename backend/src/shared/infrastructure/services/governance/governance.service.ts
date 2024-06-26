import {Injectable} from '@nestjs/common';
import {PrismaService} from "../prisma-service";

@Injectable()
export class GovernanceService {
  constructor(
    private prisma: PrismaService,
  ) {
  }

  async updateExpiredPropsalsStatus() {

    /*const proposals = await this.prisma.$queryRaw`
      SELECT pr.id, votes.option_id as vote, COUNT(option_id) count
      FROM proposals pr
             LEFT JOIN votes ON proposal_id = pr.id
      WHERE expiration_dt < CURRENT_DATE
        AND result_option_id IS NULL
        AND votes.id IS NOT NULL
      GROUP BY option_id
      ORDER BY count DESC LIMIT 1
    `*/
    const expiredProposals = await this.prisma.$queryRaw`
      SELECT pr.id, votes.option_id as vote, SUM(vote_value) count
      FROM proposals pr
             LEFT JOIN votes ON proposal_id = pr.id
      WHERE expiration_dt < CURRENT_DATE
        AND result_option_id IS NULL
      GROUP BY option_id
      ORDER BY count DESC LIMIT 1
    `


    await this.prisma.$queryRaw`
        UPDATE proposals
        SET status = 'EXPIRED'
        WHERE expiration_dt < CURRENT_DATE AND (status = 'ACTIVE' OR status = 'PENDING');`
    /*const [data, updatedData]: [any, any] = await this.prisma.$transaction([
      this.prisma.$queryRaw`
        SELECT pr.*
        FROM proposals pr
        LEFT JOIN votes ON proposal_id = pr.id
        WHERE expiration_dt < CURRENT_DATE AND result_option_id IS NULL`,

      this.prisma.$queryRaw`
        UPDATE proposals
        SET status = 'EXPIRED'
        WHERE expiration_dt < CURRENT_DATE;`,
    ])*/
  }
}

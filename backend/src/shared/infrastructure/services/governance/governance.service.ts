import {Injectable} from '@nestjs/common';
import {PrismaService} from "../prisma-service";
import { notificationCodes, NotificationsService } from '../notifications-service';

interface ExpiredProposal {
  id: number;
  vote: number | null;
  count: number;
  communtyId:number;
  proposal: string;
}

@Injectable()
export class GovernanceService {
  constructor(
    private prisma: PrismaService,
    private notificationsService:NotificationsService
  ) {
  }

  async updateExpiredPropsalsStatus() {

    const expiredProposals = await this.prisma.$queryRaw<ExpiredProposal[]>`
      SELECT pr.id, votes.option_id as vote, SUM(vote_value) count, pr.community_id as communityId, pr.proposal as proposal
      FROM proposals pr
             LEFT JOIN votes ON proposal_id = pr.id
      WHERE expiration_dt < CURRENT_DATE
        AND result_option_id IS NULL
      GROUP BY option_id
      ORDER BY count DESC LIMIT 1
    `

    for(let expiredProposal of expiredProposals){
      const communityId = expiredProposal.communtyId
      const proposalName = expiredProposal.proposal;
      const text = '';
      const subject = this.notificationsService.getNotificationSubject(notificationCodes.proposalExpired, this.notificationsService.defaultNotificationLang,{proposalName})
      this.notificationsService.sendCommunityNotification(communityId,notificationCodes.proposalExpired,subject,text)
    }

    await this.prisma.$queryRaw`
        UPDATE proposals
        SET status = 'EXPIRED'
        WHERE expiration_dt < CURRENT_DATE AND (status = 'ACTIVE' OR status = 'PENDING');`

  }
}



export interface CommunityCupsStats {
  kwh_in: number;
  kwh_out: number;
  kwh_out_virtual: number;
  surplus_community_active: number;
  kwh_in_price: number;
  kwh_out_price: number;
  kwh_in_price_community: number | null;
  kwh_out_price_community: number | null;
  active_members: string;
  filter_dt: number;
  info_dt: string;
  surplus_community: number;
  communitiesCups?: CommunityCups[] | []
}

export interface CommunityCups{
  kwh_out: number;
  filter_dt: number;
  info_dt: string;
  cups_id: number;
  cups: string;
  reference: string | null;
}

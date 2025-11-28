export interface Registration {
  id: string;
  name: string;
  phone: string;
  email: string;
  profile_picture?: string;
  created_at: string;
}

export interface CampaignSettings {
  id: string;
  target_count: number;
  start_date: string;
  end_date: string;
  channel_link: string;
  group_link: string;
  campaign_name: string;
}

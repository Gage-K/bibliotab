export interface Tab {
  id: string;
  user_id: string;
  tab_name: string;
  tab_artist: string;
  tuning: TabTuning;
  created_at: Date;
  modified_at: Date;
  tab: string;
}

export type TabTuning = string[];

export type CreateTabDto = {
  tab_name: string;
  tab_artist: string;
  tuning: TabTuning;
  tab: string;
};

export type UpdateTabDto = {
  tab_name?: string;
  tab_artist?: string;
  tuning?: TabTuning;
  tab?: string;
};

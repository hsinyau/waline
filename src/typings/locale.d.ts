export interface WalineDateLocale {
  seconds: string;
  minutes: string;
  hours: string;
  days: string;
  now: string;
}

export type WalineLevelLocale = Record<`level${number}`, string>;

export interface WalineLocale extends WalineDateLocale, WalineLevelLocale {
  nick: string;
  mail: string;
  link: string;
  optional: string;
  placeholder: string;
  sofa: string;
  submit: string;
  comment: string;
  refresh: string;
  more: string;
  uploading: string;
  login: string;
  admin: string;
  sticky: string;
  word: string;
  anonymous: string;

  // manage
  approved: string;
  waiting: string;
  spam: string;
  unsticky: string;

  // sorting
  oldest: string;
  latest: string;
  hottest: string;

  // hint
  nickError: string;
  mailError: string;
  wordHint: string;

  // i18n
  like: string;
  cancelLike: string;
  reply: string;
  cancelReply: string;
  emoji: string;
  uploadImage: string;
  profile: string;
  logout: string;
  commentUnderReview: string;

  subPostComment: string;
  subSiteComment: string;
  subscribeToReplies: string;
}

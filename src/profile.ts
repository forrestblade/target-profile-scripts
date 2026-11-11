/**
 * The `profile` object: visitor profile parameters (mbox params sent with a
 * `profile.` prefix, which Target persists) plus the built-in profiles Adobe
 * lists in the profile and variable glossary.
 *
 * `profile.get(name)` returns null when nothing is set, as documented.
 * `profile.param` and `profile.parameter` are the documented aliases.
 */
export interface Geolocation {
  country: string;
  state: string;
  city: string;
  zip: string;
  dma: string;
  domainName: string;
  ispName: string;
  connectionSpeed: string;
  mobileCarrier: string;
  latitude: string;
  longitude: string;
}

export interface Mobile {
  isTablet: boolean;
  isMobilePhone: boolean;
}

export interface ProfileInput {
  /** Persistent `profile.*` parameters for this visitor. */
  params?: Record<string, string>;
  geolocation?: Partial<Geolocation>;
  mobile?: Partial<Mobile>;
  /** Visitor's local browser time, as Target would supply it. */
  browserTime?: string;
  averageDaysBetweenVisits?: number;
  sessionCount?: number;
}

export interface TargetProfile {
  get(name: string): string | null;
  param(name: string): string | null;
  parameter(name: string): string | null;
  readonly geolocation: Readonly<Geolocation>;
  readonly mobile: Readonly<Mobile>;
  readonly browserTime: string;
  readonly averageDaysBetweenVisits: number;
  readonly sessionCount: number;
}

const emptyGeo: Geolocation = {
  country: "",
  state: "",
  city: "",
  zip: "",
  dma: "",
  domainName: "",
  ispName: "",
  connectionSpeed: "",
  mobileCarrier: "",
  latitude: "",
  longitude: "",
};

export function createProfile(input: ProfileInput = {}): TargetProfile {
  const params = input.params ?? {};
  const get = (name: string): string | null =>
    Object.prototype.hasOwnProperty.call(params, name) ? params[name] : null;

  return Object.freeze({
    get,
    param: get,
    parameter: get,
    geolocation: Object.freeze({ ...emptyGeo, ...input.geolocation }),
    mobile: Object.freeze({ isTablet: false, isMobilePhone: false, ...input.mobile }),
    browserTime: input.browserTime ?? "",
    averageDaysBetweenVisits: input.averageDaysBetweenVisits ?? 0,
    sessionCount: input.sessionCount ?? 0,
  });
}

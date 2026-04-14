import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface Name {
  first: string;
  last: string;
}

interface Contacts {
  phone: string;
  email: string;
}

interface Personal {
  gender: string;
  dob: string;
  loc: string;
  ethnicity: string;
}

interface Social {
  facebook: string;
  instagram: string;
  tiktok: string;
  x: string;
  youtube: string;
  website: string;
  imdb: string;
  linkedin: string;
}

interface Photos {
  headshot: string;
  side: string;
  full: string;
  additional: string[];
}

interface Appearance {
  height: string;
  weight: string;
  eye: string;
  hair: string;
}

interface Assets {
  youtube: string[];
  audio: string[];
}

interface Credit {
  id?: string;
  title: string;
  year: string;
  company: string;
  about: string;
  photo?: string;
}

interface ProfileState {
  activeTab: string;
  name: Name;
  contacts: Contacts;
  personal: Personal;
  personalLink: string;
  interestedIn: string[];
  skills: string[];
  social: Social;
  photos: Photos;
  appearance: Appearance;
  assets: Assets;
  credits: Credit[];
}

interface ProfileActions {
  setActiveTab: (tab: string) => void;
  setData: (data: Partial<ProfileState>) => void;
  // Add other actions here as needed, for example:
  setFirstName: (firstName: string) => void;
  setLastName: (lastName: string) => void;
}

const useProfileStore = create<ProfileState & ProfileActions>()(
  immer((set) => ({
    activeTab: 'info',
    name: { first: '', last: '' },
    contacts: { phone: '', email: '' },
    personal: { gender: '', dob: '', loc: '', ethnicity: '' },
    personalLink: '',
    interestedIn: [],
    skills: [],
    social: { facebook: '', instagram: '', tiktok: '', x: '', youtube: '', website: '', imdb: '', linkedin: '' },
    photos: { headshot: '', side: '', full: '', additional: [] },
    appearance: { height: 'N/A', weight: 'N/A', eye: 'N/A', hair: 'N/A' },
    assets: { youtube: [], audio: [] },
    credits: [],

    setActiveTab: (tab) =>
      set((state) => {
        state.activeTab = tab;
      }),

    setData: (data) =>
      set((state) => {
        Object.assign(state, data);
      }),

    setFirstName: (firstName) =>
      set((state) => {
        state.name.first = firstName;
      }),

    setLastName: (lastName) =>
      set((state) => {
        state.name.last = lastName;
      }),
  }))
);

export default useProfileStore;

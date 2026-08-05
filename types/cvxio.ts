export const LEVELS = [
  'elementary',
  'limited-working',
  'professional-working',
  'full-professional',
  'native-bilingual',
] as const

export type Level = (typeof LEVELS)[number]
export interface Cv {
  layout?: 'one-column' | 'two-column'
  profileImageDataUri?: string | null
  jobTitle: string
  name: string
  lastName: string
  email: string
  location: string
  phoneNumber: string
  aboutme: string
  jobSkills: string[]
  displayJobSkills?: boolean
  softSkills: string[]
  displaySoftSkills?: boolean
  languages: { lang: string, level: Level }[]
  displayLanguages?: boolean
  interests: string[]
  displayInterests?: boolean
  linkedin: string
  twitter: string
  github: string
  website: string
  education: CvEvent[]
  work: CvEvent[]
  projects: CvEvent[]
  displaySocial: boolean
  displayAbout?: boolean
  displaySkills?: boolean
  displayWork?: boolean
  displayEducation: boolean
  displayProjects: boolean
  sectionOrder?: CvPart[]
  activeColor: string
}
export interface CvEvent {
  id: string
  title: string
  location: string
  from: Date | any
  to: Date | any
  displayDate: boolean
  current: boolean
  summary: string
}

export type OptionalSection =
  | 'displayAbout'
  | 'displaySkills'
  | 'displaySocial'
  | 'displayWork'
  | 'displayEducation'
  | 'displayProjects'

export type SkillType =
  'jobSkills' |
  'softSkills' |
  'languages' |
  'interests'

export interface LanguagesSkill {
  skill: { lang: string, level: Level }
  skillType: 'languages'
}
export interface DefaultSkill {
  skill: string
  skillType: Exclude<SkillType, 'languages'>
}

export type Skill = DefaultSkill['skill'] | LanguagesSkill['skill']

export const SectionNameList = {
  work: 'experience',
  education: 'education',
  projects: 'projects',
} as const
export type SectionName = keyof typeof SectionNameList

export const CV_PARTS = [
  'about',
  'skills',
  'work',
  'education',
  'projects',
  'social',
] as const

export type CvPart = (typeof CV_PARTS)[number]

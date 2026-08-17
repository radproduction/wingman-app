import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import type { TravelMode } from '../data/mobility'

import {
  BubbleChatIcon as ChatS,
  Mail01Icon as MailS,
  Calendar01Icon as CalendarS,
  Tick02Icon as CheckS,
  CheckmarkCircle02Icon as CheckCircleS,
  Task01Icon as TaskS,
  Notification02Icon as BellS,
  Clock01Icon as ClockS,
  Globe02Icon as GlobeS,
  User03Icon as UserS,
  UserGroup02Icon as UsersS,
  Airplane01Icon as PlaneS,
  DeliveryBox01Icon as BoxS,
  Invoice01Icon as ReceiptS,
  FavouriteIcon as HeartS,
  Moon02Icon as MoonS,
  Sun03Icon as SunS,
  Home01Icon as HomeS,
  DashboardSquare01Icon as GridS,
  ChevronLeftIcon as ChevronLeftS,
  ChevronRightIcon as ChevronRightS,
  PlusSignIcon as PlusS,
  Shield01Icon as ShieldS,
  SparklesIcon as SparkS,
  SmartPhone01Icon as PhoneS,
  Delete02Icon as TrashS,
  Alert02Icon as AlertS,
  Download04Icon as DownloadS,
  TruckDeliveryIcon as TruckS,
  CreditCardIcon as CardS,
  Location01Icon as PinS,
  PassportIcon as PassportS,
  Hotel01Icon as HotelS,
  Building06Icon as OfficeS,
  PencilEdit01Icon as EditS,
  EquipmentGym03Icon as GymS,
  WorkoutRunIcon as ActivityS,
  Logout03Icon as LogoutS,
  Cancel01Icon as CloseS,
  PaintBoardIcon as PaletteS,
  VolumeHighIcon as VolumeS,
  Motion01Icon as MotionS,
  TranslateIcon as TranslateS,
  Car03Icon as CarS,
  WalkingIcon as WalkS,
  Train01Icon as TrainS,
  Scooter01Icon as ScooterS,
  Search01Icon as SearchS,
  News01Icon as NewsS,
  AddCircleIcon as AddCircleS,
  Briefcase02Icon as BriefcaseS,
} from '../vendor/hugeicons/stroke'

import {
  BubbleChatIcon as ChatF,
  Mail01Icon as MailF,
  Calendar01Icon as CalendarF,
  Tick02Icon as CheckF,
  CheckmarkCircle02Icon as CheckCircleF,
  Task01Icon as TaskF,
  Notification02Icon as BellF,
  Clock01Icon as ClockF,
  Globe02Icon as GlobeF,
  User03Icon as UserF,
  UserGroup02Icon as UsersF,
  Airplane01Icon as PlaneF,
  DeliveryBox01Icon as BoxF,
  Invoice01Icon as ReceiptF,
  FavouriteIcon as HeartF,
  Moon02Icon as MoonF,
  Sun03Icon as SunF,
  Home01Icon as HomeF,
  DashboardSquare01Icon as GridF,
  ChevronLeftIcon as ChevronLeftF,
  ChevronRightIcon as ChevronRightF,
  PlusSignIcon as PlusF,
  Shield01Icon as ShieldF,
  SparklesIcon as SparkF,
  SmartPhone01Icon as PhoneF,
  Delete02Icon as TrashF,
  Alert02Icon as AlertF,
  Download04Icon as DownloadF,
  TruckDeliveryIcon as TruckF,
  CreditCardIcon as CardF,
  Location01Icon as PinF,
  PassportIcon as PassportF,
  Hotel01Icon as HotelF,
  Building06Icon as OfficeF,
  PencilEdit01Icon as EditF,
  EquipmentGym03Icon as GymF,
  WorkoutRunIcon as ActivityF,
  Logout03Icon as LogoutF,
  Cancel01Icon as CloseF,
  PaintBoardIcon as PaletteF,
  VolumeHighIcon as VolumeF,
  Motion01Icon as MotionF,
  TranslateIcon as TranslateF,
  Car03Icon as CarF,
  WalkingIcon as WalkF,
  Train01Icon as TrainF,
  Scooter01Icon as ScooterF,
  Search01Icon as SearchF,
  News01Icon as NewsF,
  AddCircleIcon as AddCircleF,
  Briefcase02Icon as BriefcaseF,
} from '../vendor/hugeicons/solid'

import {
  BubbleChatIcon as ChatD,
  Mail01Icon as MailD,
  Calendar01Icon as CalendarD,
  Tick02Icon as CheckD,
  CheckmarkCircle02Icon as CheckCircleD,
  Task01Icon as TaskD,
  Notification02Icon as BellD,
  Clock01Icon as ClockD,
  Globe02Icon as GlobeD,
  User03Icon as UserD,
  UserGroup02Icon as UsersD,
  Airplane01Icon as PlaneD,
  DeliveryBox01Icon as BoxD,
  Invoice01Icon as ReceiptD,
  FavouriteIcon as HeartD,
  Moon02Icon as MoonD,
  Sun03Icon as SunD,
  Home01Icon as HomeD,
  DashboardSquare01Icon as GridD,
  ChevronLeftIcon as ChevronLeftD,
  ChevronRightIcon as ChevronRightD,
  PlusSignIcon as PlusD,
  Shield01Icon as ShieldD,
  SparklesIcon as SparkD,
  SmartPhone01Icon as PhoneD,
  Delete02Icon as TrashD,
  Alert02Icon as AlertD,
  Download04Icon as DownloadD,
  TruckDeliveryIcon as TruckD,
  CreditCardIcon as CardD,
  Location01Icon as PinD,
  PassportIcon as PassportD,
  Hotel01Icon as HotelD,
  Building06Icon as OfficeD,
  PencilEdit01Icon as EditD,
  EquipmentGym03Icon as GymD,
  WorkoutRunIcon as ActivityD,
  Logout03Icon as LogoutD,
  Cancel01Icon as CloseD,
  PaintBoardIcon as PaletteD,
  VolumeHighIcon as VolumeD,
  Motion01Icon as MotionD,
  TranslateIcon as TranslateD,
  Car03Icon as CarD,
  WalkingIcon as WalkD,
  Train01Icon as TrainD,
  Scooter01Icon as ScooterD,
  Search01Icon as SearchD,
  News01Icon as NewsD,
  AddCircleIcon as AddCircleD,
  Briefcase02Icon as BriefcaseD,
} from '../vendor/hugeicons/duotone'

export type IconVariant = 'stroke' | 'solid' | 'duotone'

type Glyph = IconSvgElement
type VariantSet = { stroke: Glyph; solid: Glyph; duotone: Glyph }

const ICONS = {
  chat: { stroke: ChatS, solid: ChatF, duotone: ChatD },
  mail: { stroke: MailS, solid: MailF, duotone: MailD },
  calendar: { stroke: CalendarS, solid: CalendarF, duotone: CalendarD },
  check: { stroke: CheckS, solid: CheckF, duotone: CheckD },
  checkCircle: { stroke: CheckCircleS, solid: CheckCircleF, duotone: CheckCircleD },
  task: { stroke: TaskS, solid: TaskF, duotone: TaskD },
  bell: { stroke: BellS, solid: BellF, duotone: BellD },
  clock: { stroke: ClockS, solid: ClockF, duotone: ClockD },
  globe: { stroke: GlobeS, solid: GlobeF, duotone: GlobeD },
  user: { stroke: UserS, solid: UserF, duotone: UserD },
  users: { stroke: UsersS, solid: UsersF, duotone: UsersD },
  plane: { stroke: PlaneS, solid: PlaneF, duotone: PlaneD },
  box: { stroke: BoxS, solid: BoxF, duotone: BoxD },
  receipt: { stroke: ReceiptS, solid: ReceiptF, duotone: ReceiptD },
  heart: { stroke: HeartS, solid: HeartF, duotone: HeartD },
  moon: { stroke: MoonS, solid: MoonF, duotone: MoonD },
  sun: { stroke: SunS, solid: SunF, duotone: SunD },
  home: { stroke: HomeS, solid: HomeF, duotone: HomeD },
  grid: { stroke: GridS, solid: GridF, duotone: GridD },
  briefcase: { stroke: BriefcaseS, solid: BriefcaseF, duotone: BriefcaseD },
  chevronLeft: { stroke: ChevronLeftS, solid: ChevronLeftF, duotone: ChevronLeftD },
  chevronRight: { stroke: ChevronRightS, solid: ChevronRightF, duotone: ChevronRightD },
  plus: { stroke: PlusS, solid: PlusF, duotone: PlusD },
  shield: { stroke: ShieldS, solid: ShieldF, duotone: ShieldD },
  spark: { stroke: SparkS, solid: SparkF, duotone: SparkD },
  phone: { stroke: PhoneS, solid: PhoneF, duotone: PhoneD },
  trash: { stroke: TrashS, solid: TrashF, duotone: TrashD },
  alert: { stroke: AlertS, solid: AlertF, duotone: AlertD },
  download: { stroke: DownloadS, solid: DownloadF, duotone: DownloadD },
  truck: { stroke: TruckS, solid: TruckF, duotone: TruckD },
  card: { stroke: CardS, solid: CardF, duotone: CardD },
  pin: { stroke: PinS, solid: PinF, duotone: PinD },
  passport: { stroke: PassportS, solid: PassportF, duotone: PassportD },
  hotel: { stroke: HotelS, solid: HotelF, duotone: HotelD },
  office: { stroke: OfficeS, solid: OfficeF, duotone: OfficeD },
  edit: { stroke: EditS, solid: EditF, duotone: EditD },
  addCircle: { stroke: AddCircleS, solid: AddCircleF, duotone: AddCircleD },
  gym: { stroke: GymS, solid: GymF, duotone: GymD },
  activity: { stroke: ActivityS, solid: ActivityF, duotone: ActivityD },
  logout: { stroke: LogoutS, solid: LogoutF, duotone: LogoutD },
  close: { stroke: CloseS, solid: CloseF, duotone: CloseD },
  palette: { stroke: PaletteS, solid: PaletteF, duotone: PaletteD },
  volume: { stroke: VolumeS, solid: VolumeF, duotone: VolumeD },
  motion: { stroke: MotionS, solid: MotionF, duotone: MotionD },
  translate: { stroke: TranslateS, solid: TranslateF, duotone: TranslateD },
  car: { stroke: CarS, solid: CarF, duotone: CarD },
  walk: { stroke: WalkS, solid: WalkF, duotone: WalkD },
  train: { stroke: TrainS, solid: TrainF, duotone: TrainD },
  scooter: { stroke: ScooterS, solid: ScooterF, duotone: ScooterD },
  search: { stroke: SearchS, solid: SearchF, duotone: SearchD },
  news: { stroke: NewsS, solid: NewsF, duotone: NewsD },
} satisfies Record<string, VariantSet>

export type IconName = keyof typeof ICONS

export interface IconProps {
  name: IconName
  size?: number
  variant?: IconVariant
  strokeWidth?: number
  className?: string
  color?: string
}

export const Icon = ({
  name,
  size = 22,
  variant = 'stroke',
  strokeWidth = 1.8,
  className,
  color = 'currentColor',
}: IconProps) => (
  <HugeiconsIcon
    icon={ICONS[name][variant]}
    size={size}
    strokeWidth={variant === 'stroke' ? strokeWidth : undefined}
    color={color}
    className={className}
    aria-hidden
  />
)

type LegacyProps = { size?: number; variant?: IconVariant; strokeWidth?: number; className?: string }
const legacy = (name: IconName) => {
  const C = (p: LegacyProps) => <Icon name={name} {...p} />
  C.displayName = `Icon(${name})`
  return C
}

export const IconChat = legacy('chat')
export const IconMail = legacy('mail')
export const IconCalendar = legacy('calendar')
export const IconCheck = legacy('check')
export const IconCheckCircle = legacy('checkCircle')
export const IconTask = legacy('task')
export const IconBell = legacy('bell')
export const IconClock = legacy('clock')
export const IconGlobe = legacy('globe')
export const IconUser = legacy('user')
export const IconUsers = legacy('users')
export const IconPlane = legacy('plane')
export const IconBox = legacy('box')
export const IconReceipt = legacy('receipt')
export const IconHeart = legacy('heart')
export const IconMoon = legacy('moon')
export const IconSun = legacy('sun')
export const IconHome = legacy('home')
export const IconGrid = legacy('grid')
export const IconChevronL = legacy('chevronLeft')
export const IconChevronR = legacy('chevronRight')
export const IconPlus = legacy('plus')
export const IconShield = legacy('shield')
export const IconSpark = legacy('spark')
export const IconPhone = legacy('phone')


const MODE_ICON: Record<TravelMode, IconName> = {
  drive: 'car',
  walk: 'walk',
  transit: 'train',
  twowheeler: 'scooter',
}

export const ModeIcon = ({ mode, size = 18 }: { mode: TravelMode; size?: number }) => (
  <Icon name={MODE_ICON[mode]} size={size} variant="duotone" />
)


export const ShareGlyph = ({ size = 16, className }: { size?: number; className?: string }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M8 7l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M6 11H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)


export const IconGmailBrand = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 49.4 512 399.42" aria-hidden="true">
    <path fill="#4285f4" d="M34.91 448.818h81.454V251L0 163.727V413.91c0 19.287 15.622 34.91 34.91 34.91z" />
    <path fill="#34a853" d="M395.636 448.818h81.455c19.287 0 34.909-15.622 34.909-34.909V163.727L395.636 251z" />
    <path fill="#fbbc04" d="M395.636 99.727V251L512 163.727v-46.545c0-43.142-49.25-67.782-83.782-41.891z" />
    <path fill="#ea4335" d="M116.364 251V99.727L256 204.455 395.636 99.727V251L256 355.727z" />
    <path fill="#c5221f" d="M0 117.182v46.545L116.364 251V99.727L83.782 75.291C49.25 49.4 0 74.04 0 117.18z" />
  </svg>
)

export const IconWhatsapp = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 360 362" fill="none" aria-hidden="true">
    <path
      fill="#25D366"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M307.546 52.566C273.709 18.684 228.706.017 180.756 0 81.951 0 1.538 80.404 1.504 179.235c-.017 31.594 8.242 62.432 23.928 89.609L0 361.736l95.024-24.925c26.179 14.285 55.659 21.805 85.655 21.814h.077c98.788 0 179.21-80.413 179.244-179.244.017-47.898-18.608-92.926-52.454-126.807v-.008Zm-126.79 275.788h-.06c-26.73-.008-52.952-7.194-75.831-20.765l-5.44-3.231-56.391 14.791 15.05-54.981-3.542-5.638c-14.912-23.721-22.793-51.139-22.776-79.286.035-82.14 66.867-148.973 149.051-148.973 39.793.017 77.198 15.53 105.328 43.695 28.131 28.157 43.61 65.596 43.593 105.398-.035 82.149-66.867 148.982-148.982 148.982v.008Zm81.719-111.577c-4.478-2.243-26.497-13.073-30.606-14.568-4.108-1.496-7.09-2.243-10.073 2.243-2.982 4.487-11.568 14.577-14.181 17.559-2.613 2.991-5.226 3.361-9.704 1.117-4.477-2.243-18.908-6.97-36.02-22.226-13.313-11.878-22.304-26.54-24.916-31.027-2.613-4.486-.275-6.91 1.959-9.136 2.011-2.011 4.478-5.234 6.721-7.847 2.244-2.613 2.983-4.486 4.478-7.469 1.496-2.991.748-5.603-.369-7.847-1.118-2.243-10.073-24.289-13.812-33.253-3.636-8.732-7.331-7.546-10.073-7.692-2.613-.13-5.595-.155-8.586-.155-2.991 0-7.839 1.118-11.947 5.604-4.108 4.486-15.677 15.324-15.677 37.361s16.047 43.344 18.29 46.335c2.243 2.991 31.585 48.225 76.51 67.632 10.684 4.615 19.029 7.374 25.535 9.437 10.727 3.412 20.49 2.931 28.208 1.779 8.604-1.289 26.498-10.838 30.228-21.298 3.73-10.46 3.73-19.433 2.613-21.298-1.117-1.865-4.108-2.991-8.586-5.234l.008-.017Z"
    />
  </svg>
)

export const IconGCalBrand = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden="true">
    <path fill="#fff" d="M148.88 51.12H51.12v97.76h97.76z" />
    <path fill="#ea4335" d="M148.88 200 200 148.88h-51.12z" />
    <path fill="#fbbc04" d="M200 51.12h-51.12v97.76H200z" />
    <path fill="#34a853" d="M148.88 148.88H51.12V200h97.76z" />
    <path fill="#188038" d="M0 148.88v34a17.12 17.12 0 0 0 17.12 17.12h34v-51.12z" />
    <path fill="#1967d2" d="M200 51.12v-34A17.12 17.12 0 0 0 182.88 0h-34v51.12z" />
    <path fill="#4285f4" d="M148.88 0H17.12A17.12 17.12 0 0 0 0 17.12v131.76h51.12V51.12h97.76z" />
    <path
      fill="#4285f4"
      d="M74.47 129.04c-4.25-2.87-7.19-7.06-8.8-12.58l9.86-4.07c.9 3.41 2.46 6.05 4.69 7.93 2.22 1.88 4.92 2.8 8.07 2.8 3.22 0 5.99-.98 8.31-2.94 2.31-1.96 3.48-4.46 3.48-7.49 0-3.1-1.22-5.63-3.66-7.59-2.45-1.96-5.52-2.94-9.18-2.94h-5.7v-9.76h5.12c3.15 0 5.81-.85 7.97-2.56 2.16-1.7 3.24-4.03 3.24-7 0-2.65-.97-4.75-2.9-6.32-1.94-1.58-4.38-2.38-7.35-2.38-2.9 0-5.2.77-6.9 2.32a13.6 13.6 0 0 0-3.73 5.7l-9.76-4.07c1.29-3.66 3.66-6.9 7.15-9.7 3.48-2.8 7.93-4.21 13.33-4.21 4 0 7.59.77 10.77 2.32 3.18 1.55 5.68 3.69 7.49 6.42 1.8 2.74 2.7 5.81 2.7 9.22 0 3.48-.84 6.42-2.52 8.84a17.6 17.6 0 0 1-6.17 5.56v.58a18.8 18.8 0 0 1 7.93 6.18c2.06 2.77 3.1 6.08 3.1 9.94 0 3.87-.98 7.32-2.94 10.34-1.96 3.04-4.68 5.43-8.11 7.18-3.45 1.75-7.33 2.63-11.64 2.63-4.98.01-9.59-1.42-13.83-4.29zM135.74 83.19l-10.83 7.83-5.41-8.21 19.42-14.01h7.45v66.07h-10.63z"
    />
  </svg>
)

export const IconShopifyBrand = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 256 292" aria-hidden="true">
    <path
      fill="#95BF46"
      d="M223.774 57.34c-.201-1.46-1.48-2.268-2.537-2.357-1.055-.088-23.383-1.743-23.383-1.743s-15.507-15.395-17.209-17.099c-1.703-1.703-5.029-1.185-6.32-.805-.19.056-3.388 1.043-8.678 2.68-5.18-14.906-14.322-28.604-30.405-28.604-.444 0-.901.018-1.358.044C129.31 3.407 123.644.779 118.75.779c-37.465 0-55.364 46.835-60.976 70.635-14.558 4.511-24.9 7.718-26.221 8.133-8.126 2.549-8.383 2.805-9.45 10.462C21.3 95.806.038 260.235.038 260.235l165.678 31.042 89.77-19.42S223.973 58.8 223.775 57.34zM156.49 40.848l-14.019 4.339c.005-.988.01-1.96.01-3.023 0-9.264-1.286-16.723-3.349-22.636 8.287 1.04 13.806 10.469 17.358 21.32zm-27.638-19.483c2.304 5.773 3.802 14.058 3.802 25.238 0 .572-.005 1.095-.01 1.624-9.117 2.824-19.024 5.89-28.953 8.966 5.575-21.516 16.025-31.908 25.161-35.828zm-11.131-10.537c1.617 0 3.246.549 4.805 1.622-12.007 5.65-24.877 19.88-30.312 48.297l-22.886 7.088C75.694 46.16 90.81 10.828 117.72 10.828z"
    />
    <path
      fill="#5E8E3E"
      d="M221.237 54.983c-1.055-.088-23.383-1.743-23.383-1.743s-15.507-15.395-17.209-17.099c-.637-.634-1.496-.959-2.394-1.099l-12.527 256.233 89.762-19.418S223.972 58.8 223.774 57.34c-.201-1.46-1.48-2.268-2.537-2.357"
    />
    <path
      fill="#FFF"
      d="M135.242 104.585l-11.069 32.926s-9.698-5.176-21.586-5.176c-17.428 0-18.305 10.937-18.305 13.693 0 15.038 39.2 20.8 39.2 56.024 0 27.713-17.577 45.558-41.277 45.558-28.44 0-42.984-17.7-42.984-17.7l7.615-25.16s14.95 12.835 27.565 12.835c8.243 0 11.596-6.49 11.596-11.232 0-19.616-32.16-20.491-32.16-52.724 0-27.129 19.472-53.382 58.778-53.382 15.145 0 22.627 4.338 22.627 4.338"
    />
  </svg>
)

export const IconAnalyticsBrand = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 2195.9 2430.9" aria-hidden="true">
    <path
      fill="#F9AB00"
      d="M2195.9,2126.7c0.9,166.9-133.7,302.8-300.5,303.7c-12.4,0.1-24.9-0.6-37.2-2.1 c-154.8-22.9-268.2-157.6-264.4-314V316.1c-3.7-156.6,110-291.3,264.9-314c165.7-19.4,315.8,99.2,335.2,264.9 c1.4,12.2,2.1,24.4,2,36.7L2195.9,2126.7z"
    />
    <path
      fill="#E37400"
      d="M301.1,1828.7c166.3,0,301.1,134.8,301.1,301.1c0,166.3-134.8,301.1-301.1,301.1 C134.8,2430.9,0,2296.1,0,2129.8C0,1963.5,134.8,1828.7,301.1,1828.7z M1093.3,916.2c-167.1,9.2-296.7,149.3-292.8,316.6v808.7 c0,219.5,96.6,352.7,238.1,381.1c163.3,33.1,322.4-72.4,355.5-235.7c4.1-20,6.1-40.3,6-60.7v-907.4 c0.3-166.9-134.7-302.4-301.6-302.7C1096.8,916.1,1095,916.1,1093.3,916.2z"
    />
  </svg>
)

export const IconHubspotBrand = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#FF7A59" aria-hidden="true">
    <path d="M18.164 7.93V5.084a2.198 2.198 0 001.267-1.978v-.067A2.2 2.2 0 0017.238.845h-.067a2.2 2.2 0 00-2.193 2.193v.067a2.196 2.196 0 001.252 1.973l.013.006v2.852a6.22 6.22 0 00-2.969 1.31l.012-.01-7.828-6.095A2.497 2.497 0 104.3 4.656l-.012.006 7.697 5.991a6.176 6.176 0 00-1.038 3.446c0 1.343.425 2.588 1.147 3.607l-.013-.02-2.342 2.343a1.968 1.968 0 00-.58-.095h-.002a2.033 2.033 0 102.033 2.033 1.978 1.978 0 00-.1-.595l.005.014 2.317-2.317a6.247 6.247 0 104.782-11.134l-.036-.005zm-.964 9.378a3.206 3.206 0 113.215-3.207v.002a3.206 3.206 0 01-3.207 3.207z" />
  </svg>
)

export const BRAND_MARKS = {
  whatsapp: IconWhatsapp,
  gmail: IconGmailBrand,
  gcal: IconGCalBrand,
  shopify: IconShopifyBrand,
  ga: IconAnalyticsBrand,
  crm: IconHubspotBrand,
} as const

export type BrandKey = keyof typeof BRAND_MARKS

export const ConnectorMark = ({
  brandKey,
  icon,
  tone,
  size = 24,
  rung = 'sm',
}: {
  brandKey: string
  icon: IconName
  tone: string
  size?: number
  rung?: 'sm' | 'lg'
}) => {
  const Brand = BRAND_MARKS[brandKey as BrandKey]
  return Brand ? (
    <span className={`wg-chip wg-chip--brand ${rung}`}>
      <Brand size={size} />
    </span>
  ) : (
    <span className={`wg-chip ${tone} ${rung}`}>
      <Icon name={icon} size={Math.round(size * 0.72)} variant="duotone" />
    </span>
  )
}

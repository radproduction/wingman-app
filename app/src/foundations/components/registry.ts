import type { ComponentType } from 'react'
import { ActionBarDoc } from './ActionBarDoc'
import { AssistantSummaryDoc } from './AssistantSummaryDoc'
import { ButtonDoc } from './ButtonDoc'
import { AvatarDoc } from './AvatarDoc'
import { ChipDoc } from './ChipDoc'
import { CodeBoxDoc } from './CodeBoxDoc'
import { CardLineDoc } from './CardLineDoc'
import { EmptyStateDoc } from './EmptyStateDoc'
import { FieldDoc } from './FieldDoc'
import { GalleryDoc } from './GalleryDoc'
import { PageDotsDoc, ProgressDoc, SliderDoc, SwitchDoc } from './ControlAtomsDocs'
import { SettingGroupDoc, ListRowDoc } from './GroupRowsDocs'
import { IconDoc } from './IconDoc'
import { FilterRailDoc, SearchFieldDoc } from './ListFurnitureDocs'
import { ApprovalCardDoc } from './ApprovalCardDoc'
import { PullToRefreshDoc, SplashDoc } from './BrandMotionDocs'
import { WeekStripDoc, EventCardDoc } from './CalendarDocs'
import { TaskRowDoc, MailRowDoc } from './FeedRowsDocs'
import { DayCardDoc, MetricPillDoc, InsightCardDoc } from './HomeCardsDocs'
import { TimelineDoc, StoryRowDoc } from './IntelNewsDocs'
import { ModuleHeroDoc } from './ModuleHeroDoc'
import { ModuleRowDoc } from './ModuleRowDoc'
import { NotConnectedDoc } from './NotConnectedDoc'
import { ConnectorRowDoc, MemoryRowDoc, MeetingRowDoc } from './PeopleRowsDocs'
import { ThemePickerDoc, AppIconPickerDoc } from './PickerDocs'
import { TripCardDoc, SparklineDoc } from './TravelHealthDocs'
import { WidgetCellDoc, WidgetRowDoc } from './WidgetDocs'
import { NoticeDoc } from './NoticeDoc'
import { OptionRowDoc } from './OptionRowDoc'
import { AppHeaderDoc, BackBarDoc, OnboardingBarDoc } from './BarsDocs'
import { ScreenTransitionDoc } from './ScreenTransitionDoc'
import { SegmentedDoc } from './SegmentedDoc'
import { SettingRowDoc } from './SettingRowDoc'
import { SheetActionsDoc, SheetDoc } from './SheetDocs'
import { PanelDoc, ScreenScaffoldDoc } from './ShellSurfacesDocs'
import { TabBarDoc } from './TabBarDoc'
import { ToastDoc } from './ToastDoc'
import { StatePillDoc, StatusPillDoc, TagDoc, TonePillDoc } from './PillDocs'
import { SkeletonDoc } from './SkeletonDoc'
import { TileGridDoc, BentoTileDoc } from './TileGridDocs'
import { InlineLinkDoc, TextButtonDoc } from './TextActionsDocs'
import { CaptionDoc, FootnoteDoc, SectionHeadDoc } from './TextAtomsDocs'

export const DOC_PAGES: Record<string, ComponentType> = {
  icon: IconDoc,
  footnote: FootnoteDoc,
  caption: CaptionDoc,
  'section-head': SectionHeadDoc,
  tag: TagDoc,
  'tone-pill': TonePillDoc,
  'state-pill': StatePillDoc,
  'status-pill': StatusPillDoc,
  switch: SwitchDoc,
  progress: ProgressDoc,
  'page-dots': PageDotsDoc,
  slider: SliderDoc,
  skeleton: SkeletonDoc,
  'card-line': CardLineDoc,
  'code-box': CodeBoxDoc,

  button: ButtonDoc,
  chip: ChipDoc,
  avatar: AvatarDoc,
  field: FieldDoc,
  segmented: SegmentedDoc,
  'inline-link': InlineLinkDoc,
  'text-button': TextButtonDoc,

  'option-row': OptionRowDoc,
  'empty-state': EmptyStateDoc,
  'setting-row': SettingRowDoc,
  'setting-group': SettingGroupDoc,
  'list-row': ListRowDoc,
  'module-row': ModuleRowDoc,
  'tile-grid': TileGridDoc,
  'bento-tile': BentoTileDoc,
  gallery: GalleryDoc,
  notice: NoticeDoc,
  'filter-rail': FilterRailDoc,
  'search-field': SearchFieldDoc,
  'assistant-summary': AssistantSummaryDoc,

  screen: ScreenScaffoldDoc,
  panel: PanelDoc,
  'app-header': AppHeaderDoc,
  'back-bar': BackBarDoc,
  'onboarding-bar': OnboardingBarDoc,
  'tab-bar': TabBarDoc,
  sheet: SheetDoc,
  'sheet-actions': SheetActionsDoc,
  toast: ToastDoc,
  'action-bar': ActionBarDoc,
  'screen-transition': ScreenTransitionDoc,
  'not-connected': NotConnectedDoc,

  'widget-cell': WidgetCellDoc,
  'widget-row': WidgetRowDoc,
  'day-card': DayCardDoc,
  'metric-pill': MetricPillDoc,
  'insight-card': InsightCardDoc,
  'event-card': EventCardDoc,
  'week-strip': WeekStripDoc,
  'task-row': TaskRowDoc,
  'mail-row': MailRowDoc,
  'approval-card': ApprovalCardDoc,
  'module-hero': ModuleHeroDoc,
  'connector-row': ConnectorRowDoc,
  'memory-row': MemoryRowDoc,
  'meeting-row': MeetingRowDoc,
  'trip-card': TripCardDoc,
  sparkline: SparklineDoc,
  timeline: TimelineDoc,
  'story-row': StoryRowDoc,
  'theme-picker': ThemePickerDoc,
  'app-icon-picker': AppIconPickerDoc,

  splash: SplashDoc,
  'pull-spacer': PullToRefreshDoc,
}

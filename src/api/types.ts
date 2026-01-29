// API类型定义

// 位置节点
export interface StorageNode {
  id: number
  name: string
  parent: number | null
  path_name: string
  image?: string | null
  description?: string | null
  order: number
}

// IP关键词
export interface IPKeyword {
  id: number
  value: string
}

// IP信息
export interface IP {
  id: number
  name: string
  short_name?: string
  keywords?: IPKeyword[]
  /**
   * 作品类型：1=书籍, 2=动画, 3=音乐, 4=游戏, 6=三次元/特摄
   */
  subject_type?: number | null
  /**
   * 该 IP 下的角色数量（后端 /api/ips/ 列表接口返回）
   */
  character_count?: number
}

// 角色性别类型
export type CharacterGender = 'male' | 'female' | 'other'

// 角色信息
export interface Character {
  id: number
  name: string
  ip: IP
  avatar?: string | null
  gender: CharacterGender
}

// 品类信息（树形支持）
export interface Category {
  id: number
  name: string
  parent: number | null
  path_name: string
  color_tag?: string | null
  order: number
  children?: Category[]
}

// 主题信息
export interface Theme {
  id: number
  name: string
  description?: string | null
  created_at?: string | null
}

// 谷子状态
export type GoodsStatus = 'in_cabinet' | 'outdoor' | 'sold'

// 补充图片
export interface GuziImage {
  id: number
  image: string
  label?: string | null
}

// 谷子列表项（瘦身版）
export interface GoodsListItem {
  id: string
  name: string
  ip: IP
  characters: Character[]
  category: Category
  theme?: Theme | null
  location_path: string
  main_photo?: string | null
  status: GoodsStatus
  quantity: number
  is_official?: boolean
}

// 谷子详情（完整版）
export interface GoodsDetail extends GoodsListItem {
  location: number | null
  price?: string | null
  purchase_date?: string | null
  is_official: boolean
  notes?: string | null
  created_at: string
  updated_at: string
  additional_photos: GuziImage[]
}

// 分页响应
export interface PaginatedResponse<T> {
  count: number
  page: number
  page_size: number
  next: number | null
  previous: number | null
  results: T[]
}

// 搜索参数
export interface GoodsSearchParams {
  ip?: number
  character?: number
  // 支持后端的多角色过滤：characters__in=5,6
  characters__in?: string
  category?: number
  theme?: number
  status?: GoodsStatus
  // 支持后端的多状态过滤：status__in=in_cabinet,sold
  status__in?: string
  /**
   * 是否官谷筛选：
   * - true：只看官谷
   * - false：只看非官谷
   * - undefined：不过滤
   */
  is_official?: boolean
  location?: number
  search?: string
  page?: number
  page_size?: number
}

// 统计看板查询参数（复用列表筛选 + 统计专用参数）
export interface GoodsStatsParams {
  // 与 GoodsSearchParams 共用的筛选字段
  ip?: number
  character?: number
  category?: number
  theme?: number
  status?: GoodsStatus
  status__in?: string
  is_official?: boolean
  location?: number
  search?: string
  // 统计专用
  top?: number
  group_by?: 'month' | 'week' | 'day'
  purchase_start?: string
  purchase_end?: string
  created_start?: string
  created_end?: string
}

// 统计响应类型
export interface GoodsStatsMeta {
  top: number
  group_by: 'month' | 'week' | 'day'
  purchase_start: string | null
  purchase_end: string | null
  created_start: string | null
  created_end: string | null
}

export interface GoodsStatsOverview {
  goods_count: number
  quantity_sum: number
  value_sum: string
  with_price_count: number
  missing_price_count: number
  with_purchase_date_count: number
  missing_purchase_date_count: number
  with_location_count: number
  missing_location_count: number
  with_main_photo_count: number
  missing_main_photo_count: number
}

export interface GoodsStatusDistributionItem {
  status: GoodsStatus
  label: string
  goods_count: number
  quantity_sum: number
}

export interface GoodsOfficialDistributionItem {
  is_official: boolean
  label: string
  goods_count: number
  quantity_sum: number
}

export interface GoodsSubjectTypeDistributionItem {
  ip__subject_type: number | null
  label: string
  goods_count: number
  quantity_sum: number
}

export interface GoodsCategoryTopItem {
  category_id: number
  category__name: string
  category__path_name: string
  category__color_tag?: string | null
  goods_count: number
  quantity_sum: number
  value_sum: string
}

export interface GoodsIPTopItem {
  ip_id: number
  ip__name: string
  ip__subject_type?: number | null
  subject_type_label?: string
  goods_count: number
  quantity_sum: number
  value_sum: string
}

export interface GoodsTrendBucket {
  bucket: string
  goods_count: number
  quantity_sum: number
  value_sum?: string
}

export interface GoodsStatsDistributions {
  status?: GoodsStatusDistributionItem[]
  is_official?: GoodsOfficialDistributionItem[]
  ip_subject_type?: GoodsSubjectTypeDistributionItem[]
  category_top?: GoodsCategoryTopItem[]
  ip_top?: GoodsIPTopItem[]
  // 角色 / 位置 Top 在需要时再补充完整类型
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

export interface GoodsStatsTrends {
  purchase_date?: GoodsTrendBucket[]
  created_at?: GoodsTrendBucket[]
}

export interface GoodsStatsResponse {
  meta: GoodsStatsMeta
  overview: GoodsStatsOverview
  distributions: GoodsStatsDistributions
  trends: GoodsStatsTrends
}

// 创建/更新谷子的输入类型（字段可以是 ID 或对象）
export interface GoodsInput {
  name?: string
  ip?: number | IP
  ip_id?: number
  character?: number | Character
  character_id?: number
  // 多角色关联（用于创建/更新）
  character_ids?: number[]
  category?: number | Category
  category_id?: number
  theme?: number | Theme | null
  theme_id?: number | null
  status?: GoodsStatus
  location?: number | null
  quantity?: number
  price?: string | null
  purchase_date?: string | null
  is_official?: boolean
  notes?: string | null
  main_photo?: string | null
}

// 谷子排序移动响应
export interface MoveGoodsResponse {
  detail?: string
  id: string
  new_order?: number
}

// ==================== 展柜（Showcase）====================

export interface Showcase {
  id: string
  name: string
  description?: string | null
  cover_image?: string | null
  /**
   * 展柜列表接口会返回该展柜下前四个谷子的主图 URL（最多 4 个）
   * - 后端字段名：preview_photos
   * - 可能为空数组 []
   */
  preview_photos?: string[]
  order?: number
  is_public?: boolean
  created_at?: string
  updated_at?: string
  /**
   * 展柜详情接口会包含以下字段（列表接口通常不含）
   */
  categories?: ShowcaseCategory[]
  showcase_goods?: ShowcaseGoods[]
}

export interface ShowcaseCategory {
  id: string
  showcase?: string
  name: string
  description?: string | null
  order: number
  created_at?: string
  updated_at?: string
}

export interface ShowcaseGoods {
  id: string
  goods: GoodsListItem & {
    order?: number
  }
  category: ShowcaseCategory | null
  order: number
  notes?: string | null
  created_at?: string
  updated_at?: string
}

export interface ShowcaseListParams {
  page?: number
  page_size?: number
}

export type PaginatedShowcaseResponse = PaginatedResponse<Showcase>

export interface ShowcaseCreateInput {
  name: string
  description?: string | null
  is_public?: boolean
  /**
   * 说明：后端文档支持 multipart 同传 cover_image；如需封面上传，前端用 FormData。
   * 这里允许透传 FormData（在 api/showcase.ts 中按需处理）。
   */
}

export type ShowcaseUpdateInput = Partial<ShowcaseCreateInput> & {
  name?: string
}

export interface ShowcaseCategoryCreateInput {
  showcase: string
  name: string
  description?: string | null
  order?: number
}

export type ShowcaseCategoryUpdateInput = Partial<ShowcaseCategoryCreateInput>

export interface ShowcaseAddGoodsInput {
  goods_id: string
  category_id?: string
  notes?: string
}

export interface ShowcaseRemoveGoodsInput {
  goods_id: string
}

export interface ShowcaseMoveGoodsInput {
  goods_id: string
  anchor_goods_id: string
  position: 'before' | 'after'
  category_id?: string
}

export interface ShowcaseMoveGoodsResponse {
  detail?: string
  id: string
  new_order?: number
}

// BGM角色搜索结果
export interface BGMCharacter {
  name: string
  relation: string
  avatar: string
}

// BGM搜索响应
export interface BGMSearchResponse {
  ip_name: string
  characters: BGMCharacter[]
}

// BGM创建角色请求项
export interface BGMCreateCharacterItem {
  ip_name: string
  character_name: string
  subject_type?: number | null
  avatar?: string | null
}

// BGM创建角色响应项
export interface BGMCreateCharacterResult {
  ip_name: string
  character_name: string
  status: 'created' | 'already_exists' | 'error'
  ip_id?: number
  character_id?: number
  error?: string
}

// BGM批量创建角色响应
export interface BGMCreateCharactersResponse {
  created: number
  skipped: number
  details: BGMCreateCharacterResult[]
}

// BGM作品信息
export interface BGMSubject {
  id: number
  name: string
  name_cn: string
  type: number
  type_name: string
  image: string
}

// 搜索作品响应
export interface BGMSearchSubjectsResponse {
  subjects: BGMSubject[]
}

// 根据ID获取角色响应
export interface BGMGetCharactersResponse {
  subject_id: number
  subject_name: string
  characters: BGMCharacter[]
}


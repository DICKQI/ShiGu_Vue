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


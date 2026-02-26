<template>
  <div class="ip-character-management-container">
    <!-- 顶部操作区 -->
    <div class="header-section">
      <div class="title-wrapper">
        <h2 class="page-title">IP作品与角色管理</h2>
        <span class="sub-title">管理您的作品分类及其角色</span>
      </div>

      <!-- 合并后的操作按钮 -->
      <div class="header-actions" v-if="authStore.isAdmin">
        <el-dropdown trigger="click" @command="handleActionCommand">
          <el-button type="primary" class="action-dropdown-btn">
            <el-icon class="icon-left"><Plus /></el-icon>
            <span>新增 / 导入</span>
            <el-icon class="icon-right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu class="custom-dropdown-menu">
              <el-dropdown-item command="bgm">
                <div class="menu-item-content">
                  <el-icon><Search /></el-icon>
                  <span>从 Bangumi 导入</span>
                  <el-tag size="small" type="info" effect="plain" class="menu-tag">推荐</el-tag>
                </div>
              </el-dropdown-item>
              <el-dropdown-item divided command="ip">
                <div class="menu-item-content">
                  <el-icon><Collection /></el-icon>
                  <span>新增作品 (IP)</span>
                </div>
              </el-dropdown-item>
              <el-dropdown-item command="character">
                <div class="menu-item-content">
                  <el-icon><UserFilled /></el-icon>
                  <span>新增角色</span>
                </div>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 搜索与筛选卡片 -->
    <el-card class="search-card" shadow="never">
      <div class="search-filter-container">
        <div class="search-flex">
          <el-input
            v-model="searchText"
            placeholder="搜索作品名称或关键词..."
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
            class="custom-search"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button class="search-btn" type="primary" @click="handleSearch">搜索</el-button>
        </div>
        <div class="filter-flex">
          <el-select
            v-model="selectedSubjectTypes"
            placeholder="筛选作品类型（可多选）"
            multiple
            clearable
            collapse-tags
            collapse-tags-tooltip
            @change="handleSearch"
            class="filter-select"
            style="width: 100%"
          >
            <el-option label="书籍" :value="1" />
            <el-option label="动画" :value="2" />
            <el-option label="音乐" :value="3" />
            <el-option label="游戏" :value="4" />
            <el-option label="三次元/特摄" :value="6" />
          </el-select>
        </div>
      </div>
    </el-card>

    <!-- 内容展示区 -->
    <div v-loading="loading" class="content-body">
      <!-- PC端：精致的表格 -->
      <!-- 修改点：data绑定sortedIpList，添加sort-change事件 -->
      <div class="desktop-view">
        <el-table
          ref="tableRef"
          :data="sortedIpList"
          border-radius="12"
          style="width: 100%"
          row-key="id"
          @expand-change="handleTableExpandChange"
          @sort-change="handleSortChange"
        >
          <el-table-column v-if="authStore.isAdmin" label="排序" width="80" align="center">
            <template #default>
              <div class="drag-handle" @click.stop>
                <svg viewBox="0 0 16 16" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="2" y1="4" x2="14" y2="4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  <line x1="2" y1="12" x2="14" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </div>
            </template>
          </el-table-column>
          <el-table-column type="expand" width="50">
            <template #default="{ row }">
              <div class="character-expand-section">
                <div class="expand-header">
                  <span class="expand-title">角色列表</span>
                  <el-button
                    v-if="authStore.isAdmin"
                    size="small"
                    type="primary"
                    text
                    @click="handleAddCharacterForIP(row)"
                  >
                    <el-icon><Plus /></el-icon>
                    为该IP添加角色
                  </el-button>
                </div>
                <div v-loading="characterLoadingMap[row.id]" class="character-content">
                  <template v-if="characterMap[row.id]?.length">
                    <div
                      v-for="char in characterMap[row.id]"
                      :key="char.id"
                      class="character-row"
                    >
                      <div class="char-info-row">
                        <el-avatar :size="40" :src="char.avatar || undefined" shape="square" class="char-avatar table-avatar">
                          <el-icon><UserFilled /></el-icon>
                        </el-avatar>
                        <div class="char-details">
                          <span class="char-name">{{ char.name }}</span>
                          <span v-if="false" :class="['gender-badge', char.gender]">
                            {{ getGenderLabel(char.gender) }}
                          </span>
                        </div>
                      </div>
                      <div class="char-actions" v-if="authStore.isAdmin">
                        <el-button link type="primary" @click="handleEditCharacter(char)" title="编辑">
                          <el-icon :size="16"><Edit /></el-icon>
                        </el-button>
                        <el-button link type="danger" @click="handleDeleteCharacter(char)" title="删除">
                          <el-icon :size="16"><Delete /></el-icon>
                        </el-button>
                      </div>
                    </div>
                  </template>
                  <el-empty
                    v-else-if="!characterLoadingMap[row.id]"
                    description="该作品下暂无角色"
                    :image-size="80"
                  />
                </div>
              </div>
            </template>
          </el-table-column>

          <!-- 修改点：添加 sortable="custom" 和 prop -->
          <el-table-column prop="name" label="作品名称" min-width="180" sortable="custom">
            <template #default="{ row }">
              <span class="table-name">{{ row.name }}</span>
            </template>
          </el-table-column>

          <!-- 修改点：添加 sortable="custom" 和 prop -->
          <el-table-column prop="subject_type" label="作品类型" width="120" align="center" sortable="custom">
            <template #default="{ row }">
              <el-tag v-if="row.subject_type" size="small" :type="getSubjectTypeTagType(row.subject_type)">
                {{ getSubjectTypeLabel(row.subject_type) }}
              </el-tag>
              <span v-else class="no-type">-</span>
            </template>
          </el-table-column>

          <el-table-column label="检索关键词" min-width="250">
            <template #default="{ row }">
              <div class="tag-group">
                <el-tag
                  v-for="keyword in row.keywords || []"
                  :key="keyword.id"
                  effect="plain"
                  round
                  size="small"
                  class="custom-tag"
                >
                  {{ keyword.value }}
                </el-tag>
              </div>
            </template>
          </el-table-column>

          <!-- 修改点：添加 sortable="custom" 和 prop="character_count" -->
          <el-table-column prop="character_count" label="角色数量" width="120" align="center" sortable="custom">
            <template #default="{ row }">
              <span class="character-count">{{ row.character_count ?? (characterMap[row.id]?.length || 0) }}</span>
            </template>
          </el-table-column>

          <el-table-column v-if="authStore.isAdmin" label="操作" width="120" align="right" fixed="right">
            <template #default="{ row }">
              <div class="action-inline">
                <el-button link type="primary" @click="handleEditIP(row)" title="编辑">
                  <el-icon :size="16"><Edit /></el-icon>
                </el-button>
                <el-button link type="danger" @click="handleDeleteIP(row)" title="删除">
                  <el-icon :size="16"><Delete /></el-icon>
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 移动端：现代化卡片 -->
      <div
        class="mobile-view pull-refresh-wrapper"
        ref="scrollContainerRef"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <!-- 下拉加载提示区 -->
        <div
          class="pull-indicator"
          :style="{
            height: `${pullDistance}px`,
            opacity: pullDistance > 0 ? 1 : 0,
            transition: isDragging ? 'none' : 'height 0.3s cubic-bezier(0.25, 0.8, 0.5, 1)'
          }"
        >
          <div class="indicator-content">
            <el-icon v-if="isRefreshing" class="is-loading"><Loading /></el-icon>
            <el-icon v-else :style="{ transform: `rotate(${pullDistance > 50 ? 180 : 0}deg)` }"><Top /></el-icon>
            <span class="indicator-text">
              {{ isRefreshing ? '正在刷新...' : (pullDistance > 50 ? '释放刷新' : '下拉刷新') }}
            </span>
          </div>
        </div>

        <!-- 内容区域 -->
        <!-- 修改点：遍历 sortedIpList，保持顺序一致 -->
        <div class="mobile-view-inner" ref="mobileListRef">
          <div v-for="item in sortedIpList" :key="item.id" class="ip-card-item">
            <div class="card-main" @click="toggleExpand(item.id)">
              <div class="card-info">
                <div class="name-row">
                  <h3 class="name-text">{{ item.name }}</h3>
                  <span class="character-count-badge">{{ item.character_count ?? (characterMap[item.id]?.length || 0) }}</span>
                </div>
                <div class="keyword-row">
                  <span v-for="keyword in item.keywords || []" :key="keyword.id" class="mini-tag">
                    {{ keyword.value }}
                  </span>
                  <span v-if="!item.keywords?.length" class="no-tag">暂无关键词</span>
                </div>
              </div>
              <div class="card-arrow">
                <el-icon :class="{ rotated: expandedIPs.includes(item.id) }">
                  <ArrowRight />
                </el-icon>
              </div>
              <div class="card-drag-handle mobile-drag-handle" v-if="authStore.isAdmin" @click.stop>
                <svg viewBox="0 0 16 16" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="2" y1="4" x2="14" y2="4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  <line x1="2" y1="12" x2="14" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </div>
            </div>

            <!-- 展开的角色列表 -->
            <div
              v-if="expandedIPs.includes(item.id)"
              v-loading="characterLoadingMap[item.id]"
              class="character-list"
            >
              <div class="character-list-header">
                <span>角色列表</span>
                <el-button
                  v-if="authStore.isAdmin"
                  size="small"
                  type="primary"
                  text
                  @click.stop="handleAddCharacterForIP(item)"
                >
                  <el-icon><Plus /></el-icon>
                  添加角色
                </el-button>
              </div>
              <template v-if="characterMap[item.id]?.length">
                <div
                  v-for="char in characterMap[item.id]"
                  :key="char.id"
                  class="character-card"
                >
                  <el-avatar :size="50" :src="char.avatar || undefined" shape="square" class="char-avatar">
                    <el-icon><UserFilled /></el-icon>
                  </el-avatar>
                  <div class="char-info">
                    <div class="name-line">
                      <span class="name">{{ char.name }}</span>
                      <span v-if="false" :class="['gender-badge', char.gender]">
                        {{ getGenderLabel(char.gender) }}
                      </span>
                    </div>
                  </div>
                  <div class="char-actions-mobile" v-if="authStore.isAdmin">
                    <el-button
                      size="small"
                      text
                      type="primary"
                      @click.stop="handleEditCharacter(char)"
                    >
                      <el-icon><Edit /></el-icon>
                    </el-button>
                    <el-button
                      size="small"
                      text
                      type="danger"
                      @click.stop="handleDeleteCharacter(char)"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                </div>
              </template>
              <el-empty v-else description="暂无角色" :image-size="60" />
            </div>

            <div class="card-footer" v-if="authStore.isAdmin">
              <div class="footer-action" @click.stop="handleEditIP(item)" title="编辑作品">
                <el-icon><Edit /></el-icon>
              </div>
              <div class="footer-action delete" @click.stop="handleDeleteIP(item)" title="删除作品">
                <el-icon><Delete /></el-icon>
              </div>
            </div>
          </div>
        </div>
      </div>

      <el-empty v-if="!loading && ipList.length === 0" description="没有找到相关的作品" />
    </div>

    <!-- 刷新按钮 - 右下角悬浮（仅PC端） -->
    <div class="refresh-fab hidden-xs-only" @click="handleRefresh" :class="{ loading: loading }">
      <el-icon v-if="!loading"><Refresh /></el-icon>
      <el-icon v-else class="is-loading"><Loading /></el-icon>
    </div>

    <!-- IP编辑弹窗 (保持不变) -->
    <el-dialog
      v-model="ipDialogVisible"
      :title="ipDialogTitle"
      :width="dialogWidth"
      class="custom-dialog"
      align-center
    >
      <el-form :model="ipFormData" :rules="ipFormRules" ref="ipFormRef" label-position="top">
        <el-form-item label="作品官方全称" prop="name">
          <el-input v-model="ipFormData.name" placeholder="例如：崩坏：星穹铁道" />
        </el-form-item>
        <el-form-item label="作品类型">
          <el-select
            v-model="ipFormData.subject_type"
            placeholder="选择作品类型（可选）"
            clearable
            style="width: 100%"
          >
            <el-option label="书籍" :value="1" />
            <el-option label="动画" :value="2" />
            <el-option label="音乐" :value="3" />
            <el-option label="游戏" :value="4" />
            <el-option label="三次元/特摄" :value="6" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联关键词 (别名/缩写)">
          <div class="keyword-manager-box">
            <div class="input-inline">
              <el-input
                v-model="newKeyword"
                placeholder="输入别名后点添加"
                @keyup.enter="handleAddKeyword"
              >
                <template #append>
                  <el-button @click="handleAddKeyword">添加</el-button>
                </template>
              </el-input>
            </div>
            <div class="tags-wrapper">
              <el-tag
                v-for="(keyword, index) in ipFormData.keywords"
                :key="index"
                closable
                round
                @close="handleRemoveKeyword(index)"
              >
                {{ keyword }}
              </el-tag>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="ipDialogVisible = false">取消</el-button>
          <el-button type="primary" class="submit-btn" @click="handleSubmitIP" :loading="submitting">
            保存更改
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- BGM导入弹窗 (保持不变) -->
    <el-dialog
      v-model="bgmDialogVisible"
      title="从Bangumi导入角色"
      :width="bgmDialogWidth"
      class="custom-dialog bgm-dialog"
      align-center
      :close-on-click-modal="false"
    >
      <div class="bgm-import-container">
        <!-- 搜索阶段 -->
        <div v-if="bgmStep === 'search'" class="bgm-step-search">
          <el-form @submit.prevent="handleBGMSearch">
            <el-form-item label="IP作品名称">
              <el-input
                v-model="bgmSearchInput"
                placeholder="例如：崩坏：星穹铁道"
                clearable
                @keyup.enter="handleBGMSearch"
                :disabled="bgmSearching"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item label="作品类型（可选）">
              <el-select
                v-model="bgmSubjectType"
                placeholder="选择作品类型（不选则搜索所有类型）"
                clearable
                :disabled="bgmSearching"
                style="width: 100%"
              >
                <el-option label="所有类型" :value="undefined" />
                <el-option label="书籍" :value="1" />
                <el-option label="动画" :value="2" />
                <el-option label="音乐" :value="3" />
                <el-option label="游戏" :value="4" />
                <el-option label="三次元/特摄" :value="6" />
              </el-select>
            </el-form-item>
            <div class="bgm-search-actions">
              <el-button type="primary" @click="handleBGMSearch" :loading="bgmSearching" :disabled="!bgmSearchInput.trim()">
                搜索BGM
              </el-button>
            </div>
          </el-form>
        </div>

        <!-- 搜索中等待页面 -->
        <div v-if="bgmStep === 'searching'" class="bgm-step-searching">
          <div class="searching-content">
            <el-icon class="searching-icon"><Loading /></el-icon>
            <h3>正在搜索Bangumi...</h3>
            <p>请耐心等待，正在从Bangumi API获取角色信息</p>
            <div class="searching-progress">
              <el-progress :percentage="50" :indeterminate="true" />
            </div>
          </div>
        </div>

        <!-- 作品列表展示 -->
        <div v-if="bgmStep === 'subjects'" class="bgm-step-subjects">
          <div class="results-header">
            <h3>选择作品</h3>
            <p class="results-subtitle">找到 {{ bgmSubjects.length }} 个相关作品，请点击选择一个</p>
          </div>
          <div class="bgm-subjects-list">
             <div
               v-for="subject in bgmSubjects"
               :key="subject.id"
               class="bgm-subject-item"
               @click="handleBGMSelectSubject(subject)"
             >
                <el-image
                  :src="subject.image"
                  class="bgm-subject-cover"
                  fit="cover"
                  loading="lazy"
                >
                  <template #error>
                    <div class="image-slot">
                      <el-icon><Picture /></el-icon>
                    </div>
                  </template>
                </el-image>
                <div class="bgm-subject-info">
                  <h4 class="subject-name" :title="subject.name">{{ subject.name }}</h4>
                  <div class="subject-meta">
                    <el-tag size="small" type="info">{{ subject.type_name }}</el-tag>
                    <span class="subject-cn" v-if="subject.name_cn && subject.name_cn !== subject.name">{{ subject.name_cn }}</span>
                  </div>
                </div>
                <div class="bgm-subject-arrow">
                  <el-icon><ArrowRight /></el-icon>
                </div>
             </div>
          </div>
        </div>

        <!-- 获取角色中等待页面 -->
        <div v-if="bgmStep === 'loading-characters'" class="bgm-step-searching">
          <div class="searching-content">
            <el-icon class="searching-icon"><Loading /></el-icon>
            <h3>正在获取角色列表...</h3>
            <p>正在从Bangumi API获取选中作品的角色信息</p>
          </div>
        </div>

        <!-- 搜索结果展示 -->
        <div v-if="bgmStep === 'results'" class="bgm-step-results">
          <div class="results-header">
            <h3>搜索结果：{{ bgmSearchResult?.ip_name }}</h3>
            <p class="results-subtitle">找到 {{ bgmSearchResult?.characters.length || 0 }} 个角色，请勾选需要导入的角色</p>
          </div>
          <div class="results-actions-top">
            <el-button size="small" @click="handleBGMSelectAll">全选</el-button>
            <el-button size="small" @click="handleBGMSelectNone">取消全选</el-button>
            <span class="selected-count">已选择 {{ bgmSelectedCharacters.length }} 个角色</span>
          </div>
          <div class="results-filter">
            <el-input
              v-model="bgmCharacterKeyword"
              size="small"
              placeholder="按角色名搜索"
              clearable
              class="results-filter-input"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
          <div class="character-list-container">
            <div
              v-for="(char, index) in bgmSearchResult?.characters || []"
              :key="index"
              class="bgm-character-item"
              :class="{ selected: bgmSelectedCharacters.includes(index) }"
              v-show="
                !bgmCharacterKeyword.trim() ||
                char.name.toLowerCase().includes(bgmCharacterKeyword.trim().toLowerCase())
              "
              @click="handleBGMToggleCharacter(index)"
            >
              <el-checkbox
                :model-value="bgmSelectedCharacters.includes(index)"
                @change="handleBGMToggleCharacter(index)"
                @click.stop
              />
              <el-avatar :size="50" :src="char.avatar || undefined" shape="square" class="char-avatar">
                <el-icon><UserFilled /></el-icon>
              </el-avatar>
              <div class="char-info">
                <div class="char-name">{{ char.name }}</div>
                <div class="char-relation">{{ char.relation }}</div>
              </div>
            </div>
          </div>
          <div v-if="!bgmSearchResult?.characters.length" class="empty-results">
            <el-empty description="未找到角色信息" />
          </div>
        </div>

        <!-- 导入中 -->
        <div v-if="bgmStep === 'importing'" class="bgm-step-importing">
          <div class="importing-content">
            <el-icon class="importing-icon"><Loading /></el-icon>
            <h3>正在导入角色...</h3>
            <p>请稍候，正在将选中的角色添加到数据库</p>
            <div class="importing-progress">
              <el-progress :percentage="50" :indeterminate="true" />
            </div>
          </div>
        </div>

        <!-- 导入结果 -->
        <div v-if="bgmStep === 'imported'" class="bgm-step-imported">
          <div class="imported-content">
            <el-icon class="success-icon"><CircleCheck /></el-icon>
            <h3>导入完成！</h3>
            <div class="import-summary">
              <p>成功创建：<strong>{{ bgmImportResult?.created || 0 }}</strong> 个角色</p>
              <p>已存在跳过：<strong>{{ bgmImportResult?.skipped || 0 }}</strong> 个角色</p>
            </div>
            <div class="import-details" v-if="bgmImportResult?.details.length">
              <el-collapse>
                <el-collapse-item title="查看详情" name="details">
                  <div
                    v-for="(detail, idx) in bgmImportResult.details"
                    :key="idx"
                    class="detail-item"
                    :class="detail.status"
                  >
                    <el-icon>
                      <CircleCheck v-if="detail.status === 'created'" />
                      <Warning v-else-if="detail.status === 'already_exists'" />
                      <CircleClose v-else />
                    </el-icon>
                    <span class="detail-text">
                      {{ detail.ip_name }} - {{ detail.character_name }}
                      <span class="detail-status">
                        ({{ detail.status === 'created' ? '已创建' : detail.status === 'already_exists' ? '已存在' : '错误' }})
                      </span>
                    </span>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button v-if="bgmStep === 'search'" @click="bgmDialogVisible = false">取消</el-button>
          <el-button v-if="bgmStep === 'subjects'" @click="handleBGMReset">返回搜索</el-button>
          <el-button
            v-if="bgmStep === 'results'"
            @click="bgmStep = 'subjects'"
          >
            返回作品列表
          </el-button>
          <el-button
            v-if="bgmStep === 'results'"
            type="primary"
            @click="handleBGMConfirmImport"
            :disabled="bgmSelectedCharacters.length === 0"
            :loading="bgmImporting"
          >
            确认导入 ({{ bgmSelectedCharacters.length }})
          </el-button>
          <el-button
            v-if="bgmStep === 'imported'"
            type="primary"
            @click="handleBGMClose"
          >
            完成
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 角色编辑弹窗 (保持不变) -->
    <el-dialog
      v-model="characterDialogVisible"
      :title="characterDialogTitle"
      :width="dialogWidth"
      class="custom-dialog"
      align-center
    >
      <el-form
        :model="characterFormData"
        :rules="characterFormRules"
        ref="characterFormRef"
        label-position="top"
      >
        <div class="form-layout">
          <div class="avatar-col">
            <div class="avatar-mode-switch">
              <el-radio-group v-model="avatarInputMode" size="small" class="mode-radio-group">
                <el-radio-button value="upload">上传文件</el-radio-button>
                <el-radio-button value="url">输入URL</el-radio-button>
              </el-radio-group>
            </div>
            <!-- 文件上传模式 -->
            <el-upload
              v-if="avatarInputMode === 'upload'"
              class="avatar-uploader"
              :auto-upload="false"
              :show-file-list="false"
              @change="handleAvatarFileChange"
            >
              <img v-if="avatarPreview" :src="avatarPreview" class="preview-img" />
              <el-icon v-else class="uploader-icon"><Plus /></el-icon>
              <div class="upload-label">点击上传</div>
            </el-upload>
            <!-- URL输入模式 -->
            <div v-else class="avatar-url-input">
              <el-input
                v-model="avatarUrlInput"
                placeholder="输入头像图片URL"
                clearable
                @input="handleAvatarUrlInput"
              >
                <template #prefix>
                  <el-icon><Link /></el-icon>
                </template>
              </el-input>
              <div v-if="avatarPreview" class="url-preview">
                <img :src="avatarPreview" class="preview-img" alt="头像预览" />
              </div>
            </div>
          </div>
          <div class="info-col">
            <el-form-item label="角色名称" prop="name">
              <el-input v-model="characterFormData.name" placeholder="输入角色名" />
            </el-form-item>
            <el-form-item label="所属作品" prop="ip_id">
              <el-select
                v-model="characterFormData.ip_id"
                placeholder="选择所属IP"
                filterable
                style="width: 100%"
              >
                <el-option v-for="ip in ipList" :key="ip.id" :label="ip.name" :value="ip.id" />
              </el-select>
            </el-form-item>
            <el-form-item v-if="false" label="性别" prop="gender">
              <el-radio-group v-model="characterFormData.gender" class="custom-radio">
                <el-radio-button value="female">女</el-radio-button>
                <el-radio-button value="male">男</el-radio-button>
                <el-radio-button value="other">其他</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </div>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="characterDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          class="submit-btn"
          @click="handleSubmitCharacter"
          :loading="submitting"
        >
          保存信息
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import {
  Plus,
  Edit,
  Delete,
  Search,
  ArrowRight,
  UserFilled,
  Loading,
  CircleCheck,
  Warning,
  CircleClose,
  Refresh,
  ArrowDown,
  Collection,
  Link,
  Top,
  Picture,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules, UploadFile } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useMetadataStore } from '@/stores/metadata'
import {
  getIPList,
  getIPDetail,
  createIP,
  updateIP,
  deleteIP,
  getIPCharacters,
  batchUpdateIPOrder,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  searchBGMCharacters,
  createBGMCharacters,
  searchBGMSubjects,
  getBGMCharactersBySubjectId,
} from '@/api/metadata'
import Sortable from 'sortablejs'
import type {
  IP,
  Character,
  CharacterGender,
  BGMSearchResponse,
  BGMCreateCharactersResponse,
  BGMSubject,
} from '@/api/types'

// 窗口宽度响应式
const windowWidth = ref(window.innerWidth)
const isMobile = computed(() => windowWidth.value < 768)

const updateWindowWidth = () => {
  windowWidth.value = window.innerWidth
}

const authStore = useAuthStore()
const metadataStore = useMetadataStore()

onMounted(() => {
  window.addEventListener('resize', updateWindowWidth)
  fetchIPList()
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowWidth)
  destroySortables()
})

// 下拉刷新相关状态
const scrollContainerRef = ref<HTMLElement | null>(null)
const startY = ref(0)
const pullDistance = ref(0)
const isRefreshing = ref(false)
const isDragging = ref(false)
const MAX_PULL = 80
const TRIGGER_DIST = 50

// 拖拽排序相关
const tableRef = ref()
const mobileListRef = ref<HTMLElement | null>(null)
let sortableTable: ReturnType<typeof Sortable.create> | null = null
let sortableMobile: ReturnType<typeof Sortable.create> | null = null
const isSorting = ref(false)

// 修复：获取页面滚动高度的辅助函数
const getScrollTop = () => {
  return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
}

// 下拉刷新逻辑
const handleTouchStart = (e: TouchEvent) => {
  if (!isMobile.value || isRefreshing.value || isSorting.value) return

  // 核心修复：检查 window 的滚动高度，只有在页面最顶端时才记录触摸点
  if (getScrollTop() > 0) {
    startY.value = 0 // 确保非顶端时不记录有效起始点
    return
  }

  const firstTouch = e.touches?.[0]
  if (!firstTouch) return

  isDragging.value = true
  startY.value = firstTouch.clientY
}

const handleTouchMove = (e: TouchEvent) => {
  if (!isMobile.value || isRefreshing.value || isSorting.value || startY.value === 0 || !isDragging.value) return

  // 双重保险：移动过程中如果页面被卷下去了，也不处理
  if (getScrollTop() > 0) return

  const firstTouch = e.touches?.[0]
  if (!firstTouch) return
  const currentY = firstTouch.clientY
  const distance = currentY - startY.value

  if (distance > 0) {
    if (e.cancelable) e.preventDefault()
    pullDistance.value = Math.min(distance * 0.4, MAX_PULL)
  } else {
    pullDistance.value = 0
  }
}

const handleTouchEnd = async () => {
  isDragging.value = false
  if (!isMobile.value || isRefreshing.value || isSorting.value) return

  if (pullDistance.value >= TRIGGER_DIST) {
    isRefreshing.value = true
    pullDistance.value = TRIGGER_DIST

    try {
      await fetchIPList(true)
      ElMessage.success('刷新成功')
    } catch (error) {
      ElMessage.error('刷新失败')
    } finally {
      setTimeout(() => {
        isRefreshing.value = false
        pullDistance.value = 0
        startY.value = 0
      }, 500)
    }
  } else {
    pullDistance.value = 0
    startY.value = 0
  }
}

// 弹窗宽度计算
const dialogWidth = computed(() => {
  if (windowWidth.value <= 768) {
    return '90%'
  }
  return '600px'
})

// BGM导入弹窗需要更宽
const bgmDialogWidth = computed(() => {
  if (windowWidth.value <= 768) {
    return '90%'
  }
  return '800px'
})

// 状态管理
const loading = ref(false)
const submitting = ref(false)
const searchText = ref('')
const selectedSubjectTypes = ref<number[]>([])
const ipList = ref<IP[]>([])
const characterMap = ref<Record<number, Character[]>>({})
const characterLoadingMap = ref<Record<number, boolean>>({})
const expandedIPs = ref<number[]>([])

// 排序状态管理
const sortState = ref<{ prop: string, order: string }>({ prop: '', order: '' })

// 监听表格排序变化
const handleSortChange = ({ prop, order }: { prop: string, order: string }) => {
  sortState.value = { prop, order }
}

// 纯前端排序计算属性
const sortedIpList = computed(() => {
  const list = [...ipList.value].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id)
  if (!sortState.value.prop || !sortState.value.order) return list

  return list.sort((a, b) => {
    let result = 0

    // 根据作品名称排序 (支持中文拼音)
    if (sortState.value.prop === 'name') {
      result = a.name.localeCompare(b.name, 'zh-CN')
    }
    // 根据作品类型排序 (数值)
    else if (sortState.value.prop === 'subject_type') {
      const typeA = a.subject_type || 0
      const typeB = b.subject_type || 0
      result = typeA - typeB
    }
    // 根据角色数量排序
    else if (sortState.value.prop === 'character_count') {
      const countA = a.character_count ?? (characterMap.value[a.id]?.length || 0)
      const countB = b.character_count ?? (characterMap.value[b.id]?.length || 0)
      result = countA - countB
    }

    return sortState.value.order === 'descending' ? -result : result
  })
})

const destroySortables = () => {
  if (sortableTable) {
    sortableTable.destroy()
    sortableTable = null
  }
  if (sortableMobile) {
    sortableMobile.destroy()
    sortableMobile = null
  }
}

const handleRowReorder = async (oldIndex: number, newIndex: number) => {
  if (oldIndex === newIndex) return
  if (sortState.value.prop) {
    ElMessage.warning('请清空表格排序后再进行拖拽排序')
    await fetchIPList(true)
    return
  }

  const list = [...sortedIpList.value]
  const moved = list[oldIndex]
  const target = list[newIndex]
  if (!moved || !target) return

  list.splice(oldIndex, 1)
  list.splice(newIndex, 0, moved)

  const items = list.map((item, index) => ({
    id: item.id,
    order: index * 10,
  }))

  const orderMap = new Map(items.map((i) => [i.id, i.order]))
  ipList.value = list.map((item) => ({
    ...item,
    order: orderMap.get(item.id) ?? item.order,
  }))

  await nextTick()
  initDragSort()

  try {
    await batchUpdateIPOrder(items)
    ElMessage.success('排序已更新')
  } catch (err: any) {
    ElMessage.error(err?.message || '排序更新失败，已回滚')
    await fetchIPList(true)
  }
}

const initDragSort = () => {
  destroySortables()
  if (typeof window === 'undefined' || !authStore.isAdmin) return

  const tableEl = tableRef.value?.$el as HTMLElement | undefined
  const tbody = tableEl?.querySelector('.el-table__body-wrapper tbody') as HTMLElement | null
  if (tbody) {
    sortableTable = Sortable.create(tbody, {
      handle: '.drag-handle',
      draggable: '.el-table__row',
      filter: '.el-table__expanded-row',
      animation: 150,
      onStart: () => {
        isSorting.value = true
      },
      onEnd: (evt: any) => {
        isSorting.value = false
        handleRowReorder(evt.oldIndex ?? 0, evt.newIndex ?? 0)
      },
    })
  }

  const mobileListEl = mobileListRef.value
  if (mobileListEl) {
    sortableMobile = Sortable.create(mobileListEl, {
      handle: '.mobile-drag-handle',
      draggable: '.ip-card-item',
      animation: 150,
      onStart: () => {
        isSorting.value = true
      },
      onEnd: (evt: any) => {
        isSorting.value = false
        handleRowReorder(evt.oldIndex ?? 0, evt.newIndex ?? 0)
      },
    })
  }
}

// IP相关
const ipDialogVisible = ref(false)
const ipDialogTitle = computed(() => (isEditIP.value ? '📝 编辑作品资料' : '✨ 新增IP作品'))
const isEditIP = ref(false)
const editingIPId = ref<number | null>(null)
const ipFormRef = ref<FormInstance>()
const newKeyword = ref('')
const ipFormData = ref({
  name: '',
  keywords: [] as string[],
  subject_type: null as number | null,
})
const ipFormRules: FormRules = {
  name: [{ required: true, message: '请输入作品名称', trigger: 'blur' }],
}

// 角色相关
const characterDialogVisible = ref(false)
const characterDialogTitle = computed(() =>
  isEditCharacter.value ? '🎭 编辑角色资料' : '✨ 迎接新角色'
)
const isEditCharacter = ref(false)
const editingCharacterId = ref<number | null>(null)
const editingCharacterOriginalIpId = ref<number | null>(null)
const characterFormRef = ref<FormInstance>()
const avatarPreview = ref('')
const avatarFile = ref<File | null>(null)
const avatarInputMode = ref<'upload' | 'url'>('upload')
const avatarUrlInput = ref('')
const characterFormData = ref({
  name: '',
  ip_id: null as number | null,
  gender: 'other' as CharacterGender,
})
const characterFormRules: FormRules = {
  name: [{ required: true, message: '请输入角色名', trigger: 'blur' }],
  ip_id: [{ required: true, message: '请选择所属IP', trigger: 'change' }],
}

// BGM导入相关
const bgmDialogVisible = ref(false)
type BGMStep = 'search' | 'searching' | 'subjects' | 'loading-characters' | 'results' | 'importing' | 'imported'
const bgmStep = ref<BGMStep>('search')
const bgmSearchInput = ref('')
const bgmSubjectType = ref<number | undefined>(undefined)
const bgmSearching = ref(false)
const bgmCharacterKeyword = ref('')
const bgmSubjects = ref<BGMSubject[]>([])
const bgmSearchResult = ref<BGMSearchResponse | null>(null)
const bgmSelectedCharacters = ref<number[]>([])
const bgmImporting = ref(false)
const bgmImportResult = ref<BGMCreateCharactersResponse | null>(null)

const getGenderLabel = (g: CharacterGender) =>
  ({ male: '男', female: '女', other: '其他' }[g] || '未知')

// 获取作品类型标签
const getSubjectTypeLabel = (type: number | null | undefined) => {
  if (!type) return ''
  const map: Record<number, string> = {
    1: '书籍',
    2: '动画',
    3: '音乐',
    4: '游戏',
    6: '三次元/特摄',
  }
  return map[type] || '未知'
}

// 获取作品类型标签颜色
const getSubjectTypeTagType = (type: number | null | undefined): '' | 'success' | 'info' | 'warning' | 'danger' => {
  if (!type) return ''
  const map: Record<number, '' | 'success' | 'info' | 'warning' | 'danger'> = {
    1: 'warning', // 书籍 - 黄色
    2: 'success', // 动画 - 绿色
    3: 'info',    // 音乐 - 蓝色
    4: 'danger',  // 游戏 - 红色
    6: '',        // 三次元/特摄 - 默认
  }
  return map[type] || ''
}

const setIPCharacterCount = (ipId: number, count: number) => {
  const ip = ipList.value.find((x) => x.id === ipId)
  if (!ip) return
  ip.character_count = count
}

const syncIPCharacterCountFromMap = (ipId: number) => {
  const list = characterMap.value[ipId]
  if (!list) return
  setIPCharacterCount(ipId, list.length)
}

const handleActionCommand = (command: string) => {
  switch (command) {
    case 'bgm':
      handleOpenBGMImport()
      break
    case 'ip':
      handleAddIP()
      break
    case 'character':
      handleAddCharacter()
      break
  }
}

const fetchIPList = async (force = false) => {
  loading.value = true
  try {
    const allIPs = await metadataStore.fetchIPs(force)

    let filtered = allIPs
    if (searchText.value.trim()) {
      const lowerSearch = searchText.value.trim().toLowerCase()
      filtered = filtered.filter(ip =>
        ip.name.toLowerCase().includes(lowerSearch) ||
        (ip.keywords && ip.keywords.some(k => k.value.toLowerCase().includes(lowerSearch)))
      )
    }

    if (selectedSubjectTypes.value.length > 0) {
      filtered = filtered.filter(ip =>
        ip.subject_type && selectedSubjectTypes.value.includes(ip.subject_type)
      )
    }

    ipList.value = filtered
    characterMap.value = {}
    expandedIPs.value = []
    await nextTick()
    initDragSort()
  } catch (err: any) {
    ElMessage.error(err.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const fetchIPCharacters = async (ipId: number) => {
  if (characterLoadingMap.value[ipId]) return

  // 先检查 Store 内存中是否有数据，如果有，先展示（虽然 Store 内部有检查，但这里可以避免 loading 状态闪烁）
  if (metadataStore.charactersByIP[ipId]) {
    characterMap.value[ipId] = metadataStore.charactersByIP[ipId]
    syncIPCharacterCountFromMap(ipId)
    return
  }

  characterLoadingMap.value[ipId] = true
  try {
    // 调用 Store 的按需获取方法
    const data = await metadataStore.fetchIPCharacters(ipId)
    characterMap.value[ipId] = data
    syncIPCharacterCountFromMap(ipId)
  } catch (err: any) {
    ElMessage.error(err.message || '加载角色失败')
    characterMap.value[ipId] = []
    syncIPCharacterCountFromMap(ipId)
  } finally {
    characterLoadingMap.value[ipId] = false
  }
}

const toggleExpand = async (ipId: number) => {
  const index = expandedIPs.value.indexOf(ipId)
  if (index > -1) {
    expandedIPs.value.splice(index, 1)
  } else {
    expandedIPs.value.push(ipId)
    await fetchIPCharacters(ipId)
  }
}

const handleTableExpandChange = async (row: IP, expandedRows: IP[]) => {
  const isExpanded = expandedRows.some((r) => r.id === row.id)
  if (isExpanded) {
    await fetchIPCharacters(row.id)
  }
}

const handleSearch = () => fetchIPList()

const handleRefresh = () => {
  fetchIPList(true)
}

const handleAddIP = () => {
  isEditIP.value = false
  editingIPId.value = null
  ipFormData.value = { name: '', keywords: [], subject_type: null }
  newKeyword.value = ''
  ipDialogVisible.value = true
}

const handleEditIP = async (row: IP) => {
  isEditIP.value = true
  editingIPId.value = row.id
  try {
    const detail = await getIPDetail(row.id)
    ipFormData.value = {
      name: detail.name,
      keywords: detail.keywords?.map((k) => k.value) || [],
      subject_type: detail.subject_type ?? null,
    }
  } catch {
    ipFormData.value = {
      name: row.name,
      keywords: row.keywords?.map((k) => k.value) || [],
      subject_type: row.subject_type ?? null,
    }
  }
  newKeyword.value = ''
  ipDialogVisible.value = true
}

const handleDeleteIP = async (row: IP) => {
  try {
    await ElMessageBox.confirm(
      `确定删除作品《${row.name}》吗？这将导致关联的角色数据丢失。`,
      '警告',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '点错了',
        type: 'warning',
        buttonSize: 'default',
      }
    )
    await deleteIP(row.id)
    ElMessage.success('已安全删除')
    delete characterMap.value[row.id]
    fetchIPList(true)
  } catch {}
}

const handleAddKeyword = () => {
  const val = newKeyword.value.trim()
  if (!val) return
  if (ipFormData.value.keywords.includes(val)) return ElMessage.warning('关键词已存在')
  ipFormData.value.keywords.push(val)
  newKeyword.value = ''
}

const handleRemoveKeyword = (index: number) => {
  ipFormData.value.keywords.splice(index, 1)
}

const handleSubmitIP = async () => {
  if (!ipFormRef.value) return
  await ipFormRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      const data = {
        name: ipFormData.value.name,
        keywords: ipFormData.value.keywords,
        subject_type: ipFormData.value.subject_type ?? null,
      }
      if (isEditIP.value && editingIPId.value) {
        await updateIP(editingIPId.value, data)
        if (expandedIPs.value.includes(editingIPId.value)) {
          delete characterMap.value[editingIPId.value]
          await fetchIPCharacters(editingIPId.value)
        }
      } else {
        await createIP(data)
      }
      ElMessage.success('操作成功')
      ipDialogVisible.value = false
      fetchIPList(true)
    } catch (err: any) {
      ElMessage.error(err.message || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}

const handleAddCharacter = () => {
  isEditCharacter.value = false
  editingCharacterId.value = null
  editingCharacterOriginalIpId.value = null
  characterFormData.value = { name: '', ip_id: null, gender: 'other' }
  avatarPreview.value = ''
  avatarFile.value = null
  avatarUrlInput.value = ''
  avatarInputMode.value = 'upload'
  characterDialogVisible.value = true
}

const handleAddCharacterForIP = (ip: IP) => {
  isEditCharacter.value = false
  editingCharacterId.value = null
  editingCharacterOriginalIpId.value = null
  characterFormData.value = { name: '', ip_id: ip.id, gender: 'other' }
  avatarPreview.value = ''
  avatarFile.value = null
  avatarUrlInput.value = ''
  avatarInputMode.value = 'upload'
  characterDialogVisible.value = true
}

const handleEditCharacter = (row: Character) => {
  isEditCharacter.value = true
  editingCharacterId.value = row.id
  editingCharacterOriginalIpId.value = row.ip.id
  characterFormData.value = {
    name: row.name,
    ip_id: row.ip.id,
    gender: row.gender,
  }
  if (row.avatar) {
    if (row.avatar.startsWith('http://') || row.avatar.startsWith('https://')) {
      avatarInputMode.value = 'url'
      avatarUrlInput.value = row.avatar
      avatarPreview.value = row.avatar
    } else {
      avatarInputMode.value = 'url'
      avatarUrlInput.value = row.avatar
      avatarPreview.value = row.avatar
    }
  } else {
    avatarInputMode.value = 'upload'
    avatarUrlInput.value = ''
    avatarPreview.value = ''
  }
  avatarFile.value = null
  characterDialogVisible.value = true
}

const handleDeleteCharacter = async (row: Character) => {
  try {
    await ElMessageBox.confirm(
      `确定删除角色《${row.name}》吗？关联的谷子数据也会受到影响。`,
      '警告',
      {
        type: 'warning',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
      }
    )
    await deleteCharacter(row.id)
    await metadataStore.fetchIPCharacters(row.ip.id, true) // 刷新该IP的角色缓存
    ElMessage.success('已删除')
    if (ipList.value.find((x) => x.id === row.ip.id)?.character_count != null) {
      setIPCharacterCount(row.ip.id, Math.max(0, (ipList.value.find((x) => x.id === row.ip.id)?.character_count || 0) - 1))
    }
    if (characterMap.value[row.ip.id]) {
      delete characterMap.value[row.ip.id]
      await fetchIPCharacters(row.ip.id)
    }
  } catch {}
}

const handleAvatarFileChange = (file: UploadFile) => {
  if (file.raw) {
    avatarFile.value = file.raw
    avatarUrlInput.value = ''
    const reader = new FileReader()
    reader.onload = (e) => (avatarPreview.value = e.target?.result as string)
    reader.readAsDataURL(file.raw)
  }
}

const handleAvatarUrlInput = (value: string) => {
  avatarUrlInput.value = value
  if (value.trim()) {
    try {
      new URL(value.trim())
      avatarPreview.value = value.trim()
      avatarFile.value = null
    } catch {
      avatarPreview.value = ''
    }
  } else {
    avatarPreview.value = ''
  }
}

const handleSubmitCharacter = async () => {
  if (!characterFormRef.value) return
  await characterFormRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      let data: FormData | { name: string; ip_id: number; gender: CharacterGender; avatar?: string | null }

      if (avatarInputMode.value === 'upload' && avatarFile.value) {
        const formData = new FormData()
        formData.append('name', characterFormData.value.name)
        formData.append('ip_id', String(characterFormData.value.ip_id))
        formData.append('gender', characterFormData.value.gender)
        formData.append('avatar', avatarFile.value)
        data = formData
      } else {
        data = {
          name: characterFormData.value.name,
          ip_id: characterFormData.value.ip_id!,
          gender: characterFormData.value.gender,
          avatar: avatarInputMode.value === 'url' && avatarUrlInput.value.trim()
            ? avatarUrlInput.value.trim()
            : null,
        }
      }

      const newIpId = characterFormData.value.ip_id!
      const oldIpId = editingCharacterOriginalIpId.value
      if (isEditCharacter.value && editingCharacterId.value) {
        await updateCharacter(editingCharacterId.value, data)
        await metadataStore.fetchIPCharacters(newIpId, true) // 刷新新IP的角色缓存

        if (oldIpId && oldIpId !== newIpId) {
          await metadataStore.fetchIPCharacters(oldIpId, true) // 刷新旧IP的角色缓存
          if (characterMap.value[oldIpId]) {
            delete characterMap.value[oldIpId]
            await fetchIPCharacters(oldIpId)
          } else if (ipList.value.find((x) => x.id === oldIpId)?.character_count != null) {
            setIPCharacterCount(
              oldIpId,
              Math.max(0, (ipList.value.find((x) => x.id === oldIpId)?.character_count || 0) - 1)
            )
          }

          if (characterMap.value[newIpId]) {
            delete characterMap.value[newIpId]
            await fetchIPCharacters(newIpId)
          } else if (ipList.value.find((x) => x.id === newIpId)?.character_count != null) {
            setIPCharacterCount(newIpId, (ipList.value.find((x) => x.id === newIpId)?.character_count || 0) + 1)
          }
        } else {
          if (characterMap.value[newIpId]) {
            delete characterMap.value[newIpId]
            await fetchIPCharacters(newIpId)
          }
        }
      } else {
        await createCharacter(data)
        await metadataStore.fetchIPCharacters(newIpId, true) // 刷新该IP的角色缓存
        delete characterMap.value[newIpId]
        if (ipList.value.find((x) => x.id === newIpId)?.character_count != null) {
          setIPCharacterCount(newIpId, (ipList.value.find((x) => x.id === newIpId)?.character_count || 0) + 1)
        }
        await fetchIPCharacters(newIpId)
        if (!expandedIPs.value.includes(newIpId)) {
          expandedIPs.value.push(newIpId)
        }
      }
      ElMessage.success('保存成功')
      characterDialogVisible.value = false
      editingCharacterOriginalIpId.value = null
    } catch (err: any) {
      ElMessage.error(err.message || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}

const handleOpenBGMImport = () => {
  bgmDialogVisible.value = true
  handleBGMReset()
}

const handleBGMReset = () => {
  bgmStep.value = 'search'
  bgmSearchInput.value = ''
  bgmSubjectType.value = undefined
  bgmCharacterKeyword.value = ''
  bgmSubjects.value = []
  bgmSearchResult.value = null
  bgmSelectedCharacters.value = []
  bgmImportResult.value = null
}

const handleBGMSearch = async () => {
  const keyword = bgmSearchInput.value.trim()
  if (!keyword) {
    ElMessage.warning('请输入IP作品名称')
    return
  }

  bgmSearching.value = true
  bgmStep.value = 'searching'

  try {
    const response = await searchBGMSubjects(keyword, bgmSubjectType.value)
    bgmSubjects.value = response.subjects
    if (bgmSubjects.value.length === 0) {
      ElMessage.warning('未找到相关作品')
      bgmStep.value = 'search'
    } else {
      bgmStep.value = 'subjects'
    }
  } catch (err: any) {
    ElMessage.error(err.message || '搜索失败')
    bgmStep.value = 'search'
  } finally {
    bgmSearching.value = false
  }
}

const handleBGMSelectSubject = async (subject: BGMSubject) => {
  bgmStep.value = 'loading-characters'
  try {
    const response = await getBGMCharactersBySubjectId(subject.id)
    // 转换响应格式以适配现有逻辑
    bgmSearchResult.value = {
      ip_name: response.subject_name,
      characters: response.characters
    }
    bgmCharacterKeyword.value = ''
    bgmSelectedCharacters.value = []
    bgmStep.value = 'results'
  } catch (err: any) {
    ElMessage.error(err.message || '获取角色列表失败')
    bgmStep.value = 'subjects'
  }
}

const handleBGMSelectAll = () => {
  if (!bgmSearchResult.value) return
  bgmSelectedCharacters.value = bgmSearchResult.value.characters.map((_, index) => index)
}

const handleBGMSelectNone = () => {
  bgmSelectedCharacters.value = []
}

const handleBGMToggleCharacter = (index: number) => {
  const idx = bgmSelectedCharacters.value.indexOf(index)
  if (idx > -1) {
    bgmSelectedCharacters.value.splice(idx, 1)
  } else {
    bgmSelectedCharacters.value.push(index)
  }
}

const handleBGMConfirmImport = async () => {
  const result = bgmSearchResult.value
  if (!result || bgmSelectedCharacters.value.length === 0) {
    ElMessage.warning('请至少选择一个角色')
    return
  }

  bgmImporting.value = true
  bgmStep.value = 'importing'

  try {
    const charactersToImport = bgmSelectedCharacters.value
      .map((index) => result.characters[index])
      .filter((char): char is (typeof result.characters)[number] => !!char)
      .map((char) => ({
        ip_name: result.ip_name,
        character_name: char.name,
        avatar: char.avatar || null,
      }))

    const createResult = await createBGMCharacters(charactersToImport, bgmSubjectType.value)
    bgmImportResult.value = createResult
    bgmStep.value = 'imported'

    await fetchIPList(true)

    ElMessage.success(`成功导入 ${createResult.created} 个角色`)
  } catch (err: any) {
    ElMessage.error(err.message || '导入失败')
    bgmStep.value = 'results'
  } finally {
    bgmImporting.value = false
  }
}

const handleBGMClose = () => {
  bgmDialogVisible.value = false
  handleBGMReset()
  fetchIPList(true)
}
</script>

<style scoped>
/* 容器设计：参考云展柜布局 */
.ip-character-management-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: calc(100vh - 64px);
}

/* 顶部标题区 */
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.sub-title {
  font-size: 13px;
  color: #909399;
}

/* 聚合操作按钮 */
.action-dropdown-btn {
  background: linear-gradient(135deg, #a396ff 0%, #8e7dff 100%);
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  height: auto;
  font-size: 14px;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(142, 125, 255, 0.3);
}

.action-dropdown-btn:hover,
.action-dropdown-btn:focus {
  background: linear-gradient(135deg, #b0a4ff 0%, #9d8eff 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(142, 125, 255, 0.4);
}

.action-dropdown-btn .icon-left {
  margin-right: 6px;
}

.action-dropdown-btn .icon-right {
  margin-left: 8px;
  font-size: 12px;
}

/* 下拉菜单内容样式 */
.menu-item-content {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 140px;
}

.menu-item-content .el-icon {
  font-size: 16px;
  color: #606266;
}

.menu-tag {
  margin-left: auto;
  transform: scale(0.9);
}

/* 搜索框美化 */
.search-card {
  margin-bottom: 20px;
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.search-filter-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-flex {
  display: flex;
  gap: 8px;
}

.filter-flex {
  display: flex;
  gap: 8px;
  align-items: center;
}

.filter-select {
  flex: 1;
}

.custom-search :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px #e4e7ed inset;
}

/* 品牌色按钮 */
.search-btn,
.submit-btn {
  background: linear-gradient(135deg, #a396ff 0%, #8e7dff 100%);
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
}


/* PC端表格样式 */
.desktop-view {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

/* 刷新按钮 - 右下角悬浮 */
.refresh-fab {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #a396ff 0%, #8e7dff 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 30px;
  box-shadow: 0 4px 16px rgba(163, 150, 255, 0.4);
  cursor: pointer;
  transition: all var(--transition-normal);
  z-index: 999;
  outline: none;
  -webkit-tap-highlight-color: transparent;
  border: none;
}

.refresh-fab:hover {
  transform: scale(1.1) rotate(180deg);
  box-shadow: 0 6px 20px rgba(163, 150, 255, 0.6);
}

.refresh-fab:focus,
.refresh-fab:active {
  outline: none;
}

.refresh-fab.loading {
  cursor: not-allowed;
  opacity: 0.8;
}

.refresh-fab .is-loading {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.table-name {
  font-weight: 600;
  color: #404144;
}

.custom-tag {
  border: 1px solid #d9d4ff;
  color: #5a4bff;
  background: linear-gradient(135deg, #f6f4ff 0%, #ebe7ff 100%);
  box-shadow: 0 6px 12px rgba(90, 75, 255, 0.08);
}

.tag-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 10px;
  align-items: center;
}

.character-count {
  font-weight: 600;
  color: #606266;
}

.no-type {
  color: #c0c4cc;
  font-style: italic;
}

/* 展开区域样式 */
.character-expand-section {
  padding: 16px;
  background: #fafbfc;
}

.expand-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.expand-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.character-content {
  min-height: 50px;
}

.character-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 8px;
  border: 1px solid #f2f6fc;
}

.char-info-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.char-avatar {
  border: 1px solid #e4e7ed;
}

.table-avatar {
  flex-shrink: 0;
}

.char-details {
  display: flex;
  align-items: center;
  gap: 8px;
}

.char-name {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
}

.gender-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
}

.gender-badge.female {
  background: #fff0f0;
  color: #f56c6c;
}

.gender-badge.male {
  background: #ecf5ff;
  color: #409eff;
}

.gender-badge.other {
  background: #f0f0f0;
  color: #909399;
}

.char-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-inline {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  white-space: nowrap;
}

.char-actions .el-button,
.action-inline .el-button {
  padding: 4px;
  margin: 0;
  height: auto;
}

/* 移动端现代化卡片设计 */
.mobile-view {
  /* 修复：移除内部滚动限制，让页面自然滚动 */
  display: none;
  flex-direction: column;
  position: relative;
  /* 移除 overflow-y 和 max-height */
}

.mobile-view-inner {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* 下拉刷新相关样式 */
.pull-indicator {
  position: relative;
  width: 100%;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.indicator-content {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  color: #909399;
  padding-bottom: 10px;
  width: 100%;
}

.indicator-content .el-icon {
  font-size: 18px;
  transition: transform 0.3s;
}

.indicator-text {
  font-size: 14px;
  color: #909399;
}

.ip-card-item {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow:
    0 10px 28px -18px rgba(17, 24, 39, 0.35),
    0 3px 10px -8px rgba(17, 24, 39, 0.22);
  border: 1px solid rgba(17, 24, 39, 0.04);
  transition: transform 0.2s;
}

.ip-card-item:active {
  transform: scale(0.98);
}

.card-main {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  outline: none;
  -webkit-tap-highlight-color: transparent;
}

.card-main:focus,
.card-main:active {
  outline: none;
}

.name-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 8px;
}

.type-row {
  margin-bottom: 8px;
}

.name-text {
  margin: 0;
  font-size: 17px;
  color: #2c3e50;
  font-weight: 600;
}

.character-count-badge {
  font-size: 12px;
  background: linear-gradient(135deg, #a396ff 0%, #8e7dff 100%);
  color: #fff;
  padding: 2px 8px;
  border-radius: 10px;
}

.keyword-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.mini-tag {
  font-size: 11px;
  background: linear-gradient(135deg, #f6f4ff 0%, #ebe7ff 100%);
  color: #5a4bff;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid #d9d4ff;
}

.no-tag {
  font-size: 12px;
  color: #c0c4cc;
  font-style: italic;
}

.card-arrow {
  color: #c0c4cc;
  transition: transform 0.3s;
}

.card-arrow .rotated {
  transform: rotate(90deg);
}

.drag-handle,
.card-drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  cursor: grab;
  user-select: none;
}

.drag-handle {
  width: 100%;
  padding: 6px 0;
}

.drag-handle:hover,
.card-drag-handle:hover {
  color: #606266;
}

.drag-handle svg,
.card-drag-handle svg {
  pointer-events: none;
}

.card-drag-handle {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #f5f7fa;
}

.mobile-drag-handle {
  touch-action: none;
}

/* 角色列表展开区域（移动端） */
.character-list {
  padding: 12px 16px;
  background: #fafbfc;
  border-top: 1px solid #f2f6fc;
}

.character-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.character-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 8px;
  border: 1px solid #f2f6fc;
}

.character-card .char-info {
  flex: 1;
}

.name-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.name {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
}

.char-actions-mobile {
  display: flex;
  gap: 4px;
}

/* 卡片操作底部 */
.card-footer {
  display: flex;
  border-top: 1px solid #f2f6fc;
  background: #fafbfc;
}

.footer-action {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  color: #606266;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  outline: none;
  -webkit-tap-highlight-color: transparent;
}

.footer-action .el-icon {
  font-size: 18px;
}

.footer-action:focus,
.footer-action:active {
  outline: none;
}

.footer-action:not(:last-child) {
  border-right: 1px solid #f2f6fc;
}

.footer-action.delete {
  color: #f56c6c;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .desktop-view {
    display: none;
  }
  .mobile-view {
    display: flex;
  }
  .hidden-xs-only {
    display: none !important;
  }
  .header-section {
    flex-direction: column;
    align-items: stretch;
  }
  .header-actions {
    width: 100%;
  }
  /* 让下拉组件宽度占满 */
  .header-actions :deep(.el-dropdown) {
    width: 100%;
  }

  .action-dropdown-btn {
    width: 100%;
    justify-content: center;
  }

  .page-title {
    font-size: 18px;
  }

  .search-filter-container {
    gap: 10px;
  }

  .search-flex,
  .filter-flex {
    flex-direction: column;
  }

  .filter-select {
    width: 100% !important;
  }
}

/* 弹窗与关键词管理 */
.keyword-manager-box {
  background: #f8f9fc;
  padding: 12px;
  border-radius: 8px;
  border: 1px dashed #dcdfe6;
}

.input-inline {
  margin-bottom: 12px;
}

.tags-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.custom-dialog :deep(.el-dialog__header) {
  margin-right: 0;
  padding-bottom: 20px;
  border-bottom: 1px solid #f2f6fc;
}

.custom-dialog :deep(.el-dialog__body) {
  padding-top: 20px;
}

/* 角色表单布局 */
.form-layout {
  display: flex;
  gap: 24px;
}

.avatar-col {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.info-col {
  flex: 1;
}

.avatar-uploader {
  width: 120px;
  height: 120px;
  border: 1px dashed #dcdfe6;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  background: #f8f9fc;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

.upload-label {
  position: absolute;
  bottom: 0;
  width: 100%;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 11px;
  text-align: center;
  padding: 4px 0;
}

/* 头像输入模式切换 */
.avatar-mode-switch {
  margin-bottom: 12px;
  width: 100%;
  display: flex;
  justify-content: center;
}

.mode-radio-group {
  width: 100%;
}

.mode-radio-group :deep(.el-radio-button) {
  flex: 1;
}

.mode-radio-group :deep(.el-radio-button__inner) {
  width: 100%;
  border-radius: 8px !important;
}

.mode-radio-group :deep(.el-radio-button:first-child .el-radio-button__inner) {
  border-top-right-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
}

.mode-radio-group :deep(.el-radio-button:last-child .el-radio-button__inner) {
  border-top-left-radius: 0 !important;
  border-bottom-left-radius: 0 !important;
}

/* URL输入模式 */
.avatar-url-input {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.url-preview {
  width: 120px;
  height: 120px;
  border: 1px dashed #dcdfe6;
  border-radius: 12px;
  overflow: hidden;
  background: #f8f9fc;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.url-preview .preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.custom-radio :deep(.el-radio-button__inner) {
  border-radius: 8px !important;
  margin-right: 8px;
  border: 1px solid #dcdfe6 !important;
}

@media (max-width: 768px) {
  .form-layout {
    flex-direction: column;
    align-items: center;
  }
}

/* BGM导入对话框样式 */
.bgm-dialog :deep(.el-dialog__body) {
  padding: 24px;
  min-height: 400px;
}

.bgm-import-container {
  width: 100%;
}

/* 搜索阶段 */
.bgm-step-search {
  padding: 20px 0;
}

.bgm-search-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

/* 搜索中等待页面 */
.bgm-step-searching {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 40px 20px;
}

.searching-content {
  text-align: center;
  max-width: 400px;
}

.searching-icon {
  font-size: 64px;
  color: #a396ff;
  animation: rotate 2s linear infinite;
  margin-bottom: 20px;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.searching-content h3 {
  margin: 16px 0 8px;
  font-size: 18px;
  color: #303133;
}

.searching-content p {
  color: #909399;
  font-size: 14px;
  margin-bottom: 24px;
}

.searching-progress {
  width: 100%;
}

/* 搜索结果展示 */
.bgm-step-results {
  padding: 20px 0;
}

.results-header {
  margin-bottom: 20px;
}

.results-header h3 {
  font-size: 18px;
  color: #303133;
  margin: 0 0 8px;
}

.results-subtitle {
  color: #909399;
  font-size: 14px;
  margin: 0;
}

.results-actions-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f2f6fc;
}

.results-filter {
  margin-bottom: 12px;
}

.results-filter-input :deep(.el-input__wrapper) {
  border-radius: 999px;
}

.selected-count {
  margin-left: auto;
  color: #606266;
  font-size: 14px;
}

.character-list-container {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 8px;
}

.bgm-character-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #f2f6fc;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
}

.bgm-character-item:hover {
  border-color: #a396ff;
  background: #f6f4ff;
}

.bgm-character-item.selected {
  border-color: #a396ff;
  background: linear-gradient(135deg, #f6f4ff 0%, #ebe7ff 100%);
  box-shadow: 0 2px 8px rgba(163, 150, 255, 0.2);
}

.bgm-character-item .char-info {
  flex: 1;
}

.bgm-character-item .char-name {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.bgm-character-item .char-relation {
  font-size: 12px;
  color: #909399;
}

.empty-results {
  padding: 40px 0;
}

/* 导入中 */
.bgm-step-importing {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 40px 20px;
}

.importing-content {
  text-align: center;
  max-width: 400px;
}

.importing-icon {
  font-size: 64px;
  color: #a396ff;
  animation: rotate 2s linear infinite;
  margin-bottom: 20px;
}

.importing-content h3 {
  margin: 16px 0 8px;
  font-size: 18px;
  color: #303133;
}

.importing-content p {
  color: #909399;
  font-size: 14px;
  margin-bottom: 24px;
}

.importing-progress {
  width: 100%;
}

/* 导入完成 */
.bgm-step-imported {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 40px 20px;
}

.imported-content {
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.success-icon {
  font-size: 64px;
  color: #67c23a;
  margin-bottom: 20px;
}

.imported-content h3 {
  margin: 16px 0 24px;
  font-size: 20px;
  color: #303133;
}

.import-summary {
  background: #f8f9fc;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.import-summary p {
  margin: 8px 0;
  font-size: 15px;
  color: #606266;
}

.import-summary strong {
  color: #a396ff;
  font-size: 18px;
}

.import-details {
  text-align: left;
  margin-top: 20px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  font-size: 14px;
}

.detail-item .el-icon {
  font-size: 16px;
}

.detail-item.created .el-icon {
  color: #67c23a;
}

.detail-item.already_exists .el-icon {
  color: #e6a23c;
}

.detail-item.error .el-icon {
  color: #f56c6c;
}

.detail-text {
  flex: 1;
  color: #606266;
}

.detail-status {
  color: #909399;
  font-size: 12px;
}

/* 作品列表样式 */
.bgm-subjects-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  overflow-y: auto;
  max-height: 500px;
  padding: 4px 4px 12px 4px; /* 底部增加padding防止阴影被切 */
}

.bgm-subject-item {
  display: flex;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #ebeef5;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  height: 110px;
  position: relative;
}

.bgm-subject-item:hover {
  border-color: #a396ff;
  box-shadow: 0 8px 16px -4px rgba(163, 150, 255, 0.2);
  transform: translateY(-2px);
  z-index: 1;
}

.bgm-subject-cover {
  width: 80px;
  height: 100%;
  flex-shrink: 0;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #f2f6fc;
}

.bgm-subject-cover :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.bgm-subject-item:hover .bgm-subject-cover :deep(img) {
  transform: scale(1.05);
}

.bgm-subject-cover .image-slot {
  font-size: 24px;
  color: #909399;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.bgm-subject-info {
  flex: 1;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  min-width: 0;
}

.subject-name {
  margin: 0 0 8px;
  font-size: 15px;
  line-height: 1.4;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.subject-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.subject-cn {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.bgm-subject-arrow {
  width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #dcdfe6;
  transition: all 0.2s;
}

.bgm-subject-item:hover .bgm-subject-arrow {
  color: #a396ff;
  transform: translateX(-2px);
}

/* 响应式适配 */
@media (max-width: 768px) {
  .bgm-dialog :deep(.el-dialog) {
    width: 95% !important;
  }

  .bgm-subjects-list {
    grid-template-columns: 1fr;
  }

  /* 移动端列表高度自动适配 */
  .bgm-subjects-list {
    max-height: 60vh;
  }

  .results-actions-top {
    flex-wrap: wrap;
  }

  .selected-count {
    margin-left: 0;
    width: 100%;
  }

  .character-list-container {
    max-height: 300px;
  }

  .refresh-fab {
    bottom: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    font-size: 24px;
  }
}
</style>

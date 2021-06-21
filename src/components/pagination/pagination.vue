<template>
  <div class="pagination-bar" v-if="totalPage> 1">
    <div class="page-tag-group">
      <b class="page-tag-jump circle-b" data-value="FirstPage" title="首页" @click="pageJump">
        <i class="circle"></i>
        <svg class="icon black-icon opicon"><use xlink:href="#icon-first_page"></use></svg>
      </b>
      <b class="page-tag-jump circle-b" data-value="PreviewPage" title="上一页" @click="pageJump">
        <i class="circle"></i>
        <svg class="icon black-icon opicon"><use xlink:href="#icon-navigate_before"></use></svg>
      </b>
    </div>
    <div class="page-tag-group">
      <span v-if="needPreviewEllipsis"> ... </span>
      <b v-for="i in pageTags" :key="i.index" :data-value="i" :class="i === pageTag ? 'selected-tag pageEnd page-tag-jump circle-b' : 'page-tag-jump circle-b'"  @click="pageJump">
        <i class="circle"></i>
        <span>{{i}}</span>
      </b>
      <span v-if="needNextEllipsis" > ... </span>
    </div>
    <div class="page-tag-group">
      <b class="page-tag-jump circle-b" data-value="NextPage" title="下一页" @click="pageJump">
        <i class="circle"></i>
        <svg class="icon black-icon opicon"><use xlink:href="#icon-navigate_next"></use></svg>
      </b>
      <b class="page-tag-jump circle-b" data-value="LastPage" title="末页" @click="pageJump">
        <i class="circle"></i>
        <svg class="icon black-icon opicon"><use xlink:href="#icon-last_page"></use></svg>
      </b>
    </div>
  </div>
</template>
<script>
const maxTagCount = 5 // 最多显示 5 个页码
let maxLeftTags = Math.floor(maxTagCount / 2)  // 当页码总数超过 maxTagCount 时，当前页码左边最多有多少个页码
export default {
  // props: ['totalpage', 'pageindex', 'tablename'],pageData
  props: ['pageData'],
  data () {
    return {
      totalPage: this.pageData.totalPage,
      pageIndex: this.pageData.pageIndex,
      tableName: this.pageData.tableName,
      pageTags: null,
      needPreviewEllipsis: false,
      needNextEllipsis: false,
      isQuerying: false
    }
  },
  methods: {
    // 点击翻页函数
    pageJump (evt) {
      let target = evt.currentTarget
      let value = target.getAttribute('data-value')

      let pageIndex = -1
      switch (value) {
        case 'PreviewPage':
          pageIndex = this.pageIndex - 1
          if (pageIndex < 0) {
            pageIndex = 0
          }
          break
        case 'NextPage':
          pageIndex = this.pageIndex + 1
          if (pageIndex > this.totalPage - 1) {
            pageIndex = this.totalPage - 1
          }
          break
        case 'FirstPage':
          pageIndex = 0
          break
        case 'LastPage':
          pageIndex = this.totalPage - 1
          break
        case null:
          break
        default:
          pageIndex = parseInt(value, 10) - 1  // it is index, so start from 0
      }

      if (pageIndex === this.pageIndex) {
        // window.xhint.close()
        return
      }

      // if (this.parent.opts.dataIs === 'rept-table') {
      //   this.isQuerying = true
      // }
      // window.xhint.showLoading()
      this.$store.commit('stateStore/changePageMsg', {
        tableName: this.tableName,
        pageIndex: pageIndex
      })
      // this.parent.trigger('PAGEINDEX-CHANGE', {
      //   name: this.tableName,
      //   pageIndex: pageIndex
      // })

      this.pageTag = this.pageIndex + 1  // the display tag
      // this.init()
    },
    // 初始化函数
    init () {
      if (!this.totalPage || this.totalPage <= 0) return
      this.pageTag = this.pageIndex + 1  // the display tag
      let maxTag = Math.min(this.totalPage, maxTagCount)
      if (this.totalPage > maxTagCount) {
        let startIndex = -1
        let endIndex = -1

        startIndex = this.pageIndex - maxLeftTags
        if (startIndex <= 0) {
          startIndex = 0
        }
        endIndex = startIndex + maxTagCount

        if (endIndex > this.totalPage - 1) {
          endIndex = this.totalPage - 1
          startIndex = endIndex - maxTagCount + 1
        }

        this.pageTags = Array.from({ length: maxTag }, (v, k) => startIndex + k + 1)  // the last tag is this.pages, so: maxTag - 1
        this.needPreviewEllipsis = (startIndex > 0)
        this.needNextEllipsis = (endIndex < this.totalPage - 1)
      } else {
        this.needPreviewEllipsis = false
        this.needNextEllipsis = false
        this.pageTags = Array.from({ length: maxTag }, (v, k) => k + 1)  // the last tag is this.pages, so: maxTag - 1
      }
    }
  },
  beforeMount () {
    this.init()
  },
  watch: {
    'pageData': {
      handler: function (result) {
          this.totalPage = result.totalPage
          this.pageIndex = result.pageIndex
          this.tableName= result.tableName
          this.init()
      },
      deep: true
    },
    // pageindex (newValue, oldValue) {
    //   this.pageIndex = newValue
    //   this.init()
    // },
    // totalpage (newValue, oldValue){
    //   this.totalPage = newValue
    //   this.init()
    // },
    // tablename (newValue, oldValue) {
    //   this.tableName = newValue
    //   this.init()
    // }
  }
}
</script>
<style lang="sass" scoped>
@import '../../style/defs.sass'

.pagination
  flex: 0 0 2rem
  margin: 1rem 0
  @include flex-center

  .pagination-bar
    flex: auto
    @include flex-center
    color: #666
    font-size: $fontsize-s

    .page-tag
      @include flex-center
      border: 1px solid $body-sp
      cursor: pointer
    .page-tag-jump
      margin-right: 4px
    .page-tag-index
      padding: .2rem
      margin: 0 0.4rem
        // padding: 0 0.4rem
.page-tag-group
  display: flex
  padding: 0
  margin: 0 0.4rem
  cursor: pointer
  border: none
.icon
  fill: #3f3f3f
.selected-tag
  cursor: auto
  font-weight: bold
  background: $active-bg
  color: $active-ft
</style>

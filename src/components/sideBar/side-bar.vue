<template>
    <div>
        <ul class="list-warp">
            <li v-for="(list, index) in lists" :key="index" :name="list.name" :class = "{ active: active === index }" @click="activateItem(index,list.name)">
                <span class="iconBG">
                    <svg class="icon sidebar-icon">
                        <use :xlink:href="`#${list.icon}`"></use>
                    </svg>
                </span>
                <span class="font-span">{{list.label}}</span>
            </li>
        </ul>
    </div>
</template>
<script>
import sideBar from './side_bar.js'
export default {
    data () {
        return {
            active: 0,
            topicName: null,
            lists: null
        }
    },
    mounted(){
        this.topicName = 'pathManage'
        this.lists = sideBar[this.topicName]
    },

    watch: {
        '$store.state.stateStore.topicName': {
            handler: function (result) {
                this.active = 0
                this.topicName = result
                this.lists = sideBar[this.topicName]
                if (xdata.roleID === 2 && result === 'rangeManage') {
                    this.lists = this.lists.slice(2)
                }
                this.$store.commit('stateStore/changeTableName', {tableName: this.lists[0].name})
            }
        }
    },
    components: {
        
    },
    methods: {
        // 点击函数
        activateItem (index,tableName) {
            this.active = index
            this.$store.commit('stateStore/changeTableName', {tableName: tableName})
        }
    }
}
</script>
<style lang="sass" scoped>
@import '../../style/defs.sass'
.list-warp
    margin-left: 0
    flex-direction: column
    li
        // height: 3rem
        // line-height: 3rem
        display: flex
        align-items: center
        position: relative
        flex: 0 0 3rem
        padding: 0 10px 0 20px
        margin: 2px 0
        color: #fff
        flex-flow: row nowrap
        width: 100%
        cursor: pointer
        &:hover, &.active 
            background: #009fff
            border-top: none
        .iconBG
            .sidebar-icon
                width: 14px
                height: 14px
                fill: #fcfcfc
        .font-span
            color: #fcfcfc
            font-size: 14px
            margin-left: 8px
    
            
        
</style>

let metaMenu = [{
  title: '配置管理',
  icon: 'icon-menu2',
  expand: false,
  isShow: true,
  items: [
    { name: 'virtual_path', label: '虚拟路径管理'},
    { name: 'his_virtual_path', label: '虚拟路径模板管理'},
    { name: 'his_leader_arrange', label: '领导排班管理' },
    { name: 'his_location_staff_', label: '历史轨迹管理'},
    { name: 'user', label: '账户管理'},
    { name: 'staff_extend', label: '人员业务表'},
    { name: 'vehicle_extend', label: '车辆业务表'}
  ]
}, {
  title: '告警管理',
  icon: 'icon-menu2',
  expand: false,
  isShow: true,
  items: [
    { name: 'alarm_mange', label: '告警管理' }
  ]
}
]

export default metaMenu

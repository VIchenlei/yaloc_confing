const FUZZYSEARCHDEF = {
  'virtual_path': {
    name: 'virtual_path',
    desc: 'name',
    label: '虚拟路径名称',
    placeholder:'请输入虚拟路径模板名称、编号',
    keys: ['virtual_path_id','name','spy']
  },
  'staff': {
    name: 'staff',
    desc: 'name',
    label: '人员',
    placeholder:'请输入员工编号、名称',
    keys: ['staff_id','name','spy']
  },
  'event_type': {
    name: 'event_type',
    desc: 'name',
    label: '告警类型',
    placeholder:'请输入告警类型名称、拼音、编号',
    keys: ['event_type_id','name','spy']
  },
  'user': {
    name: 'user',
    desc: 'name',
    label: '用户',
    placeholder:'请输入用户名称',
    keys: ['user_id','name','spy']
  },
  'user_tool': {
    name: 'user_tool',
    desc: 'name',
    label: '用户',
    placeholder:'请输入用户名称',
    keys: ['user_tool_id','name','spy']
  },
  'area': {
    name: 'area',
    desc: 'name',
    label: '区域',
    placeholder:'请输入区域名称',
    keys: ['area_id','name','spy']
  },
  'staff': {
    name: 'staff',
    desc: 'name',
    label: '人员',
    placeholder:'请输入员工编号、名称',
    keys: ['staff_id','name','spy']
  },
  'vehicle': {
    name: 'vehicle',
    desc: 'name',
    label: '车辆',
    placeholder:'请输入车辆编号、名称',
    keys: ['vehicle_id','name','spy']
  },
  'dept': {
    name: 'dept',
    desc: 'name',
    label: '队组',
    placeholder:'请输入队组编号，名称',
    keys: ['dept_id','name','spy']
  },
  'dept_ck': {
    name: 'dept_ck',
    desc: 'name',
    label: '虚拟部门',
    placeholder:'请输入虚拟部门编号，名称',
    keys: ['dept_id','name','spy']
  },
  'ras.staff': {
    name: 'staff',
    desc: 'name',
    label: '人员',
    placeholder:'请输入工号、名称、卡号',
    keys: ['staff_id','card_id', 'name', 'spy']
  },
}

export default FUZZYSEARCHDEF
const normallizeSize = function (size, demical = 2) {
  //默认保留2位小数
  const units = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'ZB']
  let base = 0;
  while (size > 1024) {
    size /= 1024;
    ++base;
  }
  return `${~~(size * (10 ** demical)) / (10 ** demical)} ${units[base]}`
}

const filefilter = function (filename) {
  const endNames = [
    /.\d\d\d$/,
    /.log$/,
    /.*tmp$/,
    /.*temp$/
  ]
  const filepaths = [
    'System Volume Information',
    /^\$RECYCLE.BIN$/
  ]
  for (const endName of endNames) {
    if ((new RegExp(endName)).test(filename)) return false
  }
  for (const filepath of filepaths) {
    if ((new RegExp(filepath)).test(filename)) return false
  }
  return true
}

module.exports={
  normallizeSize,
  filefilter
}
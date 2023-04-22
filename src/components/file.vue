<template>
  <div class="page">
    <el-upload
      :limit="1"
      :auto-upload="false"
      :on-change="onChange"
      class="upload-box"
      drag
      action="#"
    >
      <i class="el-icon-upload"/>
      <div class="el-upload__text">
        <p>将.m3u8文件拖到此处，或<em>点击上传</em></p>
        <p class="sub-tip">只能上传m3u8/txt文件，且不超过500kb</p>
      </div>
    </el-upload>

    <p v-if="finished">下载完成!</p>
    <p v-else-if="loading">下载中 。。。</p>
    <p v-else>上传后即可自动下载</p>
    <div class="block">
      <div
        v-for="item in tsList"
        :key="item.url"
        :class="item.status === 1 ? 'success': item.status === -1 ? 'fail': ''"
        class="block-item"
      />
    </div>
  </div>
</template>

<script>
import request from '@/api/http'
export default {
  name: 'File',
  data () {
    return {
      loading: false,
      finished: false,
      fileName: '',
      tsList: [], // ts地址列表
      resList: [], // 资源片段列表
      streamWriter: null, // 文件流写入器
      downloadIndex: 0 // 下载索引
    }
  },
  computed: {
    finishNum () {
      return this.tsList.filter(i => i.status === 1).length
    },
    total () {
      return this.tsList.length
    }
  },
  methods: {
    async onChange (file, fileList) {
      // console.log(file)
      const fileRes = await this.waitReader(file.raw)
      const list = fileRes.split('\n').filter(i => i.includes('.ts'))
      this.tsList = list.map(i => ({
        url: i,
        status: 0
      }))
      // console.log(this.tsList)
      this.loading = true
      this.streamDownload(file.name)
    },
    // 初始化流式下载
    streamDownload (name) {
      let fileName = name
      if (name) {
        let index = name.lastIndexOf('.')
        if (index !== -1) {
          fileName = name.slice(0, index)
        }
      } else {
        let now = new Date()
        fileName = `${now.getFullYear()}${now.getMonth() + 1}${now.getDate()}${now.getHours()}${now.getMinutes()}${now.getSeconds()}`
      }
      this.fileName = fileName
      // this.streamWriter = window.streamSaver.createWriteStream(`${fileName}.ts`).getWriter()
      this.downloadTS()
    },
    // 解析 m3u8
    waitReader (file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()// 新建一个FileReader
        reader.readAsText(file, 'UTF-8')// 读取文件
        reader.onload = function (evt) { // 读取完文件之后会回来这里 这是个异步
          const fileString = evt.target.result // 读取文件内容
          fileString ? resolve(fileString) : reject(evt)
        }
      })
    },
    // 下载管理
    downloadTS () {
      let download = () => {
        let index = this.downloadIndex
        if (index >= this.tsList.length) {
          return
        }
        this.downloadIndex++
        if (this.tsList[index] && this.tsList[index].status === 0) {
          let url = this.tsList[index].url
          if (!location.href.includes('https')) {
            url = url.replace('https://', 'http://')
          }
          // console.log(url)
          request({
            url
          }).then(res => {
            this.tsList[index].status = 1
            // console.log(res.data)
            this.dealTS(res.data, index)
            download()
          }).catch(e => {
            console.warn(e)
            this.tsList[index].status = -1
            download()
          })
        } else if (this.downloadIndex < this.tsList.length - 1) { // 跳过已经成功的片段
          download()
        }
      }

      // 建立多少个 ajax 线程
      for (let i = 0; i < Math.min(6, this.tsList.length - 1 - this.finishNum); i++) {
        download()
      }
    },

    //
    dealTS (file, index) {
      this.resList[index] = file
      // if (this.streamWriter){
      //   for (let index = this.streamDownloadIndex; index < this.resList.length; index++) {
      //     if(this.resList[index]){
      //       this.streamWriter.write(new Uint8Array(this.resList[index]))
      //       this.resList[index] = null
      //       this.streamDownloadIndex = index + 1
      //     } else {
      //       break
      //     }
      //   }
      //   if (this.streamDownloadIndex >= this.rangeDownload.targetSegment){
      //     this.streamWriter.close()
      //   }
      // }

      let finish = this.resList.length === this.total
      let noEmpty = this.resList.filter(i => !!i).length === this.total
      if (finish && noEmpty) {
        // console.log(this.total, this.resList)
        this.finished = true
        this.downloadFile(this.resList, this.fileName)
      }
    },
    // 下载整合后的TS文件
    downloadFile (fileDataList, fileName) {
      let fileBlob = null
      let a = document.createElement('a')
      // if (this.isGetMP4) {
      //   fileBlob = new Blob(fileDataList, { type: 'video/mp4' }) // 创建一个Blob对象，并设置文件的 MIME 类型
      //   a.download = fileName + '.mp4'
      // } else {
      //   fileBlob = new Blob(fileDataList, { type: 'video/MP2T' }) // 创建一个Blob对象，并设置文件的 MIME 类型
      //   a.download = fileName + '.ts'
      // }
      fileBlob = new Blob(fileDataList, { type: 'video/MP2T' }) // 创建一个Blob对象，并设置文件的 MIME 类型
      a.download = fileName + '.ts'
      // fileBlob = new Blob(fileDataList, { type: 'video/mp4' }) // 创建一个Blob对象，并设置文件的 MIME 类型
      // a.download = fileName + '.mp4'
      a.href = URL.createObjectURL(fileBlob)
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      a.remove()
    }
  }
}
</script>

<style scoped lang="less">
.upload-box{
  max-width: 500px;
  margin: auto;
}
.block {
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
}
.sub-tip{
  color: #aaa;
  font-size: 12px;
  margin-top: -4px;
}
.block-item{
  width: 16px;
  height: 32px;
  margin: 0 4px 8px;
  background-color: #ccc;
  &.success{
    background-color: #6a2;
  }
  &.fail{
    background-color: #c44;
  }
}
/deep/ .el-upload {
  width: 100%;
}
/deep/ .el-upload-dragger {
  width: 100%;
}
</style>

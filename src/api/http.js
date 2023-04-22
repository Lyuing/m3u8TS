import axios from 'axios'

export default function request (param) {
  return axios({
    method: 'GET',
    url: '',
    responseType: 'arraybuffer',
    ...param
  })
}

const Router = require('koa-router');
const router = new Router({ prefix: '/user'})
const SQLUser = require('../plugins/mysql/modules/user.js')
const { isQuerySuccess } = require('../helper/utils.js')

/** 获取用户信息 */
router.get('/info', async (ctx) => {
  if (ctx.session.id) {
    const result = await SQLUser.queryUser({id: ctx.session.id})
    if (isQuerySuccess(result)) {
      ctx.body = {
        success: true,
        payload: result[0]
      }
    } else {
      ctx.session = null
      ctx.throw(400,{code: 3002, message: '找不到用户'})
    }
  } else {
    ctx.throw(400,{code: 3002, message: '请先登录'})
  }
})

/**
 * 账号登录
 */
router.post('/login', async(ctx) => {
  const account = ctx.request.body.account;
  const password = ctx.request.body.password;
  const phoneReg = /^1[3456789][0-9]{9}$/
  const emailReg = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/
  let params = {}
  if (phoneReg.test(account)) {
    params = { phone: account }
  } else if(emailReg.test(account)){
    params = { email: account }
  } else {
    ctx.throw(400, '账号格式错误')
  }
  const result = await SQLUser.queryUser(params)
  if(isQuerySuccess(result)){
    const loginInfo = result[0]
    if(loginInfo.password === password) {
      ctx.session = {
        id: loginInfo.id,
        userName: loginInfo.userName
      }
      ctx.body = {
        success: true,
        payload: loginInfo
      }
    } else {
      ctx.throw(400, '登录密码错误')
    }
  } else {
    ctx.throw(400, '账号不存在')
  }
})

/**
 *  注册
 */
router.post('/register', async(ctx, next) => {
  const result = await SQLUser.queryUser(ctx.request.body)
  if(isQuerySuccess(result)) {
    const title = ctx.request.body.phone ? '手机号' : '邮箱'
    ctx.throw(400, `该${title}已注册`)
  } else {
    await SQLUser.addUser(ctx.request.body)
    ctx.body = {
      payload: [],
      success: true
    }
  }
})

/** 退出登录 */
router.all('/logout', async(ctx, next) => {
  ctx.session = {}
  ctx.body = {
    payload: [],
    success: true
  }
})


module.exports = router
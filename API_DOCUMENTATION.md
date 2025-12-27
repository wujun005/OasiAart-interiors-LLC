# API 接口文档

根据 Swagger UI (http://115.29.197.51:8080/swagger-ui/index.html#/) 整理的接口列表

## 客户端认证接口

### 1. 用户登录
- **接口**: `POST /api/client/auth/login`
- **描述**: 客户端用户登录接口
- **当前实现**: `src/modules/client/api/index.ts` - `login()`

### 2. 验证码登录
- **接口**: `POST /api/client/auth/login-by-code`
- **描述**: 使用验证码登录
- **状态**: 需要实现

### 3. 发送验证码
- **接口**: `POST /api/client/auth/send-sms-code`
- **描述**: 发送短信验证码
- **当前实现**: `src/modules/client/api/index.ts` - `sendSmsCode()`

### 4. 用户注册
- **接口**: `POST /api/client/auth/register`
- **描述**: 客户端用户注册
- **当前实现**: `src/modules/client/api/index.ts` - `register()`

### 5. 重置密码
- **接口**: `POST /api/client/auth/reset-password`
- **描述**: 重置密码
- **状态**: 需要实现

## 客户端用户管理接口

### 1. 获取当前用户信息
- **接口**: `GET /api/client-user/me`
- **描述**: 获取当前登录用户的详细信息
- **状态**: 需要实现（可用于获取用户完整信息，如 email、phone 等）
- **认证**: 需要 Bearer Token

### 2. 获取用户详情
- **接口**: `GET /api/client-user/{id}`
- **描述**: 根据 ID 获取用户信息
- **状态**: 需要实现

### 3. 更新用户信息
- **接口**: `PUT /api/client-user`
- **描述**: 更新用户信息
- **状态**: 需要实现

### 4. 创建用户
- **接口**: `POST /api/client-user`
- **描述**: 创建新用户
- **状态**: 需要实现

### 5. 删除用户
- **接口**: `DELETE /api/client-user/{id}`
- **描述**: 删除用户
- **状态**: 需要实现

### 6. 分页查询用户
- **接口**: `GET /api/client-user/page`
- **描述**: 分页查询用户列表
- **状态**: 需要实现

### 7. 获取用户列表
- **接口**: `GET /api/client-user/list`
- **描述**: 获取用户列表
- **状态**: 需要实现

## 商品/服务管理接口

### 1. 获取所有服务列表
- **接口**: `GET /api/product/list`
- **描述**: 获取所有商品/服务列表
- **当前实现**: `src/modules/client/api/index.ts` - `getServicesList()`
- **状态**: ✅ 已实现

### 2. 分页获取服务
- **接口**: `GET /api/product/page`
- **描述**: 分页查询商品/服务
- **当前实现**: `src/modules/client/api/index.ts` - `getServicesPage()`
- **参数**: `{ pageNum, pageSize, keyword?, ... }`
- **状态**: ✅ 已实现

### 3. 获取服务详情
- **接口**: `GET /api/product/{id}`
- **描述**: 根据 ID 获取商品/服务详情
- **当前实现**: `src/modules/client/api/index.ts` - `getServiceDetail()`
- **状态**: ✅ 已实现

## 注意事项

1. **登录接口返回的数据结构**:
   ```json
   {
     "success": true,
     "message": "登录成功",
     "data": {
       "token": "JWT token",
       "tokenType": "Bearer",
       "userId": 3,
       "username": "amos",
       "userType": "CLIENT",
       "expiresIn": 2592000000
     }
   }
   ```

2. **认证方式**: 大部分接口需要在 Header 中携带 Bearer Token
   ```
   Authorization: Bearer <token>
   ```

3. **获取用户完整信息**: 登录接口返回的数据中没有 email 和 phone，如果需要这些信息，应该调用 `GET /api/client-user/me` 接口


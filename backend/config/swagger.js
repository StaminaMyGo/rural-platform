const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '乡村公共平台 API 文档',
      version: '1.0.0',
      description: '乡村公共平台后端API接口文档，包含认证、文章管理、建言献策、用户管理、管理员功能等模块',
      contact: {
        name: '开发团队',
        email: 'dev@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: '开发环境'
      },
      {
        url: 'https://api.example.com',
        description: '生产环境'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT令牌认证，格式: Bearer {token}'
        }
      },
      schemas: {
        // 统一响应格式
        ApiResponse: {
          type: 'object',
          properties: {
            code: {
              type: 'integer',
              description: '状态码',
              example: 200
            },
            message: {
              type: 'string',
              description: '提示信息',
              example: '操作成功'
            },
            data: {
              type: 'object',
              description: '业务数据，无数据时为null',
              nullable: true
            }
          }
        },
        // 分页响应格式
        PaginatedResponse: {
          type: 'object',
          properties: {
            code: {
              type: 'integer',
              example: 200
            },
            message: {
              type: 'string',
              example: '成功'
            },
            data: {
              type: 'object',
              properties: {
                list: {
                  type: 'array',
                  description: '数据列表'
                },
                total: {
                  type: 'integer',
                  description: '总记录数',
                  example: 100
                },
                page: {
                  type: 'integer',
                  description: '当前页码',
                  example: 1
                },
                limit: {
                  type: 'integer',
                  description: '每页条数',
                  example: 10
                }
              }
            }
          }
        },
        // 错误响应
        ErrorResponse: {
          type: 'object',
          properties: {
            code: {
              type: 'integer',
              example: 400
            },
            message: {
              type: 'string',
              example: '请求参数错误'
            },
            data: {
              type: 'object',
              nullable: true,
              example: null
            }
          }
        }
      },
      parameters: {
        // 通用参数定义
        pageParam: {
          name: 'page',
          in: 'query',
          description: '页码',
          required: false,
          schema: {
            type: 'integer',
            default: 1,
            minimum: 1
          }
        },
        limitParam: {
          name: 'limit',
          in: 'query',
          description: '每页条数',
          required: false,
          schema: {
            type: 'integer',
            default: 10,
            minimum: 1,
            maximum: 100
          }
        },
        keywordParam: {
          name: 'keyword',
          in: 'query',
          description: '搜索关键词',
          required: false,
          schema: {
            type: 'string'
          }
        }
      }
    },
    security: [{
      bearerAuth: []
    }],
    tags: [
      {
        name: '认证接口',
        description: '用户注册、登录等认证相关接口'
      },
      {
        name: '文章接口',
        description: '文章管理相关接口'
      },
      {
        name: '建言接口',
        description: '建言献策相关接口'
      },
      {
        name: '用户接口',
        description: '用户个人中心相关接口'
      },
      {
        name: '管理员接口',
        description: '管理员后台管理接口'
      },
      {
        name: '健康检查',
        description: '服务健康状态检查'
      }
    ]
  },
  apis: [
    './routes/*.js', // 扫描routes目录下的所有路由文件
    './routes/**/*.js' // 扫描routes子目录下的路由文件
  ]
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
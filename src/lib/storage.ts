import fs from 'fs'
import path from 'path'

// 数据存储根目录
const DATA_DIR = path.join(process.cwd(), 'data')
const POOLS_DIR = path.join(DATA_DIR, 'pools')
const POOLS_META_FILE = path.join(DATA_DIR, 'pools.json')
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json')

// 确保目录存在
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// 系统设置类型
export interface SystemSettings {
  quizAccess: 'public' | 'password'  // 做题权限：公开或需要密码
  quizPassword: string               // 做题密码
  updatedAt: string
}

// 默认设置
const DEFAULT_SETTINGS: SystemSettings = {
  quizAccess: 'public',
  quizPassword: '',
  updatedAt: new Date().toISOString()
}

// 获取系统设置
export function getSettings(): SystemSettings {
  ensureDir(DATA_DIR)
  
  if (!fs.existsSync(SETTINGS_FILE)) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2))
    return DEFAULT_SETTINGS
  }
  
  const data = fs.readFileSync(SETTINGS_FILE, 'utf-8')
  return { ...DEFAULT_SETTINGS, ...JSON.parse(data) }
}

// 更新系统设置
export function updateSettings(data: Partial<SystemSettings>): SystemSettings {
  ensureDir(DATA_DIR)
  
  const currentSettings = getSettings()
  const newSettings: SystemSettings = {
    ...currentSettings,
    ...data,
    updatedAt: new Date().toISOString()
  }
  
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(newSettings, null, 2))
  return newSettings
}

// 验证做题密码
export function verifyQuizPassword(password: string): boolean {
  const settings = getSettings()
  if (settings.quizAccess === 'public') {
    return true
  }
  return settings.quizPassword === password
}

// 类型定义
export interface Question {
  id: string
  number: number
  content: string
  options: QuestionOption[]
  answer: string
  poolId: string
  createdAt: string
  updatedAt: string
}

export interface QuestionOption {
  label: string
  content: string
}

export interface QuestionPool {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface PoolWithCount extends QuestionPool {
  questionCount: number
}

// 生成唯一ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

// 获取所有题目池
export function getAllPools(): PoolWithCount[] {
  ensureDir(DATA_DIR)
  
  if (!fs.existsSync(POOLS_META_FILE)) {
    return []
  }
  
  const data = fs.readFileSync(POOLS_META_FILE, 'utf-8')
  const pools: QuestionPool[] = JSON.parse(data)
  
  return pools.map(pool => ({
    ...pool,
    questionCount: getQuestionCount(pool.id)
  }))
}

// 获取单个题目池
export function getPoolById(poolId: string): QuestionPool | null {
  const pools = getAllPools().map(p => ({ 
    id: p.id, 
    name: p.name, 
    description: p.description,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt
  }))
  return pools.find(p => p.id === poolId) || null
}

// 创建题目池
export function createPool(name: string, description?: string): QuestionPool {
  ensureDir(DATA_DIR)
  
  // 读取现有题目池
  let pools: QuestionPool[] = []
  if (fs.existsSync(POOLS_META_FILE)) {
    const data = fs.readFileSync(POOLS_META_FILE, 'utf-8')
    pools = JSON.parse(data)
  }
  
  // 检查名称是否重复
  if (pools.some(p => p.name === name)) {
    throw new Error('题目池名称已存在')
  }
  
  const now = new Date().toISOString()
  const pool: QuestionPool = {
    id: generateId(),
    name,
    description,
    createdAt: now,
    updatedAt: now
  }
  
  pools.push(pool)
  fs.writeFileSync(POOLS_META_FILE, JSON.stringify(pools, null, 2))
  
  // 创建题目池目录
  const poolDir = path.join(POOLS_DIR, pool.id)
  ensureDir(poolDir)
  
  return pool
}

// 更新题目池
export function updatePool(poolId: string, data: { name?: string; description?: string }): QuestionPool | null {
  if (!fs.existsSync(POOLS_META_FILE)) {
    return null
  }
  
  const fileData = fs.readFileSync(POOLS_META_FILE, 'utf-8')
  const pools: QuestionPool[] = JSON.parse(fileData)
  
  const index = pools.findIndex(p => p.id === poolId)
  if (index === -1) {
    return null
  }
  
  // 检查名称是否重复
  if (data.name && pools.some(p => p.name === data.name && p.id !== poolId)) {
    throw new Error('题目池名称已存在')
  }
  
  pools[index] = {
    ...pools[index],
    ...data,
    updatedAt: new Date().toISOString()
  }
  
  fs.writeFileSync(POOLS_META_FILE, JSON.stringify(pools, null, 2))
  return pools[index]
}

// 删除题目池
export function deletePool(poolId: string): boolean {
  if (!fs.existsSync(POOLS_META_FILE)) {
    return false
  }
  
  const fileData = fs.readFileSync(POOLS_META_FILE, 'utf-8')
  const pools: QuestionPool[] = JSON.parse(fileData)
  
  const index = pools.findIndex(p => p.id === poolId)
  if (index === -1) {
    return false
  }
  
  pools.splice(index, 1)
  fs.writeFileSync(POOLS_META_FILE, JSON.stringify(pools, null, 2))
  
  // 删除题目池目录和所有题目
  const poolDir = path.join(POOLS_DIR, poolId)
  if (fs.existsSync(poolDir)) {
    fs.rmSync(poolDir, { recursive: true, force: true })
  }
  
  return true
}

// 获取题目池的题目数量
export function getQuestionCount(poolId: string): number {
  const poolDir = path.join(POOLS_DIR, poolId)
  if (!fs.existsSync(poolDir)) {
    return 0
  }
  
  const files = fs.readdirSync(poolDir).filter(f => f.endsWith('.json'))
  return files.length
}

// 获取题目的文件路径
function getQuestionFilePath(poolId: string, number: number): string {
  return path.join(POOLS_DIR, poolId, `${String(number).padStart(3, '0')}.json`)
}

// 获取题目池中的所有题目
export function getQuestionsByPool(poolId: string): Question[] {
  const poolDir = path.join(POOLS_DIR, poolId)
  if (!fs.existsSync(poolDir)) {
    return []
  }
  
  const files = fs.readdirSync(poolDir)
    .filter(f => f.endsWith('.json'))
    .sort()
  
  const questions: Question[] = []
  for (const file of files) {
    const filePath = path.join(poolDir, file)
    const data = fs.readFileSync(filePath, 'utf-8')
    questions.push(JSON.parse(data))
  }
  
  return questions.sort((a, b) => a.number - b.number)
}

// 获取所有题目（可排除某个题目池）
export function getAllQuestions(excludePoolId?: string): Question[] {
  const pools = getAllPools()
  let allQuestions: Question[] = []
  
  for (const pool of pools) {
    if (excludePoolId && pool.id === excludePoolId) {
      continue
    }
    const questions = getQuestionsByPool(pool.id)
    allQuestions = allQuestions.concat(questions)
  }
  
  return allQuestions
}

// 获取单个题目
export function getQuestionById(poolId: string, questionId: string): Question | null {
  const questions = getQuestionsByPool(poolId)
  return questions.find(q => q.id === questionId) || null
}

// 创建题目
export function createQuestion(data: {
  content: string
  options: QuestionOption[]
  answer: string
  poolId: string
  number?: number
}): Question {
  const poolDir = path.join(POOLS_DIR, data.poolId)
  ensureDir(poolDir)
  
  // 确定题目编号
  let questionNumber = data.number
  if (!questionNumber) {
    const existingQuestions = getQuestionsByPool(data.poolId)
    questionNumber = existingQuestions.length > 0 
      ? Math.max(...existingQuestions.map(q => q.number)) + 1 
      : 1
  }
  
  // 检查编号是否已存在
  const filePath = getQuestionFilePath(data.poolId, questionNumber)
  if (fs.existsSync(filePath)) {
    throw new Error('题目编号在该题目池中已存在')
  }
  
  const now = new Date().toISOString()
  const question: Question = {
    id: generateId(),
    number: questionNumber,
    content: data.content,
    options: data.options,
    answer: data.answer,
    poolId: data.poolId,
    createdAt: now,
    updatedAt: now
  }
  
  fs.writeFileSync(filePath, JSON.stringify(question, null, 2))
  return question
}

// 更新题目
export function updateQuestion(
  poolId: string,
  questionId: string,
  data: {
    content?: string
    options?: QuestionOption[]
    answer?: string
    number?: number
  }
): Question | null {
  const questions = getQuestionsByPool(poolId)
  const question = questions.find(q => q.id === questionId)
  
  if (!question) {
    return null
  }
  
  // 如果修改了编号
  let newNumber = data.number !== undefined ? data.number : question.number
  
  // 检查新编号是否与其他题目冲突
  if (data.number !== undefined && data.number !== question.number) {
    const existingQuestion = questions.find(q => q.number === data.number && q.id !== questionId)
    if (existingQuestion) {
      throw new Error('题目编号在该题目池中已存在')
    }
  }
  
  // 删除旧文件（如果编号变了）
  const oldFilePath = getQuestionFilePath(poolId, question.number)
  
  const updatedQuestion: Question = {
    ...question,
    ...data,
    number: newNumber,
    updatedAt: new Date().toISOString()
  }
  
  // 写入新文件
  const newFilePath = getQuestionFilePath(poolId, newNumber)
  fs.writeFileSync(newFilePath, JSON.stringify(updatedQuestion, null, 2))
  
  // 如果编号变了，删除旧文件
  if (newNumber !== question.number && fs.existsSync(oldFilePath)) {
    fs.unlinkSync(oldFilePath)
  }
  
  return updatedQuestion
}

// 删除题目
export function deleteQuestion(poolId: string, questionId: string): boolean {
  const questions = getQuestionsByPool(poolId)
  const question = questions.find(q => q.id === questionId)
  
  if (!question) {
    return false
  }
  
  const filePath = getQuestionFilePath(poolId, question.number)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
    return true
  }
  
  return false
}

// 移动题目到另一个题目池
export function moveQuestion(
  questionId: string,
  sourcePoolId: string,
  targetPoolId: string,
  targetNumber?: number
): Question | null {
  const question = getQuestionById(sourcePoolId, questionId)
  
  if (!question) {
    return null
  }
  
  // 确定目标编号
  let newNumber = targetNumber
  if (!newNumber) {
    const targetQuestions = getQuestionsByPool(targetPoolId)
    newNumber = targetQuestions.length > 0 
      ? Math.max(...targetQuestions.map(q => q.number)) + 1 
      : 1
  }
  
  // 检查目标编号是否已存在
  const targetFilePath = getQuestionFilePath(targetPoolId, newNumber)
  if (fs.existsSync(targetFilePath)) {
    throw new Error('目标题目池中已存在相同编号的题目')
  }
  
  // 创建新题目
  const now = new Date().toISOString()
  const movedQuestion: Question = {
    ...question,
    poolId: targetPoolId,
    number: newNumber,
    updatedAt: now
  }
  
  // 确保目标目录存在
  const targetPoolDir = path.join(POOLS_DIR, targetPoolId)
  ensureDir(targetPoolDir)
  
  // 写入新位置
  fs.writeFileSync(targetFilePath, JSON.stringify(movedQuestion, null, 2))
  
  // 删除旧位置
  const oldFilePath = getQuestionFilePath(sourcePoolId, question.number)
  if (fs.existsSync(oldFilePath)) {
    fs.unlinkSync(oldFilePath)
  }
  
  return movedQuestion
}

// 初始化默认题目池
export function initializeDefaultPools(): void {
  ensureDir(DATA_DIR)
  ensureDir(POOLS_DIR)
  
  if (!fs.existsSync(POOLS_META_FILE)) {
    // 创建4个默认题目池
    const defaultPools: QuestionPool[] = []
    for (let i = 1; i <= 4; i++) {
      const now = new Date().toISOString()
      defaultPools.push({
        id: String(i),
        name: `题目池${i}`,
        description: `第${i}个题目池`,
        createdAt: now,
        updatedAt: now
      })
    }
    fs.writeFileSync(POOLS_META_FILE, JSON.stringify(defaultPools, null, 2))
    
    // 创建题目池目录
    for (const pool of defaultPools) {
      const poolDir = path.join(POOLS_DIR, pool.id)
      ensureDir(poolDir)
    }
  }
}

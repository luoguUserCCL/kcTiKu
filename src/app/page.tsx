'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from '@/hooks/use-toast'
import { 
  Plus, Trash2, Edit, MoveRight, FileQuestion, 
  CheckCircle, XCircle, SkipForward, Eye, Lock, 
  BookOpen, Database, Settings, ArrowRight, RefreshCw,
  ImageIcon, Shield, Globe, KeyRound
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import 'katex/dist/katex.min.css'

// 类型定义
interface QuestionPool {
  id: string
  name: string
  description?: string | null
  questionCount: number
  createdAt: string
}

interface Question {
  id: string
  number: number
  content: string
  options: QuestionOption[]
  answer: string
  poolId: string
  pool?: { id: string; name: string }
  createdAt: string
}

interface QuestionOption {
  label: string
  content: string
}

// 图片上传按钮组件
function ImageUploadButton({ onInsert }: { onInsert: (markdown: string) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      toast({ title: '请选择图片文件', variant: 'destructive' })
      return
    }

    // 检查文件大小 (限制5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: '图片大小不能超过5MB', variant: 'destructive' })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      const markdown = `![${file.name}](${base64})`
      onInsert(markdown)
      toast({ title: '图片已插入' })
    }
    reader.readAsDataURL(file)

    // 清空input以便重复选择同一文件
    e.target.value = ''
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
      >
        <ImageIcon className="w-4 h-4 mr-1" />
        插入图片
      </Button>
    </>
  )
}

// Markdown + KaTeX 渲染组件
function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          img: ({ src, alt }) => (
            <img 
              src={src} 
              alt={alt || ''} 
              className="max-w-full h-auto rounded-lg"
              style={{ maxHeight: '300px' }}
            />
          ),
          code: ({ className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '')
            return match ? (
              <code className={className} {...props}>{children}</code>
            ) : (
              <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props}>{children}</code>
            )
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

// 题目预览卡片
function QuestionPreviewCard({ 
  question, 
  showAnswer = false,
  selectedAnswer,
  onAnswerSelect,
  isSubmitted,
  isCorrect
}: { 
  question: Question
  showAnswer?: boolean
  selectedAnswer?: string
  onAnswerSelect?: (answer: string) => void
  isSubmitted?: boolean
  isCorrect?: boolean
}) {
  const options = question.options || []
  
  return (
    <Card className={`${isSubmitted !== undefined ? (isCorrect ? 'border-green-500' : 'border-red-500') : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline">第 {question.number} 题</Badge>
          {question.pool && <Badge variant="secondary">{question.pool.name}</Badge>}
          {isSubmitted !== undefined && (
            <Badge variant={isCorrect ? 'default' : 'destructive'} className={isCorrect ? 'bg-green-500' : ''}>
              {isCorrect ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
              {isCorrect ? '正确' : '错误'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-muted/50 rounded-lg">
          <MarkdownRenderer content={question.content} />
        </div>
        
        <RadioGroup 
          value={selectedAnswer} 
          onValueChange={onAnswerSelect}
          disabled={isSubmitted}
        >
          {options.map((option) => (
            <div 
              key={option.label} 
              className={`flex items-start space-x-3 p-2 rounded-lg transition-colors ${
                isSubmitted 
                  ? option.label === question.answer 
                    ? 'bg-green-100 dark:bg-green-900/30' 
                    : selectedAnswer === option.label 
                      ? 'bg-red-100 dark:bg-red-900/30'
                      : ''
                  : selectedAnswer === option.label 
                    ? 'bg-primary/10' 
                    : 'hover:bg-muted/50'
              }`}
            >
              <RadioGroupItem value={option.label} id={`${question.id}-${option.label}`} />
              <Label 
                htmlFor={`${question.id}-${option.label}`} 
                className="flex-1 cursor-pointer font-normal"
              >
                <span className="font-semibold mr-2">{option.label}.</span>
                <MarkdownRenderer content={option.content} />
              </Label>
              {isSubmitted && option.label === question.answer && (
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />
              )}
            </div>
          ))}
        </RadioGroup>
        
        {showAnswer && isSubmitted && (
          <div className="text-sm text-muted-foreground">
            正确答案: <span className="font-bold text-green-500">{question.answer}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// 导入题目组件
function ImportQuestions() {
  const [pools, setPools] = useState<QuestionPool[]>([])
  const [selectedPool, setSelectedPool] = useState<string>('')
  const [content, setContent] = useState('')
  const [optionCount, setOptionCount] = useState(4)
  const [options, setOptions] = useState<QuestionOption[]>([])
  const [answer, setAnswer] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchPools()
  }, [])

  useEffect(() => {
    // 初始化选项
    const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const newOptions = labels.slice(0, optionCount).map(label => ({
      label,
      content: options.find(o => o.label === label)?.content || ''
    }))
    setOptions(newOptions)
  }, [optionCount])

  const fetchPools = async () => {
    try {
      const res = await fetch('/api/pools')
      const data = await res.json()
      setPools(data)
      if (data.length > 0 && !selectedPool) {
        setSelectedPool(data[0].id)
      }
    } catch (error) {
      toast({ title: '获取题目池失败', variant: 'destructive' })
    }
  }

  const updateOption = (label: string, content: string) => {
    setOptions(prev => prev.map(o => o.label === label ? { ...o, content } : o))
  }

  const insertToContent = (markdown: string) => {
    setContent(prev => prev + '\n' + markdown)
  }

  const insertToOption = (label: string, markdown: string) => {
    updateOption(label, options.find(o => o.label === label)?.content + '\n' + markdown || markdown)
  }

  const handleSubmit = async () => {
    if (!selectedPool) {
      toast({ title: '请选择题目池', variant: 'destructive' })
      return
    }
    if (!content.trim()) {
      toast({ title: '请输入题面内容', variant: 'destructive' })
      return
    }
    if (options.some(o => !o.content.trim())) {
      toast({ title: '请填写所有选项内容', variant: 'destructive' })
      return
    }
    if (!answer) {
      toast({ title: '请选择正确答案', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          options,
          answer,
          poolId: selectedPool
        })
      })

      if (res.ok) {
        toast({ title: '题目添加成功' })
        setContent('')
        setOptions(options.map(o => ({ ...o, content: '' })))
        setAnswer('')
        fetchPools()
      } else {
        const data = await res.json()
        toast({ title: data.error || '添加失败', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: '添加失败', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const previewQuestion: Question = {
    id: 'preview',
    number: 1,
    content,
    options,
    answer,
    poolId: selectedPool,
    createdAt: new Date().toISOString()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            导入新题目
          </CardTitle>
          <CardDescription>
            支持 Markdown 和 KaTeX 语法编写题面和选项，可插入图片
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 题目池选择 */}
          <div className="space-y-2">
            <Label>选择题目池</Label>
            <Select value={selectedPool} onValueChange={setSelectedPool}>
              <SelectTrigger>
                <SelectValue placeholder="选择题目池" />
              </SelectTrigger>
              <SelectContent>
                {pools.map(pool => (
                  <SelectItem key={pool.id} value={pool.id}>
                    {pool.name} ({pool.questionCount || 0} 题)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 题面输入 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>题面内容</Label>
              <ImageUploadButton onInsert={insertToContent} />
            </div>
            <Textarea
              placeholder="输入题面内容，支持 Markdown 和 KaTeX 语法&#10;例如：求 $x^2 + 2x + 1 = 0$ 的解"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] font-mono"
            />
          </div>

          {/* 选项数量 */}
          <div className="space-y-2">
            <Label>选项数量</Label>
            <Select value={String(optionCount)} onValueChange={(v) => setOptionCount(Number(v))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2, 3, 4, 5, 6, 7, 8].map(n => (
                  <SelectItem key={n} value={String(n)}>{n} 个选项</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 选项输入 */}
          <div className="space-y-3">
            <Label>选项内容</Label>
            {options.map((option) => (
              <div key={option.label} className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2 w-20 flex-shrink-0">
                    <RadioGroup value={answer} onValueChange={setAnswer}>
                      <RadioGroupItem value={option.label} id={`answer-${option.label}`} />
                    </RadioGroup>
                    <Label htmlFor={`answer-${option.label}`} className="font-semibold cursor-pointer">
                      {option.label}.
                    </Label>
                  </div>
                  <Textarea
                    placeholder={`选项 ${option.label} 内容`}
                    value={option.content}
                    onChange={(e) => updateOption(option.label, e.target.value)}
                    className="flex-1 min-h-[60px] font-mono"
                  />
                </div>
                <div className="ml-20">
                  <ImageUploadButton onInsert={(md) => insertToOption(option.label, md)} />
                </div>
              </div>
            ))}
            <p className="text-sm text-muted-foreground">
              点击选项前的圆圈选择正确答案
            </p>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <Button 
              onClick={() => setPreviewOpen(true)}
              variant="outline"
              disabled={!content || options.some(o => !o.content)}
            >
              <Eye className="w-4 h-4 mr-2" />
              预览
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? '保存中...' : '保存题目'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 预览对话框 */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>题目预览</DialogTitle>
          </DialogHeader>
          <QuestionPreviewCard question={previewQuestion} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// 做题组件
function QuizMode() {
  const [pools, setPools] = useState<QuestionPool[]>([])
  const [selectedPool, setSelectedPool] = useState<string>('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [skipped, setSkipped] = useState<Set<string>>(new Set())
  const [isFinished, setIsFinished] = useState(false)
  const [started, setStarted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [quizAccess, setQuizAccess] = useState<'public' | 'password'>('public')
  const [needPassword, setNeedPassword] = useState(false)
  const [quizPassword, setQuizPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    fetchPools()
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      const data = await res.json()
      setQuizAccess(data.quizAccess)
      if (data.quizAccess === 'password') {
        setNeedPassword(true)
      }
    } catch (error) {
      console.error('获取设置失败', error)
    }
  }

  const handlePasswordSubmit = async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: quizPassword })
      })
      const data = await res.json()
      if (data.success) {
        setIsAuthenticated(true)
        setNeedPassword(false)
        toast({ title: '验证成功' })
      } else {
        toast({ title: '密码错误', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: '验证失败', variant: 'destructive' })
    }
  }

  const fetchPools = async () => {
    try {
      const res = await fetch('/api/pools')
      const data = await res.json()
      setPools(data)
      if (data.length > 0) {
        setSelectedPool(data[0].id)
      }
    } catch (error) {
      toast({ title: '获取题目池失败', variant: 'destructive' })
    }
  }

  const startQuiz = async () => {
    if (!selectedPool) {
      toast({ title: '请选择题目池', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/questions?excludePoolId=${selectedPool}&limit=50`)
      const allQuestions = await res.json()
      
      if (allQuestions.length === 0) {
        toast({ title: '没有可用的题目', description: '请先添加题目到其他题目池', variant: 'destructive' })
        setLoading(false)
        return
      }

      const shuffled = [...allQuestions].sort(() => Math.random() - 0.5)
      const selected = shuffled.slice(0, Math.min(10, shuffled.length))
      
      setQuestions(selected)
      setCurrentIndex(0)
      setAnswers({})
      setSkipped(new Set())
      setIsFinished(false)
      setStarted(true)
    } catch (error) {
      toast({ title: '获取题目失败', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questions[currentIndex].id]: answer
    }))
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      setIsFinished(true)
    }
  }

  const handleSkip = () => {
    setSkipped(prev => new Set(prev).add(questions[currentIndex].id))
    handleNext()
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const resetQuiz = () => {
    setStarted(false)
    setQuestions([])
    setCurrentIndex(0)
    setAnswers({})
    setSkipped(new Set())
    setIsFinished(false)
  }

  const calculateScore = () => {
    let correct = 0
    questions.forEach(q => {
      if (answers[q.id] === q.answer) {
        correct++
      }
    })
    return correct
  }

  // 需要密码验证
  if (needPassword && !isAuthenticated) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5" />
            做题需要密码
          </CardTitle>
          <CardDescription>
            请输入做题密码以开始答题
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>做题密码</Label>
            <Input
              type="password"
              value={quizPassword}
              onChange={(e) => setQuizPassword(e.target.value)}
              placeholder="输入做题密码"
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
            />
          </div>
          <Button onClick={handlePasswordSubmit} className="w-full">
            验证
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!started) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileQuestion className="w-5 h-5" />
            开始做题
          </CardTitle>
          <CardDescription>
            选择一个题目池，系统将随机从其他题目池抽取10道题目
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>选择题目池（将排除该池的题目）</Label>
            <Select value={selectedPool} onValueChange={setSelectedPool}>
              <SelectTrigger>
                <SelectValue placeholder="选择题目池" />
              </SelectTrigger>
              <SelectContent>
                {pools.map(pool => (
                  <SelectItem key={pool.id} value={pool.id}>
                    {pool.name} ({pool.questionCount || 0} 题)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={startQuiz} disabled={loading || pools.length < 2}>
            {loading ? '加载中...' : '开始答题'}
          </Button>
          {pools.length < 2 && (
            <p className="text-sm text-muted-foreground">
              需要至少2个题目池才能开始答题
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  if (isFinished) {
    const score = calculateScore()
    const total = questions.length
    const skippedCount = skipped.size

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              答题完成
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold text-green-500">{score}</div>
                <div className="text-sm text-muted-foreground">正确</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold text-red-500">{total - score}</div>
                <div className="text-sm text-muted-foreground">错误</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold">{skippedCount}</div>
                <div className="text-sm text-muted-foreground">跳过</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold">{Math.round((score / total) * 100)}%</div>
                <div className="text-sm text-muted-foreground">正确率</div>
              </div>
            </div>

            <Progress value={(score / total) * 100} className="h-3" />

            <Button onClick={resetQuiz} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              再来一次
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>答题详情</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-6">
                {questions.map((q) => (
                  <QuestionPreviewCard
                    key={q.id}
                    question={q}
                    selectedAnswer={answers[q.id]}
                    isSubmitted={true}
                    isCorrect={answers[q.id] === q.answer}
                    showAnswer={true}
                  />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const progress = ((currentIndex + 1) / questions.length) * 100

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileQuestion className="w-5 h-5" />
              答题中
            </CardTitle>
            <Badge variant="outline">
              {currentIndex + 1} / {questions.length}
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>
      </Card>

      {currentQuestion && (
        <QuestionPreviewCard
          key={currentQuestion.id}
          question={currentQuestion}
          selectedAnswer={answers[currentQuestion.id]}
          onAnswerSelect={handleAnswer}
        />
      )}

      <div className="flex justify-between gap-3">
        <Button 
          onClick={handlePrevious} 
          variant="outline"
          disabled={currentIndex === 0}
        >
          上一题
        </Button>
        <Button 
          onClick={handleSkip} 
          variant="ghost"
          className="text-yellow-600"
        >
          <SkipForward className="w-4 h-4 mr-2" />
          跳过
        </Button>
        <Button onClick={handleNext}>
          {currentIndex === questions.length - 1 ? '完成' : '下一题'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

// 管理界面组件
function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [pools, setPools] = useState<QuestionPool[]>([])
  const [selectedPool, setSelectedPool] = useState<string>('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const [movingQuestion, setMovingQuestion] = useState<Question | null>(null)
  const [targetPoolId, setTargetPoolId] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingQuestion, setDeletingQuestion] = useState<Question | null>(null)
  const [newPoolDialogOpen, setNewPoolDialogOpen] = useState(false)
  const [newPoolName, setNewPoolName] = useState('')
  const [newPoolDesc, setNewPoolDesc] = useState('')
  // 做题权限设置
  const [quizAccess, setQuizAccess] = useState<'public' | 'password'>('public')
  const [quizPassword, setQuizPassword] = useState('')
  const [settingsLoading, setSettingsLoading] = useState(false)

  const ADMIN_PASSWORD = 'admin123'

  useEffect(() => {
    if (isAuthenticated) {
      fetchPools()
      fetchSettings()
    }
  }, [isAuthenticated])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      const data = await res.json()
      setQuizAccess(data.quizAccess)
    } catch (error) {
      console.error('获取设置失败', error)
    }
  }

  const handleSaveSettings = async () => {
    setSettingsLoading(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizAccess,
          quizPassword: quizPassword || undefined
        })
      })
      if (res.ok) {
        toast({ title: '设置保存成功' })
        setQuizPassword('') // 清空密码输入
      } else {
        const data = await res.json()
        toast({ title: data.error || '保存失败', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: '保存失败', variant: 'destructive' })
    } finally {
      setSettingsLoading(false)
    }
  }

  const fetchPools = async () => {
    try {
      const res = await fetch('/api/pools')
      const data = await res.json()
      setPools(data)
      if (data.length > 0 && !selectedPool) {
        setSelectedPool(data[0].id)
      }
    } catch (error) {
      toast({ title: '获取题目池失败', variant: 'destructive' })
    }
  }

  useEffect(() => {
    if (selectedPool && isAuthenticated) {
      fetchQuestions()
    }
  }, [selectedPool, isAuthenticated])

  const fetchQuestions = async () => {
    try {
      const res = await fetch(`/api/pools/${selectedPool}`)
      const data = await res.json()
      setQuestions(data.questions || [])
    } catch (error) {
      toast({ title: '获取题目失败', variant: 'destructive' })
    }
  }

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      toast({ title: '登录成功' })
    } else {
      toast({ title: '密码错误', variant: 'destructive' })
    }
  }

  const handleCreatePool = async () => {
    if (!newPoolName.trim()) {
      toast({ title: '请输入题目池名称', variant: 'destructive' })
      return
    }

    try {
      const res = await fetch('/api/pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPoolName, description: newPoolDesc })
      })

      if (res.ok) {
        toast({ title: '题目池创建成功' })
        setNewPoolDialogOpen(false)
        setNewPoolName('')
        setNewPoolDesc('')
        fetchPools()
      } else {
        const data = await res.json()
        toast({ title: data.error || '创建失败', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: '创建失败', variant: 'destructive' })
    }
  }

  const handleDeleteQuestion = async () => {
    if (!deletingQuestion) return

    try {
      const res = await fetch(`/api/questions/${deletingQuestion.id}?poolId=${deletingQuestion.poolId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast({ title: '题目删除成功' })
        fetchQuestions()
        fetchPools()
      } else {
        toast({ title: '删除失败', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: '删除失败', variant: 'destructive' })
    } finally {
      setDeleteDialogOpen(false)
      setDeletingQuestion(null)
    }
  }

  const handleMoveQuestion = async () => {
    if (!movingQuestion || !targetPoolId) return

    try {
      const res = await fetch('/api/questions/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          questionId: movingQuestion.id, 
          sourcePoolId: movingQuestion.poolId,
          targetPoolId 
        })
      })

      if (res.ok) {
        toast({ title: '题目移动成功' })
        fetchQuestions()
        fetchPools()
      } else {
        const data = await res.json()
        toast({ title: data.error || '移动失败', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: '移动失败', variant: 'destructive' })
    } finally {
      setMoveDialogOpen(false)
      setMovingQuestion(null)
      setTargetPoolId('')
    }
  }

  const handleEditQuestion = async (updatedData: Partial<Question>) => {
    if (!editingQuestion) return

    try {
      const res = await fetch(`/api/questions/${editingQuestion.id}?poolId=${editingQuestion.poolId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updatedData, poolId: editingQuestion.poolId })
      })

      if (res.ok) {
        toast({ title: '题目更新成功' })
        fetchQuestions()
      } else {
        const data = await res.json()
        toast({ title: data.error || '更新失败', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: '更新失败', variant: 'destructive' })
    } finally {
      setEditDialogOpen(false)
      setEditingQuestion(null)
    }
  }

  if (!isAuthenticated) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            管理员登录
          </CardTitle>
          <CardDescription>
            请输入管理秘钥以访问管理界面
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>管理秘钥</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入管理秘钥"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <Button onClick={handleLogin} className="w-full">
            登录
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 做题权限设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            做题权限设置
          </CardTitle>
          <CardDescription>
            设置做题的访问权限
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>做题权限</Label>
            <RadioGroup 
              value={quizAccess} 
              onValueChange={(v) => setQuizAccess(v as 'public' | 'password')}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="public" id="access-public" />
                <Label htmlFor="access-public" className="flex items-center gap-2 cursor-pointer">
                  <Globe className="w-4 h-4" />
                  <div>
                    <div className="font-medium">公众可做题</div>
                    <div className="text-sm text-muted-foreground">任何人都可以直接开始做题</div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="password" id="access-password" />
                <Label htmlFor="access-password" className="flex items-center gap-2 cursor-pointer">
                  <KeyRound className="w-4 h-4" />
                  <div>
                    <div className="font-medium">做题需要密码</div>
                    <div className="text-sm text-muted-foreground">用户需要输入密码才能开始做题</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {quizAccess === 'password' && (
            <div className="space-y-2">
              <Label>做题密码</Label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={quizPassword}
                  onChange={(e) => setQuizPassword(e.target.value)}
                  placeholder="输入新密码（留空则保持原密码）"
                  className="flex-1"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                设置做题密码后，用户需要输入正确密码才能开始答题
              </p>
            </div>
          )}

          <Button onClick={handleSaveSettings} disabled={settingsLoading}>
            {settingsLoading ? '保存中...' : '保存设置'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              题目池管理
            </CardTitle>
            <Button onClick={() => setNewPoolDialogOpen(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              新建题目池
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {pools.map(pool => (
              <Badge
                key={pool.id}
                variant={selectedPool === pool.id ? 'default' : 'outline'}
                className="cursor-pointer px-3 py-1"
                onClick={() => setSelectedPool(pool.id)}
              >
                {pool.name} ({pool.questionCount || 0})
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>题目列表</CardTitle>
          <CardDescription>
            选择题目池查看和管理题目
          </CardDescription>
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              该题目池暂无题目
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-4 pr-4">
                {questions.map((q) => (
                  <Card key={q.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">#{q.number}</Badge>
                            <Badge variant="secondary">答案: {q.answer}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            <MarkdownRenderer content={q.content} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditingQuestion(q)
                              setEditDialogOpen(true)
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setMovingQuestion(q)
                              setMoveDialogOpen(true)
                            }}
                          >
                            <MoveRight className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => {
                              setDeletingQuestion(q)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* 新建题目池对话框 */}
      <Dialog open={newPoolDialogOpen} onOpenChange={setNewPoolDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建题目池</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>题目池名称</Label>
              <Input
                value={newPoolName}
                onChange={(e) => setNewPoolName(e.target.value)}
                placeholder="输入题目池名称"
              />
            </div>
            <div className="space-y-2">
              <Label>描述（可选）</Label>
              <Textarea
                value={newPoolDesc}
                onChange={(e) => setNewPoolDesc(e.target.value)}
                placeholder="输入题目池描述"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewPoolDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreatePool}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑题目对话框 */}
      <EditQuestionDialog
        key={editingQuestion?.id || 'none'}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        question={editingQuestion}
        onSave={handleEditQuestion}
      />

      {/* 移动题目对话框 */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>移动题目</DialogTitle>
            <DialogDescription>
              将题目移动到其他题目池
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>目标题目池</Label>
              <Select value={targetPoolId} onValueChange={setTargetPoolId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择目标题目池" />
                </SelectTrigger>
                <SelectContent>
                  {pools.filter(p => p.id !== selectedPool).map(pool => (
                    <SelectItem key={pool.id} value={pool.id}>
                      {pool.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleMoveQuestion} disabled={!targetPoolId}>
              移动
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这道题目吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteQuestion} className="bg-destructive text-destructive-foreground">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// 编辑题目对话框组件
function EditQuestionDialog({
  open,
  onOpenChange,
  question,
  onSave
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  question: Question | null
  onSave: (data: Partial<Question>) => void
}) {
  // 使用函数式初始化，配合父组件的 key 属性实现组件重新挂载
  const [content, setContent] = useState(() => question?.content || '')
  const [options, setOptions] = useState<QuestionOption[]>(() => 
    Array.isArray(question?.options) ? [...question.options] : []
  )
  const [answer, setAnswer] = useState(() => question?.answer || '')

  const updateOption = (label: string, newContent: string) => {
    setOptions(prev => prev.map(o => o.label === label ? { ...o, content: newContent } : o))
  }

  const insertToContent = (markdown: string) => {
    setContent(prev => prev + '\n' + markdown)
  }

  const insertToOption = (label: string, markdown: string) => {
    setOptions(prev => prev.map(o => 
      o.label === label ? { ...o, content: o.content + '\n' + markdown } : o
    ))
  }

  const handleSave = () => {
    onSave({
      content,
      options,
      answer
    })
  }

  if (!question) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>编辑题目</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>题面内容</Label>
              <ImageUploadButton onInsert={insertToContent} />
            </div>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px] font-mono"
            />
          </div>
          <div className="space-y-3">
            <Label>选项内容 ({options.length} 个选项)</Label>
            {options.length === 0 ? (
              <div className="text-muted-foreground text-sm">暂无选项</div>
            ) : (
              options.map((option) => (
                <div key={option.label} className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2 w-20 flex-shrink-0">
                      <RadioGroup value={answer} onValueChange={setAnswer}>
                        <RadioGroupItem value={option.label} id={`edit-answer-${option.label}`} />
                      </RadioGroup>
                      <Label htmlFor={`edit-answer-${option.label}`} className="font-semibold cursor-pointer">
                        {option.label}.
                      </Label>
                    </div>
                    <Textarea
                      value={option.content}
                      onChange={(e) => updateOption(option.label, e.target.value)}
                      className="flex-1 min-h-[60px] font-mono"
                    />
                  </div>
                  <div className="ml-20">
                    <ImageUploadButton onInsert={(md) => insertToOption(option.label, md)} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// 主页面
export default function Home() {
  const [activeTab, setActiveTab] = useState('import')

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-3">
            <BookOpen className="w-8 h-8" />
            题目管理系统
          </h1>
          <p className="text-muted-foreground">
            支持 Markdown + KaTeX + 图片的题库管理与练习系统
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              导入题目
            </TabsTrigger>
            <TabsTrigger value="quiz" className="flex items-center gap-2">
              <FileQuestion className="w-4 h-4" />
              做题练习
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              管理界面
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import">
            <ImportQuestions />
          </TabsContent>

          <TabsContent value="quiz">
            <QuizMode />
          </TabsContent>

          <TabsContent value="admin">
            <AdminPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
